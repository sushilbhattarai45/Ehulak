import { classNames } from "../lib/format.js";

const GITHUB_URL = "https://github.com/sushilbhattarai45";

export default function DeveloperCredit({ className, align = "center" }) {
  return (
    <p
      className={classNames(
        "text-[11px] text-muted-foreground",
        align === "center" && "text-center",
        className,
      )}
    >
      Developed by{" "}
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium"
      >
        Sushil Bhattarai
      </a>
    </p>
  );
}
