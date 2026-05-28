import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, UserPlus, KeyRound, Send, Server, Info } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import DeveloperCredit from "../components/DeveloperCredit.jsx";
import Sidebar from "../layout/Sidebar.jsx";
import Topbar from "../layout/Topbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { classNames } from "../lib/format.js";

const API_BASE = "https://api.ehulak.tech";

const SECTIONS = [
  { id: "smtp", label: "SMTP" },
  { id: "quick-start", label: "Quick Start" },
  { id: "getting-started", label: "Getting Started" },
  { id: "api-key", label: "API Key" },
  { id: "send-email", label: "Send Email" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "track-emails", label: "Track Emails" },
  { id: "dlq", label: "Dead Letter Queue" },
];

export default function Docs() {
  const { user } = useAuth();

  if (user) {
    return (
      <AuthedShell>
        <DocsBody withPageHeader />
      </AuthedShell>
    );
  }

  return (
    <PublicShell>
      <DocsBody />
    </PublicShell>
  );
}

function AuthedShell({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 ml-60">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function DocsBody({ withPageHeader = false }) {
  const [active, setActive] = useState("smtp");
  const scrollRef = useRef(null);
  const lockUntilRef = useRef(0);

  const scrollTo = (id) => {
    setActive(id);
    // Suppress scrollspy updates briefly while smooth-scroll animates past
    // intermediate sections so the highlight lands cleanly on the target.
    lockUntilRef.current = Date.now() + 800;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const visible = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        if (Date.now() < lockUntilRef.current) return;
        // Pick the first section (in document order) that is currently visible.
        const next = SECTIONS.find((s) => visible.has(s.id));
        if (next) setActive(next.id);
      },
      {
        root,
        // Trigger when a section's top crosses the upper third of the viewport
        // so the active item changes a beat before the heading reaches the top.
        rootMargin: "0px 0px -65% 0px",
        threshold: 0,
      },
    );

    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {withPageHeader && (
        <PageHeader
          title="Documentation"
          description="Learn how to send instant emails for free and track delivery from queue to inbox."
        />
      )}

      <div className="flex gap-8 h-[calc(100vh-11rem)] min-h-[320px]">
        <aside className="w-[200px] shrink-0">
          <nav className="space-y-0.5 sticky top-0">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={classNames(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm transition-base",
                  active === s.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto max-w-3xl pr-2">
          <article className="space-y-12 pb-20">
            <Section id="smtp" title="SMTP">
              <div className="not-prose rounded-lg border border-primary/30 bg-primary/5 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground m-0">
                        Sending via the platform SMTP
                      </h3>
                      <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                        DEFAULT
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Right now, every email you send through Ehulak goes out through our shared
                      platform SMTP. Recipients will see the sender address as{" "}
                      <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded text-[12px]">
                        noreply@ehulak.tech
                      </code>
                      , regardless of the{" "}
                      <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded text-[12px]">
                        from
                      </code>{" "}
                      value you pass in the request body (that field is recorded against the
                      message but not yet used as the envelope sender).
                    </p>

                    <div className="rounded-md border border-border bg-card/60 p-3 flex items-start gap-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        <div className="text-foreground font-medium mb-0.5">
                          Custom SMTP — coming soon
                        </div>
                        <p className="m-0">
                          We are working on a <strong>Custom SMTP</strong> feature so you can plug
                          in your own SMTP host, port, and credentials, and send from a verified
                          email address on your own domain. Until that ships, all sends use the
                          default Ehulak SMTP shown above.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section id="quick-start" title="Quick Start">
              <p>
                New to Ehulak? Get your first email out the door in three steps. You can read these
                without signing in—come back after each step to continue. The service is free to
                start and optimized for instant delivery.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 not-prose">
                <QuickStartCard
                  step="01"
                  icon={UserPlus}
                  title="Create an account"
                  desc="Sign up with your email and verify the one-time code."
                  cta="Create account"
                  to="/auth?mode=signup"
                />
                <QuickStartCard
                  step="02"
                  icon={KeyRound}
                  title="Create an API key"
                  desc="Open API Keys in the dashboard, generate a key, and copy it."
                  cta="Open API Keys"
                  to="/api-keys"
                />
                <QuickStartCard
                  step="03"
                  icon={Send}
                  title="Send your first email"
                  desc="Call /email/processEmail with your key and a recipient."
                  cta="See send example"
                  hash="send-email"
                />
              </div>

              <h3>Step 1 — Create an account</h3>
              <p>
                Head to the{" "}
                <Link to="/auth?mode=signup" className="text-primary hover:underline font-medium">
                  sign up page
                </Link>
                . Enter your email, request a one-time code, and verify. You will be redirected to
                your dashboard once your account is ready.
              </p>

              <h3>Step 2 — Create an API key</h3>
              <p>
                Once signed in, open{" "}
                <Link to="/api-keys" className="text-primary hover:underline font-medium">
                  API Keys
                </Link>{" "}
                from the sidebar and create a new key. <strong>Copy it immediately</strong>—for
                security, the full key is only shown once.
              </p>
              <p>Keep your key private:</p>
              <ul>
                <li>Store it in a secrets manager or <code>.env</code> file.</li>
                <li>Never commit it to a public repository.</li>
                <li>Rotate it from the same page if you suspect it leaked.</li>
              </ul>

              <h3>Step 3 — Send your first email</h3>
              <p>
                Install <code>axios</code> in your project and call the send endpoint with your key
                in the <code>x-api-key</code> header. The request body needs just a recipient and a
                sender address.
              </p>
              <Code lang="bash">{`npm install axios`}</Code>
              <Code lang="js">{`import axios from "axios";

const api = axios.create({
  baseURL: "${API_BASE}",
  headers: {
    "x-api-key": process.env.EHULAK_API_KEY,
    "Content-Type": "application/json",
  },
});

async function sendFirstEmail() {
  try {
    const { data } = await api.post("/email/processEmail", {
      to: "user@example.com",
      subject: "Hello from Ehulak",
      body: "This is a test email from Ehulak",
      html: "<p>This is a test email from Ehulak</p>",
      text: "This is a test email from Ehulak",
      campaign: "Test Campaign",
    });
    console.log("Accepted:", data);
  } catch (err) {
    console.error("Send failed:", err.response?.data || err.message);
  }
}

sendFirstEmail();`}</Code>
              <p>
                That’s it. Open the dashboard to watch the email move through the pipeline and land
                as a <strong>delivered</strong> event. If something fails five times in a row, it
                will appear in the <strong>Dead Letter Queue</strong> for review.
              </p>
            </Section>

            <Section id="getting-started" title="Getting Started">
              <p>
                Ehulak is an instant, free-to-start email delivery service with a simple HTTP API.
                Every message follows the same delivery path: accepted by the API, pushed to queue,
                processed by workers, then delivered (or retried and moved to DLQ if needed).
              </p>
              <p>To integrate in three steps:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Create an API key in the platform (see{" "}
                  <Link to="/api-keys" className="text-primary hover:underline font-medium">
                    API Keys
                  </Link>
                  ).
                </li>
                <li>Call the Send Email API from your app or script using axios.</li>
                <li>Open the Emails view in the dashboard to see activity.</li>
              </ol>
              <p>
                The base URL for every request is <code>{API_BASE}</code>.
              </p>
            </Section>

            <Section id="api-key" title="API Key">
              <p>
                Every API request must include your personal API key. Keys are tied to your account
                and should be kept private—do not commit them to public repositories.
              </p>
              <h3>How to get your key</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Sign in and open{" "}
                  <Link to="/api-keys" className="text-primary hover:underline font-medium">
                    API Keys
                  </Link>{" "}
                  in the sidebar.
                </li>
                <li>
                  Create a new key and copy it immediately. You may not be able to view the full key
                  again later.
                </li>
                <li>Store it in a secure place (password manager or secrets vault).</li>
              </ol>
              <p>
                Use the key in the <code>x-api-key</code> header on every Send Email request (see
                below).
              </p>
            </Section>

            <Section id="send-email" title="Send Email">
              <p>
                Submit a send request with your email content. The platform accepts it immediately,
                queues it, and workers deliver it in the background.
              </p>

              <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    POST
                  </span>
                  <code className="text-sm font-mono text-foreground">/email/processEmail</code>
                </div>

                <h4 className="text-sm font-semibold text-foreground">Headers</h4>
                <Code>{`x-api-key: <your-api-key>
Content-Type: application/json`}</Code>

                <h4 className="text-sm font-semibold text-foreground">Request body</h4>
                <Code lang="json">{`{
  "to": "recipient@example.com",
  "subject": "Hello from Ehulak",
  "body": "This is a test email from Ehulak",
  "html": "<p>This is a test email from Ehulak</p>",
  "text": "This is a test email from Ehulak",
  "campaign": "Test Campaign"
}`}</Code>

                <h4 className="text-sm font-semibold text-foreground">Success response</h4>
                <Code lang="json">{`{
  "message": "Email details for ID: fetched successfully!"
}`}</Code>

                <h4 className="text-sm font-semibold text-foreground">Example (axios)</h4>
                <Code lang="js">{`import axios from "axios";

const { data } = await axios.post(
  "${API_BASE}/email/processEmail",
  {
    to: "user@example.com",
    subject: "Hello from Ehulak",
    body: "This is a test email from Ehulak",
    html: "<p>This is a test email from Ehulak</p>",
    text: "This is a test email from Ehulak",
    campaign: "Test Campaign",
  },
  {
    headers: {
      "x-api-key": "YOUR_API_KEY",
      "Content-Type": "application/json",
    },
  }
);

console.log(data);`}</Code>

                <h4 className="text-sm font-semibold text-foreground">
                  Reusable client (recommended)
                </h4>
                <Code lang="js">{`import axios from "axios";

export const ehulak = axios.create({
  baseURL: "${API_BASE}",
  timeout: 5000,
  headers: {
    "x-api-key": process.env.EHULAK_API_KEY,
    "Content-Type": "application/json",
  },
});

export async function sendEmail({ to,  subject, body, html, text, campaign }) {
  const { data } = await ehulak.post("/email/processEmail", { to,  subject, body, html, text, campaign });
  return data;
}`}</Code>

                <p className="text-xs text-muted-foreground">
That's it. Open the dashboard to watch the email move through the pipeline and land as a <strong>delivered</strong> event. If something fails five times in a row, it will appear in the <strong>Dead Letter Queue</strong> for review.
                </p>
              </div>

              <h3>Errors</h3>
              <ul>
                <li>
                  <strong>401</strong> — Missing or invalid API key, or you hit a rate limit (see
                  below). Confirm the key from{" "}
                  <Link to="/api-keys" className="text-primary hover:underline">
                    API Keys
                  </Link>{" "}
                  is correct and active.
                </li>
                <li>
                  <strong>500</strong> — Something went wrong on our side. Retry after a short wait
                  or contact support if it persists.
                </li>
              </ul>
            </Section>

            <Section id="rate-limits" title="Rate Limits">
              <p>
                To keep the platform healthy and prevent abuse, every API key is limited to a fixed
                number of send requests over rolling time windows.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 not-prose">
                <RateCard label="Per minute" value="5" sub="requests / minute" />
                <RateCard label="Per hour" value="60" sub="requests / hour" />
              </div>

              <h3>What happens when you exceed a limit</h3>
              <p>
                The API responds with <strong>HTTP 401</strong> and one of these messages:
              </p>
              <Code lang="json">{`{
  "success": false,
  "message": "You have reached the maximum number of emails per minute."
}`}</Code>
              <Code lang="json">{`{
  "success": false,
  "message": "You have reached the maximum number of emails per hour."
}`}</Code>
              <p>
                The minute window resets after <strong>60 seconds</strong> and the hour window
                resets after <strong>3600 seconds</strong>. Counters are tracked per API key.
              </p>

              <h3>Staying within the limits</h3>
              <ul>
                <li>Send at most <strong>5 requests per minute</strong> per key.</li>
                <li>Send at most <strong>60 requests per hour</strong> per key.</li>
                <li>
                  If you receive the rate-limit error, wait until the window resets before sending
                  again.
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                If you need higher limits for production traffic, contact support so we can raise
                the quota on your key.
              </p>
            </Section>

            <Section id="track-emails" title="Track Emails">
              <p>
                You do not need extra API calls to monitor sends. Open <strong>Emails</strong> in
                the sidebar to see a timeline of recent activity—successful deliveries and
                failures—sorted with the newest first.
              </p>
              <p>
                Click any row to open full details for that message. You will see how it moved
                through the pipeline (queue → processing → delivered), or where it failed if
                retries were exhausted.
              </p>
            </Section>

            <Section id="dlq" title="Dead Letter Queue (DLQ)">
              <p>
                Not every email delivers on the first try. When delivery keeps failing, Ehulak
                retries automatically before moving the message to the{" "}
                <strong>Dead Letter Queue (DLQ)</strong>—a safe holding area for emails that could
                not be sent.
              </p>

              <h3>Retry policy</h3>
              <p>
                Each send is attempted up to <strong>5 times</strong>. If all 5 attempts fail (for
                example due to a temporary network issue or mailbox unavailable), the message is
                removed from the active send pipeline and stored in the DLQ. You can review it
                there instead of losing the record.
              </p>
              <Code lang="text">{`Send request accepted
  → attempt 1 … fails → retry
  → attempt 2 … fails → retry
  → attempt 3 … fails → retry
  → attempt 4 … fails → retry
  → attempt 5 … fails → moved to DLQ`}</Code>

              <h3>What is stored in the DLQ</h3>
              <p>
                When a message lands in the DLQ, the platform keeps the information you need to
                understand and act on the failure—without storing unnecessary copies of your API
                key or account secrets:
              </p>
              <ul>
                <li>
                  <strong>Recipient</strong> — who the email was sent to
                </li>
                <li>
                  <strong>Sender</strong> — the from address used for that send
                </li>
                <li>
                  <strong>Subject</strong> — the campaign or message subject line
                </li>
                <li>
                  <strong>Failure reason</strong> — a short explanation of why the last attempt
                  failed
                </li>
                <li>
                  <strong>Failed at</strong> — when the message was placed in the DLQ
                </li>
              </ul>
              <p>
                These records stay linked to your account so only you can see them in the
                dashboard.
              </p>

              <h3>How to use the DLQ in the platform</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Open{" "}
                  <Link to="/dlq" className="text-primary hover:underline font-medium">
                    Dead Letter Queue
                  </Link>{" "}
                  in the sidebar.
                </li>
                <li>
                  Browse failed messages—newest first—and read the failure reason for each row.
                </li>
                <li>
                  Use <strong>Retry</strong> on a row when you have fixed the underlying issue (for
                  example corrected an address or restored your mail provider).
                </li>
              </ol>
              <p>
                Successfully delivered emails appear under <strong>Emails</strong>; only messages
                that exhausted all 5 retries appear in the DLQ.
              </p>
            </Section>
          </article>
        </div>
      </div>
    </div>
  );
}

function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.72_0.14_155/0.12),transparent)]"
      />
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-14 border-b border-border/60 bg-background/80 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_oklch(0.72_0.14_155)]" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Ehulak</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="h-9 px-4 inline-flex items-center rounded-md border border-border bg-card text-sm font-medium hover:bg-accent transition-base"
          >
            Sign in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-base"
          >
            Create account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>
      <main className="relative z-10 flex-1 mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-muted-foreground mb-4">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span>Documentation · open access</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
            Learn how Ehulak gives you instant, free email delivery and send your first email.
            Start with{" "}
            <a href="#quick-start" className="text-primary hover:underline">
              Quick Start
            </a>{" "}
            for the fastest path.
          </p>
        </div>
        {children}
      </main>
      <footer className="relative z-10 px-5 sm:px-8 py-3 border-t border-border/60 space-y-1.5 max-w-5xl mx-auto">
        <p className="text-center text-[11px] text-muted-foreground">
          Queue → worker → delivery · Built for teams who care about deliverability
        </p>
        <DeveloperCredit />
      </footer>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight mb-4">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-3 leading-relaxed [&_strong]:text-foreground [&_code]:font-mono [&_code]:text-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h4]:text-foreground [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1.5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm">
        {children}
      </div>
    </section>
  );
}

function Code({ children }) {
  return (
    <pre className="rounded-md border border-border bg-[color-mix(in_oklab,var(--background)_60%,black_10%)] p-4 overflow-x-auto text-[12px] font-mono leading-relaxed text-foreground whitespace-pre-wrap">
      <code>{children}</code>
    </pre>
  );
}

function QuickStartCard({ step, icon: Icon, title, desc, cta, to, hash }) {
  const className =
    "group flex flex-col rounded-lg border border-border bg-card/50 p-4 hover:bg-accent/40 transition-base";
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-primary">{step}</span>
        <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-foreground">{title}</div>
      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary group-hover:underline">
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </>
  );

  if (hash) {
    return (
      <a href={`#${hash}`} className={className}>
        {body}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {body}
    </Link>
  );
}

function RateCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}
