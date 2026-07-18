import { classNames } from "../lib/format.js";

const MAP = {
  success: { label: "success", color: "bg-primary", text: "text-primary" },
  failed: { label: "failed", color: "bg-destructive", text: "text-destructive" },
  pending: { label: "pending", color: "bg-info", text: "text-info" },
  retrying: { label: "retrying", color: "bg-warning", text: "text-warning" },
};

export default function StatusBadge({ status, size = "sm" }) {
  const m = MAP[status] || MAP.pending;
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card font-mono",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        m.text
      )}
    >
      <span className={classNames("dot", m.color)} />
      {m.label}
    </span>
  );
}
