// Deterministic mock data for the email event pipeline.
const STATUSES = ["success", "failed", "pending", "retrying"];
const CAMPAIGNS = [
  { id: "cmp_welcome_2", name: "Welcome Series #2" },
  { id: "cmp_billing_jul", name: "Billing Reminders — Jul" },
  { id: "cmp_onboard_dev", name: "Developer Onboarding" },
  { id: "cmp_security_alert", name: "Security Alerts" },
  { id: "cmp_newsletter_w29", name: "Newsletter W29" },
];
const WORKERS = ["wkr-01", "wkr-02", "wkr-03", "wkr-04"];
const QUEUES = ["emailQueue", "emailQueue", "emailQueue", "dlq"];
const DOMAINS = ["acme.io", "globex.com", "initech.co", "umbrella.dev", "hooli.com"];
const FAILURE_REASONS = [
  { code: "SMTP_550", msg: "Mailbox unavailable (550 5.1.1 User unknown)" },
  { code: "DNS_NXDOMAIN", msg: "Recipient domain MX lookup failed" },
  { code: "TLS_HANDSHAKE", msg: "TLS handshake timeout with upstream MTA" },
  { code: "RATE_LIMITED", msg: "Provider rate limit exceeded (429)" },
  { code: "BOUNCE_HARD", msg: "Hard bounce reported by remote server" },
];

function seeded(n) {
  let s = n;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function id(prefix, rand) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(rand() * chars.length)];
  return `${prefix}_${out}`;
}

const rand = seeded(7);

export const EVENTS = Array.from({ length: 64 }).map((_, i) => {
  const campaign = CAMPAIGNS[Math.floor(rand() * CAMPAIGNS.length)];
  const statusRoll = rand();
  let status;
  if (statusRoll < 0.62) status = "success";
  else if (statusRoll < 0.78) status = "failed";
  else if (statusRoll < 0.9) status = "retrying";
  else status = "pending";
  const retries =
    status === "success"
      ? Math.floor(rand() * 2)
      : status === "retrying"
      ? 1 + Math.floor(rand() * 3)
      : status === "failed"
      ? 5
      : 0;
  const minutesAgo = Math.floor(rand() * 60 * 36);
  const ts = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const failure =
    status === "failed"
      ? FAILURE_REASONS[Math.floor(rand() * FAILURE_REASONS.length)]
      : null;
  return {
    id: id("em", rand),
    recipient: `user${i}@${DOMAINS[Math.floor(rand() * DOMAINS.length)]}`,
    status,
    retries,
    maxRetries: 5,
    timestamp: ts,
    queue: status === "failed" ? "dlq" : QUEUES[Math.floor(rand() * QUEUES.length)],
    worker: WORKERS[Math.floor(rand() * WORKERS.length)],
    campaignId: campaign.id,
    campaignName: campaign.name,
    failure,
  };
});

export const CAMPAIGNS_LIST = CAMPAIGNS.map((c) => {
  const items = EVENTS.filter((e) => e.campaignId === c.id);
  const total = items.length;
  const success = items.filter((e) => e.status === "success").length;
  const failed = items.filter((e) => e.status === "failed").length;
  const retries = items.reduce((s, e) => s + e.retries, 0);
  return {
    ...c,
    total,
    successRate: total ? Math.round((success / total) * 100) : 0,
    failureRate: total ? Math.round((failed / total) * 100) : 0,
    avgRetries: total ? (retries / total).toFixed(2) : "0.00",
  };
});

export function getEvent(id) {
  return EVENTS.find((e) => e.id === id);
}

export function buildTimeline(event) {
  const t0 = new Date(event.timestamp).getTime();
  const base = [
    { stage: "created", ts: new Date(t0 - 8000).toISOString(), note: "API request accepted" },
    { stage: "queued", ts: new Date(t0 - 6000).toISOString(), note: `Pushed to ${event.queue}` },
    { stage: "processing", ts: new Date(t0 - 3000).toISOString(), note: `Picked up by ${event.worker}` },
  ];
  for (let i = 0; i < event.retries; i++) {
    base.push({
      stage: "retry",
      ts: new Date(t0 - 1500 + i * 800).toISOString(),
      note: `Retry attempt ${i + 1} — backoff ${2 ** (i + 1)}s`,
    });
  }
  if (event.status === "success") {
    base.push({ stage: "success", ts: event.timestamp, note: "Accepted by remote MTA (250 OK)" });
  } else if (event.status === "failed") {
    base.push({
      stage: "failed",
      ts: event.timestamp,
      note: event.failure ? `${event.failure.code}: ${event.failure.msg}` : "Delivery failed",
    });
    base.push({ stage: "dlq", ts: event.timestamp, note: "Moved to Dead Letter Queue" });
  } else if (event.status === "retrying") {
    base.push({ stage: "scheduled", ts: event.timestamp, note: "Next retry scheduled" });
  } else {
    base.push({ stage: "pending", ts: event.timestamp, note: "Awaiting worker pickup" });
  }
  return base;
}

export const API_KEYS = [
  { id: "key_live_8x2k", name: "Production", prefix: "rk_live_8x2k…f93", created: "2025-02-11", lastUsed: "2m ago" },
  { id: "key_test_44dq", name: "Staging", prefix: "rk_test_44dq…01a", created: "2025-04-22", lastUsed: "1h ago" },
  { id: "key_test_zzm1", name: "Local dev", prefix: "rk_test_zzm1…b7c", created: "2025-05-03", lastUsed: "3d ago" },
];
