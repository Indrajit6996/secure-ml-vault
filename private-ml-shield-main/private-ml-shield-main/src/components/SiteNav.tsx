import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

function AuthLink() {
  const { user } = useAuth();
  const cls =
    "rounded-md border border-primary/40 px-3 py-2 font-mono text-xs text-primary hover:bg-primary/10";
  if (user)
    return (
      <button className={cls} onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
    );
  return (
    <Link to="/auth" className={cls}>
      Sign in
    </Link>
  );
}

const links = [
  { to: "/", label: "Overview" },
  { to: "/architecture", label: "Architecture" },
  { to: "/demo", label: "Live Demo" },
  { to: "/synopsis", label: "Synopsis" },
  { to: "/slides", label: "Slides" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-sm text-primary">
            ⛨
          </span>
          <span className="font-mono text-sm leading-tight">
            <span className="block font-semibold tracking-tight">PrivacyVault ML</span>
            <span className="block text-[0.65rem] tracking-[0.2em] text-muted-foreground">
              ON-PREMISE
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-2 font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              {l.label}
            </Link>
          ))}
          <AuthLink />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 py-10">
      <div className="mx-auto max-w-7xl px-6 font-mono text-xs text-muted-foreground">
        Final year B.E./B.Tech project · On-Premise Privacy-Preserving Machine Learning &amp;
        Encrypted Vault · All computation runs locally in your browser.
      </div>
    </footer>
  );
}
