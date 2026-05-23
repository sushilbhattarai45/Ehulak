import { useEffect, useState } from "react";
// @ts-expect-error - App is a .jsx file
import App from "./App.jsx";

// React Router DOM uses `window` and cannot SSR safely; mount only on client.
export function ClientApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-background)" }} />
    );
  }
  return <App />;
}
