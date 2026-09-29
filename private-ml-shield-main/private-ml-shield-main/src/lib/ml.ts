/**
 * Tiny, dependency-free logistic regression used by the demo.
 * Everything runs in the browser — no data ever leaves the device.
 */

export type Sample = { x: number[]; y: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rnd: () => number): number {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Synthetic "clinical" dataset: [age, glucose, bmi] -> risk label. */
export function makeDataset(n: number, seed = 42): Sample[] {
  const rnd = mulberry32(seed);
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const age = 20 + rnd() * 60;
    const glucose = 70 + rnd() * 130;
    const bmi = 16 + rnd() * 24;
    const score =
      0.045 * (age - 45) + 0.035 * (glucose - 120) + 0.09 * (bmi - 27) + gaussian(rnd) * 0.55;
    out.push({
      x: [(age - 50) / 20, (glucose - 135) / 40, (bmi - 28) / 7],
      y: score > 0 ? 1 : 0,
    });
  }
  return out;
}

export function splitData(data: Sample[], trainRatio = 0.8) {
  const cut = Math.floor(data.length * trainRatio);
  return { train: data.slice(0, cut), test: data.slice(cut) };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function predictOne(w: number[], b: number, x: number[]): number {
  let z = b;
  for (let i = 0; i < x.length; i++) z += w[i]! * x[i]!;
  return sigmoid(z);
}

export function accuracy(w: number[], b: number, data: Sample[]): number {
  let ok = 0;
  for (const s of data) if ((predictOne(w, b, s.x) >= 0.5 ? 1 : 0) === s.y) ok++;
  return ok / Math.max(data.length, 1);
}

export function logLoss(w: number[], b: number, data: Sample[]): number {
  let sum = 0;
  for (const s of data) {
    const p = Math.min(Math.max(predictOne(w, b, s.x), 1e-7), 1 - 1e-7);
    sum += -(s.y * Math.log(p) + (1 - s.y) * Math.log(1 - p));
  }
  return sum / Math.max(data.length, 1);
}

export type TrainConfig = {
  epochs: number;
  lr: number;
  /** Differential privacy: per-sample gradient L2 clipping bound. */
  clip: number;
  /** Differential privacy: gaussian noise multiplier (0 = no privacy). */
  noise: number;
  /** Number of simulated on-prem clients for federated averaging. */
  clients: number;
  seed?: number;
};

export type TrainResult = {
  w: number[];
  b: number;
  history: { epoch: number; loss: number; acc: number }[];
  testAcc: number;
  epsilon: number | null;
};

/** Poisson-style lot size sampled from each client's shard per round. */
export const LOT_SIZE = 32;

/** One round of DP-SGD on a single client's shard. */
function localUpdate(
  w: number[],
  b: number,
  shard: Sample[],
  cfg: TrainConfig,
  rnd: () => number,
): { w: number[]; b: number } {
  const dim = w.length;
  const gw = new Array<number>(dim).fill(0);
  let gb = 0;

  const lot = Math.min(LOT_SIZE, shard.length);
  for (let j = 0; j < lot; j++) {
    const s = shard[Math.floor(rnd() * shard.length)]!;
    const err = predictOne(w, b, s.x) - s.y;
    const pg = s.x.map((xi) => err * xi);
    const pb = err;
    // per-sample gradient clipping
    let norm = pb * pb;
    for (const g of pg) norm += g * g;
    norm = Math.sqrt(norm);
    const scale = cfg.clip > 0 ? Math.min(1, cfg.clip / (norm + 1e-9)) : 1;
    for (let i = 0; i < dim; i++) gw[i] = gw[i]! + pg[i]! * scale;
    gb += pb * scale;
  }

  const m = Math.max(lot, 1);
  const sigma = cfg.noise * cfg.clip;
  const nw = w.slice();
  for (let i = 0; i < dim; i++) {
    const noisy = (gw[i]! + (sigma > 0 ? gaussian(rnd) * sigma : 0)) / m;
    nw[i] = w[i]! - cfg.lr * noisy;
  }
  const nb = b - cfg.lr * ((gb + (sigma > 0 ? gaussian(rnd) * sigma : 0)) / m);
  return { w: nw, b: nb };
}

/** Rough (moments-accountant style) epsilon estimate for the dashboard. */
export function estimateEpsilon(cfg: TrainConfig, n: number): number | null {
  if (cfg.noise <= 0) return null;
  const perClient = Math.max(n / Math.max(cfg.clients, 1), 1);
  const q = Math.min(LOT_SIZE / perClient, 1); // sampling rate
  const T = cfg.epochs;
  const delta = 1e-5;
  const eps = (q * Math.sqrt(2 * T * Math.log(1 / delta))) / cfg.noise;
  return Math.max(eps, 0.01);
}


export function trainFederated(train: Sample[], test: Sample[], cfg: TrainConfig): TrainResult {
  const rnd = mulberry32(cfg.seed ?? 7);
  const dim = train[0]?.x.length ?? 3;
  let w = new Array<number>(dim).fill(0);
  let b = 0;

  const k = Math.max(1, cfg.clients);
  const shards: Sample[][] = Array.from({ length: k }, () => []);
  train.forEach((s, i) => shards[i % k]!.push(s));

  const history: TrainResult["history"] = [];

  for (let e = 1; e <= cfg.epochs; e++) {
    const aggW = new Array<number>(dim).fill(0);
    let aggB = 0;
    for (const shard of shards) {
      const local = localUpdate(w, b, shard, cfg, rnd);
      for (let i = 0; i < dim; i++) aggW[i] = aggW[i]! + local.w[i]!;
      aggB += local.b;
    }
    w = aggW.map((v) => v / k); // FedAvg
    b = aggB / k;

    if (e % Math.max(1, Math.floor(cfg.epochs / 40)) === 0 || e === cfg.epochs) {
      history.push({ epoch: e, loss: logLoss(w, b, train), acc: accuracy(w, b, train) });
    }
  }

  return {
    w,
    b,
    history,
    testAcc: accuracy(w, b, test),
    epsilon: estimateEpsilon(cfg, train.length),
  };
}

export function predictRisk(w: number[], b: number, raw: { age: number; glucose: number; bmi: number }) {
  const x = [(raw.age - 50) / 20, (raw.glucose - 135) / 40, (raw.bmi - 28) / 7];
  return predictOne(w, b, x);
}
