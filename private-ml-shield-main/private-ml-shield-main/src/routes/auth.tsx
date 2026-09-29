import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PrivacyVault ML" },
      { name: "description", content: "Sign in to store your encrypted vault and training runs." },
      { property: "og:title", content: "Sign in — PrivacyVault ML" },
      { property: "og:description", content: "Access your encrypted vault and saved training runs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary";
const btnCls =
  "w-full rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/demo` },
      });
      setMsg(error ? error.message : "Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else nav({ to: "/demo" });
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return setMsg(String(r.error.message ?? r.error));
    if (r.redirected) return;
    nav({ to: "/demo" });
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-md px-6 py-16">
        <div className="panel p-7">
          <span className="kicker">Secure access</span>
          <h1 className="mt-2 text-2xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your vault is stored in the SQL database as ciphertext only. Your passphrase never
            leaves this device.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input className={inputCls} type="email" required placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} type="password" required minLength={6} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className={btnCls} disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</button>
          </form>
          <button onClick={google} className="mt-3 w-full rounded-md border border-border bg-surface-2 px-4 py-2 font-mono text-sm hover:bg-secondary">
            Continue with Google
          </button>
          {msg ? <p className="mt-4 font-mono text-xs text-muted-foreground">{msg}</p> : null}
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 font-mono text-xs text-primary">
            {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
