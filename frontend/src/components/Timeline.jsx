import { classNames } from "../lib/format.js";
import { absoluteTime } from "../lib/format.js";

const STAGE_COLOR = {
  created: "bg-info",
  queued: "bg-info",
  processing: "bg-warning",
  retry: "bg-warning",
  scheduled: "bg-warning",
  success: "bg-primary",
  failed: "bg-destructive",
  dlq: "bg-destructive",
  pending: "bg-muted-foreground",
};

export default function Timeline({ events }) {
  return (
    <ol className="relative border-l border-border ml-2">
      {events.map((e, i) => (
        <li key={i} className="pl-6 pb-5 last:pb-0 relative">
          <span
            className={classNames(
              "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background",
              STAGE_COLOR[e.stage] || "bg-muted-foreground"
            )}
          />
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-mono text-xs uppercase tracking-wider text-foreground">
              {e.stage}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {absoluteTime(e.ts)}
            </div>
          </div>
          {e.worker && (
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              worker: {e.worker}
              {e.attempt != null ? ` · attempt ${e.attempt}` : ""}
            </div>
          )}
          <div className="mt-1 text-sm text-muted-foreground">{e.note}</div>
          {e.errorMessage && (
            <div className="mt-1 text-xs text-destructive font-mono">{e.errorMessage}</div>
          )}
        </li>
      ))}
    </ol>
  );
}
