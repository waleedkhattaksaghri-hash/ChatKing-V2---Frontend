import { useState } from "react";

export function AdminLoginScreen({ t, accent, status, onRequestCode, onVerifyCode, onLegacyLogin, onPasswordLogin }) {
  const [mode, setMode] = useState("password"); // "password" | "code" | "token"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [helper, setHelper] = useState("");

  function resetErrors() {
    setError("");
    setDevCode("");
    setHelper("");
  }

  async function handlePasswordLogin(event) {
    event?.preventDefault?.();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    resetErrors();
    try {
      await onPasswordLogin(email, password);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestCode(event) {
    event?.preventDefault?.();
    setSubmitting(true);
    resetErrors();
    try {
      const payload = await onRequestCode(email);
      setStep("code");
      if (payload?.dev_code) setDevCode(payload.dev_code);
      if (payload?.delivery) {
        setHelper(payload.delivery === "smtp" ? "We emailed you a 6-digit sign-in code." : "SMTP is not configured — the code is shown below for local use.");
      }
    } catch (err) {
      setError(err.message || "Failed to send sign-in code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event) {
    event?.preventDefault?.();
    setSubmitting(true);
    resetErrors();
    try {
      await onVerifyCode(email, code);
    } catch (err) {
      setError(err.message || "Invalid sign-in code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLegacyLogin(event) {
    event?.preventDefault?.();
    if (!token.trim()) return;
    setSubmitting(true);
    resetErrors();
    try {
      await onLegacyLogin(token);
    } catch (err) {
      setError(err.message || "Failed to sign in with platform token.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setStep("email");
    resetErrors();
  }

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: `1px solid ${t.border}`,
    background: t.input,
    color: t.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const primaryBtn = (label, disabled) => ({
    style: {
      padding: "14px 18px",
      borderRadius: "16px",
      border: "none",
      background: accent,
      color: "#fff",
      fontWeight: "700",
      fontSize: "14px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.7 : 1,
      width: "100%",
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px", background: t.bg }}>
      <div style={{ width: "100%", maxWidth: "480px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "28px", padding: "32px", boxShadow: `0 24px 80px ${accent}18` }}>

        <div style={{ fontSize: "12px", fontWeight: "700", color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>ChatKing</div>
        <h1 style={{ fontSize: "28px", lineHeight: 1.1, letterSpacing: "-0.04em", color: t.text, margin: "0 0 20px 0" }}>Sign in to your workspace</h1>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "22px", background: t.surfaceHover, borderRadius: "14px", padding: "4px" }}>
          {[["password", "Email & Password"], ["code", "Email Code"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "10px",
                border: "none",
                background: mode === key ? t.surface : "transparent",
                color: mode === key ? t.text : t.textSub,
                fontWeight: mode === key ? "700" : "500",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: mode === key ? `0 1px 4px rgba(0,0,0,0.1)` : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {status?.checking && <div style={{ fontSize: "13px", color: t.textSub, marginBottom: "14px" }}>Checking session...</div>}
        {error && <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: "#FB718514", border: "1px solid #FB718544", color: "#FB7185", fontSize: "13px" }}>{error}</div>}
        {helper && <div style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "14px", background: `${accent}12`, border: `1px solid ${accent}2e`, color: t.text, fontSize: "13px" }}>{helper}</div>}
        {devCode && <div style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "14px", background: `${accent}14`, border: `1px dashed ${accent}`, color: t.text, fontSize: "13px" }}>Local code: <strong>{devCode}</strong></div>}

        {/* Email + Password */}
        {mode === "password" && (
          <form onSubmit={handlePasswordLogin} style={{ display: "grid", gap: "14px" }}>
            <label style={{ display: "grid", gap: "7px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: "7px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </label>
            <button type="submit" disabled={submitting || !email.trim() || !password.trim()} {...primaryBtn("Sign in", submitting || !email.trim() || !password.trim())}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {/* Email code */}
        {mode === "code" && step === "email" && (
          <form onSubmit={handleRequestCode} style={{ display: "grid", gap: "14px" }}>
            <label style={{ display: "grid", gap: "7px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>Work Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
            </label>
            <button type="submit" disabled={submitting || !email.trim()} {...primaryBtn("Send code", submitting || !email.trim())}>
              {submitting ? "Sending..." : "Send sign-in code"}
            </button>
          </form>
        )}

        {mode === "code" && step === "code" && (
          <form onSubmit={handleVerifyCode} style={{ display: "grid", gap: "14px" }}>
            <div style={{ fontSize: "13px", color: t.textSub }}>Code sent to <strong style={{ color: t.text }}>{email}</strong></div>
            <label style={{ display: "grid", gap: "7px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>6-digit code</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D+/g, "").slice(0, 6))}
                placeholder="123456"
                style={{ ...inputStyle, fontSize: "20px", letterSpacing: "0.25em" }}
              />
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => { setStep("email"); setCode(""); resetErrors(); }} style={{ padding: "14px 18px", borderRadius: "16px", border: `1px solid ${t.border}`, background: "transparent", color: t.text, fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>Back</button>
              <button type="submit" disabled={submitting || code.length !== 6} style={{ flex: 1, padding: "14px 18px", borderRadius: "16px", border: "none", background: accent, color: "#fff", fontWeight: "700", fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Verifying..." : "Verify code"}
              </button>
            </div>
          </form>
        )}

        {/* Platform admin token — collapsed by default */}
        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            onClick={() => switchMode(mode === "token" ? "password" : "token")}
            style={{ background: "none", border: "none", color: t.textMuted, fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            {mode === "token" ? "Back to login" : "Platform admin token login"}
          </button>

          {mode === "token" && (
            <form onSubmit={handleLegacyLogin} style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Admin token"
                style={{ ...inputStyle, flex: 1, padding: "12px 14px", borderRadius: "14px", fontSize: "13px" }}
              />
              <button type="submit" disabled={submitting || !token.trim()} style={{ padding: "12px 16px", borderRadius: "14px", border: `1px solid ${t.border}`, background: "transparent", color: t.text, fontWeight: "700", fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                Sign in
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
