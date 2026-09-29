import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrivacyVault ML — On-Premise Privacy-Preserving ML & Encrypted Vault" },
      {
        name: "description",
        content:
          "A final-year project that trains machine learning models on sensitive data without the data ever leaving the premises, and stores files in an AES-256-GCM encrypted vault.",
      },
      {
        property: "og:title",
        content: "PrivacyVault ML — On-Premise Privacy-Preserving ML & Encrypted Vault",
      },
      {
        property: "og:description",
        content:
          "Federated learning + differential privacy + an encrypted vault, all running locally. Try the live demo.",
      },
    ],
  }),
  component: Home,
});

const modules = [
  {
    no: "01",
    title: "Encrypted Vault",
    body: "Files and records are sealed with AES-256-GCM. The key is derived from your passphrase with PBKDF2 and never stored anywhere.",
  },
  {
    no: "02",
    title: "Federated Training",
    body: "Data is split across simulated departments. Each trains locally and only model weights are averaged — raw records never move.",
  },
  {
    no: "03",
    title: "Differential Privacy",
    body: "Per-sample gradients are clipped and noised, so no single patient record can be reverse-engineered from the model.",
  },
  {
    no: "04",
    title: "Private Inference",
    body: "Predictions are computed on-device against the trained model. No prediction request is ever sent to a third party.",
  },
];

const stats = [
  { k: "AES-256-GCM", v: "Vault cipher" },
  { k: "PBKDF2 · 250k", v: "Key derivation" },
  { k: "FedAvg", v: "Training protocol" },
  { k: "DP-SGD", v: "Privacy mechanism" },
];

function Home() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="kicker">Final Year Major Project · B.E. / B.Tech</p>
          <h1 className="mt-5 max-w-4xl text-4xl leading-[1.05] font-bold md:text-6xl">
            On-Premise Privacy-Preserving Machine Learning &amp; Encrypted Vault
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Train useful models on sensitive records — medical, financial, academic — without the
            records ever leaving the building. Every file is sealed in an encrypted vault, every
            gradient is clipped and noised, and every prediction happens locally.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="rounded-md bg-primary px-5 py-3 font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Launch live demo →
            </Link>
            <Link
              to="/synopsis"
              className="rounded-md border border-border bg-surface px-5 py-3 font-mono text-sm transition-colors hover:bg-secondary"
            >
              Read synopsis
            </Link>
            <Link
              to="/slides"
              className="rounded-md border border-border bg-surface px-5 py-3 font-mono text-sm transition-colors hover:bg-secondary"
            >
              Open slide deck
            </Link>
          </div>

          <dl className="mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.k} className="bg-surface px-5 py-6">
                <dt className="font-mono text-sm font-semibold text-primary">{s.k}</dt>
                <dd className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="kicker">System modules</p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Four parts, one closed loop</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {modules.map((m) => (
            <article key={m.no} className="panel group relative p-7 transition-colors hover:border-primary/50">
              <span className="font-mono text-xs text-primary">{m.no}</span>
              <h3 className="mt-3 text-xl font-semibold">{m.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="kicker">The problem</p>
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            <p className="text-lg leading-relaxed">
              Hospitals, banks and colleges hold the exact data that machine learning needs — and
              the exact data they are legally forbidden from uploading to a cloud API. The usual
              answer is to not build the model at all.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              This project shows the third option: keep the data where it is, move only the maths.
              A vault protects data at rest, federated averaging protects it in use, and
              differential privacy protects it inside the finished model.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
