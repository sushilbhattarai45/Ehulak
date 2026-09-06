import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import PublicPageShell from "../components/PublicPageShell.jsx";
import { usePageSeo } from "../hooks/usePageSeo.js";

const PRIVACY_SECTIONS = [
  {
    title: "Information We Collect",
    body: (
      <>
        <p>
          Ehulak collects the information needed to create your account, secure your access, and
          deliver emails through the platform. This may include your email address, verification
          activity, API keys, SMTP configuration details you choose to save, email metadata, delivery
          status, error messages, and dead letter queue records.
        </p>
        <p>
          When you send email, we process the recipient, sender, subject, campaign, message body,
          delivery attempts, and related timestamps so the service can queue, retry, deliver, and
          display activity in your dashboard.
        </p>
      </>
    ),
  },
  {
    title: "How We Use Information",
    body: (
      <ul>
        <li>To authenticate your account and verify sign-in requests.</li>
        <li>To accept, queue, send, retry, and track emails you submit.</li>
        <li>To show delivery history, analytics, logs, and dead letter queue details.</li>
        <li>To protect the platform from abuse, spam, credential misuse, and excessive traffic.</li>
        <li>To debug failures, improve reliability, and respond to support requests.</li>
      </ul>
    ),
  },
  {
    title: "API Keys And SMTP Credentials",
    body: (
      <>
        <p>
          API keys are account-specific secrets. You should store them securely and delete any key
          that may have been exposed. Ehulak uses your API key only to authorize requests to your
          account.
        </p>
        <p>
          If you add custom SMTP settings, we use those credentials to send email on your behalf.
          Keep your SMTP account protected and remove saved credentials when you no longer need
          custom delivery.
        </p>
      </>
    ),
  },
  {
    title: "Sharing And Disclosure",
    body: (
      <p>
        We do not sell your personal information. We may disclose information when required to
        operate the service, comply with law, enforce acceptable use rules, investigate abuse, or
        protect Ehulak, users, recipients, and the public.
      </p>
    ),
  },
  {
    title: "Retention",
    body: (
      <p>
        We keep account, email, delivery, and diagnostic records for as long as needed to provide the
        service, maintain security, resolve issues, and satisfy legal obligations. You can remove API
        keys and SMTP settings from the dashboard when they are no longer needed.
      </p>
    ),
  },
  {
    title: "Your Responsibilities",
    body: (
      <ul>
        <li>Send email only to recipients you are allowed to contact.</li>
        <li>Do not use Ehulak for spam, phishing, scams, malware, harassment, or illegal content.</li>
        <li>Keep API keys, SMTP credentials, and account access private.</li>
        <li>Honor unsubscribe, consent, and privacy requirements that apply to your messages.</li>
      </ul>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        For privacy questions, account requests, or security concerns, contact the Ehulak team from
        the support channel listed in the product or documentation.
      </p>
    ),
  },
];

const TERMS_SECTIONS = [
  {
    title: "Using Ehulak",
    body: (
      <p>
        By creating an account or using Ehulak, you agree to use the service lawfully and
        responsibly. Ehulak provides email delivery tools, API access, dashboard visibility, and
        related infrastructure for sending and tracking messages.
      </p>
    ),
  },
  {
    title: "Acceptable Use",
    body: (
      <ul>
        <li>Do not send spam, phishing, scams, malware, or deceptive messages.</li>
        <li>Do not send harassment, threats, hate speech, illegal content, or abusive material.</li>
        <li>Do not impersonate others or misrepresent your sender identity.</li>
        <li>Do not attempt to bypass rate limits, security controls, or account restrictions.</li>
      </ul>
    ),
  },
  {
    title: "Your Content And Recipients",
    body: (
      <p>
        You are responsible for the email content you send, the recipients you contact, and the
        sender details you configure. You must have the right to contact your recipients and must
        comply with consent, unsubscribe, anti-spam, and privacy rules that apply to your messages.
      </p>
    ),
  },
  {
    title: "Service Limits",
    body: (
      <p>
        Ehulak may apply rate limits, delivery limits, platform SMTP limits, abuse controls, and
        account restrictions to keep the service reliable. Accounts that violate these terms may be
        limited, suspended, or removed.
      </p>
    ),
  },
  {
    title: "Availability And Changes",
    body: (
      <p>
        We aim to keep Ehulak reliable, but the service may change, pause, fail, or be unavailable
        from time to time. We may update features, limits, policies, and these terms as the platform
        evolves.
      </p>
    ),
  },
];

export default function Privacy() {
  usePageSeo({
    title: "Privacy Policy and Terms of Use — Ehulak",
    description:
      "How Ehulak collects, uses, and protects account, email, and delivery data, plus the terms of use for the service.",
    path: "/privacy",
  });
  return (
    <PublicPageShell
      headerVariant="docs"
      headerBlurred
      overflowHidden={false}
      mainClassName="mx-auto w-full max-w-4xl px-5 sm:px-8 py-10"
      footerClassName="max-w-4xl"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-muted-foreground mb-4">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Privacy and Terms · open access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Privacy Policy and Terms of Use
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          This page explains how Ehulak handles information and the terms that apply when you create
          an account, use API keys, configure SMTP, and send emails through the platform.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">Last updated: June 25, 2026</p>
      </div>

      <article className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 sm:p-7">
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Privacy Policy</h2>
            <div className="mt-5 space-y-8">
              {PRIVACY_SECTIONS.map((section) => (
                <PolicySection key={section.title} section={section} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Terms of Use</h2>
            <div className="mt-5 space-y-8">
              {TERMS_SECTIONS.map((section) => (
                <PolicySection key={section.title} section={section} />
              ))}
            </div>
          </section>
        </div>
      </article>

      <div className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Ready to use Ehulak?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in or create an account to manage API keys and send email.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/auth"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent transition-base"
            >
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-base"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link to="/docs" className="text-primary hover:underline font-medium">
          Read documentation
        </Link>
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </div>
    </PublicPageShell>
  );
}

function PolicySection({ section }) {
  return (
    <section className="scroll-mt-24">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h3>
      <div className="mt-3 text-sm text-muted-foreground space-y-3 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm">
        {section.body}
      </div>
    </section>
  );
}
