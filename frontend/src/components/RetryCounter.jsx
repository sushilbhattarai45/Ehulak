import { classNames } from "../lib/format.js";

export default function RetryCounter({ value, max = 5 }) {
  const ratio = value / max;
  const color =
    value === 0
      ? "text-muted-foreground"
      : ratio >= 1
      ? "text-destructive"
      : ratio >= 0.6
      ? "text-warning"
      : "text-foreground";
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className={classNames(color)}>
        {value}/{max}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={classNames(
              "h-1.5 w-1.5 rounded-sm",
              i < value
                ? ratio >= 1
                  ? "bg-destructive"
                  : ratio >= 0.6
                  ? "bg-warning"
                  : "bg-primary"
                : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
