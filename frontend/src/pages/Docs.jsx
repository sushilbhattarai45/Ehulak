import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { classNames } from "../lib/format.js";

const API_BASE = "https://your-api.example.com";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "api-key", label: "API Key" },
  { id: "send-email", label: "Send Email" },
  { id: "track-emails", label: "Track Emails" },
  { id: "dlq", label: "Dead Letter Queue" },
];

export default function Docs() {
  const [active, setActive] = useState("getting-started");

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <PageHeader
        title="Documentation"
        description="Learn how to send email through the platform and monitor delivery from your dashboard."
      />

      <div className="flex gap-8 h-[calc(100vh-11rem)] min-h-[320px]">
        <aside className="w-[200px] shrink-0">
          <nav className="space-y-0.5">
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

        <div className="flex-1 min-w-0 overflow-y-auto max-w-3xl pr-2">
        <article className="space-y-12 pb-20">
          <Section id="getting-started" title="Getting Started">
            <p>
              Ehulak lets you send transactional and campaign email through a simple HTTP API. After
              you send a message, you can follow its status from the dashboard—delivered, failed, or
              held for review.
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
              <li>Call the Send Email API from your app or script.</li>
              <li>Open the Emails view in the dashboard to see activity.</li>
            </ol>
          </Section>

          <Section id="api-key" title="API Key">
            <p>
              Every API request must include your personal API key. Keys are tied to your account and
              should be kept private—do not commit them to public repositories.
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
              <li>Create a new key and copy it immediately. You may not be able to view the full key again later.</li>
              <li>Store it in a secure place (password manager or secrets vault).</li>
            </ol>
            <p>
              Use the key in the <code>x-api-key</code> header on every Send Email request (see below).
            </p>
          </Section>

          <Section id="send-email" title="Send Email">
            <p>
              Submit a send request with the recipient and sender addresses. The platform accepts the
              message and processes delivery in the background.
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
  "from": "sender@yourdomain.com"
}`}</Code>

              <h4 className="text-sm font-semibold text-foreground">Success response</h4>
              <Code lang="json">{`{
  "message": "Email details for ID: fetched successfully!"
}`}</Code>

              <h4 className="text-sm font-semibold text-foreground">Example</h4>
              <Code lang="bash">{`curl -X POST ${API_BASE}/email/processEmail \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "from": "hello@yourdomain.com"
  }'`}</Code>

              <p className="text-xs text-muted-foreground">
                Replace <code>{API_BASE}</code> with the base URL provided for your environment.
              </p>
            </div>

            <h3>Errors</h3>
            <ul>
              <li>
                <strong>401</strong> — Missing or invalid API key. Confirm the key from{" "}
                <Link to="/api-keys" className="text-primary hover:underline">
                  API Keys
                </Link>{" "}
                is correct and active.
              </li>
              <li>
                <strong>500</strong> — Something went wrong on our side. Retry after a short wait or
                contact support if it persists.
              </li>
            </ul>
          </Section>

          <Section id="track-emails" title="Track Emails">
            <p>
              You do not need extra API calls to monitor sends. Open <strong>Emails</strong> in the
              sidebar to see a timeline of recent activity—successful deliveries and failures—sorted
              with the newest first.
            </p>
            <p>
              Click any row to open full details for that message. Status badges show whether a send
              succeeded or ultimately failed.
            </p>
          </Section>

          <Section id="dlq" title="Dead Letter Queue (DLQ)">
            <p>
              Not every email delivers on the first try. When delivery keeps failing, Ehulak retries
              automatically before moving the message to the <strong>Dead Letter Queue (DLQ)</strong>—a
              safe holding area for emails that could not be sent.
            </p>

            <h3>Retry policy</h3>
            <p>
              Each send is attempted up to <strong>5 times</strong>. If all 5 attempts fail (for example
              due to a temporary network issue or mailbox unavailable), the message is removed from the
              active send pipeline and stored in the DLQ. You can review it there instead of losing the
              record.
            </p>
            <Code lang="text">{`Send request accepted
  → attempt 1 … fails → retry
  → attempt 2 … fails → retry
  → attempt 3 … fails → retry
  → attempt 4 … fails → retry
  → attempt 5 … fails → moved to DLQ`}</Code>

            <h3>What is stored in the DLQ</h3>
            <p>
              When a message lands in the DLQ, the platform keeps the information you need to understand
              and act on the failure—without storing unnecessary copies of your API key or account
              secrets:
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
                <strong>Failure reason</strong> — a short explanation of why the last attempt failed
              </li>
              <li>
                <strong>Failed at</strong> — when the message was placed in the DLQ
              </li>
            </ul>
            <p>
              These records stay linked to your account so only you can see them in the dashboard.
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
                Use <strong>Retry</strong> on a row when you have fixed the underlying issue (for example
                corrected an address or restored your mail provider).
              </li>
            </ol>
            <p>
              Successfully delivered emails appear under <strong>Emails</strong>; only messages that
              exhausted all 5 retries appear in the DLQ.
            </p>
          </Section>
        </article>
        </div>
      </div>
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
