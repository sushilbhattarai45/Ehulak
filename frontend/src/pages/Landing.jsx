import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Mail,
  ArrowRight,
  Zap,
  Activity,
  KeyRound,
  ChevronRight,
  Send,
  Layers,
  BarChart3,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_oklch(0.72_0.14_155)]" />
      </div>
      <span className="font-semibold tracking-tight text-lg">Ehulak</span>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, label: "Event-driven", desc: "Kafka-backed pipeline" },
  { icon: Activity, label: "Live tracking", desc: "Every send, every stage" },
  { icon: KeyRound, label: "API-first", desc: "Keys & webhooks ready" },
];

const PIPELINE_STEPS = [
  { label: "Queued", status: "pending" },
  { label: "Processing", status: "retrying" },
  { label: "Delivered", status: "success" },
];

const HOW_IT_WORKS = [
  {
    icon: Send,
    step: "01",
    title: "Send via API",
    desc: "One POST with your API key — message enters the queue.",
  },
  {
    icon: Layers,
    step: "02",
    title: "Pipeline runs",
    desc: "Workers pick up, retry on failure, route failures to DLQ.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Track & recover",
    desc: "Dashboard shows every stage; replay or inspect dead letters.",
  },
];

function PipelinePreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-2xl bg-primary/10 blur-2xl"
      />
      <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-2xl shadow-black/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Delivery pipeline
          </span>
          <span className="text-[11px] font-mono text-primary">live</span>
        </div>

        <div className="p-4 space-y-3">
          {[
            { id: "eml_8f2a…c91", to: "a***@company.io", subject: "Welcome aboard", status: "success" },
            { id: "eml_3b7e…a04", to: "t***@startup.dev", subject: "Password reset", status: "retrying" },
            { id: "eml_1c9d…f88", to: "n***@mail.com", subject: "Weekly digest", status: "pending" },
          ].map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-lg border border-border/80 bg-background/60 px-3 py-2.5"
            >
              <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground truncate">
                    {row.id}
                  </span>
                </div>
                <div className="text-xs text-foreground truncate mt-0.5">{row.subject}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{row.to}</div>
              </div>
              <StatusBadge status={row.status} />
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between gap-1 rounded-lg border border-border bg-muted/20 p-3">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <StatusBadge status={step.status} size="sm" />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {step.label}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.72_0.14_155/0.12),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,oklch(0.26_0.012_250/0.4)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.26_0.012_250/0.4)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
      />

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-14 border-b border-border/60">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            to="/docs"
            className="h-9 px-4 inline-flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-base"
          >
            Docs
          </Link>
          <Link
            to="/auth"
            className="h-9 px-4 inline-flex items-center rounded-md border border-border bg-card text-sm font-medium hover:bg-accent transition-base"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto w-full grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-muted-foreground mb-5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>
                <span className="text-primary font-medium">e</span>-hulak · electronic post office
              </span>
            </div>

            <h1 className="text-4xl sm:text-[2.75rem] font-semibold tracking-tight leading-[1.1]">
              Your emails,{" "}
              <span className="text-primary">delivered</span>
              <br className="hidden sm:block" />
              <span className="text-muted-foreground font-normal text-3xl sm:text-[2rem]">
                {" "}
                through one pipeline.
              </span>
            </h1>

            <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-md mx-auto lg:mx-0 leading-relaxed">
              Ehulak routes every message from queue to worker to inbox — with retries, DLQ, and
              full visibility built in.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <Link
                to="/auth"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-base shadow-[0_0_24px_oklch(0.72_0.14_155/0.25)]"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth?mode=signup"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium hover:bg-accent transition-base"
              >
                Create account
              </Link>
              <Link
                to="/docs#quick-start"
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md px-5 text-sm font-medium text-muted-foreground hover:text-foreground transition-base"
              >
                Read the quick start →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto lg:mx-0">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border/80 bg-card/50 px-2.5 py-2.5 sm:px-3 text-left"
                >
                  <Icon className="h-3.5 w-3.5 text-primary mb-1.5" />
                  <div className="text-[11px] sm:text-xs font-medium text-foreground leading-tight">
                    {label}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug hidden sm:block">
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
            <PipelinePreview />
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full mt-10 lg:mt-12">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground text-center mb-3">
            How it works
          </p>
          <div className="grid sm:grid-cols-3 gap-3 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm overflow-hidden">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }, i) => (
              <div
                key={step}
                className={`flex gap-3 p-4 ${i > 0 ? "sm:border-l border-border/80" : ""} ${i > 0 ? "border-t sm:border-t-0 border-border/80" : ""}`}
              >
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-primary">{step}</span>
                  <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-medium text-foreground">{title}</div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-5 sm:px-8 py-3 border-t border-border/60">
        <p className="text-center text-[11px] text-muted-foreground max-w-5xl mx-auto">
          Queue → worker → delivery · Built for teams who care about deliverability
        </p>
      </footer>
    </div>
  );
}
