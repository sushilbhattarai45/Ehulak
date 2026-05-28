import { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { classNames } from "../lib/format.js";
import { Mail, Zap, Activity, KeyRound, ArrowLeft } from "lucide-react";
import Modal from "../components/Modal.jsx";
import DeveloperCredit from "../components/DeveloperCredit.jsx";
import LogoMark from "../components/LogoMark.jsx";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";

const FEATURES = [
  { icon: Zap, label: "Event-driven pipeline" },
  { icon: Activity, label: "Real-time delivery tracking" },
  { icon: KeyRound, label: "API keys & DLQ built in" },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(() =>
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [signupStarting, setSignupStarting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const navigate = useNavigate();
  const {
    login,
    loginWithGoogle,
    signup,
    createOtp,
    validateOtp,
    completeFirstLogin,
    loading,
  } = useAuth();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      import("sonner").then(({ toast }) => toast.error("Email and password required"));
      return;
    }

    if (mode === "signin") {
      const result = await login(email, password);
      if (!result?.success) return;

      if (result.needsProfile) {
        
        setPendingLogin({ user: result.user, accessToken: result.accessToken });
        setShowProfileModal(true);
        return;
      }
      navigate("/dashboard");
      return;
    }

    if (mode === "signup") {
      await handleSignupStart();
    }
  }

  async function handleSignupStart() {
    setSignupStarting(true);
    setOtp("");
    setShowOtpModal(true);
    setOtpLoading(true);
    const sent = await createOtp(email);
    setOtpLoading(false);
    setSignupStarting(false);
    if (!sent) setShowOtpModal(false);
  }

  async function handleOtpVerify() {
    if (otp.length !== 6) {
      import("sonner").then(({ toast }) => toast.error("Enter the 6-digit code"));
      return;
    }
    setOtpLoading(true);
    const valid = await validateOtp(email, otp);
    if (!valid) {
      setOtpLoading(false);
      return;
    }

    const registered = await signup(email, password);
    setOtpLoading(false);
    if (registered) {
      setShowOtpModal(false);
      setMode("signin");
      setOtp("");
    }
  }

  async function handleResendOtp() {
    setOtpLoading(true);
    await createOtp(email);
    setOtpLoading(false);
  }

  async function handleGoogleSuccess(credentialResponse) {
    const credential = credentialResponse?.credential;
    if (!credential) return;

    const result = await loginWithGoogle(credential);
    if (!result?.success) return;

    if (result.needsProfile) {
      setPendingLogin({ user: result.user, accessToken: result.accessToken });
      setShowProfileModal(true);
      return;
    }
    navigate("/dashboard");
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !organization.trim()) {
      import("sonner").then(({ toast }) =>
        toast.error("Name and organization are required"),
      );
      return;
    }
    const ok = await completeFirstLogin(
      pendingLogin.user,
      pendingLogin.accessToken,
      
      name.trim(),
      organization.trim(),
    );
    if (ok) {
      setShowProfileModal(false);
      setPendingLogin(null);
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.72_0.14_155/0.12),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,oklch(0.26_0.012_250/0.4)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.26_0.012_250/0.4)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
      />

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-14 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-base">
          <LogoMark />
          <span className="font-semibold tracking-tight text-lg">Ehulak</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-base"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto w-full grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
          <div className="hidden lg:block text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-muted-foreground mb-5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>
                <span className="text-primary font-medium">e</span>-hulak · electronic post office
              </span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight leading-snug">
              {mode === "signin" ? "Welcome back to your" : "Start sending with your"}{" "}
              <span className="text-primary">delivery dashboard</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {mode === "signin"
                ? "Monitor emails, manage API keys, and recover failed sends — all in one place."
                : "Create an account and get your API key in under a minute. No credit card needed."}
            </p>

            <ul className="mt-8 space-y-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-lg border border-border/80 bg-card/40 px-4 py-3 max-w-sm">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Pipeline flow
              </p>
              <p className="text-xs font-mono text-foreground">
                queue <span className="text-muted-foreground">→</span> worker{" "}
                <span className="text-muted-foreground">→</span>{" "}
                <span className="text-primary">delivered</span>
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:w-[380px]">
            <div className="lg:hidden flex items-center gap-2 justify-center mb-6">
              <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <span className="font-semibold tracking-tight text-lg">Ehulak</span>
            </div>

            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-2xl shadow-black/10">
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
                    type="button"
                    onClick={() => setMode(t.v)}
                    className={classNames(
                      "h-8 rounded text-xs font-medium transition-base",
                      mode === t.v
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.l}
                  </button>
                ))}
              </div>

              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <div className="w-full flex justify-center [&>div]:w-full [&_iframe]:!w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() =>
                        import("sonner").then(({ toast }) =>
                          toast.error("Google sign-in was cancelled or failed"),
                        )
                      }
                      theme="outline"
                      size="large"
                      width="100%"
                      text="continue_with"
                      shape="rectangular"
                    />
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Add VITE_GOOGLE_CLIENT_ID to your .env file"
                  className="w-full h-9 rounded-md border border-border bg-background text-sm font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              )}

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  or
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Field
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Field
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base shadow-[0_0_20px_oklch(0.72_0.14_155/0.2)]"
                  disabled={loading || signupStarting}
                >
                  {loading
                    ? "Signing in..."
                    : signupStarting
                      ? "Sending code..."
                      : mode === "signin"
                        ? "Sign in"
                        : "Create account"}
                </button>
              </form>

              <div className="mt-5 text-center text-[11px] text-muted-foreground">
                By continuing you agree to our Terms and Privacy Policy.
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-5 sm:px-8 py-3 border-t border-border/60 space-y-1.5 max-w-4xl mx-auto">
        <p className="text-center text-[11px] text-muted-foreground">
          Queue → worker → delivery · Built for teams who care about deliverability
        </p>
        <DeveloperCredit />
      </footer>

      <Modal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify your email"
        subtitle={email}
      >
        <p className="text-sm text-muted-foreground mb-5">
          {otpLoading && otp.length === 0
            ? "Sending verification code..."
            : "Enter the 6-digit code sent to your email to complete signup."}
        </p>
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={otpLoading && otp.length === 0}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <button
          type="button"
          onClick={handleOtpVerify}
          disabled={otpLoading || otp.length !== 6}
          className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base disabled:opacity-50"
        >
          {otpLoading ? "Verifying..." : "Verify & create account"}
        </button>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={otpLoading}
          className="w-full mt-2 h-9 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-base disabled:opacity-50"
        >
          Resend code
        </button>
      </Modal>

      <Modal
        open={showProfileModal}
        onClose={() => {}}
        title="Complete your profile"
        subtitle={pendingLogin?.user?.email}
      >
        <p className="text-sm text-muted-foreground mb-5">
          Welcome! Tell us a bit about yourself before continuing.
        </p>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <Field
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="Organization"
            type="text"
            placeholder="Company or team name"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to dashboard"}
          </button>
        </form>
      </Modal>
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
