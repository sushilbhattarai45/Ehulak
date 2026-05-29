import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import LogoMark from "./LogoMark.jsx";
import { classNames } from "../lib/format.js";

const navLink =
  "h-9 px-4 inline-flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-base";
const navLinkBordered =
  "h-9 px-4 inline-flex items-center rounded-md border border-border bg-card text-sm font-medium hover:bg-accent transition-base";
const navLinkPrimary =
  "h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 transition-base";

function HeaderActions({ variant }) {
  switch (variant) {
    case "landing":
      return (
        <div className="flex items-center gap-2">
          <Link to="/docs" className={navLink}>
            Docs
          </Link>
          <Link to="/auth" className={navLinkBordered}>
            Sign in
          </Link>
        </div>
      );
    case "auth":
      return (
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-base"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      );
    case "docs":
      return (
        <div className="flex items-center gap-2">
          <Link to="/auth" className={navLinkBordered}>
            Sign in
          </Link>
          <Link to="/auth?mode=signup" className={navLinkPrimary}>
            Create account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      );
    default:
      return null;
  }
}

export default function SiteHeader({
  variant = "landing",
  blurred = false,
  logoLarge = false,
}) {
  return (
    <header
      className={classNames(
        "relative z-10 flex items-center justify-between px-5 sm:px-8 h-14 border-b border-border/60",
        blurred && "bg-background/80 backdrop-blur",
      )}
    >
      <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-base">
        <LogoMark />
        <span
          className={classNames(
            "font-semibold tracking-tight",
            "text-xl",
          )}
        >
          Ehulak
        </span>
      </Link>
      <HeaderActions variant={variant} />
    </header>
  );
}
