import { useState } from "react";

export function AdminLoginScreen({ t, accent, status, onRequestCode, onVerifyCode, onLegacyLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [helper, setHelper] = useState("");

  async function handleRequestCode(event) {
    event?.preventDefault?.();
    setSubmitting(true);
    setError("");
    setDevCode("");
    setHelper("");
    try {
      const payload = await onRequestCode(email);
      setStep("code");
      if (payload?.dev_code) {
        setDevCode(payload.dev_code);
      }
      if (payload?.delivery) {
        setHelper(payload.delivery === "smtp" ? "We emailed you a 6-digit sign-in code." : "SMTP is not configured, so the code is shown below for local use.");
      }
    } catch (nextError) {
      setError(nextError.message || "Failed to send sign-in code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event) {
    event?.preventDefault?.();
    setSubmitting(true);
    setError("");
    try {
      await onVerifyCode(email, code);
    } catch (nextError) {
      setError(nextError.message || "Invalid sign-in code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLegacyLogin(event) {
    event?.preventDefault?.();
    if (!token.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onLegacyLogin(token);
    } catch (nextError) {
      setError(nextError.message || "Failed to sign in with platform token.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px", background: t.bg }}>
      <div style={{ width: "100%", maxWidth: "560px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "28px", padding: "28px", boxShadow: `0 24px 80px ${accent}18` }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>ChatKing Access</div>
        <h1 style={{ fontSize: "30px", lineHeight: 1.05, letterSpacing: "-0.04em", color: t.text, margin: 0 }}>Sign in to your workspace</h1>
        <p style={{ fontSize: "14px", color: t.textSub, marginTop: "12px", marginBottom: "20px", lineHeight: 1.6 }}>
          Use your organization email to receive a sign-in code. This session is tenant-aware and only loads the workspaces you belong to.
        </p>

        {status?.checking && <div style={{ fontSize: "13px", color: t.textSub, marginBottom: "16px" }}>Checking existing session...</div>}
        {error && <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: "#FB718514", border: "1px solid #FB718544", color: "#FB7185", fontSize: "13px" }}>{error}</div>}
        {helper && <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: `${accent}12`, border: `1px solid ${accent}2e`, color: t.text, fontSize: "13px" }}>{helper}</div>}
        {devCode && <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: `${accent}14`, border: `1px dashed ${accent}`, color: t.text, fontSize: "13px" }}>Local sign-in code: <strong>{devCode}</strong></div>}

        {step === "email" ? (
          <form onSubmit={handleRequestCode} style={{ display: "grid", gap: "14px" }}>
            <label style={{ display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>Work Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: `1px solid ${t.border}`, background: t.input, color: t.text, fontSize: "14px", outline: "none" }}
              />
            </label>
            <button type="submit" disabled={submitting || !email.trim()} style={{ padding: "14px 18px", borderRadius: "16px", border: "none", background: accent, color: "#fff", fontWeight: "700", fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Sending code..." : "Send sign-in code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} style={{ display: "grid", gap: "14px" }}>
            <div style={{ fontSize: "13px", color: t.textSub }}>Code sent to <strong style={{ color: t.text }}>{email}</strong></div>
            <label style={{ display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>6-digit code</span>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D+/g, "").slice(0, 6))}
                placeholder="123456"
                style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: `1px solid ${t.border}`, background: t.input, color: t.text, fontSize: "18px", letterSpacing: "0.2em", outline: "none" }}
              />
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setDevCode(""); setHelper(""); }} style={{ padding: "14px 18px", borderRadius: "16px", border: `1px solid ${t.border}`, background: "transparent", color: t.text, fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>Back</button>
              <button type="submit" disabled={submitting || code.length !== 6} style={{ flex: 1, padding: "14px 18px", borderRadius: "16px", border: "none", background: accent, color: "#fff", fontWeight: "700", fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Signing in..." : "Verify code"}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: `1px solid ${t.border}` }}>
          <div style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700", marginBottom: "10px" }}>Platform admin fallback</div>
          <form onSubmit={handleLegacyLogin} style={{ display: "flex", gap: "10px" }}>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Legacy admin token"
              style={{ flex: 1, padding: "12px 14px", borderRadius: "14px", border: `1px solid ${t.border}`, background: t.input, color: t.text, fontSize: "13px", outline: "none" }}
            />
            <button type="submit" disabled={submitting || !token.trim()} style={{ padding: "12px 16px", borderRadius: "14px", border: `1px solid ${t.border}`, background: "transparent", color: t.text, fontWeight: "700", fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              Token Sign-in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
