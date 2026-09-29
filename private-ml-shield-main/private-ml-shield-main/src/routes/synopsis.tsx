import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

export const Route = createFileRoute("/synopsis")({
  head: () => ({
    meta: [
      { title: "Project Synopsis — On-Premise Privacy-Preserving ML & Encrypted Vault" },
      {
        name: "description",
        content:
          "Abstract, objectives, literature survey, methodology, modules, results and future scope for the final-year privacy-preserving machine learning project.",
      },
      { property: "og:title", content: "Project Synopsis — PrivacyVault ML" },
      {
        property: "og:description",
        content: "Full synopsis: abstract, objectives, methodology, modules, results, references.",
      },
    ],
  }),
  component: Synopsis,
});

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={n} className="scroll-mt-24">
      <p className="kicker">Section {n}</p>
      <h2 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Synopsis() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-14 px-6 py-16">
        <header>
          <p className="kicker">Project synopsis</p>
          <h1 className="mt-3 text-4xl leading-tight font-bold">
            On-Premise Privacy-Preserving Machine Learning &amp; Encrypted Vault
          </h1>
          <p className="mt-4 text-muted-foreground">
            A final-year major project in Computer Engineering / Information Technology.
          </p>
          <div className="mt-6 panel p-5 font-mono text-xs text-muted-foreground">
            <p>
              Fill in before submission: <span className="text-warn">[STUDENT NAMES &amp; ROLL NOS]</span>,{" "}
              <span className="text-warn">[GUIDE NAME]</span>,{" "}
              <span className="text-warn">[DEPARTMENT]</span>,{" "}
              <span className="text-warn">[COLLEGE &amp; UNIVERSITY]</span>,{" "}
              <span className="text-warn">[ACADEMIC YEAR]</span>.
            </p>
          </div>
        </header>

        <Section n="1" title="Abstract">
          <p>
            Institutions that hold the most valuable training data — hospitals, banks, universities
            — are usually the ones least able to use cloud machine learning services, because
            regulation and consent forbid the data from leaving their premises. This project
            implements a complete system in which machine learning is brought to the data instead
            of the data being shipped to the model.
          </p>
          <p>
            The system combines three defences. Data at rest is sealed in an encrypted vault using
            AES-256-GCM with keys derived from a user passphrase via PBKDF2, so stolen storage is
            useless. Data in use is protected by federated learning: the dataset is partitioned
            across independent clients that train locally and share only model weights. The trained
            model itself is protected by differential privacy: per-sample gradients are clipped to
            a bounded norm and perturbed with calibrated Gaussian noise, so membership of any one
            record cannot be inferred from the released model.
          </p>
          <p>
            A working prototype demonstrates the full pipeline end to end and lets the user trade
            accuracy against the privacy budget ε interactively.
          </p>
        </Section>

        <Section n="2" title="Problem statement">
          <p>
            Conventional ML workflows require centralising raw sensitive records on a server or
            third-party API. This creates a single high-value breach target, violates data
            residency rules, and leaks information through the model itself — trained models are
            known to memorise individual training rows and are vulnerable to membership-inference
            and model-inversion attacks. There is a need for a deployable, on-premise system that
            delivers useful predictions without any of these exposures.
          </p>
        </Section>

        <Section n="3" title="Objectives">
          <Bullets
            items={[
              "Build an encrypted vault that stores sensitive files and records as authenticated ciphertext, with no plaintext or key ever written to disk.",
              "Implement federated learning so multiple departments can jointly train one model without exchanging raw data.",
              "Apply differential privacy (DP-SGD) so the released model carries a quantified, bounded privacy guarantee.",
              "Provide fully local inference so predictions never leave the device.",
              "Measure and visualise the accuracy-versus-privacy trade-off across privacy budgets.",
              "Deliver the whole system so it runs on-premise, with no external service dependency.",
            ]}
          />
        </Section>

        <Section n="4" title="Literature survey">
          <Bullets
            items={[
              "McMahan et al., Communication-Efficient Learning of Deep Networks from Decentralized Data (2017) — introduces FederatedAveraging, the aggregation protocol adopted here.",
              "Abadi et al., Deep Learning with Differential Privacy (2016) — defines DP-SGD with gradient clipping, Gaussian noise and the moments accountant.",
              "Dwork & Roth, The Algorithmic Foundations of Differential Privacy (2014) — the formal (ε, δ) framework used to state the guarantee.",
              "Shokri et al., Membership Inference Attacks Against Machine Learning Models (2017) — motivates why an unprotected model is itself a data leak.",
              "Kairouz et al., Advances and Open Problems in Federated Learning (2021) — survey of the deployment challenges this project's architecture responds to.",
              "NIST SP 800-38D — GCM mode of operation, the authenticated encryption standard used by the vault.",
            ]}
          />
        </Section>

        <Section n="5" title="Proposed methodology">
          <p>
            The workflow proceeds in four stages. (i) <strong>Ingest &amp; seal</strong>: the data
            owner supplies a passphrase; a 256-bit key is derived with PBKDF2-HMAC-SHA256 over
            250,000 iterations and a fresh 128-bit salt; each record is encrypted with AES-GCM
            under a unique 96-bit IV and stored as ciphertext with its authentication tag.
          </p>
          <p>
            (ii) <strong>Partition</strong>: for training, records are decrypted transiently in
            memory and distributed across K simulated clients, each representing a department with
            its own machine.
          </p>
          <p>
            (iii) <strong>Private training</strong>: each client computes per-sample gradients,
            clips each to L2 norm C, sums them, adds Gaussian noise N(0, σ²C²), and takes a local
            step. The coordinator averages the resulting weight vectors (FedAvg). Only weights ever
            cross the client boundary.
          </p>
          <p>
            (iv) <strong>Inference &amp; audit</strong>: the global model is evaluated on a held-out
            split, the effective privacy budget ε is reported at δ = 1e-5, and predictions are
            computed locally on demand.
          </p>
        </Section>

        <Section n="6" title="System modules">
          <Bullets
            items={[
              "Vault Module — encryption, decryption, integrity verification via SHA-256 digest, and secure deletion.",
              "Key Management Module — passphrase-based derivation; keys live only in volatile memory for the duration of an operation.",
              "Data Partitioning Module — shards records across federated clients and holds out a test split.",
              "Privacy Engine — gradient clipping, Gaussian noise injection, privacy budget accounting.",
              "Federated Trainer — local logistic-regression updates plus FedAvg aggregation across rounds.",
              "Inference & Visualisation Module — local scoring, loss/accuracy curves, and the accuracy-versus-ε comparison against a non-private baseline.",
            ]}
          />
        </Section>

        <Section n="7" title="Hardware & software requirements">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-mono text-sm text-primary">Hardware</h3>
              <Bullets
                items={[
                  "Any x86-64 or ARM machine, 8 GB RAM",
                  "No GPU required",
                  "Local network only; internet optional",
                ]}
              />
            </div>
            <div>
              <h3 className="font-mono text-sm text-primary">Software</h3>
              <Bullets
                items={[
                  "Node.js 20+ / Bun runtime",
                  "React 19 with TanStack Start",
                  "Web Crypto API (AES-GCM, PBKDF2, SHA-256)",
                  "TypeScript, Tailwind CSS v4",
                ]}
              />
            </div>
          </div>
        </Section>

        <Section n="8" title="Results & observations">
          <p>
            The prototype trains a logistic-regression risk classifier on a synthetic clinical
            dataset generated on-device. Users can reproduce the central finding directly in the{" "}
            <Link to="/demo" className="text-primary underline underline-offset-4">
              live demo
            </Link>
            : as the noise multiplier σ rises, the privacy budget ε falls and accuracy degrades
            gracefully rather than collapsing, and increasing the client count costs only a small
            amount of accuracy relative to centralised training.
          </p>
          <p className="rounded-md border border-warn/40 bg-warn/5 px-4 py-3 font-mono text-xs text-warn">
            [RECORD YOUR OWN MEASURED NUMBERS HERE before submission — run the demo at several σ
            values and tabulate accuracy vs ε. Do not quote figures you have not measured.]
          </p>
        </Section>

        <Section n="9" title="Limitations & future scope">
          <Bullets
            items={[
              "The privacy budget shown is an approximation; a full Rényi/moments accountant should be integrated for a publishable guarantee.",
              "Federation is simulated in one process; a real deployment needs authenticated network transport between client machines.",
              "Extend from logistic regression to neural networks, and add secure aggregation so the coordinator cannot see individual client updates.",
              "Add homomorphic encryption for inference on ciphertext, and hardware-backed key storage (TPM / secure enclave).",
              "Add a tamper-evident audit log for every unseal operation.",
            ]}
          />
        </Section>

        <Section n="10" title="Conclusion">
          <p>
            The project demonstrates that privacy and utility are not mutually exclusive. By
            layering authenticated encryption at rest, federated computation in use, and
            differential privacy in the released model, an institution can build and deploy
            predictive models on its most sensitive data without that data ever leaving its own
            premises — and can state, numerically, how much privacy it has preserved.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
