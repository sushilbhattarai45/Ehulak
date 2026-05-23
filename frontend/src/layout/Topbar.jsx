
import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useState, useRef, useEffect } from "react";

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : (user?.email ? user.email[0].toUpperCase() : 'U');

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full px-8 flex items-center justify-between gap-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email ID, recipient, or campaign…"
            className="w-full h-9 pl-9 pr-3 rounded-md bg-input/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-base font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-base"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              className="h-9 w-9 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-semibold focus:outline-none"
              onClick={() => setOpen((v) => !v)}
              aria-label="Profile menu"
            >
              {initials}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg z-50 p-2 text-sm min-w-[180px]">
                <div className="px-3 py-2 border-b border-border">
                  <div className="font-semibold">{user?.name || 'No Name'}</div>
                  <div className="text-xs text-muted-foreground break-all">{user?.email}</div>
                </div>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-accent rounded-md mt-1"
                  onClick={() => { logout(); setOpen(false); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
