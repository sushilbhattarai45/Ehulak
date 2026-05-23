import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { classNames } from "../lib/format.js";
import axios from "axios";
import axiosInstance from "../components/api/axiosInstance.js";
export default function Auth() {

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, signup, loading } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      // Show error toast via context
      import('sonner').then(({ toast }) => toast.error('Email and password required'));
      return;
    }
    let success = false;
    if (mode === "signin") {
      success = await login(email, password);
    } else if (mode === "signup") {
      success = await signup(email, password);
    } else {
      import('sonner').then(({ toast }) => toast.error('Invalid mode'));
      return;
    }
    if (success) {
      navigate("/dashboard");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Ehulak</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "signin"
                ? "Sign in to your delivery dashboard"
                : "Start sending in under a minute"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-muted/60 mb-5">
            {[
              { v: "signin", l: "Sign in" },
              { v: "signup", l: "Sign up" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setMode(t.v)}
                className={classNames(
                  "h-8 rounded text-xs font-medium transition-base",
                  mode === t.v
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.l}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="w-full h-9 rounded-md border border-border bg-background hover:bg-accent text-sm font-medium flex items-center justify-center gap-2 transition-base"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* {mode === "signup" && <Field label="Name" type="text" placeholder="Ada Lovelace" />} */}
            <Field label="Email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <button
              type="submit"
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base"
              disabled={loading}
            >
              {loading ? (mode === "signin" ? "Signing in..." : "Creating...") : (mode === "signin" ? "Sign in" : "Create account")}
            </button>
          </form>

          <div className="mt-5 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full h-9 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-base"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.96h5.52c-.24 1.44-1.68 4.2-5.52 4.2-3.36 0-6.12-2.76-6.12-6.12s2.76-6.12 6.12-6.12c1.92 0 3.18.84 3.9 1.56l2.64-2.52C16.92 3.66 14.7 2.7 12 2.7c-5.22 0-9.48 4.26-9.48 9.48s4.26 9.48 9.48 9.48c5.46 0 9.06-3.84 9.06-9.24 0-.6-.06-1.08-.18-1.56H12z"
      />
    </svg>
  );
}
