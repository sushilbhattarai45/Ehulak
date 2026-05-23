export function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  const visible = user.slice(0, 2);
  const masked = "*".repeat(Math.max(1, user.length - 2));
  return `${visible}${masked}@${domain}`;
}

export function relativeTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function absoluteTime(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function classNames(...args) {
  return args.filter(Boolean).join(" ");
}
