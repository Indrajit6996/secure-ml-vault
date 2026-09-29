import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export const Route = createFileRoute("/slides")({
  head: () => ({
    meta: [
      { title: "Presentation Deck — On-Premise Privacy-Preserving ML & Encrypted Vault" },
      {
        name: "description",
        content:
          "Twelve-slide review deck covering the problem, architecture, cryptography, DP-FedAvg algorithm, results and future scope.",
      },
      { property: "og:title", content: "Presentation Deck — PrivacyVault ML" },
      {
        property: "og:description",
        content: "Review-ready slide deck for the privacy-preserving machine learning project.",
      },
    ],
  }),
  component: SlidesPage,
});

/* ---------- slide building blocks ---------- */

function Slide({ children, n }: { children: ReactNode; n: number }) {
  return (
    <div className="slide-content bg-background text-foreground">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <div className="absolute inset-0 flex flex-col px-[110px] py-[80px]">{children}</div>
      <div className="slide-chrome absolute right-[60px] bottom-[42px] text-muted-foreground">
        {String(n).padStart(2, "0")} / 12
      </div>
      <div className="slide-chrome absolute bottom-[42px] left-[110px] text-muted-foreground">
        PRIVACYVAULT&nbsp;ML
      </div>
    </div>
  );
}

function Heading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-[54px]">
      <p className="slide-kicker text-primary">{kicker}</p>
      <h2 className="slide-title mt-[18px] font-bold">{title}</h2>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[30px]">
      {items.map((t) => (
        <li key={t} className="slide-body flex gap-[24px] text-muted-foreground">
          <span className="mt-[16px] h-[12px] w-[12px] shrink-0 rounded-full bg-signal" />
          <span className="max-w-[1400px]">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Cards({ items }: { items: { k: string; t: string; d: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-[36px]">
      {items.map((c) => (
        <div key={c.t} className="panel flex min-h-[300px] flex-col p-[40px]">
          <span className="slide-kicker text-primary">{c.k}</span>
          <h3 className="slide-subtitle mt-[18px] font-bold">{c.t}</h3>
          <p className="slide-caption mt-[20px] text-muted-foreground">{c.d}</p>
        </div>
      ))}
    </div>
  );
}

const slides: ReactNode[] = [
  <Slide n={1} key="1">
    <div className="flex h-full flex-col justify-center">
      <p className="slide-kicker text-primary">Final Year Major Project</p>
      <h1 className="slide-title-lg mt-[34px] max-w-[1550px] font-bold">
        On-Premise Privacy-Preserving Machine Learning &amp; Encrypted Vault
      </h1>
      <p className="slide-body-lg mt-[40px] max-w-[1200px] text-muted-foreground">
        Bringing the model to the data — so sensitive records never leave the building.
      </p>
      <p className="slide-caption mt-[56px] font-mono text-warn">
        [STUDENT NAMES] · Guide: [GUIDE NAME] · [DEPARTMENT], [COLLEGE]
      </p>
    </div>
  </Slide>,

  <Slide n={2} key="2">
    <Heading kicker="Problem" title="The data that matters cannot move" />
    <Bullets
      items={[
        "Hospitals, banks and colleges hold the richest training data — and are forbidden from uploading it.",
        "Centralising records creates one high-value breach target and breaks data-residency rules.",
        "Even the trained model leaks: membership-inference attacks recover individual rows.",
        "Result: the most useful models simply never get built.",
      ]}
    />
  </Slide>,

  <Slide n={3} key="3">
    <Heading kicker="Objective" title="Three defences, one system" />
    <Cards
      items={[
        { k: "At rest", t: "Encrypted vault", d: "AES-256-GCM with PBKDF2-derived keys. Stolen storage yields nothing." },
        { k: "In use", t: "Federated learning", d: "Departments train locally; only model weights are ever exchanged." },
        { k: "In the model", t: "Differential privacy", d: "Clipped, noised gradients bound what any single record can reveal." },
      ]}
    />
  </Slide>,

  <Slide n={4} key="4">
    <Heading kicker="Architecture" title="On-premise trust boundary" />
    <Bullets
      items={[
        "All components run inside the institution's own network — the system works air-gapped.",
        "Vault, key derivation, trainer and aggregator are separate modules with separate duties.",
        "The coordinator sees weight vectors only; it never receives a record.",
        "Global weights are broadcast back each round; nothing flows outward.",
      ]}
    />
  </Slide>,

  <Slide n={5} key="5">
    <Heading kicker="Cryptography" title="How the vault seals a record" />
    <div className="grid grid-cols-2 gap-[48px]">
      <div className="panel p-[44px]">
        <p className="slide-body text-muted-foreground">Parameters</p>
        <ul className="slide-body mt-[26px] space-y-[20px] font-mono">
          <li>AES-256-GCM</li>
          <li>PBKDF2-SHA256 · 250,000 iters</li>
          <li>128-bit salt per record</li>
          <li>96-bit IV per record</li>
        </ul>
      </div>
      <div className="panel p-[44px]">
        <p className="slide-body text-muted-foreground">Guarantees</p>
        <ul className="slide-body mt-[26px] space-y-[20px]">
          <li>Confidentiality + integrity (auth tag)</li>
          <li>Wrong passphrase reveals nothing</li>
          <li>Key exists only in volatile memory</li>
          <li>SHA-256 digest verifies on unseal</li>
        </ul>
      </div>
    </div>
  </Slide>,

  <Slide n={6} key="6">
    <Heading kicker="Algorithm" title="DP-FedAvg training loop" />
    <pre className="slide-caption panel overflow-hidden p-[40px] font-mono leading-[1.7] text-muted-foreground">
{`for round t = 1 … T:
    for each client k in parallel:
        for each sample (x, y) in shard_k:
            g_i ← ∇L(w; x, y)
            g_i ← g_i · min(1, C / ‖g_i‖₂)      # clip
        g ← ( Σ g_i + N(0, σ²C²I) ) / |shard_k|  # noise
        w_k ← w − η · g
    w ← (1/K) Σ_k w_k                            # FedAvg`}
    </pre>
    <p className="slide-body mt-[34px] text-muted-foreground">
      Output carries an (ε, δ)-differential privacy guarantee at δ = 1e-5.
    </p>
  </Slide>,

  <Slide n={7} key="7">
    <Heading kicker="Implementation" title="Built end to end, no black boxes" />
    <Cards
      items={[
        { k: "Crypto", t: "Web Crypto API", d: "Native AES-GCM, PBKDF2 and SHA-256 — no third-party crypto library." },
        { k: "ML", t: "Hand-written trainer", d: "Logistic regression with per-sample gradients, in pure TypeScript." },
        { k: "UI", t: "React 19 + SSR", d: "TanStack Start with a token-driven Tailwind v4 design system." },
      ]}
    />
  </Slide>,

  <Slide n={8} key="8">
    <Heading kicker="Demo" title="What the reviewer can try live" />
    <Bullets
      items={[
        "Seal a real file, watch it become ciphertext, then unseal it with the correct passphrase.",
        "Enter the wrong passphrase — the authentication tag rejects it and nothing is revealed.",
        "Move the noise slider and watch the privacy budget ε and accuracy move in opposite directions.",
        "Score a patient locally against the trained private model, with no network request.",
      ]}
    />
  </Slide>,

  <Slide n={9} key="9">
    <Heading kicker="Results" title="Accuracy versus privacy" />
    <div className="panel flex min-h-[520px] flex-col items-start justify-center p-[60px]">
      <p className="slide-body-lg max-w-[1400px]">
        Accuracy degrades gracefully as the noise multiplier rises, and federation across several
        clients costs only a small margin against centralised training.
      </p>
      <p className="slide-body mt-[40px] font-mono text-warn">
        [INSERT YOUR MEASURED TABLE: σ · ε · accuracy · baseline]
      </p>
    </div>
  </Slide>,

  <Slide n={10} key="10">
    <Heading kicker="Evaluation" title="Threat model coverage" />
    <Bullets
      items={[
        "Stolen disk or backup → ciphertext only, no key stored anywhere.",
        "Curious coordinator → sees averaged weights, never raw records.",
        "Membership inference on the model → bounded by the chosen ε.",
        "Network interception → no data egress exists to intercept.",
      ]}
    />
  </Slide>,

  <Slide n={11} key="11">
    <Heading kicker="Future scope" title="Where this goes next" />
    <Bullets
      items={[
        "Full Rényi / moments accountant for a publication-grade ε.",
        "Real multi-machine federation over authenticated transport.",
        "Secure aggregation so even individual client updates stay hidden.",
        "Neural network models, homomorphic inference, TPM-backed key storage.",
      ]}
    />
  </Slide>,

  <Slide n={12} key="12">
    <div className="flex h-full flex-col justify-center">
      <p className="slide-kicker text-primary">Conclusion</p>
      <h2 className="slide-title mt-[26px] max-w-[1500px] font-bold">
        Privacy and utility are not a trade you have to lose.
      </h2>
      <p className="slide-body-lg mt-[40px] max-w-[1300px] text-muted-foreground">
        Encryption at rest, federation in use, and differential privacy in the model let an
        institution build on its most sensitive data — and state numerically how much privacy it
        kept.
      </p>
      <p className="slide-body mt-[60px] font-mono text-signal">Thank you · Questions?</p>
    </div>
  </Slide>,
];

/* ---------- viewer ---------- */

function ScaledSlide({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setScale(Math.min(r.width / 1920, r.height / 1080));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: 1920,
          height: 1080,
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SlidesPage() {
  const [i, setI] = useState(0);
  const total = slides.length;

  const go = useCallback(
    (d: number) => setI((v) => Math.min(Math.max(v + d, 0), total - 1)),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "f" || e.key === "F") document.documentElement.requestFullscreen?.();
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    document.title = `${i + 1}/${total} — PrivacyVault ML deck`;
  }, [i, total]);

  return (
    <div className="flex h-screen flex-col bg-black">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-5 py-3">
        <a href="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">
          ← back to project
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(-1)}
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-secondary"
          >
            ◀
          </button>
          <span className="font-mono text-xs text-muted-foreground">
            {i + 1} / {total}
          </span>
          <button
            onClick={() => go(1)}
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-secondary"
          >
            ▶
          </button>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="ml-2 rounded-md bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-foreground"
          >
            Present
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ScaledSlide>{slides[i]}</ScaledSlide>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-border bg-background px-4 py-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-8 w-14 shrink-0 rounded border font-mono text-[0.65rem] transition-colors ${
              idx === i
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
