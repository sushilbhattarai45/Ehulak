import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  AlertTriangle,
  BarChart3,
  KeyRound,
  ScrollText,
  BookOpen,
} from "lucide-react";
import { classNames } from "../lib/format.js";
import DeveloperCredit from "../components/DeveloperCredit.jsx";
import LogoMark from "../components/LogoMark.jsx";

const NAV = [
  { to: "/dashboard", label: "Emails", icon: LayoutDashboard, end: true },
  // { to: "/campaigns", label: "Campaigns", icon: Send },
  { to: "/dlq", label: "Dead Letter Queue", icon: AlertTriangle },
  // { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/api-keys", label: "SMTPs & API Keys", icon: KeyRound },
  { to: "/docs", label: "Documentation", icon: BookOpen },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col z-30">
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span className="font-semibold tracking-tight text-[15px]">Ehulak</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          Pipeline
        </div>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              classNames(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-base",
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="rounded-md bg-sidebar-accent/60 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <span className="dot bg-primary" />
            <span className="font-medium">All systems operational</span>
          </div>
          <div className="mt-1">99.98% delivery uptime · 30d</div>
        </div>
        <DeveloperCredit align="left" />
      </div>
    </aside>
  );
}
