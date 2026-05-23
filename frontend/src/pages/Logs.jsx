import PageHeader from "../components/PageHeader.jsx";
import { EVENTS } from "../services/mockData.js";
import { absoluteTime } from "../lib/format.js";

const LEVELS = ["info", "warn", "error"];

export default function Logs() {
  // Synthesize log lines from events. No email content — metadata only.
  const lines = EVENTS.slice(0, 40).flatMap((e) => {
    const out = [
      { ts: e.timestamp, level: "info", text: `event=${e.id} stage=queued queue=${e.queue}` },
      { ts: e.timestamp, level: "info", text: `event=${e.id} stage=processing worker=${e.worker}` },
    ];
    if (e.status === "failed")
      out.push({ ts: e.timestamp, level: "error", text: `event=${e.id} stage=failed code=${e.failure?.code}` });
    else if (e.status === "retrying")
      out.push({ ts: e.timestamp, level: "warn", text: `event=${e.id} stage=retry attempt=${e.retries}` });
    else if (e.status === "success")
      out.push({ ts: e.timestamp, level: "info", text: `event=${e.id} stage=success` });
    return out;
  });

  const levelColor = {
    info: "text-info",
    warn: "text-warning",
    error: "text-destructive",
  };

  return (
    <div>
      <PageHeader
        title="Logs / Events"
        description="Structured event log emitted by workers. Email content is never logged."
      />
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/40 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Stream</span>
          <span className="ml-auto font-mono">{lines.length} lines</span>
        </div>
        <div className="max-h-[640px] overflow-y-auto font-mono text-xs">
          {lines.map((l, i) => (
            <div key={i} className="px-4 py-1.5 border-b border-border/40 hover:bg-accent/40 transition-base flex gap-3">
              <span className="text-muted-foreground shrink-0">{absoluteTime(l.ts)}</span>
              <span className={`shrink-0 w-12 uppercase ${levelColor[l.level]}`}>{l.level}</span>
              <span className="text-foreground">{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
