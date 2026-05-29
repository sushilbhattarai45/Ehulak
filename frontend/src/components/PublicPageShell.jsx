import SiteHeader from "./SiteHeader.jsx";
import DeveloperCredit from "./DeveloperCredit.jsx";
import { classNames } from "../lib/format.js";

const RADIAL_BG =
  "pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.72_0.14_155/0.12),transparent)]";

const GRID_BG =
  "pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,oklch(0.26_0.012_250/0.4)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.26_0.012_250/0.4)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]";

export function PublicFooter({ className = "max-w-5xl" }) {
  return (
    <footer
      className={classNames(
        "relative z-10 px-5 sm:px-8 py-3 border-t border-border/60 space-y-1.5 mx-auto w-full",
        className,
      )}
    >
      <p className="text-center text-[11px] text-muted-foreground">
        Queue → worker → delivery · Built for teams who care about deliverability
      </p>
      <DeveloperCredit />
    </footer>
  );
}

export default function PublicPageShell({
  headerVariant = "landing",
  headerBlurred = false,
  logoLarge = false,
  overflowHidden = true,
  mainClassName,
  footerClassName,
  showFooter = true,
  children,
}) {
  return (
    <div
      className={classNames(
        "min-h-screen bg-background text-foreground flex flex-col",
        overflowHidden && "overflow-hidden",
      )}
    >
      <div aria-hidden className={RADIAL_BG} />
      <div aria-hidden className={GRID_BG} />
      <SiteHeader
        variant={headerVariant}
        blurred={headerBlurred}
        logoLarge={logoLarge}
      />
      <main className={classNames("relative z-10 flex-1", mainClassName)}>
        {children}
      </main>
      {showFooter && <PublicFooter className={footerClassName} />}
    </div>
  );
}
