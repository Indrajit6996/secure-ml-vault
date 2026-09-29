import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "System Architecture & Diagrams — PrivacyVault ML" },
      {
        name: "description",
        content:
          "Block diagram, data-flow diagram, use-case diagram and the DP-SGD + FedAvg algorithm behind the on-premise privacy-preserving ML system.",
      },
      { property: "og:title", content: "System Architecture & Diagrams — PrivacyVault ML" },
      {
        property: "og:description",
        content: "Block, data-flow and use-case diagrams plus the training algorithm.",
      },
    ],
  }),
  component: Architecture,
});

function Box({
  x,
  y,
  w = 200,
  h = 64,
  title,
  sub,
  tone = "base",
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
  tone?: "base" | "primary" | "signal";
}) {
  const stroke =
    tone === "primary" ? "var(--primary)" : tone === "signal" ? "var(--signal)" : "var(--border)";
  const fill = tone === "base" ? "var(--surface-2)" : "var(--surface)";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2 + 5}
        textAnchor="middle"
        fontSize="14"
        fontFamily="JetBrains Mono, monospace"
        fill="var(--foreground)"
      >
        {title}
      </text>
      {sub ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + 16}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted-foreground)"
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function Arrow({ d, label }: { d: string; label?: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth={1.5} markerEnd="url(#ah)" />
      {label ? (
        <text fontSize="11" fill="var(--muted-foreground)">
          <textPath href="#none">{label}</textPath>
        </text>
      ) : null}
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <marker id="ah" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
        <path d="M0,0 L9,4.5 L0,9 z" fill="var(--primary)" />
      </marker>
    </defs>
  );
}

function Figure({
  n,
  title,
  children,
  caption,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  caption: string;
}) {
  return (
    <figure className="panel overflow-hidden">
      <figcaption className="border-b border-border px-6 py-4">
        <span className="kicker">{n}</span>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      </figcaption>
      <div className="overflow-x-auto bg-background/40 p-6">{children}</div>
      <p className="border-t border-border px-6 py-4 text-sm text-muted-foreground">{caption}</p>
    </figure>
  );
}

function Architecture() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-16">
        <header>
          <p className="kicker">Design documentation</p>
          <h1 className="mt-3 text-4xl font-bold">System architecture &amp; diagrams</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Every diagram below is drawn to the same system that powers the live demo — nothing is
            aspirational.
          </p>
        </header>

        <Figure
          n="Fig. 1"
          title="Block diagram — on-premise deployment"
          caption="The trust boundary is the institution's own network. Only aggregated, noised model weights cross between departments; raw records never do."
        >
          <svg viewBox="0 0 900 430" className="w-[900px]">
            <Defs />
            <rect
              x={10}
              y={10}
              width={880}
              height={410}
              rx={12}
              fill="none"
              stroke="var(--border)"
              strokeDasharray="6 6"
            />
            <text x={26} y={34} fontSize="12" fontFamily="JetBrains Mono" fill="var(--muted-foreground)">
              TRUST BOUNDARY — INSTITUTION LAN (no egress)
            </text>

            <Box x={40} y={60} w={200} h={64} title="Data Owner UI" sub="upload / passphrase" tone="primary" />
            <Box x={40} y={170} w={200} h={64} title="Encrypted Vault" sub="AES-256-GCM at rest" tone="signal" />
            <Box x={40} y={280} w={200} h={64} title="Key Derivation" sub="PBKDF2-SHA256" />

            <Box x={340} y={60} w={220} h={64} title="Client A — Cardiology" sub="local shard" />
            <Box x={340} y={170} w={220} h={64} title="Client B — Endocrinology" sub="local shard" />
            <Box x={340} y={280} w={220} h={64} title="Client C — Outpatient" sub="local shard" />

            <Box x={650} y={110} w={210} h={70} title="DP-SGD Trainer" sub="clip + gaussian noise" tone="primary" />
            <Box x={650} y={240} w={210} h={70} title="FedAvg Aggregator" sub="weight averaging only" tone="signal" />

            <Arrow d="M140,124 L140,170" />
            <Arrow d="M140,234 L140,280" />
            <Arrow d="M240,92 L340,92" />
            <Arrow d="M240,202 L340,202" />
            <Arrow d="M240,312 L340,312" />
            <Arrow d="M560,92 C610,92 610,130 650,138" />
            <Arrow d="M560,202 C610,202 610,160 650,160" />
            <Arrow d="M560,312 C610,312 610,290 650,282" />
            <Arrow d="M755,180 L755,240" />
            <Arrow d="M650,275 C540,400 300,400 150,350" />
            <text x={360} y={398} fontSize="11" fill="var(--muted-foreground)">
              global weights broadcast back to every client (no data returns)
            </text>
          </svg>
        </Figure>

        <Figure
          n="Fig. 2"
          title="Data-flow diagram (Level 1)"
          caption="Plaintext exists only transiently in volatile memory during a session; it is never written to disk or transmitted."
        >
          <svg viewBox="0 0 900 260" className="w-[900px]">
            <Defs />
            <Box x={20} y={100} w={160} h={60} title="Raw record" sub="CSV / file" />
            <Box x={230} y={100} w={160} h={60} title="Encrypt" sub="AES-GCM + IV" tone="signal" />
            <Box x={440} y={30} w={170} h={60} title="Vault store" sub="ciphertext only" />
            <Box x={440} y={170} w={170} h={60} title="Feature pipeline" sub="in-memory" tone="primary" />
            <Box x={680} y={100} w={190} h={60} title="Private model" sub="ε-bounded weights" tone="primary" />
            <Arrow d="M180,130 L230,130" />
            <Arrow d="M390,120 C415,120 415,70 440,62" />
            <Arrow d="M390,140 C415,140 415,192 440,200" />
            <Arrow d="M610,200 C650,200 650,150 680,140" />
            <Arrow d="M610,60 C650,60 650,110 680,120" />
          </svg>
        </Figure>

        <Figure
          n="Fig. 3"
          title="Use-case diagram"
          caption="Three actors, strictly separated duties. The analyst can request predictions but can never read a vault record."
        >
          <svg viewBox="0 0 900 300" className="w-[900px]">
            <Defs />
            {[
              { y: 60, label: "Data Owner" },
              { y: 150, label: "ML Analyst" },
              { y: 240, label: "Auditor" },
            ].map((a) => (
              <g key={a.label}>
                <circle cx={60} cy={a.y - 14} r={12} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
                <path
                  d={`M60,${a.y - 2} L60,${a.y + 20} M46,${a.y + 6} L74,${a.y + 6} M60,${a.y + 20} L48,${a.y + 38} M60,${a.y + 20} L72,${a.y + 38}`}
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                  fill="none"
                />
                <text x={60} y={a.y + 54} textAnchor="middle" fontSize="12" fill="var(--foreground)">
                  {a.label}
                </text>
              </g>
            ))}
            {[
              { x: 300, y: 40, t: "Seal file in vault" },
              { x: 300, y: 110, t: "Unseal & verify hash" },
              { x: 300, y: 180, t: "Configure privacy budget" },
              { x: 300, y: 250, t: "Train federated model" },
              { x: 610, y: 110, t: "Run local prediction" },
              { x: 610, y: 215, t: "Review audit log" },
            ].map((u) => (
              <g key={u.t}>
                <ellipse
                  cx={u.x + 90}
                  cy={u.y + 20}
                  rx={110}
                  ry={26}
                  fill="var(--surface-2)"
                  stroke="var(--border)"
                />
                <text x={u.x + 90} y={u.y + 25} textAnchor="middle" fontSize="12" fill="var(--foreground)">
                  {u.t}
                </text>
              </g>
            ))}
            <g stroke="var(--border)" strokeWidth={1.2} fill="none">
              <path d="M95,50 L190,60" />
              <path d="M95,58 L190,130" />
              <path d="M95,150 L190,200" />
              <path d="M95,158 L190,270" />
              <path d="M500,130 L610,130" />
              <path d="M95,250 C300,300 450,280 610,235" />
            </g>
          </svg>
        </Figure>

        <section className="panel p-7">
          <span className="kicker">Algorithm</span>
          <h3 className="mt-2 text-lg font-semibold">DP-FedAvg training loop</h3>
          <pre className="mt-4 overflow-x-auto rounded-md bg-background p-5 font-mono text-[0.8rem] leading-relaxed text-muted-foreground">
{`Input: clients K, rounds T, clip C, noise multiplier σ, lr η
Initialise global weights w0 ← 0

for t = 1 … T:
    for each client k in K (in parallel, on its own machine):
        g ← 0
        for each sample (x, y) in shard_k:
            gi ← ∇ L(w_{t-1}; x, y)              # per-sample gradient
            gi ← gi · min(1, C / ‖gi‖₂)          # clip sensitivity
            g  ← g + gi
        g ← ( g + N(0, σ²C²I) ) / |shard_k|      # gaussian DP noise
        w_k ← w_{t-1} − η · g                     # local step
    w_t ← (1/K) Σ_k w_k                           # FedAvg aggregation

Output: w_T, with (ε, δ)-differential privacy, δ = 1e-5`}
          </pre>
        </section>

        <section className="panel p-7">
          <span className="kicker">Stack</span>
          <h3 className="mt-2 text-lg font-semibold">Technology used</h3>
          <div className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Frontend", "React 19 + TanStack Start (SSR)"],
              ["Styling", "Tailwind CSS v4 design tokens"],
              ["Cryptography", "Web Crypto API — AES-256-GCM, PBKDF2, SHA-256"],
              ["ML engine", "Custom logistic regression, pure TypeScript"],
              ["Privacy", "DP-SGD (gradient clipping + gaussian noise)"],
              ["Distribution", "Federated averaging across simulated clients"],
              ["Storage", "Browser-local ciphertext store (no server)"],
              ["Deployment", "Runs fully on-premise / air-gapped capable"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <span className="font-mono text-xs tracking-wider text-primary uppercase">{k}</span>
                <span className="text-right text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
