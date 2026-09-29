import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  makeDataset,
  splitData,
  trainFederated,
  predictRisk,
  type TrainResult,
} from "@/lib/ml";
import {
  VAULT_PARAMS,
  bytesToText,
  decryptRecord,
  encryptPayload,
  sha256Hex,
  textToBytes,
  type VaultRecord,
} from "@/lib/crypto-vault";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live Demo — Encrypted Vault & Private Training | PrivacyVault ML" },
      {
        name: "description",
        content:
          "Seal files with AES-256-GCM, train a federated differentially private model in your browser, and run private predictions.",
      },
      { property: "og:title", content: "Live Demo — Encrypted Vault & Private Training" },
      {
        property: "og:description",
        content: "Working demo of on-premise privacy-preserving machine learning.",
      },
    ],
  }),
  component: Demo,
});

function Panel({
  step,
  title,
  desc,
  children,
}: {
  step: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-7">
      <span className="kicker">{step}</span>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary";
const btnCls =
  "rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40";
const btnGhost =
  "rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs transition-colors hover:bg-secondary";

/* ------------------------------ Vault ------------------------------ */

function VaultSection() {
  const { user, loading } = useAuth();
  const [pass, setPass] = useState("");
  const [note, setNote] = useState("patient_id=1042, glucose=181, bmi=33.6, outcome=1");
  const [records, setRecords] = useState<VaultRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<{ id: string; text: string; hash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const { data, error } = await supabase
      .from("vault_records")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return setError(error.message);
    setRecords(
      (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        mime: r.mime,
        size: r.size,
        createdAt: new Date(r.created_at).getTime(),
        salt: r.salt,
        iv: r.iv,
        cipher: r.cipher,
      })),
    );
  }

  useEffect(() => {
    if (user) refresh();
    else setRecords([]);
  }, [user]);

  async function shred(id: string) {
    const { error } = await supabase.from("vault_records").delete().eq("id", id);
    if (error) setError(error.message);
    else refresh();
  }

  async function seal(name: string, mime: string, bytes: Uint8Array) {
    if (!pass) {
      setError("Enter a passphrase first — it is the only thing that can unlock the vault.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { salt, iv, cipher } = await encryptPayload(pass, bytes);
      const { error } = await supabase
        .from("vault_records")
        .insert({ name, mime, size: bytes.byteLength, salt, iv, cipher });
      if (error) throw new Error(error.message);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Encryption failed in this browser.");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !user) {
    return (
      <p className="rounded-md border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
        <Link to="/auth" className="font-mono text-primary">Sign in</Link> to store encrypted
        records in the SQL database. Only ciphertext is ever sent.
      </p>
    );
  }

  async function open(rec: VaultRecord) {
    setError(null);
    setOpened(null);
    try {
      const bytes = await decryptRecord(pass, rec);
      const hash = await sha256Hex(bytes);
      setOpened({
        id: rec.id,
        text: rec.mime.startsWith("text") || rec.mime === "note"
          ? bytesToText(bytes)
          : `[binary payload · ${bytes.byteLength} bytes decrypted successfully]`,
        hash,
      });
    } catch {
      setError("Wrong passphrase — authentication tag rejected. Nothing was revealed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-2 block font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Vault passphrase
          </span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="never leaves this device"
            className={inputCls}
          />
        </label>
        <div className="flex gap-2">
          <button className={btnCls} disabled={busy} onClick={() => fileRef.current?.click()}>
            Seal a file
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const buf = new Uint8Array(await f.arrayBuffer());
              await seal(f.name, f.type || "application/octet-stream", buf);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-2 block font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Or seal a sensitive record
          </span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>
        <button
          className={btnCls}
          disabled={busy || !note}
          onClick={() => seal(`record-${records.length + 1}.txt`, "note", textToBytes(note))}
        >
          Encrypt →
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 font-mono text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2 rounded-md border border-border bg-background/50 p-4 font-mono text-[0.7rem] text-muted-foreground sm:grid-cols-2">
        <span>cipher · {VAULT_PARAMS.cipher}</span>
        <span>kdf · {VAULT_PARAMS.kdf}</span>
        <span>iv · {VAULT_PARAMS.iv}</span>
        <span>salt · {VAULT_PARAMS.salt}</span>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {records.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Vault is empty. Sealed items appear here as ciphertext only.
          </p>
        ) : (
          records.map((r) => (
            <div key={r.id} className="bg-surface px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{r.name}</p>
                  <p className="font-mono text-[0.7rem] text-muted-foreground">
                    {r.size} B · sealed {new Date(r.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className={btnGhost} onClick={() => open(r)}>
                    Unseal
                  </button>
                  <button
                    className={btnGhost}
                    onClick={() => shred(r.id)}
                  >
                    Shred
                  </button>
                </div>
              </div>
              <p className="mt-3 truncate font-mono text-[0.68rem] text-signal/70">
                {r.cipher.slice(0, 96)}…
              </p>
              {opened?.id === r.id ? (
                <div className="mt-3 rounded-md border border-signal/40 bg-signal/5 p-4">
                  <p className="font-mono text-xs break-all text-foreground">{opened.text}</p>
                  <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
                    sha256 · {opened.hash.slice(0, 48)}…
                  </p>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Training ------------------------------ */

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between font-mono text-xs tracking-wider uppercase">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-primary">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--primary)]"
      />
      <span className="mt-1 block text-[0.7rem] text-muted-foreground">{hint}</span>
    </label>
  );
}

function LossChart({ result }: { result: TrainResult }) {
  const pts = result.history;
  if (pts.length < 2) return null;
  const w = 640;
  const h = 200;
  const maxLoss = Math.max(...pts.map((p) => p.loss));
  const minLoss = Math.min(...pts.map((p) => p.loss));
  const span = Math.max(maxLoss - minLoss, 1e-6);
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p.loss - minLoss) / span) * (h - 20) - 10;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const accPath = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - p.acc * (h - 20) - 10;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded-md border border-border bg-background">
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} />
      <path d={accPath} fill="none" stroke="var(--signal)" strokeWidth={2} strokeDasharray="5 4" />
      <text x={8} y={16} fontSize="10" fontFamily="JetBrains Mono" fill="var(--primary)">
        loss
      </text>
      <text x={48} y={16} fontSize="10" fontFamily="JetBrains Mono" fill="var(--signal)">
        accuracy
      </text>
    </svg>
  );
}

function TrainingSection() {
  const [samples, setSamples] = useState(1200);
  const [clients, setClients] = useState(4);
  const [epochs, setEpochs] = useState(200);
  const [noise, setNoise] = useState(0.6);
  const [clip, setClip] = useState(1);
  const [result, setResult] = useState<TrainResult | null>(null);
  const [baseline, setBaseline] = useState<TrainResult | null>(null);
  const [patient, setPatient] = useState({ age: 58, glucose: 172, bmi: 32 });

  const data = useMemo(() => splitData(makeDataset(samples)), [samples]);

  const { user } = useAuth();
  type Run = { id: string; samples: number; clients: number; epochs: number; noise: number; clip: number; private_acc: number; baseline_acc: number; epsilon: number | null; created_at: string };
  const [runs, setRuns] = useState<Run[]>([]);

  async function loadRuns() {
    const { data } = await supabase
      .from("training_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setRuns((data ?? []) as Run[]);
  }
  useEffect(() => {
    if (user) loadRuns();
    else setRuns([]);
  }, [user]);

  async function run() {
    const cfg = { epochs, lr: 0.6, clip, noise, clients, seed: 7 };
    const r = trainFederated(data.train, data.test, cfg);
    const b = trainFederated(data.train, data.test, { ...cfg, noise: 0, clients: 1 });
    setResult(r);
    setBaseline(b);
    if (user) {
      // Only aggregate metrics are stored — never the training records.
      await supabase.from("training_runs").insert({
        samples, clients, epochs, noise, clip,
        private_acc: r.testAcc, baseline_acc: b.testAcc, epsilon: r.epsilon,
      });
      loadRuns();
    }
  }

  const risk = result ? predictRisk(result.w, result.b, patient) : null;

  return (
    <div className="space-y-7">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Slider
          label="Training records"
          value={samples}
          min={200}
          max={4000}
          step={100}
          onChange={setSamples}
          hint="Synthetic clinical records generated locally."
        />
        <Slider
          label="Federated clients"
          value={clients}
          min={1}
          max={10}
          step={1}
          onChange={setClients}
          hint="Departments training on their own shard."
        />
        <Slider
          label="Rounds"
          value={epochs}
          min={20}
          max={600}
          step={20}
          onChange={setEpochs}
          hint="Aggregation rounds of FedAvg."
        />
        <Slider
          label="Noise multiplier σ"
          value={noise}
          min={0}
          max={3}
          step={0.1}
          onChange={setNoise}
          hint="Higher = more privacy, lower accuracy."
        />
        <Slider
          label="Clip norm C"
          value={clip}
          min={0.2}
          max={3}
          step={0.1}
          onChange={setClip}
          hint="Caps how much one record can influence the model."
        />
        <div className="flex items-end">
          <button className={btnCls} onClick={run}>
            Train privately →
          </button>
        </div>
      </div>

      {result ? (
        <>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            <div className="bg-surface px-5 py-5">
              <p className="font-mono text-xs text-muted-foreground uppercase">Private accuracy</p>
              <p className="mt-1 font-mono text-3xl font-bold text-primary">
                {(result.testAcc * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-surface px-5 py-5">
              <p className="font-mono text-xs text-muted-foreground uppercase">
                Non-private baseline
              </p>
              <p className="mt-1 font-mono text-3xl font-bold">
                {baseline ? (baseline.testAcc * 100).toFixed(1) : "—"}%
              </p>
            </div>
            <div className="bg-surface px-5 py-5">
              <p className="font-mono text-xs text-muted-foreground uppercase">
                Privacy budget ε (δ=1e-5)
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-signal">
                {result.epsilon === null ? "∞" : result.epsilon.toFixed(2)}
              </p>
            </div>
          </div>

          <LossChart result={result} />

          {runs.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <p className="border-b border-border bg-surface px-4 py-2 font-mono text-xs text-muted-foreground uppercase">
                Saved runs (SQL · training_runs)
              </p>
              <table className="w-full font-mono text-xs">
                <thead className="text-muted-foreground">
                  <tr>{["Time", "N", "K", "Rounds", "σ", "C", "Private", "Baseline", "ε"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2">{new Date(r.created_at).toLocaleTimeString()}</td>
                      <td className="px-3 py-2">{r.samples}</td>
                      <td className="px-3 py-2">{r.clients}</td>
                      <td className="px-3 py-2">{r.epochs}</td>
                      <td className="px-3 py-2">{r.noise.toFixed(1)}</td>
                      <td className="px-3 py-2">{r.clip.toFixed(1)}</td>
                      <td className="px-3 py-2 text-primary">{(r.private_acc * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2">{(r.baseline_acc * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2 text-signal">{r.epsilon === null ? "∞" : r.epsilon.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="panel p-6">
            <span className="kicker">Private inference</span>
            <h3 className="mt-2 text-lg font-semibold">Score a patient locally</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["age", "Age", 18, 90],
                  ["glucose", "Glucose (mg/dL)", 60, 250],
                  ["bmi", "BMI", 15, 45],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key} className="block">
                  <span className="mb-2 block font-mono text-xs text-muted-foreground uppercase">
                    {label}
                  </span>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={patient[key]}
                    onChange={(e) => setPatient({ ...patient, [key]: Number(e.target.value) })}
                    className={inputCls}
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-primary/40 bg-primary/5 px-5 py-4">
              <p className="font-mono text-sm">
                Predicted risk ·{" "}
                <span className="text-xl font-bold text-primary">
                  {risk === null ? "—" : `${(risk * 100).toFixed(1)}%`}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Computed in this browser tab from the noised global weights. No request was sent
                anywhere.
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-md border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
          Set your privacy budget and press <span className="font-mono text-primary">Train privately</span>.
        </p>
      )}
    </div>
  );
}

function Demo() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <header>
          <p className="kicker">Working prototype</p>
          <h1 className="mt-3 text-4xl font-bold">Live demo</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Everything on this page runs inside your browser tab using the Web Crypto API and a
            hand-written learning algorithm. Nothing is uploaded — you can disconnect from the
            network and it will still work.
          </p>
        </header>

        <Panel
          step="Step 01"
          title="Encrypted vault"
          desc="Seal a file or a sensitive record. The passphrase derives an AES-256 key that is discarded the moment the operation ends; only ciphertext is kept."
        >
          <VaultSection />
        </Panel>

        <Panel
          step="Step 02"
          title="Federated + differentially private training"
          desc="Records are split across simulated departments. Each trains on its own shard with clipped, noised gradients, and only the weights are averaged."
        >
          <TrainingSection />
        </Panel>
      </main>
      <SiteFooter />
    </div>
  );
}
