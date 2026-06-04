import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";

import axiosInstance from "../components/api/axiosInstance.js";
import { Plus, Copy, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { toast } from "sonner";

const inputClass =
  "mt-1 w-full h-9 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-base";

const emptySmtpForm = {
  hostname: "",
  port: "",
  username: "",
  password: "",
  name: "",
};

function SmtpFormFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="block text-sm sm:col-span-2">
        <span className="text-muted-foreground">Display name</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={inputClass}
          placeholder="e.g. Production mail"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted-foreground">Hostname</span>
        <input
          type="text"
          value={form.hostname}
          onChange={(e) => onChange("hostname", e.target.value)}
          className={inputClass}
          placeholder="smtp.example.com"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted-foreground">Port</span>
        <input
          type="number"
          value={form.port}
          onChange={(e) => onChange("port", e.target.value)}
          className={inputClass}
          placeholder="587"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted-foreground">Username</span>
        <input
          type="text"
          value={form.username}
          onChange={(e) => onChange("username", e.target.value)}
          className={inputClass}
          autoComplete="off"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted-foreground">Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(e) => onChange("password", e.target.value)}
          className={inputClass}
          placeholder="Required"
          autoComplete="new-password"
        />
      </label>
    </div>
  );
}

function SmtpDetailGrid({ smtp }) {
  const rows = [
    { label: "Hostname", value: smtp.hostname },
    { label: "Port", value: String(smtp.port) },
    { label: "Username", value: smtp.username },
    { label: "Password", value: smtp.password || "••••••••" },
  ];
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 font-mono text-[13px] break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ApiKeys() {
  const { apiKey, user, accessToken, fetchApiKey, updateUseCustomSMTP, setUser } =
    useAuth();
  const useCustomSMTP = user?.useCustomSMTP === true;
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [smtp, setSmtp] = useState(null);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpForm, setSmtpForm] = useState(emptySmtpForm);
  /** null = view or empty, "add" | "edit" = form */
  const [smtpFormMode, setSmtpFormMode] = useState(null);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpToggleSaving, setSmtpToggleSaving] = useState(false);
  const canToggleSmtp = Boolean(smtp) || useCustomSMTP;

  const loadSmtp = async () => {
    if (!accessToken) return;
    setSmtpLoading(true);
    try {
      const res = await axiosInstance.get("/smtp/getUserSMTPs", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const list = res.data?.smtps || [];
      setSmtp(list[0] || null);
      setSmtpFormMode(null);
    } catch (e) {
      setSmtp(null);
      if (e?.response?.status !== 404) {
        toast.error(e?.response?.data?.message || "Failed to load SMTP");
      }
    } finally {
      setSmtpLoading(false);
    }
  };

  const syncUserSmtpPreference = async () => {
    if (!user?.userId || !accessToken) return;
    try {
      const res = await axiosInstance.post("/auth/updateUser", {
        userId: user.userId,
        name: user.name,
        email: user.email,
        organization: user.organization,
      });
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch {
      /* keep cached user */
    }
  };

  useEffect(() => {
    loadSmtp();
    syncUserSmtpPreference();
  }, [accessToken]);

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const createKey = async () => {
    try {
      await axiosInstance.post("/creds/createApiKey", {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchApiKey(user._id || user.userId);
      toast.success("API key created");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create API key");
    }
  };

  const handleSmtpField = (field, value) => {
    setSmtpForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateSmtpForm = () => {
    const { hostname, port, username, password, name } = smtpForm;
    const portNum = Number(port);
    if (!hostname?.trim() || !username?.trim() || !password || !name?.trim()) {
      toast.error("All SMTP fields are required");
      return null;
    }
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      toast.error("Port must be a number between 1 and 65535");
      return null;
    }
    return {
      hostname: hostname.trim(),
      port: portNum,
      username: username.trim(),
      password,
      name: name.trim(),
    };
  };

  const startAddSmtp = () => {
    setSmtpForm(emptySmtpForm);
    setSmtpFormMode("add");
  };

  const startEditSmtp = () => {
    if (!smtp) return;
    setSmtpForm({
      hostname: smtp.hostname || "",
      port: String(smtp.port ?? ""),
      username: smtp.username || "",
      password: "",
      name: smtp.name || "",
    });
    setSmtpFormMode("edit");
  };

  const cancelSmtpForm = () => {
    setSmtpForm(emptySmtpForm);
    setSmtpFormMode(null);
  };

  const saveSmtp = async () => {
    const payload = validateSmtpForm();
    if (!payload) return;

    if (smtpFormMode === "add" && smtp) {
      toast.error("Delete your existing SMTP before adding a new one");
      return;
    }

    setSmtpSaving(true);
    try {
      if (smtpFormMode === "edit" && smtp?.smtpId) {
        await axiosInstance.put(
          "/smtp/update",
          { smtpId: smtp.smtpId, ...payload },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        toast.success("SMTP updated");
      } else {
        await axiosInstance.post(
          "/smtp/create",
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        toast.success("SMTP saved");
      }
      setSmtpForm(emptySmtpForm);
      await loadSmtp();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save SMTP");
    } finally {
      setSmtpSaving(false);
    }
  };

  const deleteSmtp = async () => {
    if (!smtp?.smtpId) return;
    try {
      await axiosInstance.post(
        "/smtp/delete",
        { smtpId: smtp.smtpId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (useCustomSMTP) {
        await updateUseCustomSMTP(false);
      }
      toast.success("SMTP removed");
      setSmtp(null);
      setSmtpForm(emptySmtpForm);
      setSmtpFormMode(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete SMTP");
    }
  };

  const toggleUseCustomSMTP = async () => {
    const enabling = !useCustomSMTP;
    if (enabling && !smtp) {
      toast.error("Add SMTP credentials before enabling custom SMTP");
      return;
    }
    setSmtpToggleSaving(true);
    await updateUseCustomSMTP(enabling);
    setSmtpToggleSaving(false);
  };

  const showSmtpForm = smtpFormMode === "add" || smtpFormMode === "edit";

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title="API Key"
        description="Your API key is used to authenticate requests against the Send Email API. Keep it secret!"
        actions={
          !apiKey && (
            <button
              onClick={createKey}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base"
            >
              <Plus className="h-4 w-4" /> Create key
            </button>
          )
        }
      />
      {apiKey ? (
        <div className="border border-border rounded-lg bg-card px-4 py-3 flex flex-row items-center gap-4 shadow-sm">
          <span className="font-semibold text-sm shrink-0">Key</span>
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded select-all break-all flex-1 min-w-0">
            {showKey ? apiKey : "••••••••••••••••••••••••••••••••"}
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-base shrink-0"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? "Hide API Key" : "Show API Key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-base shrink-0"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </button>
          {copied && <span className="text-xs text-green-600 shrink-0">Copied!</span>}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-6">
          No API key yet. Click <strong>Create key</strong> above.
        </p>
      )}
      {apiKey && (
        <p className="text-xs text-muted-foreground mt-2 text-right">
          Account: <span className="font-mono">{user?.email}</span>
        </p>
      )}

      <div className="mt-14 pt-14 border-t border-border">
        <PageHeader
          title="Custom SMTP"
          description="One SMTP server per account. When enabled, your mail is sent through your server; if that fails, the platform SMTP is used."
          actions={
            smtp && !showSmtpForm ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEditSmtp}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent transition-base"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={deleteSmtp}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm text-destructive hover:bg-destructive/10 transition-base"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            ) : (
              !showSmtpForm &&
              !smtp && (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={startAddSmtp}
                    className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 shrink-0" /> Add SMTP
                  </button>
                </div>
              )
            )
          }
        />

        <div
          className={`mb-4 rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 shadow-sm ${
            !canToggleSmtp ? "opacity-60" : ""
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">Use custom SMTP</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {smtp
                ? useCustomSMTP
                  ? "Enabled — your SMTP is used first; platform SMTP is used if it fails."
                  : "Disabled — your SMTP stays saved; sends use platform SMTP only."
                : "Add SMTP credentials below to enable this option."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={useCustomSMTP}
            disabled={!canToggleSmtp || smtpToggleSaving}
            onClick={toggleUseCustomSMTP}
            className={`relative shrink-0 h-6 w-11 rounded-full transition-base disabled:cursor-not-allowed ${
              useCustomSMTP ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                useCustomSMTP ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {smtpLoading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>
        ) : showSmtpForm ? (
          <div className="rounded-lg border border-border bg-card px-4 py-5 shadow-sm">
            <h3 className="text-sm font-medium mb-4">
              {smtpFormMode === "edit" ? "Update SMTP" : "Add SMTP"}
            </h3>
            <SmtpFormFields form={smtpForm} onChange={handleSmtpField} />
            {smtpFormMode === "edit" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Re-enter your password to save changes (it is not shown after saving).
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                type="button"
                onClick={saveSmtp}
                disabled={smtpSaving}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base disabled:opacity-50"
              >
                {smtpFormMode === "edit" ? "Update SMTP" : "Save SMTP"}
              </button>
              <button
                type="button"
                onClick={cancelSmtpForm}
                disabled={smtpSaving}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent transition-base disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : smtp ? (
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{smtp.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Custom SMTP</p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  useCustomSMTP
                    ? "bg-primary/15 text-primary border-primary/25"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {useCustomSMTP ? "In use" : "Configured"}
              </span>
            </div>
            <div className="px-4 py-4">
              <SmtpDetailGrid smtp={smtp} />
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">
            No custom SMTP configured. Click <strong>Add SMTP</strong> to connect your server.
          </p>
        )}
      </div>
    </div>
  );
}
