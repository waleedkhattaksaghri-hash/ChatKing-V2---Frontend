import { useState, useEffect, useRef } from "react";

// ── API Config ────────────────────────────────────────────────────────────────
const API_URL   = "https://chatking-api-production.up.railway.app";
const CLIENT_ID = "1a46712c-93b2-46fe-a4f9-8c57afaa5923";

async function apiFetch(path) {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("API error:", path, e);
    return null;
  }
}

function useApi(path, fallback = null, deps = []) {
  const [data,    setData]    = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(path).then(d => {
      if (d !== null) setData(d);
      else setError("Failed to load");
      setLoading(false);
    });
  }, deps);

  return { data, loading, error, refetch: () => apiFetch(path).then(d => d && setData(d)) };
}

// ── Theme System ──────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:           "#070911",
    bgSolid:      "#070911",
    surface:      "#0D1117",
    surfaceHover: "#111827",
    surfaceActive:"#141D2E",
    border:       "#1E2A3E",
    borderLight:  "#141D2E",
    text:         "#E8EDF7",
    textSub:      "#7A8DB3",
    textMuted:    "#3B4D6B",
    sidebar:      "#09101B",
    sidebarHover: "#0E1826",
    input:        "#0B1423",
  },
  light: {
    bg:           "#F4F6FB",
    bgSolid:      "#F4F6FB",
    surface:      "#FFFFFF",
    surfaceHover: "#F0F4FF",
    surfaceActive:"#E9EFFD",
    border:       "#DDE3F0",
    borderLight:  "#EAEEF8",
    text:         "#0D1424",
    textSub:      "#4B5A7A",
    textMuted:    "#94A3B8",
    sidebar:      "#FFFFFF",
    sidebarHover: "#F5F7FF",
    input:        "#F8FAFF",
  },
};

const ACCENT_PRESETS = [
  { name: "Sapphire", color: "#4F8EF7", dark: "#2563EB", glow: "rgba(79,142,247,0.15)" },
  { name: "Emerald",  color: "#34D399", dark: "#059669", glow: "rgba(52,211,153,0.15)" },
  { name: "Violet",   color: "#A78BFA", dark: "#7C3AED", glow: "rgba(167,139,250,0.15)" },
  { name: "Rose",     color: "#FB7185", dark: "#E11D48", glow: "rgba(251,113,133,0.15)" },
  { name: "Amber",    color: "#FBBF24", dark: "#D97706", glow: "rgba(251,191,36,0.15)"  },
  { name: "Teal",     color: "#2DD4BF", dark: "#0D9488", glow: "rgba(45,212,191,0.15)"  },
];

const FONT_OPTIONS = [
  { name: "Geist",             import: "Geist:wght@300;400;500;600;700" },
  { name: "DM Sans",           import: "DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700" },
  { name: "Plus Jakarta Sans", import: "Plus+Jakarta+Sans:wght@300;400;500;600;700" },
  { name: "Instrument Sans",   import: "Instrument+Sans:wght@400;500;600;700" },
  { name: "Onest",             import: "Onest:wght@300;400;500;600;700" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, accent }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: "36px", height: "20px", borderRadius: "10px", cursor: "pointer",
      background: value ? accent : "#2D3A52",
      position: "relative", transition: "background 0.18s", flexShrink: 0,
      boxShadow: value ? `0 0 8px ${accent}50` : "none",
    }}>
      <div style={{
        position: "absolute", top: "3px",
        left: value ? "19px" : "3px",
        width: "14px", height: "14px", borderRadius: "50%",
        background: "#fff", transition: "left 0.18s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }} />
    </div>
  );
}

function Tag({ children, color = "#34D399", bg }) {
  return (
    <span style={{
      background: bg || `${color}14`,
      color, borderRadius: "999px",
      fontSize: "10px", fontWeight: "700",
      padding: "2px 8px", letterSpacing: "0.04em",
      textTransform: "uppercase",
      border: `1px solid ${color}30`,
    }}>{children}</span>
  );
}

function Pill({ children, active, accent, onClick, t }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "5px 14px", borderRadius: "999px",
        border: active ? `1.5px solid ${accent}` : `1.5px solid ${t.border}`,
        background: active ? `${accent}14` : hov ? t.surfaceHover : "transparent",
        color: active ? accent : hov ? t.text : t.textSub,
        fontSize: "12px", fontWeight: active ? "600" : "400",
        cursor: "pointer", transition: "all 0.12s",
        whiteSpace: "nowrap", letterSpacing: "-0.01em",
      }}>{children}</button>
  );
}

function Card({ children, t, style = {}, glow, accent }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: "14px",
      boxShadow: glow ? `0 0 0 1px ${accent}22, 0 4px 24px ${accent}10` : "0 1px 3px rgba(0,0,0,0.06)",
      ...style,
    }}>{children}</div>
  );
}

function SectionHeader({ title, sub, t, action }) {
  return (
    <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <h2 style={{ fontSize: "17px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize: "12.5px", color: t.textSub, marginTop: "5px", lineHeight: "1.5" }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0, marginLeft: "16px" }}>{action}</div>}
    </div>
  );
}

// ── Containment Bar ─────────────────────────────────────────────────────────
function ContainmentBar({ current, target, accent, t, steps: stepsProp }) {
  const steps = stepsProp || [];
  let running = current;
  return (
    <div style={{ background: t.surfaceHover, borderRadius: "10px", padding: "16px 18px",
      border: `1px solid ${t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "11.5px", color: t.textSub, flex: 1 }}>Current containment</span>
        <span style={{ fontSize: "13px", fontWeight: "700", color: accent,
          fontFamily: "'DM Mono', monospace" }}>{current}%</span>
        <span style={{ fontSize: "11px", color: t.textMuted }}>→</span>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#34D399",
          fontFamily: "'DM Mono', monospace" }}>{target}%</span>
        <span style={{ fontSize: "10.5px", color: t.textMuted }}>potential</span>
      </div>
      <div style={{ position: "relative", height: "8px", borderRadius: "999px", overflow: "hidden",
        background: t.border, display: "flex" }}>
        <div style={{ width: `${Math.min(current,100)}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
          borderRadius: "999px 0 0 999px", transition: "width 1s ease" }} />
        {steps.map((s, i) => {
          running += s;
          return (
            <div key={i} style={{
              width: `${Math.min(s, 100 - running + s)}%`,
              background: `${accent}${Math.round(255 * Math.max(0.12, 0.35 - i * 0.06)).toString(16).padStart(2,"0")}`,
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
        <span style={{ fontSize: "10px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>{current}%</span>
        <span style={{ fontSize: "10px", color: "#34D399", fontFamily: "'DM Mono', monospace" }}>→ {target}%</span>
      </div>
    </div>
  );
}

// ── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, badge, indent, t, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "9px",
        padding: indent ? "5px 12px 5px 34px" : "7px 12px",
        borderRadius: "7px", border: "none", cursor: "pointer",
        background: active ? `${accent}16` : hov ? t.sidebarHover : "transparent",
        color: active ? accent : hov ? t.text : t.textSub,
        fontSize: indent ? "11.5px" : "12.5px",
        fontWeight: active ? "600" : "400",
        width: "100%", textAlign: "left", position: "relative",
        transition: "all 0.12s", letterSpacing: "-0.01em",
      }}>
      {active && !indent && (
        <span style={{ position: "absolute", left: 0, top: "18%", height: "64%",
          width: "3px", borderRadius: "0 3px 3px 0", background: accent }} />
      )}
      {!indent && icon && (
        <span style={{ fontSize: "13px", width: "16px", textAlign: "center",
          opacity: active ? 1 : hov ? 0.9 : 0.55, transition: "opacity 0.12s" }}>{icon}</span>
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ background: "#EF4444", color: "#fff", borderRadius: "999px",
          fontSize: "9.5px", padding: "1px 5px", fontWeight: "700" }}>{badge}</span>
      )}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: BUILD → AGENT OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
// ── useUndoState ──────────────────────────────────────────────────────────────
// Controlled textarea state with debounced undo history (commits every 1.5s)
function useUndoState(initial) {
  const committed = useRef([initial]);
  const liveRef   = useRef(initial);
  const timerRef  = useRef(null);
  const [, rerender] = useState(0);

  function setValue(newVal) {
    liveRef.current = newVal;
    rerender(n => n + 1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const last = committed.current[committed.current.length - 1];
      if (last !== newVal) {
        committed.current = [...committed.current, newVal];
        rerender(n => n + 1);
      }
    }, 1500);
  }

  function undo() {
    clearTimeout(timerRef.current);
    if (committed.current.length > 1) {
      committed.current = committed.current.slice(0, -1);
      liveRef.current = committed.current[committed.current.length - 1];
      rerender(n => n + 1);
    }
  }

  return [liveRef.current, setValue, undo, committed.current.length > 1];
}

function AgentOverview({ t, accent, defaultSub }) {
  const [subTab, setSubTab] = useState(defaultSub || "context");
  const [saved, setSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [contextText,     setContextText,     undoContext,     canUndoContext    ] = useUndoState(
`We are a laundry delivery platform connecting customers with independent laundry professionals.
Standard service is wash-dry-fold only. We do NOT offer ironing, dry cleaning, or specialty services.
Laundry Pros are 1099 independent contractors, not employees.
Orders can be reassigned if a Pro is unavailable or the customer requests a change.
Refunds are processed within 3–5 business days to the original payment method.`);

  const [escalationsText, setEscalationsText, undoEscalations, canUndoEscalations] = useUndoState(
`Any mention of legal action, lawsuit, or attorney
Threats of violence or aggressive/abusive language toward staff or Pros
Media, press, or social media escalation threats
Regulatory or government authority involvement
Fraud or chargeback claims
Child safety or safeguarding concerns`);

  const [toneChat,    setToneChat,    undoToneChat,    canUndoToneChat   ] = useUndoState("Short, friendly, bullet points when listing steps. Max 3 sentences per reply.");
  const [toneEmail,   setToneEmail,   undoToneEmail,   canUndoToneEmail  ] = useUndoState("Formal greeting, structured paragraphs, clear subject. Max 200 words.");
  const [toneWA,      setToneWA,      undoToneWA,      canUndoToneWA     ] = useUndoState("Conversational, use emojis sparingly. Keep under 100 words.");

  const [allowedText, setAllowedText, undoAllowed,     canUndoAllowed    ] = useUndoState(
`Look up order status and delivery estimates
Process standard refunds up to $50
Reassign orders to available Laundry Pros
Update order notes and relay messages
Issue account credits for goodwill gestures`);

  const [blockedText, setBlockedText, undoBlocked,     canUndoBlocked    ] = useUndoState(
`Process refunds over $50 (human approval required)
Modify billing records or invoices directly
Permanently delete customer accounts
Make promises about service guarantees not in policy`);

  // Load saved settings from API on mount
  useEffect(() => {
    apiFetch(`/api/settings?client_id=${CLIENT_ID}`).then(s => {
      if (!s) return;
      if (s.context_text)          setContextText(s.context_text);
      if (s.escalations_text)      setEscalationsText(s.escalations_text);
      if (s.tone_chat)             setToneChat(s.tone_chat);
      if (s.tone_email)            setToneEmail(s.tone_email);
      if (s.tone_whatsapp)         setToneWA(s.tone_whatsapp);
      if (s.capabilities_allowed)  setAllowedText(s.capabilities_allowed);
      if (s.capabilities_blocked)  setBlockedText(s.capabilities_blocked);
      setSettingsLoaded(true);
    });
  }, []);

  const tabs = [
    { id: "context",      label: "Business Context" },
    { id: "escalations",  label: "Escalations" },
    { id: "tone",         label: "Response Tone & Style" },
    { id: "capabilities", label: "Agent Capabilities" },
  ];

  async function handleSave() {
    await fetch(`${API_URL}/api/settings`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:             CLIENT_ID,
        context_text:          contextText,
        escalations_text:      escalationsText,
        tone_chat:             toneChat,
        tone_email:            toneEmail,
        tone_whatsapp:         toneWA,
        capabilities_allowed:  allowedText,
        capabilities_blocked:  blockedText,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const taStyle = {
    background: t.surfaceHover, border: `1px solid ${t.border}`,
    borderRadius: "10px", color: t.text, fontSize: "14px", lineHeight: "1.7",
    padding: "16px", width: "100%", fontFamily: "inherit",
    outline: "none", resize: "vertical", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  function UndoBtn({ onUndo, canUndo }) {
    return (
      <button onClick={onUndo} disabled={!canUndo} style={{
        background: "none", border: "none", cursor: canUndo ? "pointer" : "default",
        color: canUndo ? accent : t.textMuted, fontSize: "12px",
        fontFamily: "inherit", padding: "0", display: "flex", alignItems: "center", gap: "4px",
        opacity: canUndo ? 1 : 0.4, transition: "opacity 0.15s",
      }}>↩ Undo</button>
    );
  }

  function FieldHeader({ title, onUndo, canUndo }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: t.text }}>{title}</span>
        <UndoBtn onUndo={onUndo} canUndo={canUndo} />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Agent Overview" sub="Configure your AI agent's knowledge, boundaries, tone, and capabilities." t={t} />

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <Pill key={tab.id} active={subTab === tab.id} accent={accent} onClick={() => setSubTab(tab.id)} t={t}>{tab.label}</Pill>
        ))}
      </div>

      {/* BUSINESS CONTEXT */}
      {subTab === "context" && (
        <Card t={t} style={{ padding: "22px" }}>
          <FieldHeader title="Business Policies & Context" onUndo={undoContext} canUndo={canUndoContext} />
          <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>Enter business facts and policies the AI will use when responding to customers. One item per line.</p>
          <textarea value={contextText} onChange={e => setContextText(e.target.value)} rows={12} style={taStyle}
            onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = t.border}
            placeholder="Enter business policies and context, one per line..." />
        </Card>
      )}

      {/* ESCALATIONS */}
      {subTab === "escalations" && (
        <Card t={t} style={{ padding: "22px" }}>
          <FieldHeader title="Escalation Triggers" onUndo={undoEscalations} canUndo={canUndoEscalations} />
          <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>Define when the AI must immediately hand off to a human agent. One trigger per line.</p>
          <textarea value={escalationsText} onChange={e => setEscalationsText(e.target.value)} rows={12} style={taStyle}
            onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = t.border}
            placeholder="Enter escalation triggers, one per line..." />
        </Card>
      )}

      {/* TONE */}
      {subTab === "tone" && (
        <Card t={t} style={{ padding: "22px" }}>
          <FieldHeader title="Response Tone & Formatting" onUndo={() => { undoToneChat(); undoToneEmail(); undoToneWA(); }} canUndo={canUndoToneChat || canUndoToneEmail || canUndoToneWA} />
          <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "20px" }}>Control how the AI formats and structures replies per channel.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { label: "Chat",      value: toneChat,  set: setToneChat,  undo: undoToneChat,  canUndo: canUndoToneChat  },
              { label: "Email",     value: toneEmail, set: setToneEmail, undo: undoToneEmail, canUndo: canUndoToneEmail },
              { label: "WhatsApp",  value: toneWA,    set: setToneWA,    undo: undoToneWA,    canUndo: canUndoToneWA   },
            ].map(({ label, value, set, undo, canUndo }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: accent, background: `${accent}18`,
                    padding: "3px 12px", borderRadius: "999px" }}>{label}</span>
                  <UndoBtn onUndo={undo} canUndo={canUndo} />
                </div>
                <textarea value={value} onChange={e => set(e.target.value)} rows={5} style={taStyle}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = t.border}
                  placeholder={`Enter tone and formatting instructions for ${label}...`} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CAPABILITIES */}
      {subTab === "capabilities" && (
        <Card t={t} style={{ padding: "22px" }}>
          <FieldHeader title="Agent Capabilities" onUndo={() => { undoAllowed(); undoBlocked(); }} canUndo={canUndoAllowed || canUndoBlocked} />
          <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "20px" }}>Define exactly what your AI agent is and is not allowed to do. One item per line.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#10B981", letterSpacing: "0.06em", textTransform: "uppercase" }}>✓ Allowed</span>
                <UndoBtn onUndo={undoAllowed} canUndo={canUndoAllowed} />
              </div>
              <textarea value={allowedText} onChange={e => setAllowedText(e.target.value)} rows={8} style={taStyle}
                onFocus={e => e.target.style.borderColor = "#10B981"} onBlur={e => e.target.style.borderColor = t.border}
                placeholder="Enter what the agent is allowed to do, one per line..." />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#EF4444", letterSpacing: "0.06em", textTransform: "uppercase" }}>✗ Not Allowed</span>
                <UndoBtn onUndo={undoBlocked} canUndo={canUndoBlocked} />
              </div>
              <textarea value={blockedText} onChange={e => setBlockedText(e.target.value)} rows={8} style={taStyle}
                onFocus={e => e.target.style.borderColor = "#EF4444"} onBlur={e => e.target.style.borderColor = t.border}
                placeholder="Enter what the agent is NOT allowed to do, one per line..." />
            </div>
          </div>
        </Card>
      )}

      {/* Save Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
        <button style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
          color: t.textSub, fontSize: "13px", padding: "9px 20px", cursor: "pointer" }}>
          Discard
        </button>
        <button onClick={handleSave} style={{
          background: saved ? "#059669" : accent, border: "none", borderRadius: "8px",
          color: "#fff", fontSize: "13px", fontWeight: "600", padding: "9px 24px", cursor: "pointer", transition: "all 0.2s",
        }}>{saved ? "✓ Saved" : "Save Changes"}</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: ISSUE TYPES
// ══════════════════════════════════════════════════════════════════════════════

// ── JSON Editor Cell ──────────────────────────────────────────────────────────
function JsonCell({ value, t, onSave }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState("");
  const [err, setErr]         = useState(false);

  function startEdit() {
    setRaw(typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : (value || "{}"));
    setEditing(true);
    setErr(false);
  }

  function commit() {
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      setErr(false);
      setEditing(false);
      onSave(parsed);
    } catch {
      setErr(true);
    }
  }

  if (editing) {
    return (
      <div style={{ width: "100%" }}>
        <textarea
          autoFocus value={raw}
          onChange={e => { setRaw(e.target.value); setErr(false); }}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Escape") setEditing(false); }}
          style={{
            width: "100%", minHeight: "80px", fontSize: "10px",
            fontFamily: "'DM Mono', monospace",
            background: err ? "#2D1117" : "#0a0e14",
            color: err ? "#FB7185" : "#A78BFA",
            border: `1px solid ${err ? "#FB7185" : "#A78BFA"}`,
            borderRadius: "6px", padding: "6px 8px", resize: "vertical",
            outline: "none", boxSizing: "border-box",
          }}
        />
        {err && <div style={{ fontSize: "10px", color: "#FB7185", marginTop: "2px" }}>Invalid JSON</div>}
      </div>
    );
  }

  const display = value && typeof value === "object" && Object.keys(value).length > 0
    ? JSON.stringify(value) : null;

  return (
    <div onClick={startEdit} title="Click to edit JSON" style={{
      cursor: "text", minHeight: "18px", fontSize: "11px",
      fontFamily: "'DM Mono', monospace", color: display ? "#A78BFA" : t.textMuted,
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>
      {display ? display.slice(0, 55) + (display.length > 55 ? "…" : "") : <span style={{ opacity: 0.35 }}>{ }</span>}
    </div>
  );
}

// ── Issue Type Detail Panel (slide-in) ────────────────────────────────────────
function IssueTypeDetailPanel({ item, t, accent, onClose, onSave }) {
  const [form, setForm]   = useState({ ...item });
  const [saving, setSaving] = useState(false);

  function field(key, label, isJson = false, rows = 2) {
    return (
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: t.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{label}</label>
        {isJson ? (
          <textarea
            value={typeof form[key] === "object" ? JSON.stringify(form[key], null, 2) : (form[key] || "{}")}
            onChange={e => {
              try { setForm(f => ({ ...f, [key]: JSON.parse(e.target.value) })); }
              catch { setForm(f => ({ ...f, [`_raw_${key}`]: e.target.value })); }
            }}
            rows={5}
            style={{ width: "100%", fontSize: "11px", fontFamily: "'DM Mono', monospace",
              background: t.surface, color: "#A78BFA", border: `1px solid ${t.border}`,
              borderRadius: "8px", padding: "10px 12px", resize: "vertical", outline: "none",
              boxSizing: "border-box" }}
          />
        ) : (
          <textarea
            value={form[key] || ""}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={rows}
            style={{ width: "100%", fontSize: "13px", background: t.surface, color: t.text,
              border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 12px",
              resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        )}
      </div>
    );
  }

  async function save() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: "480px", height: "100vh",
      background: t.surface, borderLeft: `1px solid ${t.border}`, overflowY: "auto",
      boxShadow: "-8px 0 40px rgba(0,0,0,0.5)", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
            {form.name || "Issue Type"}
          </div>
          <div style={{ fontSize: "11px", color: form.status === "active" ? "#34D399" : t.textMuted, marginTop: "2px" }}>
            {form.status === "active" ? "● Active" : "○ Draft"}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
          cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px 8px" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {field("name", "Name")}
        {field("reference", "Reference")}
        {field("description", "Description", false, 3)}
        {field("sop", "SOP")}
        {field("ai_instructions", "AI Instructions", false, 4)}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            Confidence Threshold (0–1)
          </label>
          <input type="number" min="0" max="1" step="0.01"
            value={form.confidence_threshold || ""}
            onChange={e => setForm(f => ({ ...f, confidence_threshold: e.target.value }))}
            placeholder="0.72"
            style={{ fontSize: "13px", background: t.surface, color: t.text,
              border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px 12px",
              outline: "none", width: "120px" }} />
        </div>
        {field("attributes", "Attributes (JSON)", true)}
        {field("escalation_rules", "Escalation Rules (JSON)", true)}
        {field("fixed_parameters", "Fixed Parameters (JSON)", true)}
      </div>

      <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.border}`,
        display: "flex", gap: "10px", flexShrink: 0 }}>
        <button onClick={save} disabled={saving} style={{ flex: 1, padding: "10px", background: accent,
          border: "none", borderRadius: "8px", color: "#fff", fontWeight: "600", fontSize: "13px",
          cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button onClick={onClose} style={{ padding: "10px 20px", background: "none",
          border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text,
          fontSize: "13px", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── IssueTypePublisher bar ────────────────────────────────────────────────────
function IssueTypePublisher({ draftCount, totalCount, onPublish, publishing, t, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 16px", background: `${accent}08`, border: `1px solid ${accent}28`,
      borderRadius: "10px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{ fontSize: "12px", color: t.text }}>
          <b>{draftCount}</b>
          <span style={{ color: t.textMuted }}> draft{draftCount !== 1 ? "s" : ""} not yet published</span>
        </span>
        <span style={{ width: "1px", height: "14px", background: t.border, display: "inline-block" }} />
        <span style={{ fontSize: "12px", color: t.textMuted }}>{totalCount - draftCount} active</span>
      </div>
      {draftCount > 0 && (
        <button onClick={onPublish} disabled={publishing} style={{
          padding: "7px 16px", background: accent, border: "none", borderRadius: "7px",
          color: "#fff", fontSize: "12px", fontWeight: "600",
          cursor: publishing ? "not-allowed" : "pointer", opacity: publishing ? 0.7 : 1 }}>
          {publishing ? "Publishing…" : `Publish ${draftCount} Issue Type${draftCount !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}

// ── IssueTypeRuntimeView — published cards ────────────────────────────────────
function IssueTypeRuntimeView({ items, t, accent, onSelectItem }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "14px" }}>📋</div>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "8px" }}>
          No published issue types
        </div>
        <div style={{ fontSize: "13px", color: t.textSub }}>
          Switch to Edit Mode, add your issue types, then click Publish.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
      {items.map(item => {
        const hasAttrs = item.attributes && Object.keys(item.attributes).length > 0;
        const hasEsc   = item.escalation_rules && Object.keys(item.escalation_rules).length > 0;
        return (
          <div key={item.id} onClick={() => onSelectItem(item)}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px",
              padding: "18px 20px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
                  {item.name}
                </div>
                {item.reference && (
                  <div style={{ fontSize: "10px", color: accent, fontFamily: "'DM Mono', monospace", marginTop: "2px" }}>
                    #{item.reference}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "999px",
                background: `${accent}18`, color: accent, fontWeight: "600", flexShrink: 0, marginLeft: "8px" }}>
                Active
              </span>
            </div>

            {item.description && (
              <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "12px", lineHeight: "1.5" }}>
                {item.description.slice(0, 120)}{item.description.length > 120 ? "…" : ""}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {item.sop && (
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
                  background: "#A78BFA18", color: "#A78BFA", fontWeight: "500" }}>
                  SOP: {item.sop}
                </span>
              )}
              {item.ai_instructions && (
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
                  background: "#60A5FA18", color: "#60A5FA", fontWeight: "500" }}>
                  AI Instructions
                </span>
              )}
              {hasAttrs && (
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
                  background: "#34D39918", color: "#34D399", fontWeight: "500" }}>
                  {Object.keys(item.attributes).length} attributes
                </span>
              )}
              {hasEsc && (
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
                  background: "#FBBF2418", color: "#FBBF24", fontWeight: "500" }}>
                  Escalation rules
                </span>
              )}
              {item.confidence_threshold && (
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
                  background: "#2DD4BF18", color: "#2DD4BF", fontWeight: "500" }}>
                  Conf: {item.confidence_threshold}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── IssueTypeTableEditor ──────────────────────────────────────────────────────
function IssueTypeTableEditor({ rows, extraCols, t, accent, onCellSave, onDeleteRow, onAddRow, onAddCol, onRemoveCol }) {
  const [editingCell, setEditingCell] = useState(null); // { rowId, colKey }
  const [cellDraft, setCellDraft]     = useState("");
  const [showAddCol, setShowAddCol]   = useState(false);
  const [newColName, setNewColName]   = useState("");

  const FIXED_COLS = [
    { key: "name",                 label: "Name",             width: 160 },
    { key: "reference",            label: "Reference",        width: 110 },
    { key: "description",          label: "Description",      width: 200 },
    { key: "sop",                  label: "SOP",              width: 140 },
    { key: "ai_instructions",      label: "AI Instructions",  width: 200 },
    { key: "attributes",           label: "Attributes",       width: 150, isJson: true },
    { key: "escalation_rules",     label: "Escalation Rules", width: 150, isJson: true },
    { key: "fixed_parameters",     label: "Fixed Parameters", width: 150, isJson: true },
    { key: "confidence_threshold", label: "Confidence",       width: 100 },
  ];

  const allCols = [
    ...FIXED_COLS,
    ...extraCols.map(c => ({ key: `custom_${c.key}`, label: c.label, width: 140, isCustom: true, customKey: c.key })),
  ];

  function startEdit(rowId, colKey, currentVal) {
    setEditingCell({ rowId, colKey });
    setCellDraft(currentVal ?? "");
  }

  function commitEdit() {
    if (!editingCell) return;
    onCellSave(editingCell.rowId, editingCell.colKey, cellDraft);
    setEditingCell(null);
    setCellDraft("");
  }

  function addCol() {
    if (!newColName.trim()) return;
    onAddCol(newColName.trim());
    setNewColName("");
    setShowAddCol(false);
  }

  const rowHeight = "38px";
  const headerBg  = t.bg || "#070911";

  return (
    <div>
      {/* Add column input */}
      {showAddCol && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <input autoFocus value={newColName}
            onChange={e => setNewColName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addCol(); if (e.key === "Escape") setShowAddCol(false); }}
            placeholder="Column name…"
            style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "7px",
              border: `1.5px solid ${accent}`, background: t.surface, color: t.text,
              outline: "none", width: "200px" }} />
          <button onClick={addCol} style={{ padding: "7px 14px", background: accent, border: "none",
            borderRadius: "7px", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            Add
          </button>
          <button onClick={() => setShowAddCol(false)} style={{ padding: "7px 12px", background: "none",
            border: `1px solid ${t.border}`, borderRadius: "7px", color: t.textMuted,
            fontSize: "12px", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      )}

      <div style={{ overflowX: "auto", borderRadius: "10px", border: `1px solid ${t.border}` }}>
        {/* Header */}
        <div style={{ display: "flex", background: headerBg, borderBottom: `1px solid ${t.border}`,
          position: "sticky", top: 0, zIndex: 10, minWidth: "fit-content" }}>
          {allCols.map(col => (
            <div key={col.key} style={{ width: `${col.width}px`, flexShrink: 0, padding: "9px 12px",
              fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase",
              letterSpacing: "0.08em", borderRight: `1px solid ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label}</span>
              {col.isCustom && (
                <button onClick={() => onRemoveCol(col.customKey)} title="Remove column"
                  style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer",
                    fontSize: "13px", padding: "0 0 0 4px", lineHeight: 1, flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
          {/* Status col */}
          <div style={{ width: "80px", flexShrink: 0, padding: "9px 12px", fontSize: "10px",
            fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em",
            borderRight: `1px solid ${t.border}` }}>Status</div>
          {/* Add col + actions */}
          <div style={{ width: "80px", flexShrink: 0, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "9px 12px" }}>
            <button onClick={() => setShowAddCol(true)} title="Add column"
              style={{ background: "none", border: `1px dashed ${t.border}`, borderRadius: "5px",
                color: t.textMuted, cursor: "pointer", fontSize: "14px", width: "26px", height: "22px",
                display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
            No issue types yet — click "+ Add Row" below to get started.
          </div>
        )}

        {/* Data rows */}
        {rows.map((row, rowIdx) => (
          <div key={row.id} style={{ display: "flex", minWidth: "fit-content",
            borderBottom: rowIdx < rows.length - 1 ? `1px solid ${t.border}` : "none",
            transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = `${accent}06`}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

            {allCols.map(col => {
              const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
              const value = col.isCustom ? row.custom_columns?.[col.customKey] : row[col.key];

              return (
                <div key={col.key} style={{ width: `${col.width}px`, flexShrink: 0, padding: "9px 12px",
                  borderRight: `1px solid ${t.border}`, display: "flex", alignItems: "center",
                  minHeight: rowHeight, overflow: "hidden" }}>
                  {col.isJson ? (
                    <JsonCell value={value} t={t}
                      onSave={parsed => onCellSave(row.id, col.key, parsed, col.isCustom ? col.customKey : undefined)} />
                  ) : isEditing ? (
                    <input autoFocus value={cellDraft}
                      onChange={e => setCellDraft(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                        if (e.key === "Escape") { setEditingCell(null); setCellDraft(""); }
                        if (e.key === "Tab")    { e.preventDefault(); commitEdit(); }
                      }}
                      style={{ width: "100%", fontSize: "12px", background: `${accent}14`,
                        border: `1px solid ${accent}`, borderRadius: "4px", padding: "3px 6px",
                        color: t.text, outline: "none" }} />
                  ) : (
                    <div onClick={() => startEdit(row.id, col.key, value)}
                      title={value || "Click to edit"}
                      style={{ width: "100%", fontSize: "12px", color: value ? t.text : t.textMuted,
                        cursor: "text", minHeight: "18px", lineHeight: "1.4",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {value ?? <span style={{ opacity: 0.3 }}>—</span>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Status badge */}
            <div style={{ width: "80px", flexShrink: 0, padding: "9px 12px",
              borderRight: `1px solid ${t.border}`, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "10px", padding: "3px 7px", borderRadius: "999px", fontWeight: "600",
                background: row.status === "active" ? "#34D39920" : "#FBBF2418",
                color: row.status === "active" ? "#34D399" : "#FBBF24" }}>
                {row.status === "active" ? "Active" : "Draft"}
              </span>
            </div>

            {/* Delete */}
            <div style={{ width: "80px", flexShrink: 0, padding: "9px 12px",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button onClick={() => onDeleteRow(row.id)} title="Delete row"
                style={{ background: "none", border: "none", color: "#FB718580",
                  cursor: "pointer", fontSize: "14px", padding: "4px", borderRadius: "4px",
                  lineHeight: 1, transition: "color 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#FB7185"}
                onMouseLeave={e => e.currentTarget.style.color = "#FB718580"}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add row */}
      <button onClick={onAddRow} style={{ marginTop: "10px", padding: "7px 14px",
        background: "none", border: `1px dashed ${t.border}`, borderRadius: "7px",
        color: t.textMuted, fontSize: "12px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px", transition: "border-color 0.15s, color 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}>
        + Add Row
      </button>
    </div>
  );
}

// ── Main IssueTypes wrapper ────────────────────────────────────────────────────
function IssueTypes({ t, accent }) {
  const [view, setView]           = useState("editor"); // "editor" | "published"
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [detailItem, setDetailItem] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [extraCols, setExtraCols] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chatking_it_cols") || "[]"); } catch { return []; }
  });

  async function loadRows() {
    setLoading(true);
    const data = await apiFetch(`/api/issue-types?client_id=${CLIENT_ID}`);
    setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { loadRows(); }, []);

  const draftRows     = rows.filter(r => r.status !== "active");
  const publishedRows = rows.filter(r => r.status === "active");

  async function onCellSave(rowId, colKey, value, customKey) {
    let patch;
    if (customKey !== undefined) {
      const row = rows.find(r => r.id === rowId);
      patch = { custom_columns: { ...(row?.custom_columns || {}), [customKey]: value } };
    } else {
      patch = { [colKey]: value };
    }
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...patch } : r));
    await fetch(`${API_URL}/api/issue-types/${rowId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function onAddRow() {
    const res  = await fetch(`${API_URL}/api/issue-types`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, name: "New Issue Type", status: "draft" }),
    });
    const data = await res.json();
    if (data?.id) setRows(prev => [...prev, data]);
  }

  async function onDeleteRow(id) {
    setRows(prev => prev.filter(r => r.id !== id));
    await fetch(`${API_URL}/api/issue-types/${id}`, { method: "DELETE" });
  }

  function onAddCol(label) {
    const key     = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const updated = [...extraCols, { key, label }];
    setExtraCols(updated);
    localStorage.setItem("chatking_it_cols", JSON.stringify(updated));
  }

  function onRemoveCol(key) {
    const updated = extraCols.filter(c => c.key !== key);
    setExtraCols(updated);
    localStorage.setItem("chatking_it_cols", JSON.stringify(updated));
  }

  async function publishAll() {
    setPublishing(true);
    await fetch(`${API_URL}/api/issue-types/publish`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID }),
    });
    setRows(prev => prev.map(r => ({ ...r, status: "active" })));
    setPublishing(false);
  }

  async function onDetailSave(form) {
    const res  = await fetch(`${API_URL}/api/issue-types/${form.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data?.id) setRows(prev => prev.map(r => r.id === data.id ? data : r));
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <SectionHeader
          title="Issue Types"
          sub="Configure issue types with SOPs, AI instructions and escalation rules. Publish to activate."
          t={t}
        />
        <div style={{ display: "flex", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
          {[{ key: "editor", label: "Edit Mode" }, { key: "published", label: "Published" }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              padding: "7px 18px", background: view === v.key ? accent : "transparent",
              border: "none", color: view === v.key ? "#fff" : t.textMuted,
              fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Publisher bar */}
      {draftRows.length > 0 && (
        <IssueTypePublisher
          draftCount={draftRows.length}
          totalCount={rows.length}
          onPublish={publishAll}
          publishing={publishing}
          t={t} accent={accent}
        />
      )}

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
          Loading issue types…
        </div>
      ) : view === "editor" ? (
        <Card t={t} style={{ padding: "16px 18px" }}>
          <IssueTypeTableEditor
            rows={rows}
            extraCols={extraCols}
            t={t} accent={accent}
            onCellSave={onCellSave}
            onDeleteRow={onDeleteRow}
            onAddRow={onAddRow}
            onAddCol={onAddCol}
            onRemoveCol={onRemoveCol}
          />
        </Card>
      ) : (
        <IssueTypeRuntimeView
          items={publishedRows}
          t={t} accent={accent}
          onSelectItem={setDetailItem}
        />
      )}

      {/* Detail panel overlay */}
      {detailItem && (
        <>
          <div onClick={() => setDetailItem(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }} />
          <IssueTypeDetailPanel
            item={detailItem}
            t={t} accent={accent}
            onClose={() => setDetailItem(null)}
            onSave={onDetailSave}
          />
        </>
      )}
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════════════════
// SECTION: TOOLS
// ══════════════════════════════════════════════════════════════════════════════

const TOOL_TYPE_META = {
  api:             { label: "API",             color: "#60A5FA" },
  n8n_workflow:    { label: "n8n Workflow",     color: "#A78BFA" },
  webhook:         { label: "Webhook",          color: "#34D399" },
  internal_action: { label: "Internal Action",  color: "#FBBF24" },
};
const METHOD_OPTIONS  = ["GET","POST","PUT","PATCH","DELETE"];
const AUTH_OPTIONS    = ["none","bearer","api_key","basic"];
const PARAM_TYPES     = ["string","number","boolean","array","object"];

// ── Parameters Builder ────────────────────────────────────────────────────────
function ParametersBuilder({ params, onChange, t, accent }) {
  function update(idx, field, val) {
    const next = params.map((p, i) => i === idx ? { ...p, [field]: val } : p);
    onChange(next);
  }
  function addParam() {
    onChange([...params, { name: "", type: "string", required: false, description: "" }]);
  }
  function removeParam(idx) {
    onChange(params.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {params.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 1fr 28px",
          gap: "8px", marginBottom: "6px", paddingBottom: "6px", borderBottom: `1px solid ${t.border}` }}>
          {["Name","Type","Req.","Description",""].map((h, i) => (
            <div key={i} style={{ fontSize: "10px", fontWeight: "700", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>
      )}
      {params.map((p, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 1fr 28px",
          gap: "8px", marginBottom: "8px", alignItems: "center" }}>
          <input value={p.name} onChange={e => update(idx, "name", e.target.value)}
            placeholder="param_name"
            style={{ fontSize: "12px", padding: "7px 10px", borderRadius: "7px",
              border: `1px solid ${t.border}`, background: t.surface, color: t.text,
              outline: "none", fontFamily: "'DM Mono', monospace" }} />
          <select value={p.type} onChange={e => update(idx, "type", e.target.value)}
            style={{ fontSize: "12px", padding: "7px 8px", borderRadius: "7px",
              border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none" }}>
            {PARAM_TYPES.map(t2 => <option key={t2} value={t2}>{t2}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "4px",
            fontSize: "11px", color: t.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={p.required} onChange={e => update(idx, "required", e.target.checked)}
              style={{ accentColor: accent }} />
            Req
          </label>
          <input value={p.description || ""} onChange={e => update(idx, "description", e.target.value)}
            placeholder="Description"
            style={{ fontSize: "12px", padding: "7px 10px", borderRadius: "7px",
              border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none" }} />
          <button onClick={() => removeParam(idx)} style={{ background: "none", border: "none",
            color: "#FB7185", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px" }}>×</button>
        </div>
      ))}
      <button onClick={addParam} style={{ fontSize: "12px", padding: "6px 14px", background: "none",
        border: `1px dashed ${t.border}`, borderRadius: "7px", color: t.textMuted, cursor: "pointer",
        marginTop: "4px", transition: "border-color 0.15s, color 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}>
        + Add Parameter
      </button>
    </div>
  );
}

// ── Tool Form Modal ───────────────────────────────────────────────────────────
function ToolFormModal({ tool, t, accent, onSave, onClose }) {
  const isEdit = !!tool?.id;
  const [form, setForm] = useState({
    name: "", slug: "", description: "", tool_type: "api",
    endpoint: "", method: "GET", auth_type: "none",
    auth_token: "", auth_key_name: "", auth_key_value: "",
    auth_username: "", auth_password: "",
    headers: "{}", parameters: [], response_schema: "{}", status: "draft",
    ...(tool || {}),
    headers:         JSON.stringify(tool?.headers         || {}, null, 2),
    response_schema: JSON.stringify(tool?.response_schema || {}, null, 2),
    parameters:      tool?.parameters || [],
  });
  const [saving, setSaving] = useState(false);
  const [jsonErrors, setJsonErrors] = useState({});

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-generate slug from name if creating
      if (k === "name" && !isEdit) {
        next.slug = v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      }
      return next;
    });
  }

  async function save() {
    // Validate JSON fields
    const errs = {};
    try { JSON.parse(form.headers); }         catch { errs.headers = true; }
    try { JSON.parse(form.response_schema); } catch { errs.response_schema = true; }
    if (Object.keys(errs).length) { setJsonErrors(errs); return; }
    setJsonErrors({});

    setSaving(true);
    await onSave({
      ...form,
      headers:         JSON.parse(form.headers),
      response_schema: JSON.parse(form.response_schema),
    });
    setSaving(false);
  }

  function fieldLabel(label, required = false) {
    return (
      <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: t.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "#FB7185" }}> *</span>}
      </label>
    );
  }
  function inp(k, placeholder = "", type = "text") {
    return (
      <input type={type} value={form[k] || ""} onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
          border: `1px solid ${t.border}`, background: t.surface, color: t.text,
          outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
        onFocus={e => e.target.style.borderColor = accent}
        onBlur={e => e.target.style.borderColor = t.border} />
    );
  }
  function jsonField(k, placeholder = "{}") {
    return (
      <textarea value={form[k]} onChange={e => set(k, e.target.value)} rows={4}
        placeholder={placeholder}
        style={{ width: "100%", fontSize: "11px", padding: "9px 12px", borderRadius: "8px",
          border: `1.5px solid ${jsonErrors[k] ? "#FB7185" : t.border}`,
          background: t.surface, color: jsonErrors[k] ? "#FB7185" : "#A78BFA",
          outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace",
          resize: "vertical" }} />
    );
  }
  function sel(k, options) {
    return (
      <select value={form[k]} onChange={e => set(k, e.target.value)}
        style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
          border: `1px solid ${t.border}`, background: t.surface, color: t.text,
          outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>)}
      </select>
    );
  }

  const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", padding: "32px 16px" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px",
        width: "660px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
            {isEdit ? "Edit Tool" : "Create Tool"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
            cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Name + Slug */}
          <div style={row2}>
            <div>{fieldLabel("Tool Name", true)}{inp("name", "e.g. Check Order Status")}</div>
            <div>{fieldLabel("Slug", true)}
              <input value={form.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="check_order_status"
                style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
                  border: `1px solid ${t.border}`, background: t.surface, color: accent,
                  outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace" }} />
            </div>
          </div>

          {/* Description */}
          <div>
            {fieldLabel("Description")}
            <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="What does this tool do?"
              style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
                border: `1px solid ${t.border}`, background: t.surface, color: t.text,
                outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
          </div>

          {/* Type + Status */}
          <div style={row2}>
            <div>{fieldLabel("Tool Type")}{sel("tool_type", Object.keys(TOOL_TYPE_META).map(k => ({ value: k, label: TOOL_TYPE_META[k].label })))}</div>
            <div>{fieldLabel("Status")}{sel("status", ["draft","active","disabled"])}</div>
          </div>

          {/* Endpoint + Method */}
          {form.tool_type !== "internal_action" && (
            <div style={row2}>
              <div>{fieldLabel("Endpoint / URL", true)}
                {inp("endpoint", "https://api.example.com/orders/{order_id}")}
              </div>
              <div>{fieldLabel("HTTP Method")}{sel("method", METHOD_OPTIONS)}</div>
            </div>
          )}

          {/* Authentication */}
          <div>
            {fieldLabel("Authentication")}
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              {AUTH_OPTIONS.map(opt => (
                <button key={opt} onClick={() => set("auth_type", opt)} style={{
                  padding: "6px 14px", borderRadius: "7px", fontSize: "12px",
                  background: form.auth_type === opt ? `${accent}18` : t.surfaceHover || t.surface,
                  border: `1.5px solid ${form.auth_type === opt ? accent : t.border}`,
                  color: form.auth_type === opt ? accent : t.textMuted,
                  cursor: "pointer", fontWeight: form.auth_type === opt ? "600" : "400",
                }}>{opt === "none" ? "None" : opt === "bearer" ? "Bearer Token" : opt === "api_key" ? "API Key" : "Basic Auth"}</button>
              ))}
            </div>
            {form.auth_type === "bearer" && (
              <div>{fieldLabel("Bearer Token")}{inp("auth_token", "eyJ...")}</div>
            )}
            {form.auth_type === "api_key" && (
              <div style={row2}>
                <div>{fieldLabel("Header Name")}{inp("auth_key_name", "X-API-Key")}</div>
                <div>{fieldLabel("Header Value")}{inp("auth_key_value", "sk-...")}</div>
              </div>
            )}
            {form.auth_type === "basic" && (
              <div style={row2}>
                <div>{fieldLabel("Username")}{inp("auth_username", "admin")}</div>
                <div>{fieldLabel("Password")}{inp("auth_password", "••••••", "password")}</div>
              </div>
            )}
          </div>

          {/* Custom Headers */}
          <div>
            {fieldLabel("Custom Headers (JSON)")}
            {jsonErrors.headers && <div style={{ fontSize: "11px", color: "#FB7185", marginBottom: "4px" }}>Invalid JSON</div>}
            {jsonField("headers", '{"Content-Type": "application/json"}')}
          </div>

          {/* Parameters */}
          <div>
            {fieldLabel("Parameters")}
            <ParametersBuilder params={form.parameters} onChange={v => set("parameters", v)} t={t} accent={accent} />
          </div>

          {/* Response Schema */}
          <div>
            {fieldLabel("Response Schema (JSON)")}
            {jsonErrors.response_schema && <div style={{ fontSize: "11px", color: "#FB7185", marginBottom: "4px" }}>Invalid JSON</div>}
            {jsonField("response_schema", '{"order_id": "string", "status": "string"}')}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", background: "none",
            border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text,
            fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: "9px 24px", background: accent,
            border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tool Test Modal ───────────────────────────────────────────────────────────
function ToolTestModal({ tool, t, accent, onClose }) {
  const [paramValues, setParamValues] = useState({});
  const [running, setRunning]         = useState(false);
  const [result, setResult]           = useState(null);

  async function runTest() {
    setRunning(true);
    setResult(null);
    try {
      const res  = await fetch(`${API_URL}/api/tools/${tool.id}/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, parameters: paramValues }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setRunning(false);
  }

  const typeColor = TOOL_TYPE_META[tool.tool_type]?.color || t.textMuted;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px",
        width: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              Test: {tool.name}
            </div>
            <div style={{ fontSize: "11px", color: typeColor, fontFamily: "'DM Mono', monospace", marginTop: "2px" }}>
              {tool.slug} · {TOOL_TYPE_META[tool.tool_type]?.label}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
            cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Parameter inputs */}
          {(tool.parameters || []).length > 0 ? (
            <>
              <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
                Parameters
              </div>
              {(tool.parameters || []).map(p => (
                <div key={p.name} style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600",
                    color: t.text, marginBottom: "4px" }}>
                    {p.name}
                    {p.required && <span style={{ color: "#FB7185", marginLeft: "4px" }}>*</span>}
                    <span style={{ color: t.textMuted, fontWeight: "400", marginLeft: "8px", fontSize: "11px" }}>
                      ({p.type}){p.description ? ` — ${p.description}` : ""}
                    </span>
                  </label>
                  <input value={paramValues[p.name] || ""}
                    onChange={e => setParamValues(v => ({ ...v, [p.name]: e.target.value }))}
                    placeholder={`Enter ${p.name}…`}
                    style={{ width: "100%", fontSize: "12px", padding: "8px 12px", borderRadius: "7px",
                      border: `1px solid ${t.border}`, background: t.bg || "#070911", color: t.text,
                      outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace" }} />
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "16px" }}>
              This tool has no parameters. Click Run to test it.
            </div>
          )}

          {/* Result */}
          {result !== null && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.07em" }}>Response</div>
                <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: "600",
                  background: result.success ? "#34D39920" : "#FB718520",
                  color: result.success ? "#34D399" : "#FB7185" }}>
                  {result.success ? `✓ Success` : "✗ Failed"}
                  {result.status ? ` · HTTP ${result.status}` : ""}
                  {result.duration_ms ? ` · ${result.duration_ms}ms` : ""}
                </span>
              </div>
              <pre style={{ background: t.bg || "#070911", border: `1px solid ${t.border}`,
                borderRadius: "8px", padding: "14px", fontSize: "11px", color: "#A78BFA",
                overflow: "auto", maxHeight: "260px", margin: 0,
                fontFamily: "'DM Mono', monospace", lineHeight: "1.5" }}>
                {JSON.stringify(result.data ?? result.error ?? result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "10px", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "none",
            border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text,
            fontSize: "13px", cursor: "pointer" }}>Close</button>
          <button onClick={runTest} disabled={running} style={{ padding: "8px 24px",
            background: running ? t.surfaceHover : accent, border: "none", borderRadius: "8px",
            color: running ? t.textMuted : "#fff", fontSize: "13px", fontWeight: "600",
            cursor: running ? "not-allowed" : "pointer" }}>
            {running ? "Running…" : "▶ Run Tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Tools component ──────────────────────────────────────────────────────
function Tools({ t, accent }) {
  const [tools, setTools]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("tools");   // "tools" | "registry" | "suggested"
  const [showForm, setShowForm]         = useState(false);
  const [editTool, setEditTool]         = useState(null);
  const [testTool, setTestTool]         = useState(null);
  const [registry, setRegistry]         = useState([]);
  const [regLoading, setRegLoading]     = useState(false);
  const [suggestions, setSuggestions]   = useState([]);
  const [sugLoading, setSugLoading]     = useState(false);
  const [sugGenerating, setSugGenerating] = useState(false);

  async function loadTools() {
    setLoading(true);
    const data = await apiFetch(`/api/tools?client_id=${CLIENT_ID}`);
    setTools(data || []);
    setLoading(false);
  }

  async function loadRegistry() {
    setRegLoading(true);
    const data = await apiFetch(`/api/tools/registry/stats?client_id=${CLIENT_ID}`);
    setRegistry(data || []);
    setRegLoading(false);
  }

  async function loadSuggestions() {
    setSugLoading(true);
    const data = await apiFetch(`/api/insights/tool-suggestions?client_id=${CLIENT_ID}`);
    setSuggestions(data || []);
    setSugLoading(false);
  }

  async function generateSuggestions() {
    setSugGenerating(true);
    const res = await fetch(`${API_URL}/api/insights/suggest-tools`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID }),
    });
    const data = await res.json();
    setSuggestions(data?.suggestions || []);
    setSugGenerating(false);
  }

  async function dismissSuggestion(id) {
    setSuggestions(prev => prev.filter(s => s.id !== id));
    await fetch(`${API_URL}/api/insights/tool-suggestions/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
  }

  useEffect(() => { loadTools(); }, []);
  useEffect(() => { if (tab === "registry") loadRegistry(); }, [tab]);
  useEffect(() => { if (tab === "suggested") loadSuggestions(); }, [tab]);

  async function handleSave(form) {
    if (editTool) {
      const res  = await fetch(`${API_URL}/api/tools/${editTool.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, ...form }),
      });
      const data = await res.json();
      if (data?.id) setTools(prev => prev.map(x => x.id === data.id ? data : x));
    } else {
      const res  = await fetch(`${API_URL}/api/tools`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, ...form }),
      });
      const data = await res.json();
      if (data?.id) setTools(prev => [data, ...prev]);
    }
    setShowForm(false);
    setEditTool(null);
  }

  async function deleteTool(id) {
    if (!window.confirm("Delete this tool?")) return;
    setTools(prev => prev.filter(x => x.id !== id));
    await fetch(`${API_URL}/api/tools/${id}`, { method: "DELETE" });
  }

  const activeCount = tools.filter(x => x.status === "active").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <SectionHeader
          title="Tools"
          sub="Configure actions the AI can execute — API calls, webhooks, and workflows."
          t={t}
        />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: "8px", overflow: "hidden" }}>
            {[{ key: "tools", label: "Tools" }, { key: "registry", label: "Registry" }, { key: "suggested", label: "✦ Suggested" }].map(v => (
              <button key={v.key} onClick={() => setTab(v.key)} style={{
                padding: "7px 16px", background: tab === v.key ? accent : "transparent",
                border: "none", color: tab === v.key ? "#fff" : t.textMuted,
                fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}>
                {v.label}
              </button>
            ))}
          </div>
          {tab === "tools" && (
            <button onClick={() => { setEditTool(null); setShowForm(true); }}
              style={{ padding: "8px 16px", background: accent, border: "none", borderRadius: "8px",
                color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
              + Create Tool
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total Tools",   val: tools.length,                 color: accent     },
          { label: "Active",        val: activeCount,                  color: "#34D399"  },
          { label: "Draft",         val: tools.filter(x=>x.status==="draft").length,    color: "#FBBF24"  },
          { label: "API Tools",     val: tools.filter(x=>x.tool_type==="api").length,   color: "#60A5FA"  },
        ].map(s => (
          <Card key={s.label} t={t} style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: "10px", color: t.textMuted, textTransform: "uppercase",
              letterSpacing: "0.07em", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: s.color,
              fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* ── Tools list ── */}
      {tab === "tools" && (
        <Card t={t} style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 100px 120px 140px",
            padding: "10px 18px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>Tool</span><span>Endpoint</span><span>Type</span>
            <span>Status</span><span>Updated</span><span></span>
          </div>

          {loading && (
            <div style={{ padding: "48px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading tools…
            </div>
          )}
          {!loading && tools.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>⚙</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>
                No tools yet
              </div>
              <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>
                Create your first tool to let the AI take actions.
              </div>
              <button onClick={() => setShowForm(true)} style={{ padding: "8px 20px", background: accent,
                border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px",
                fontWeight: "600", cursor: "pointer" }}>+ Create Tool</button>
            </div>
          )}

          {tools.map((tool, i) => {
            const meta     = TOOL_TYPE_META[tool.tool_type] || TOOL_TYPE_META.api;
            const updatedAt = tool.updated_at ? new Date(tool.updated_at).toLocaleDateString() : "—";
            return (
              <div key={tool.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 100px 120px 140px",
                  alignItems: "center", padding: "13px 18px",
                  borderBottom: i < tools.length - 1 ? `1px solid ${t.borderLight}` : "none",
                  transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${accent}06`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Name + description */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text,
                    letterSpacing: "-0.01em", marginBottom: "2px" }}>{tool.name}</div>
                  <div style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>
                    {tool.slug}
                  </div>
                  {tool.description && (
                    <div style={{ fontSize: "11px", color: t.textSub, marginTop: "2px" }}>
                      {tool.description.slice(0, 60)}{tool.description.length > 60 ? "…" : ""}
                    </div>
                  )}
                </div>
                {/* Endpoint */}
                <div style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tool.method && <span style={{ color: accent, marginRight: "4px" }}>{tool.method}</span>}
                  {tool.endpoint || "—"}
                </div>
                {/* Type badge */}
                <span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "999px",
                  background: `${meta.color}18`, color: meta.color, fontWeight: "600",
                  display: "inline-block" }}>{meta.label}</span>
                {/* Status */}
                <span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "999px", fontWeight: "600",
                  display: "inline-block",
                  background: tool.status === "active" ? "#34D39920" : tool.status === "draft" ? "#FBBF2418" : "#FB718520",
                  color: tool.status === "active" ? "#34D399" : tool.status === "draft" ? "#FBBF24" : "#FB7185" }}>
                  {tool.status}
                </span>
                {/* Updated */}
                <div style={{ fontSize: "11px", color: t.textMuted }}>{updatedAt}</div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button onClick={() => setTestTool(tool)}
                    style={{ padding: "5px 10px", background: `${accent}14`,
                      border: `1px solid ${accent}40`, borderRadius: "6px",
                      color: accent, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    ▶ Test
                  </button>
                  <button onClick={() => { setEditTool(tool); setShowForm(true); }}
                    style={{ padding: "5px 10px", background: "none", border: `1px solid ${t.border}`,
                      borderRadius: "6px", color: t.textSub, fontSize: "11px", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteTool(tool.id)}
                    style={{ padding: "5px 8px", background: "none", border: "none",
                      color: "#FB7185", fontSize: "14px", cursor: "pointer" }}>×</button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Registry ── */}
      {tab === "registry" && (
        <Card t={t} style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px 120px",
            padding: "10px 18px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>Tool</span><span>Type</span><span>Calls</span>
            <span>Success %</span><span>Errors</span><span>Last Used</span>
          </div>

          {regLoading && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading registry…
            </div>
          )}
          {!regLoading && registry.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              No usage data yet. Run tools to see stats here.
            </div>
          )}
          {registry.map((r, i) => {
            const meta    = TOOL_TYPE_META[r.tool_type] || TOOL_TYPE_META.api;
            const lastUsed = r.last_used_at ? new Date(r.last_used_at).toLocaleDateString() : "Never";
            const srColor  = r.success_rate === null ? t.textMuted
              : r.success_rate >= 90 ? "#34D399"
              : r.success_rate >= 70 ? "#FBBF24" : "#FB7185";
            return (
              <div key={r.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px 120px",
                  alignItems: "center", padding: "13px 18px",
                  borderBottom: i < registry.length - 1 ? `1px solid ${t.borderLight}` : "none",
                  transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${accent}06`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "2px" }}>{r.name}</div>
                  <div style={{ fontSize: "10px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>{r.slug}</div>
                </div>
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "999px",
                  background: `${meta.color}18`, color: meta.color, fontWeight: "600" }}>{meta.label}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                  fontFamily: "'DM Mono', monospace" }}>{r.total_calls.toLocaleString()}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: srColor,
                  fontFamily: "'DM Mono', monospace" }}>
                  {r.success_rate !== null ? `${r.success_rate}%` : "—"}
                </span>
                <span style={{ fontSize: "13px", color: r.error_count > 0 ? "#FB7185" : t.textMuted,
                  fontWeight: r.error_count > 0 ? "700" : "400",
                  fontFamily: "'DM Mono', monospace" }}>{r.error_count}</span>
                <span style={{ fontSize: "11px", color: t.textMuted }}>{lastUsed}</span>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── AI-Suggested Tools ── */}
      {tab === "suggested" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>AI-Suggested Tools</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "2px" }}>
                Tools your AI needs to resolve customer queries without escalation.
              </div>
            </div>
            <button onClick={generateSuggestions} disabled={sugGenerating}
              style={{ padding: "8px 16px", background: accent, border: "none", borderRadius: "8px",
                color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                opacity: sugGenerating ? 0.7 : 1 }}>
              {sugGenerating ? "Analyzing…" : "✦ Analyze Conversations"}
            </button>
          </div>

          {sugLoading && (
            <div style={{ padding: "48px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading suggestions…
            </div>
          )}

          {!sugLoading && suggestions.length === 0 && (
            <Card t={t} style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔮</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>
                No suggestions yet
              </div>
              <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>
                Click "Analyze Conversations" to let AI identify tools that would reduce escalations.
              </div>
              <button onClick={generateSuggestions} disabled={sugGenerating}
                style={{ padding: "8px 20px", background: accent, border: "none", borderRadius: "8px",
                  color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                {sugGenerating ? "Analyzing…" : "Analyze Now"}
              </button>
            </Card>
          )}

          {suggestions.filter(s => s.status !== "dismissed").length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {suggestions.filter(s => s.status !== "dismissed").map((s, i) => {
                const impactColor = s.impact?.toLowerCase().startsWith("high") ? "#EF4444"
                  : s.impact?.toLowerCase().startsWith("medium") ? "#F59E0B" : "#34D399";
                return (
                  <Card key={s.id || i} t={t} style={{ padding: "18px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px",
                          background: `${accent}18`, border: `1px solid ${accent}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "15px" }}>🔧</div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                            letterSpacing: "-0.01em" }}>{s.name}</div>
                          {s.frequency > 0 && (
                            <div style={{ fontSize: "10px", color: t.textMuted }}>
                              ~{s.frequency} queries/week
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 7px",
                          borderRadius: "999px", background: `${impactColor}18`, color: impactColor }}>
                          {s.impact?.split("—")[0]?.trim() || "Medium"} Impact
                        </span>
                        {s.id && (
                          <button onClick={() => dismissSuggestion(s.id)}
                            style={{ background: "none", border: "none", color: t.textMuted,
                              cursor: "pointer", fontSize: "14px", padding: "2px" }}>×</button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "8px",
                      lineHeight: "1.5" }}>{s.description}</div>
                    {s.use_case && (
                      <div style={{ fontSize: "11px", color: t.textMuted, background: t.surfaceHover,
                        borderRadius: "6px", padding: "7px 10px", lineHeight: "1.4",
                        borderLeft: `3px solid ${accent}` }}>
                        <span style={{ color: accent, fontWeight: "600" }}>Why: </span>{s.use_case}
                      </div>
                    )}
                    <button
                      onClick={() => { setEditTool(null); setShowForm(true); setTab("tools"); }}
                      style={{ marginTop: "12px", width: "100%", padding: "7px", background: `${accent}14`,
                        border: `1px solid ${accent}30`, borderRadius: "7px", color: accent,
                        fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      + Create This Tool
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ToolFormModal
          tool={editTool}
          t={t} accent={accent}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTool(null); }}
        />
      )}
      {testTool && (
        <ToolTestModal
          tool={testTool}
          t={t} accent={accent}
          onClose={() => setTestTool(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: SOPs
// ══════════════════════════════════════════════════════════════════════════════
function SOPs({ t, accent }) {
  const [sopData, setSopData] = useState([]);
  const [editingSop, setEditingSop] = useState(null); // null | { id, name, instructions, active, isNew }
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { data: rawSops, loading } = useApi(`/api/sops?client_id=${CLIENT_ID}`, null);
  useEffect(() => { if (rawSops) setSopData(rawSops); }, [rawSops]);

  function openNew() {
    setEditingSop({ id: null, name: "", instructions: "", active: true, isNew: true });
  }

  function openEdit(sop) {
    setEditingSop({ ...sop, isNew: false });
  }

  function closeModal() {
    setEditingSop(null);
    setSaving(false);
  }

  async function saveSop() {
    if (!editingSop.name.trim()) return;
    setSaving(true);
    try {
      if (editingSop.isNew) {
        const res = await fetch(`${API_URL}/api/sops`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            name: editingSop.name.trim(),
            instructions: editingSop.instructions || "",
            active: true, exec_active: true, auto_active: false, status: "agent",
          }),
        });
        const saved = await res.json();
        setSopData(p => [saved, ...p]);
      } else {
        await fetch(`${API_URL}/api/sops/${editingSop.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingSop.name.trim(),
            instructions: editingSop.instructions || "",
            active: editingSop.active,
            exec_active: editingSop.exec_active,
            auto_active: editingSop.auto_active,
          }),
        });
        setSopData(p => p.map(s => s.id === editingSop.id
          ? { ...s, name: editingSop.name.trim(), instructions: editingSop.instructions, active: editingSop.active }
          : s));
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    closeModal();
  }

  async function deleteSop(id) {
    setDeleting(id);
    await fetch(`${API_URL}/api/sops/${id}`, { method: "DELETE" });
    setSopData(p => p.filter(s => s.id !== id));
    setDeleting(null);
  }

  async function toggleActive(sop) {
    const next = !sop.active;
    setSopData(p => p.map(s => s.id === sop.id ? { ...s, active: next } : s));
    await fetch(`${API_URL}/api/sops/${sop.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next, exec_active: next }),
    });
  }

  const active = sopData.filter(s => s.active);
  const inactive = sopData.filter(s => !s.active);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <SectionHeader
          title="SOPs"
          sub="Standard Operating Procedures your AI agent follows. Active SOPs are injected into every conversation."
          t={t}
        />
        <button onClick={openNew}
          style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
            fontSize: "13px", fontWeight: "600", padding: "9px 18px", cursor: "pointer", flexShrink: 0 }}>
          + New SOP
        </button>
      </div>

      {loading && (
        <Card t={t} style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: t.textMuted }}>Loading SOPs…</div>
        </Card>
      )}

      {!loading && sopData.length === 0 && (
        <Card t={t} style={{ padding: "48px", textAlign: "center", border: `1px dashed ${t.border}` }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>⬟</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: t.text, marginBottom: "6px" }}>No SOPs yet</div>
          <div style={{ fontSize: "13px", color: t.textSub, marginBottom: "20px" }}>
            Create your first SOP to tell Aria exactly how to handle specific situations.
          </div>
          <button onClick={openNew}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "13px", fontWeight: "600", padding: "10px 22px", cursor: "pointer" }}>
            + Create First SOP
          </button>
        </Card>
      )}

      {active.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Active — read by AI ({active.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {active.map(sop => (
              <Card key={sop.id} t={t} style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%",
                    background: "#34D399", flexShrink: 0, marginTop: "5px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: t.text,
                      letterSpacing: "-0.01em", marginBottom: sop.instructions ? "6px" : 0 }}>
                      {sop.name}
                    </div>
                    {sop.instructions && (
                      <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.6",
                        whiteSpace: "pre-wrap", overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {sop.instructions}
                      </div>
                    )}
                    {!sop.instructions && (
                      <div style={{ fontSize: "12px", color: t.textMuted, fontStyle: "italic" }}>
                        No instructions yet — click Edit to add them.
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: t.textMuted }}>
                      {sop.updated_at ? new Date(sop.updated_at).toLocaleDateString() : ""}
                    </span>
                    <button onClick={() => openEdit(sop)}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: t.textSub, fontSize: "12px", padding: "5px 12px", cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => toggleActive(sop)}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: t.textMuted, fontSize: "12px", padding: "5px 12px", cursor: "pointer" }}>
                      Deactivate
                    </button>
                    <button onClick={() => deleteSop(sop.id)} disabled={deleting === sop.id}
                      style={{ background: "none", border: "none", color: "#EF4444",
                        fontSize: "18px", cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Inactive ({inactive.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {inactive.map(sop => (
              <Card key={sop.id} t={t} style={{ padding: "16px 20px", opacity: 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%",
                    background: t.textMuted, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: "13px", fontWeight: "500", color: t.text }}>
                    {sop.name}
                  </div>
                  <button onClick={() => openEdit(sop)}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                      color: t.textSub, fontSize: "12px", padding: "5px 12px", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={() => toggleActive(sop)}
                    style={{ background: `${accent}14`, border: `1px solid ${accent}40`, borderRadius: "6px",
                      color: accent, fontSize: "12px", padding: "5px 12px", cursor: "pointer", fontWeight: "600" }}>
                    Activate
                  </button>
                  <button onClick={() => deleteSop(sop.id)} disabled={deleting === sop.id}
                    style={{ background: "none", border: "none", color: "#EF4444",
                      fontSize: "18px", cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── SOP Editor Modal ── */}
      {editingSop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px" }}
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: t.surface, borderRadius: "16px",
            border: `1px solid ${t.border}`, width: "100%", maxWidth: "680px",
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: t.text,
                  letterSpacing: "-0.02em" }}>
                  {editingSop.isNew ? "New SOP" : "Edit SOP"}
                </div>
                <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px" }}>
                  Active SOPs are read by the AI on every conversation
                </div>
              </div>
              <button onClick={closeModal}
                style={{ background: "none", border: "none", color: t.textMuted,
                  fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Name */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                  SOP Name / Subject
                </label>
                <input
                  value={editingSop.name}
                  onChange={e => setEditingSop(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Handling Refund Requests, Late Delivery Response…"
                  autoFocus
                  style={{ width: "100%", background: t.input, border: `1.5px solid ${t.border}`,
                    borderRadius: "10px", color: t.text, fontSize: "15px", fontWeight: "500",
                    padding: "12px 14px", fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box", letterSpacing: "-0.01em" }}
                  onFocus={e => e.target.style.borderColor = accent}
                  onBlur={e  => e.target.style.borderColor = t.border}
                />
              </div>

              {/* Instructions */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                  Instructions
                </label>
                <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "10px", lineHeight: "1.5" }}>
                  Write exactly what the AI should do when this SOP applies. Be specific — the AI will follow these instructions word for word.
                </div>
                <textarea
                  value={editingSop.instructions || ""}
                  onChange={e => setEditingSop(p => ({ ...p, instructions: e.target.value }))}
                  placeholder={`Example:\n1. Greet the customer and acknowledge their issue.\n2. Check the order status in the system.\n3. If the order is delayed by more than 24 hours, offer a $5 credit.\n4. If the customer is angry or threatens legal action, escalate immediately.\n5. Always close with: "Is there anything else I can help you with?"`}
                  style={{ width: "100%", minHeight: "300px", background: t.input,
                    border: `1.5px solid ${t.border}`, borderRadius: "10px", color: t.text,
                    fontSize: "13.5px", lineHeight: "1.65", padding: "14px",
                    fontFamily: "inherit", outline: "none", resize: "vertical",
                    boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = accent}
                  onBlur={e  => e.target.style.borderColor = t.border}
                />
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 16px", background: t.surfaceHover, borderRadius: "10px",
                border: `1px solid ${t.border}` }}>
                <Toggle
                  value={editingSop.active !== false}
                  onChange={v => setEditingSop(p => ({ ...p, active: v }))}
                  accent={accent}
                />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>
                    Active — AI reads this SOP
                  </div>
                  <div style={{ fontSize: "12px", color: t.textSub }}>
                    Inactive SOPs are saved but never sent to the AI
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end",
              padding: "16px 24px", borderTop: `1px solid ${t.border}` }}>
              <button onClick={closeModal}
                style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
                  color: t.textSub, fontSize: "13px", padding: "10px 20px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={saveSop} disabled={saving || !editingSop.name.trim()}
                style={{ background: editingSop.name.trim() ? accent : t.surfaceHover,
                  border: "none", borderRadius: "8px", color: editingSop.name.trim() ? "#fff" : t.textMuted,
                  fontSize: "13px", fontWeight: "600", padding: "10px 28px",
                  cursor: editingSop.name.trim() ? "pointer" : "default",
                  transition: "all 0.15s" }}>
                {saving ? "Saving…" : editingSop.isNew ? "Create SOP" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ── ArticleEditModal ──────────────────────────────────────────────────────────
function ArticleEditModal({ article, isPublished, t, accent, onSave, onClose }) {
  const [title,   setTitle]   = useState(article.title   || "");
  const [content, setContent] = useState(article.content || "");
  const [status,  setStatus]  = useState(article.status  || (isPublished ? "published" : "draft"));
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ ...article, title: title.trim(), content, status });
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.surface, borderRadius: "16px", border: `1px solid ${t.border}`,
        width: "100%", maxWidth: "720px", maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              {article.id && !String(article.id).startsWith("new") ? "Edit Article" : "New Article"}
            </div>
            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px" }}>
              {status === "published" ? "Published — live in the AI's knowledge base" : "Draft — not visible to the AI until published"}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: t.textMuted,
              fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
              Title
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              placeholder="Article title…"
              style={{ width: "100%", background: t.input, border: `1.5px solid ${t.border}`,
                borderRadius: "10px", color: t.text, fontSize: "15px", fontWeight: "500",
                padding: "12px 14px", fontFamily: "inherit", outline: "none",
                boxSizing: "border-box", letterSpacing: "-0.01em" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e  => e.target.style.borderColor = t.border} />
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
              Content
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write the article content here. The AI will use this word-for-word when answering relevant customer questions."
              style={{ width: "100%", minHeight: "320px", background: t.input,
                border: `1.5px solid ${t.border}`, borderRadius: "10px", color: t.text,
                fontSize: "13.5px", lineHeight: "1.7", padding: "14px",
                fontFamily: "inherit", outline: "none", resize: "vertical",
                boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e  => e.target.style.borderColor = t.border} />
          </div>

          {/* Status */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["draft", "published"].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", border: `1.5px solid ${status === s ? accent : t.border}`,
                  background: status === s ? `${accent}14` : "transparent",
                  color: status === s ? accent : t.textSub, transition: "all 0.12s" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end",
          padding: "16px 24px", borderTop: `1px solid ${t.border}` }}>
          <button onClick={onClose}
            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "10px 20px", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            style={{ background: title.trim() ? accent : t.surfaceHover, border: "none",
              borderRadius: "8px", color: title.trim() ? "#fff" : t.textMuted,
              fontSize: "13px", fontWeight: "600", padding: "10px 28px",
              cursor: title.trim() ? "pointer" : "default", transition: "all 0.15s" }}>
            {saving ? "Saving…" : "Save Article"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════════════════════
function KnowledgeBase({ t, accent }) {
  const [search, setSearch]           = useState("");
  const [editingArticle, setEditingArticle] = useState(null);
  const [articles, setArticles]       = useState([]);
  const [generating, setGenerating]   = useState(false);
  const [saveStatus, setSaveStatus]   = useState({});
  // Connect source modal
  const [showConnect, setShowConnect] = useState(false);
  const [connectUrl, setConnectUrl]   = useState("");
  const [connectMode, setConnectMode] = useState("single"); // "single" | "crawl"
  const [connectMax, setConnectMax]   = useState(15);
  const [connecting, setConnecting]   = useState(false);
  const [connectResult, setConnectResult] = useState(null); // { pages, error }
  const [syncingDomain, setSyncingDomain] = useState(null);
  // Auth
  const [showAuth, setShowAuth]           = useState(false);
  const [authType, setAuthType]           = useState("none"); // "none"|"bearer"|"cookie"|"basic"
  const [authToken, setAuthToken]         = useState("");
  const [authCookie, setAuthCookie]       = useState("");
  const [authUser, setAuthUser]           = useState("");
  const [authPass, setAuthPass]           = useState("");

  const { data: rawArticles } = useApi(`/api/knowledge?client_id=${CLIENT_ID}`, null);
  useEffect(() => { if (rawArticles) setArticles(rawArticles); }, [rawArticles]);

  const published = articles.filter(a => a.status === "published");
  const drafts    = articles.filter(a => a.status === "draft");

  async function publishDraft(id) {
    setSaveStatus(p => ({ ...p, [id]: "saving" }));
    await fetch(`${API_URL}/api/knowledge/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    setArticles(p => p.map(a => a.id === id ? { ...a, status: "published" } : a));
    setSaveStatus(p => ({ ...p, [id]: "done" }));
    setTimeout(() => setSaveStatus(p => ({ ...p, [id]: null })), 2000);
  }

  async function deleteArticle(id) {
    await fetch(`${API_URL}/api/knowledge/${id}`, { method: "DELETE" });
    setArticles(p => p.filter(a => a.id !== id));
  }

  async function handleSaveArticle(updated) {
    const isNew   = !updated.id || String(updated.id).startsWith("new");
    const method  = isNew ? "POST" : "PUT";
    const url     = isNew ? `${API_URL}/api/knowledge` : `${API_URL}/api/knowledge/${updated.id}`;
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID, title: updated.title, content: updated.content,
        status: updated.status || (editingArticle?.isPublished ? "published" : "draft"),
      }),
    });
    const saved = await res.json();
    if (isNew) setArticles(p => [...p, saved]);
    else setArticles(p => p.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    setEditingArticle(null);
  }

  async function generateSuggestions() {
    setGenerating(true);
    try {
      const res  = await fetch(`${API_URL}/api/knowledge/suggestions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID }),
      });
      const data = await res.json();
      if (data?.articles) setArticles(p => [...p, ...data.articles]);
    } catch (e) { console.error(e); }
    setGenerating(false);
  }

  function buildAuthPayload() {
    if (authType === "bearer" && authToken.trim())
      return { type: "bearer", token: authToken.trim() };
    if (authType === "cookie" && authCookie.trim())
      return { type: "cookie", cookie: authCookie.trim() };
    if (authType === "basic" && authUser.trim())
      return { type: "basic", username: authUser.trim(), password: authPass };
    return null;
  }

  async function connectSource() {
    const url = connectUrl.trim();
    if (!url) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const endpoint = connectMode === "crawl" ? "/api/scrape/crawl" : "/api/scrape";
      const auth = buildAuthPayload();
      const body = {
        url, client_id: CLIENT_ID,
        ...(connectMode === "crawl" ? { max_pages: connectMax } : {}),
        ...(auth ? { auth } : {}),
      };
      const res  = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setConnectResult({ error: data.error || "Failed" }); return; }
      const pages = data.pages_scraped ?? 1;
      setConnectResult({ pages });
      // Reload articles from API so all new ones appear
      const refreshed = await fetch(`${API_URL}/api/knowledge?client_id=${CLIENT_ID}`).then(r => r.json());
      if (refreshed) setArticles(refreshed);
    } catch (e) {
      setConnectResult({ error: e.message });
    } finally {
      setConnecting(false);
    }
  }

  async function syncDomain(domain) {
    setSyncingDomain(domain);
    try {
      await fetch(`${API_URL}/api/scrape/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, client_id: CLIENT_ID }),
      });
      const refreshed = await fetch(`${API_URL}/api/knowledge?client_id=${CLIENT_ID}`).then(r => r.json());
      if (refreshed) setArticles(refreshed);
    } catch (e) { console.error(e); }
    setSyncingDomain(null);
  }

  async function disconnectDomain(domain) {
    try {
      await fetch(`${API_URL}/api/scrape/source`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, client_id: CLIENT_ID }),
      });
      setArticles(p => p.filter(a => !a.source_url?.includes(domain)));
    } catch (e) { console.error(e); }
  }

  // Group external articles by domain
  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  }
  const externalArticles = articles.filter(a => a.source_url);
  const sourceGroups = externalArticles.reduce((acc, a) => {
    const d = getDomain(a.source_url);
    if (!acc[d]) acc[d] = { domain: d, articles: [], lastSync: null };
    acc[d].articles.push(a);
    const dt = a.updated_at || a.created_at;
    if (dt && (!acc[d].lastSync || dt > acc[d].lastSync)) acc[d].lastSync = dt;
    return acc;
  }, {});

  const q = search.toLowerCase();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
        <SectionHeader title="Knowledge Base" sub="Articles your AI agent references when answering questions. Published articles are live immediately." t={t} />
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={generateSuggestions} disabled={generating}
            style={{ background: generating ? t.surfaceHover : `${accent}14`,
              border: `1.5px solid ${accent}40`, borderRadius: "8px", color: accent,
              fontSize: "12px", fontWeight: "600", padding: "8px 14px",
              cursor: generating ? "default" : "pointer", whiteSpace: "nowrap" }}>
            {generating ? "✦ Generating…" : "✦ AI Suggest"}
          </button>
          <button onClick={() => setEditingArticle({ article: { id: "new-" + Date.now(), title: "", content: "", status: "draft" }, isPublished: false })}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
            + New Article
          </button>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "20px" }}>
        Drafts are never visible to customers until published. AI-suggested drafts expire after 30 days if not published.
      </p>

      {/* Search */}
      <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
        display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", marginBottom: "20px" }}>
        <span style={{ color: t.textMuted }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…"
          style={{ background: "transparent", border: "none", color: t.text, fontSize: "13px", flex: 1, outline: "none" }} />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "16px" }}>×</button>}
      </div>

      {/* Drafts */}
      {drafts.filter(a => a.title.toLowerCase().includes(q)).length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Drafts</span>
            <Tag color="#FBBF24">{drafts.length} articles</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {drafts.filter(a => a.title.toLowerCase().includes(q)).map(article => (
              <Card key={article.id} t={t} style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: t.text, letterSpacing: "-0.01em" }}>{article.title || "(Untitled)"}</span>
                      <Tag color="#FBBF24">draft</Tag>
                    </div>
                    <p style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.55",
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", margin: 0 }}>
                      {(article.content || "").slice(0, 200)}
                    </p>
                    <div style={{ display: "flex", gap: "14px", marginTop: "8px" }}>
                      <span style={{ fontSize: "11px", color: t.textMuted }}>
                        {article.created_at ? new Date(article.created_at).toLocaleDateString() : "just now"}
                      </span>
                      <span style={{ fontSize: "11px", color: t.textMuted }}>{article.lookups || 0} lookups</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => setEditingArticle({ article, isPublished: false })}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: t.textSub, fontSize: "11px", padding: "5px 10px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => publishDraft(article.id)}
                      style={{ background: saveStatus[article.id] === "done" ? "#059669" : accent,
                        border: "none", borderRadius: "6px", color: "#fff",
                        fontSize: "11px", padding: "5px 12px", cursor: "pointer", fontWeight: "600" }}>
                      {saveStatus[article.id] === "saving" ? "…" : saveStatus[article.id] === "done" ? "✓" : "Publish"}
                    </button>
                    <button onClick={() => deleteArticle(article.id)}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: "#EF4444", fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>×</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty drafts */}
      {drafts.length === 0 && !q && (
        <Card t={t} style={{ padding: "28px", marginBottom: "24px", textAlign: "center", border: `1px dashed ${t.border}` }}>
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>✦</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "4px" }}>No draft articles yet</div>
          <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "14px" }}>
            Let AI analyze your conversations and suggest articles automatically.
          </div>
          <button onClick={generateSuggestions} disabled={generating}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "8px 18px", cursor: "pointer" }}>
            {generating ? "Generating…" : "✦ Generate Now"}
          </button>
        </Card>
      )}

      {/* Published */}
      {published.filter(a => a.title.toLowerCase().includes(q)).length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Published</span>
            <Tag color="#34D399">{published.length} articles</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {published.filter(a => a.title.toLowerCase().includes(q)).map(article => (
              <div key={article.id} style={{ display: "flex", alignItems: "center", gap: "14px",
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px",
                padding: "13px 16px", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = t.surface}>
                <span style={{ color: "#34D399", fontSize: "13px" }}>✓</span>
                <span style={{ flex: 1, fontSize: "13px", color: t.text, fontWeight: "500",
                  letterSpacing: "-0.01em" }}>{article.title}</span>
                <span style={{ fontSize: "11px", color: t.textMuted }}>
                  {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : ""}
                </span>
                <span style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>
                  {article.lookups || 0} lookups
                </span>
                <button onClick={() => setEditingArticle({ article, isPublished: true })}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                    color: t.textSub, fontSize: "11px", padding: "4px 10px", cursor: "pointer" }}>Edit</button>
                <button onClick={() => deleteArticle(article.id)}
                  style={{ background: "none", border: "none", color: "#EF4444",
                    fontSize: "14px", cursor: "pointer", padding: "2px 6px" }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Sources */}
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Connected Sources</span>
            <Tag color="#4F8EF7">{Object.keys(sourceGroups).length} sites · {externalArticles.length} pages</Tag>
          </div>
          <button onClick={() => { setShowConnect(true); setConnectUrl(""); setConnectMode("single"); setConnectResult(null); }}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "7px 14px", cursor: "pointer" }}>
            + Connect Source
          </button>
        </div>

        {Object.keys(sourceGroups).length === 0 && (
          <Card t={t} style={{ padding: "32px", textAlign: "center", border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>🌐</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "6px" }}>No external sources connected</div>
            <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px", maxWidth: "340px", margin: "0 auto 16px" }}>
              Connect a website, help center, or documentation URL and the AI will read and use its content when answering questions.
            </div>
            <button onClick={() => { setShowConnect(true); setConnectUrl(""); setConnectMode("single"); setConnectResult(null); }}
              style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
                fontSize: "13px", fontWeight: "600", padding: "9px 20px", cursor: "pointer" }}>
              + Connect First Source
            </button>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.values(sourceGroups).map(group => (
            <Card key={group.domain} t={t} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${accent}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", flexShrink: 0 }}>🌐</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: t.text,
                    letterSpacing: "-0.01em", marginBottom: "3px" }}>{group.domain}</div>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: t.textSub }}>
                      {group.articles.length} page{group.articles.length !== 1 ? "s" : ""} scraped
                    </span>
                    {group.lastSync && (
                      <span style={{ fontSize: "11px", color: t.textMuted }}>
                        Last synced {new Date(group.lastSync).toLocaleDateString()}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", color: "#34D399", fontWeight: "600" }}>
                      ● Live
                    </span>
                  </div>
                  {/* Scraped pages list */}
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {group.articles.slice(0, 4).map(a => (
                      <div key={a.id} style={{ fontSize: "11.5px", color: t.textSub,
                        display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#34D399", fontSize: "10px" }}>✓</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.title}</span>
                        <span style={{ color: t.textMuted, flexShrink: 0 }}>{a.lookups || 0} lookups</span>
                      </div>
                    ))}
                    {group.articles.length > 4 && (
                      <div style={{ fontSize: "11px", color: t.textMuted, paddingLeft: "18px" }}>
                        +{group.articles.length - 4} more pages
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "flex-start" }}>
                  <button onClick={() => syncDomain(group.domain)} disabled={syncingDomain === group.domain}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "7px",
                      color: t.textSub, fontSize: "12px", padding: "6px 12px", cursor: "pointer",
                      opacity: syncingDomain === group.domain ? 0.5 : 1 }}>
                    {syncingDomain === group.domain ? "Syncing…" : "↻ Sync"}
                  </button>
                  <button onClick={() => disconnectDomain(group.domain)}
                    style={{ background: "none", border: `1px solid #EF444440`, borderRadius: "7px",
                      color: "#EF4444", fontSize: "12px", padding: "6px 12px", cursor: "pointer" }}>
                    Disconnect
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Connect Source Modal ── */}
      {showConnect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px" }}
          onClick={e => e.target === e.currentTarget && !connecting && setShowConnect(false)}>
          <div style={{ background: t.surface, borderRadius: "16px", border: `1px solid ${t.border}`,
            width: "100%", maxWidth: "560px", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
                  Connect External Source
                </div>
                <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px" }}>
                  The AI will scrape and read this content to answer customer questions
                </div>
              </div>
              {!connecting && (
                <button onClick={() => setShowConnect(false)}
                  style={{ background: "none", border: "none", color: t.textMuted,
                    fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* URL input */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                  URL
                </label>
                <input value={connectUrl} onChange={e => setConnectUrl(e.target.value)}
                  placeholder="https://help.yoursite.com or https://docs.yoursite.com"
                  disabled={connecting}
                  style={{ width: "100%", background: t.input, border: `1.5px solid ${t.border}`,
                    borderRadius: "10px", color: t.text, fontSize: "14px",
                    padding: "12px 14px", fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box", opacity: connecting ? 0.6 : 1 }}
                  onFocus={e => e.target.style.borderColor = accent}
                  onBlur={e  => e.target.style.borderColor = t.border}
                  onKeyDown={e => e.key === "Enter" && !connecting && connectSource()} />
              </div>

              {/* Mode selector */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "10px" }}>
                  What to scrape
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { value: "single", label: "Single page", desc: "Scrape only this exact URL — good for one specific article or FAQ" },
                    { value: "crawl",  label: "Entire site / help center", desc: "Follow links on the same domain and scrape multiple pages automatically" },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => !connecting && setConnectMode(opt.value)}
                      style={{ display: "flex", alignItems: "flex-start", gap: "12px",
                        padding: "12px 14px", borderRadius: "10px", cursor: "pointer",
                        border: `1.5px solid ${connectMode === opt.value ? accent : t.border}`,
                        background: connectMode === opt.value ? `${accent}0D` : t.surfaceHover,
                        transition: "all 0.12s" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                        border: `2px solid ${connectMode === opt.value ? accent : t.textMuted}`,
                        background: connectMode === opt.value ? accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {connectMode === opt.value && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{opt.label}</div>
                        <div style={{ fontSize: "12px", color: t.textSub, marginTop: "2px" }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Max pages (crawl only) */}
              {connectMode === "crawl" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                    textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                    Max pages to scrape: {connectMax}
                  </label>
                  <input type="range" min={5} max={30} step={5} value={connectMax}
                    onChange={e => setConnectMax(parseInt(e.target.value))} disabled={connecting}
                    style={{ width: "100%", accentColor: accent }} />
                  <div style={{ display: "flex", justifyContent: "space-between",
                    fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>
                    <span>5 pages</span><span>30 pages</span>
                  </div>
                </div>
              )}

              {/* Authorization */}
              <div>
                <button onClick={() => setShowAuth(v => !v)}
                  style={{ background: "none", border: `1px solid ${showAuth ? accent : t.border}`,
                    borderRadius: "8px", color: showAuth ? accent : t.textSub,
                    fontSize: "12px", fontWeight: "600", padding: "7px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{showAuth ? "▾" : "▸"}</span>
                  Authorization {authType !== "none" ? `(${authType})` : "(optional — for private / login-required pages)"}
                </button>

                {showAuth && (
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px",
                    padding: "16px", background: t.surfaceHover, borderRadius: "10px",
                    border: `1px solid ${t.border}` }}>
                    {/* Auth type selector */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[
                        { value: "none",   label: "None" },
                        { value: "bearer", label: "Bearer Token" },
                        { value: "cookie", label: "Cookie / Session" },
                        { value: "basic",  label: "Basic Auth" },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setAuthType(opt.value)}
                          style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "12px",
                            fontWeight: authType === opt.value ? "600" : "400", cursor: "pointer",
                            border: `1.5px solid ${authType === opt.value ? accent : t.border}`,
                            background: authType === opt.value ? `${accent}14` : "transparent",
                            color: authType === opt.value ? accent : t.textSub }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {authType === "bearer" && (
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                          textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                          Bearer Token
                        </label>
                        <input value={authToken} onChange={e => setAuthToken(e.target.value)}
                          placeholder="eyJhbGciOi… or your API key"
                          type="password"
                          style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                            borderRadius: "8px", color: t.text, fontSize: "13px",
                            padding: "9px 12px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = accent}
                          onBlur={e  => e.target.style.borderColor = t.border} />
                        <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "5px" }}>
                          Sent as: <code style={{ fontFamily: "monospace" }}>Authorization: Bearer &lt;token&gt;</code>
                        </div>
                      </div>
                    )}

                    {authType === "cookie" && (
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                          textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                          Cookie String
                        </label>
                        <input value={authCookie} onChange={e => setAuthCookie(e.target.value)}
                          placeholder="session=abc123; auth_token=xyz…"
                          type="password"
                          style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                            borderRadius: "8px", color: t.text, fontSize: "13px",
                            padding: "9px 12px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = accent}
                          onBlur={e  => e.target.style.borderColor = t.border} />
                        <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "5px" }}>
                          Copy from browser DevTools → Application → Cookies → copy the Cookie header value
                        </div>
                      </div>
                    )}

                    {authType === "basic" && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                            textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                            Username
                          </label>
                          <input value={authUser} onChange={e => setAuthUser(e.target.value)}
                            placeholder="username"
                            style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                              borderRadius: "8px", color: t.text, fontSize: "13px",
                              padding: "9px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e  => e.target.style.borderColor = t.border} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                            textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                            Password
                          </label>
                          <input value={authPass} onChange={e => setAuthPass(e.target.value)}
                            placeholder="password" type="password"
                            style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                              borderRadius: "8px", color: t.text, fontSize: "13px",
                              padding: "9px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e  => e.target.style.borderColor = t.border} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Result */}
              {connectResult && (
                <div style={{ padding: "12px 14px", borderRadius: "10px",
                  background: connectResult.error ? "#EF444414" : "#34D39914",
                  border: `1px solid ${connectResult.error ? "#EF444430" : "#34D39930"}` }}>
                  {connectResult.error ? (
                    <div style={{ fontSize: "13px", color: "#EF4444" }}>
                      ✕ Failed: {connectResult.error}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "#34D399", fontWeight: "600" }}>
                      ✓ Successfully scraped {connectResult.pages} page{connectResult.pages !== 1 ? "s" : ""} — content is now live in the AI's knowledge base
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {connecting && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 14px", borderRadius: "10px", background: `${accent}10`,
                  border: `1px solid ${accent}30` }}>
                  <div style={{ width: "16px", height: "16px", border: `2px solid ${accent}`,
                    borderTopColor: "transparent", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontSize: "13px", color: accent }}>
                    {connectMode === "crawl" ? `Crawling site — this may take up to ${connectMax * 2} seconds…` : "Scraping page…"}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end",
              padding: "16px 24px", borderTop: `1px solid ${t.border}` }}>
              {connectResult?.pages ? (
                <button onClick={() => setShowConnect(false)}
                  style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
                    fontSize: "13px", fontWeight: "600", padding: "10px 24px", cursor: "pointer" }}>
                  Done
                </button>
              ) : (
                <>
                  <button onClick={() => setShowConnect(false)} disabled={connecting}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
                      color: t.textSub, fontSize: "13px", padding: "10px 20px",
                      cursor: connecting ? "default" : "pointer", opacity: connecting ? 0.5 : 1 }}>
                    Cancel
                  </button>
                  <button onClick={connectSource} disabled={connecting || !connectUrl.trim()}
                    style={{ background: connectUrl.trim() && !connecting ? accent : t.surfaceHover,
                      border: "none", borderRadius: "8px",
                      color: connectUrl.trim() && !connecting ? "#fff" : t.textMuted,
                      fontSize: "13px", fontWeight: "600", padding: "10px 28px",
                      cursor: connectUrl.trim() && !connecting ? "pointer" : "default",
                      transition: "all 0.15s" }}>
                    {connecting ? "Scraping…" : connectMode === "crawl" ? "Crawl Site" : "Scrape Page"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {editingArticle && (
        <ArticleEditModal key={editingArticle.article.id} article={editingArticle.article}
          isPublished={editingArticle.isPublished} t={t} accent={accent}
          onSave={handleSaveArticle} onClose={() => setEditingArticle(null)} />
      )}

      {/* ── AI Insights from database ── */}
      <AIInsightsPanel t={t} accent={accent} />
    </div>
  );
}
// ── InsightActionModal ────────────────────────────────────────────────────────
function InsightActionModal({ opp, t, accent, onClose, onSave }) {
  const [instructions, setInstructions, undoInstructions, canUndo] = useUndoState(opp.instructions || "");
  const [saveStatus, setSaveStatus] = useState("idle");
  const autoTimer = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 2000);
    return () => clearTimeout(autoTimer.current);
  }, [instructions]);

  function handleSave() {
    clearTimeout(autoTimer.current);
    onSave(instructions);
    onClose();
  }

  const placeholders = {
    sop:        `Write step-by-step instructions for the AI to follow when handling "${opp.detail.replace("for issue type ", "")}"...\n\n1. Acknowledge the customer's concern.\n2. Check the order status in admin.\n3. ...`,
    kb:         `Write the knowledge base article content here.\n\nBe clear and specific — the AI will reference this article when answering related customer questions...`,
    escalation: `Describe how to reduce unnecessary escalations for this SOP.\n\nExample: Add a fallback resolution step before the escalation trigger. Check if the issue can be resolved by issuing a $5 credit first...`,
    tool:       `Write instructions for how the AI should use the "${opp.detail}" tool.\n\nExample: Invoke this tool only after confirming the order is in "In Process" state. Pass the order ID and the target status...`,
    error:      `Describe the fix for the "${opp.detail}" tool error.\n\nExample: Add a guard check before invoking — skip this tool if order.status is "Delivered". Update the relevant SOP to reflect this change...`,
    other:      `Write your instructions or notes for this improvement opportunity...`,
  };

  const typeColors = { sop: "#8B5CF6", kb: "#06B6D4", escalation: "#F59E0B", tool: accent, error: "#EF4444", other: t.textMuted };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: t.surface, borderRadius: "14px", border: `1px solid ${t.border}`,
        width: "min(700px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: typeColors[opp.type],
                background: `${typeColors[opp.type]}18`, padding: "2px 8px", borderRadius: "999px" }}>{opp.action}</span>
              {saveStatus === "saving" && <span style={{ fontSize: "11px", color: t.textMuted }}>Saving…</span>}
              {saveStatus === "saved"  && <span style={{ fontSize: "11px", color: "#10B981" }}>✓ Auto-saved</span>}
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>{opp.detail}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
            fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px", flexShrink: 0 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: "22px", flex: 1, display: "flex", flexDirection: "column", gap: "12px", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: t.textSub }}>Add your instructions below. The AI agent will follow these when this opportunity is acted on.</span>
            <button onClick={undoInstructions} disabled={!canUndo} style={{
              background: "none", border: "none", cursor: canUndo ? "pointer" : "default",
              color: canUndo ? accent : t.textMuted, fontSize: "12px", fontFamily: "inherit",
              padding: 0, opacity: canUndo ? 1 : 0.4, whiteSpace: "nowrap", marginLeft: "12px",
            }}>↩ Undo</button>
          </div>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={16}
            placeholder={placeholders[opp.type] || placeholders.other}
            style={{
              flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "10px", color: t.text, fontSize: "14px", lineHeight: "1.7",
              padding: "16px", fontFamily: "inherit", outline: "none", resize: "vertical",
              boxSizing: "border-box", transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = t.border}
            autoFocus
          />
        </div>
        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${t.border}`,
          display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
            color: t.textSub, fontSize: "13px", padding: "9px 20px", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ background: accent, border: "none", borderRadius: "8px",
            color: "#fff", fontSize: "13px", fontWeight: "600", padding: "9px 24px", cursor: "pointer" }}>
            Save Instructions
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Insights Panel ────────────────────────────────────────────────────────
function AIInsightsPanel({ t, accent }) {
  const { data: raw, loading } = useApi(`/api/insights?client_id=${CLIENT_ID}&limit=20`, null);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState("all");

  const insights = raw || [];
  const sevColors = { critical: "#FB7185", high: "#FBBF24", medium: "#4F8EF7", low: "#34D399" };
  const typeColors = { knowledge_gap: "#A78BFA", rising_issue: "#FB7185", automation_opportunity: "#34D399" };
  const typeLabels = { knowledge_gap: "Knowledge Gap", rising_issue: "Rising Issue", automation_opportunity: "Automation Opp." };

  const filters = ["all", "critical", "high", "knowledge_gap", "rising_issue", "automation_opportunity"];
  const filtered = insights.filter(i => {
    if (filter === "all") return true;
    return i.severity === filter || i.insight_type === filter;
  });

  async function generateInsights() {
    setGenerating(true);
    try {
      await fetch(`${API_URL}/api/insights/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID }),
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch(e) { console.error(e); }
    setGenerating(false);
  }

  if (loading) return null;

  return (
    <div style={{ marginTop: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>AI Insights</div>
          <div style={{ fontSize: "11.5px", color: t.textSub, marginTop: "3px" }}>
            Automatically detected gaps, trends and opportunities from your conversations.
          </div>
        </div>
        <button onClick={generateInsights} disabled={generating}
          style={{ background: generating ? t.surfaceHover : `${accent}14`,
            border: `1.5px solid ${accent}40`, borderRadius: "8px", color: accent,
            fontSize: "12px", fontWeight: "600", padding: "7px 14px",
            cursor: generating ? "default" : "pointer", whiteSpace: "nowrap" }}>
          {generating ? "Analyzing…" : "✦ Run Analysis"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {filters.map(f => (
          <Pill key={f} active={filter === f} accent={accent} onClick={() => setFilter(f)} t={t}>
            {f === "all" ? "All" : f === "knowledge_gap" ? "Knowledge Gaps" : f === "rising_issue" ? "Rising Issues" : f === "automation_opportunity" ? "Automation" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Pill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card t={t} style={{ padding: "32px", textAlign: "center", border: `1px dashed ${t.border}` }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>✦</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "4px" }}>No insights yet</div>
          <div style={{ fontSize: "12px", color: t.textSub }}>
            Click "Run Analysis" to detect knowledge gaps, rising issues and automation opportunities.
          </div>
        </Card>
      ) : (
        <Card t={t} style={{ overflow: "hidden" }}>
          {filtered.map((ins, i) => (
            <div key={ins.id || i} style={{ display: "flex", alignItems: "flex-start", gap: "14px",
              padding: "14px 18px", borderBottom: i < filtered.length-1 ? `1px solid ${t.borderLight}` : "none",
              transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "4px", flexShrink: 0,
                background: sevColors[ins.severity] || t.textMuted }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: t.text,
                    letterSpacing: "-0.01em" }}>{ins.title}</span>
                  <span style={{ fontSize: "10px", fontWeight: "700", padding: "1px 7px",
                    borderRadius: "999px",
                    background: `${typeColors[ins.insight_type] || t.textMuted}18`,
                    color: typeColors[ins.insight_type] || t.textMuted,
                    border: `1px solid ${typeColors[ins.insight_type] || t.textMuted}30` }}>
                    {typeLabels[ins.insight_type] || ins.insight_type}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.55" }}>{ins.description}</div>
                {ins.created_at && (
                  <div style={{ fontSize: "10.5px", color: t.textMuted, marginTop: "5px" }}>
                    {new Date(ins.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px",
                borderRadius: "999px", flexShrink: 0,
                background: `${sevColors[ins.severity] || t.textMuted}18`,
                color: sevColors[ins.severity] || t.textMuted,
                border: `1px solid ${sevColors[ins.severity] || t.textMuted}30`,
                textTransform: "uppercase" }}>
                {ins.severity || "info"}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: INSIGHTS — TAKE ACTION MODAL
// ══════════════════════════════════════════════════════════════════════════════
function TakeActionModal({ opp, t, accent, onClose, onDone }) {
  // "kb" opportunities default to KB tab; "sop" to SOP tab; "escalation" lets user pick
  const defaultTab = opp.type === "sop" ? "sop" : "kb";
  const [tab,          setTab]          = useState(defaultTab);
  const [kbTitle,      setKbTitle]      = useState(opp.intent ? `${opp.intent} — Help Guide` : "");
  const [kbContent,    setKbContent]    = useState("");
  const [sopName,      setSopName]      = useState(opp.intent || "");
  const [sopInstr,     setSopInstr]     = useState("");
  const [sopIssues,    setSopIssues]    = useState(opp.intent || "");
  const [saving,       setSaving]       = useState(false);
  const [drafting,     setDrafting]     = useState(false);
  const [savedMsg,     setSavedMsg]     = useState("");

  async function aiDraftKB() {
    if (!kbTitle) return;
    setDrafting(true);
    const res = await fetch(`${API_URL}/api/knowledge/suggestions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID }),
    });
    const data = await res.json();
    // Find an article that matches the intent/title
    const match = (data?.articles || []).find(a =>
      a.title?.toLowerCase().includes((opp.intent || "").toLowerCase().slice(0, 10))
    ) || data?.articles?.[0];
    if (match) {
      setKbTitle(match.title || kbTitle);
      setKbContent(match.content || "");
    }
    setDrafting(false);
  }

  async function saveKB() {
    if (!kbTitle) return;
    setSaving(true);
    await fetch(`${API_URL}/api/knowledge`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, title: kbTitle, content: kbContent, status: "draft" }),
    });
    setSaving(false);
    setSavedMsg("KB article saved as draft in Knowledge Base.");
    setTimeout(() => { onDone(); onClose(); }, 1400);
  }

  async function saveSOP() {
    if (!sopName) return;
    setSaving(true);
    await fetch(`${API_URL}/api/sops`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        name: sopName,
        instructions: sopInstr,
        issues: sopIssues.split(",").map(s => s.trim()).filter(Boolean),
        status: "draft",
      }),
    });
    setSaving(false);
    setSavedMsg("SOP saved as draft in SOPs section.");
    setTimeout(() => { onDone(); onClose(); }, 1400);
  }

  const inp = (val, set, placeholder, rows) => rows ? (
    <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
        border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none",
        resize: "vertical", lineHeight: "1.5", fontFamily: "inherit", boxSizing: "border-box" }} />
  ) : (
    <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
        border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none",
        boxSizing: "border-box" }} />
  );

  const label = (text) => (
    <div style={{ fontSize: "10px", fontWeight: "700", color: t.textMuted,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{text}</div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.surface, borderRadius: "14px", border: `1px solid ${t.border}`,
        width: "100%", maxWidth: "560px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              Take Action
            </div>
            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px" }}>
              {opp.detail}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: t.textMuted, cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px" }}>×</button>
        </div>

        {/* Tabs — only show both if escalation type */}
        {opp.type === "escalation" && (
          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}` }}>
            {[{ key: "kb", label: "Add KB Article" }, { key: "sop", label: "Add SOP" }].map(v => (
              <button key={v.key} onClick={() => setTab(v.key)} style={{
                flex: 1, padding: "11px", background: tab === v.key ? `${accent}12` : "transparent",
                border: "none", borderBottom: tab === v.key ? `2px solid ${accent}` : "2px solid transparent",
                color: tab === v.key ? accent : t.textMuted,
                fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}>
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "22px" }}>
          {savedMsg ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#34D399", fontSize: "14px",
              fontWeight: "600" }}>✓ {savedMsg}</div>
          ) : tab === "kb" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                {label("Article Title")}
                {inp(kbTitle, setKbTitle, "e.g. How to track your order")}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "6px" }}>
                  {label("Content")}
                  <button onClick={aiDraftKB} disabled={drafting || !kbTitle}
                    style={{ fontSize: "11px", padding: "3px 10px", background: `${accent}14`,
                      border: `1px solid ${accent}30`, borderRadius: "5px", color: accent,
                      cursor: "pointer", fontWeight: "600", opacity: drafting ? 0.6 : 1 }}>
                    {drafting ? "Drafting…" : "✦ AI Draft"}
                  </button>
                </div>
                {inp(kbContent, setKbContent, "Write the article content, or click AI Draft to generate it…", 7)}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={onClose} style={{ flex: 1, padding: "10px", background: t.surfaceHover,
                  border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub,
                  fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={saveKB} disabled={saving || !kbTitle}
                  style={{ flex: 2, padding: "10px", background: accent, border: "none",
                    borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save to Knowledge Base"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                {label("SOP Name")}
                {inp(sopName, setSopName, "e.g. Order Tracking SOP")}
              </div>
              <div>
                {label("Triggers / Issue Keywords (comma separated)")}
                {inp(sopIssues, setSopIssues, "order tracking, where is my order, shipping status")}
              </div>
              <div>
                {label("Instructions")}
                {inp(sopInstr, setSopInstr, "Step 1: …\nStep 2: …\nStep 3: …", 7)}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={onClose} style={{ flex: 1, padding: "10px", background: t.surfaceHover,
                  border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub,
                  fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                <button onClick={saveSOP} disabled={saving || !sopName}
                  style={{ flex: 2, padding: "10px", background: accent, border: "none",
                    borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save to SOPs"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════
function Insights({ t, accent }) {
  const [oppFilter,      setOppFilter]      = useState("All");
  const [completedIdxs,  setCompletedIdxs]  = useState(new Set());
  const [actionOpp,      setActionOpp]      = useState(null);
  const [aiInsights,     setAiInsights]     = useState([]);
  const [insGenerating,  setInsGenerating]  = useState(false);
  const [escReasons,     setEscReasons]     = useState([]);
  const [lastRefresh,    setLastRefresh]    = useState(null);
  const [refreshTick,    setRefreshTick]    = useState(0);
  // Date range
  const [period,    setPeriod]   = useState("7");     // "1"|"7"|"30"|"90"|"custom"
  const [fromDate,  setFromDate] = useState("");
  const [toDate,    setToDate]   = useState("");

  const periodQs = period === "custom" && fromDate && toDate
    ? `from=${fromDate}&to=${toDate}`
    : `days=${period}`;

  const PERIODS = [
    { label: "Today",   val: "1"      },
    { label: "7 Days",  val: "7"      },
    { label: "30 Days", val: "30"     },
    { label: "90 Days", val: "90"     },
    { label: "Custom",  val: "custom" },
  ];

  // Real data from API
  const { data: aPrimary, loading } = useApi(`/api/analytics?client_id=${CLIENT_ID}&${periodQs}`,           null, [refreshTick, periodQs]);
  const { data: a30 }               = useApi(`/api/analytics?client_id=${CLIENT_ID}&days=30`,                null, [refreshTick]);
  const { data: rawIntents }        = useApi(`/api/analytics/intents?client_id=${CLIENT_ID}&limit=20&${periodQs}`, null, [refreshTick, periodQs]);
  const { data: rawKB }             = useApi(`/api/knowledge?client_id=${CLIENT_ID}`,                        null);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick(n => n + 1);
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load AI insights and escalation reasons on mount/refresh
  useEffect(() => {
    apiFetch(`/api/insights?client_id=${CLIENT_ID}`).then(d => setAiInsights(d || []));
    apiFetch(`/api/insights/escalation-reasons?client_id=${CLIENT_ID}&${periodQs}`).then(d => setEscReasons(d || []));
  }, [refreshTick, periodQs]);

  async function generateInsights() {
    setInsGenerating(true);
    const res = await fetch(`${API_URL}/api/insights/generate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID }),
    });
    const data = await res.json();
    setAiInsights(data?.insights || []);
    setInsGenerating(false);
  }

  async function resolveInsight(id) {
    setAiInsights(prev => prev.filter(i => i.id !== id));
    await fetch(`${API_URL}/api/insights/${id}/resolve`, { method: "PATCH" });
  }

  const sP  = aPrimary?.summary || {};
  const s30 = a30?.summary      || {};

  const totalP     = sP.total_messages      || 0;
  const automatedP = sP.automated_responses || 0;
  const escalatedP = sP.escalations         || 0;
  const total30    = s30.total_messages      || 0;
  const automated30 = s30.automated_responses || 0;
  const escalated30 = s30.escalations         || 0;

  const containmentP  = totalP  > 0 ? parseFloat(((automatedP  / totalP)  * 100).toFixed(1)) : 0;
  const containment30 = total30 > 0 ? parseFloat(((automated30 / total30) * 100).toFixed(1)) : 0;
  const target        = Math.min(99, parseFloat((containmentP + 15).toFixed(1)));

  const periodLabel = period === "custom" ? "period" : period === "1" ? "today" : `${period}d`;

  const intents    = rawIntents || [];
  const kbArticles = rawKB      || [];
  const publishedKB = kbArticles.filter(a => a.status === "published").length;

  // Build real opportunities from actual data
  const allOpps = [];

  // High-frequency intents with no KB article = suggest KB article
  intents.forEach(item => {
    const hasKB = kbArticles.some(a => a.title?.toLowerCase().includes(item.intent?.toLowerCase().slice(0, 15)));
    if (!hasKB && item.count >= 2) {
      allOpps.push({
        type:   "kb",
        action: "Add KB Article",
        detail: `"${item.intent}" — ${item.count} conversations, no article yet`,
        impact: parseFloat(Math.min(8, item.count * 0.4).toFixed(1)),
        intent: item.intent,
      });
    }
  });

  // High-frequency intents with escalations = suggest SOP
  intents.forEach(item => {
    if ((item.escalated_count || 0) >= 1) {
      allOpps.push({
        type:   "sop",
        action: "Add SOP",
        detail: `"${item.intent}" — ${item.escalated_count} escalations`,
        impact: parseFloat(Math.min(10, (item.escalated_count || 0) * 1.5).toFixed(1)),
        intent: item.intent,
      });
    }
  });

  // Overall escalation rate too high
  if (escalatedP > 0 && totalP > 0 && (escalatedP / totalP) > 0.15) {
    allOpps.push({
      type:   "escalation",
      action: "Reduce Escalations",
      detail: `${escalatedP} of ${totalP} conversations escalated (${((escalatedP/totalP)*100).toFixed(0)}%)`,
      impact: parseFloat(((escalatedP / totalP) * 20).toFixed(1)),
    });
  }

  // No KB articles published yet
  if (publishedKB === 0 && totalP > 0) {
    allOpps.push({
      type:   "kb",
      action: "Publish KB Articles",
      detail: "No published articles — AI is answering without a knowledge base",
      impact: 12.0,
    });
  }

  // Low containment rate
  if (containmentP < 70 && totalP > 3) {
    allOpps.push({
      type:   "sop",
      action: "Add SOPs for Top Issues",
      detail: `Containment rate is ${containmentP}% — SOPs can automate more responses`,
      impact: parseFloat(Math.min(20, (70 - containmentP) * 0.5).toFixed(1)),
    });
  }

  const FILTER_TYPE = { "All": null, "Add KB Article": "kb", "Add SOP": "sop", "Reduce Escalations": "escalation" };
  const oppFilters  = Object.keys(FILTER_TYPE);
  const typeColors  = { sop: "#8B5CF6", kb: "#06B6D4", escalation: "#F59E0B", other: t.textMuted };

  const filteredOpps = allOpps.filter(opp => {
    const required = FILTER_TYPE[oppFilter];
    return required === null || opp.type === required;
  });

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <SectionHeader title="Insights" sub="Real performance data from your AI agent. Auto-refreshes every 60s." t={t} />
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {lastRefresh && (
            <span style={{ fontSize: "11px", color: t.textMuted }}>
              Updated {lastRefresh.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
            </span>
          )}
          <button onClick={() => { setRefreshTick(n => n + 1); setLastRefresh(new Date()); }}
            style={{ padding: "7px 12px", background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "12px", cursor: "pointer" }}>
            ↻ Refresh
          </button>
          <button onClick={generateInsights} disabled={insGenerating}
            style={{ padding: "7px 14px", background: accent, border: "none",
              borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "600",
              cursor: "pointer", opacity: insGenerating ? 0.7 : 1 }}>
            {insGenerating ? "Analyzing…" : "✦ Generate AI Insights"}
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px",
        flexWrap: "wrap" }}>
        {PERIODS.map(p => (
          <button key={p.val} onClick={() => setPeriod(p.val)} style={{
            padding: "6px 14px", borderRadius: "7px", border: `1px solid ${period === p.val ? accent : t.border}`,
            background: period === p.val ? `${accent}18` : t.surfaceHover,
            color: period === p.val ? accent : t.textMuted,
            fontSize: "12px", fontWeight: period === p.val ? "700" : "400", cursor: "pointer" }}>
            {p.label}
          </button>
        ))}
        {period === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "7px",
                border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none" }} />
            <span style={{ fontSize: "12px", color: t.textMuted }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "7px",
                border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none" }} />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && totalP === 0 && total30 === 0 && (
        <Card t={t} style={{ padding: "40px", textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>No data yet</div>
          <div style={{ fontSize: "13px", color: t.textSub }}>
            Insights will appear here as your AI agent handles real customer conversations.
          </div>
        </Card>
      )}

      {/* Live stats grid */}
      {(totalP > 0 || total30 > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: `Conversations (${periodLabel})`, val: totalP.toLocaleString(),      color: accent,    sub: `${total30} last 30d` },
            { label: `AI Handled (${periodLabel})`,    val: automatedP.toLocaleString(),  color: "#10B981", sub: `${containmentP}% containment` },
            { label: `Escalated (${periodLabel})`,     val: escalatedP.toLocaleString(),  color: "#F59E0B", sub: `${totalP > 0 ? ((escalatedP/totalP)*100).toFixed(0) : 0}% escalation rate` },
            { label: "KB Articles",                    val: publishedKB.toString(),       color: "#06B6D4", sub: `${kbArticles.length - publishedKB} drafts pending` },
          ].map(s => (
            <Card key={s.label} t={t} style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: "11px", color: t.textSub, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div style={{ fontSize: "26px", fontWeight: "700", color: s.color, fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>{s.val}</div>
              <div style={{ fontSize: "11px", color: t.textMuted }}>{s.sub}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Containment bar */}
      {totalP > 0 && (
        <Card t={t} style={{ padding: "22px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Containment Rate</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "2px" }}>
                % of conversations fully handled by AI without human escalation.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: "700", color: containmentP >= 70 ? "#10B981" : "#F59E0B", fontFamily: "'DM Mono', monospace" }}>
                {containmentP}%
              </div>
              <div style={{ fontSize: "11px", color: t.textSub }}>
                current → <span style={{ color: "#10B981" }}>{target}%</span> potential
              </div>
            </div>
          </div>
          <ContainmentBar current={containmentP} target={target} accent={accent} t={t} steps={allOpps.map(o => o.impact)} />

          {/* Period vs 30d comparison */}
          {total30 > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${t.border}` }}>
              {[
                { label: `${periodLabel} containment`, val: `${containmentP}%`,  color: accent },
                { label: "30-day containment",          val: `${containment30}%`, color: t.textSub },
                { label: "Trend", val: containmentP >= containment30 ? `↑ +${(containmentP - containment30).toFixed(1)}%` : `↓ ${(containmentP - containment30).toFixed(1)}%`,
                  color: containmentP >= containment30 ? "#10B981" : "#EF4444" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
                  <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "3px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Top intents table */}
      {intents.length > 0 && (
        <Card t={t} style={{ overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, fontSize: "13px", fontWeight: "700", color: t.text }}>
            Top Issue Types — Last 7 Days
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 80px 70px 90px", padding: "8px 16px",
            fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em",
            borderBottom: `1px solid ${t.border}` }}>
            <span>Intent</span><span>Count</span><span>Escalated</span><span>Rate</span><span>Confidence</span>
          </div>
          {intents.slice(0, 10).map((item, i) => {
            const rate = item.count > 0 ? ((item.count - (item.escalated_count||0)) / item.count * 100).toFixed(0) : 100;
            const conf = item.avg_confidence ? (parseFloat(item.avg_confidence)*100).toFixed(0) : null;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 70px 80px 70px 90px",
                padding: "11px 16px", borderBottom: `1px solid ${t.borderLight}`,
                alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "13px", color: t.text, fontWeight: "500" }}>{item.intent}</span>
                  <div style={{ height: "3px", borderRadius: "2px", background: `linear-gradient(90deg,${accent},${accent}60)`,
                    width: `${Math.min(100, (item.count / (intents[0]?.count || 1)) * 160)}px`, maxWidth: "160px" }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: t.text, fontFamily: "'DM Mono', monospace" }}>{item.count}</span>
                <span style={{ fontSize: "13px", color: (item.escalated_count||0) > 0 ? "#F59E0B" : t.textMuted, fontFamily: "'DM Mono', monospace" }}>{item.escalated_count || 0}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", fontFamily: "'DM Mono', monospace",
                  color: rate >= 90 ? "#10B981" : rate >= 70 ? "#F59E0B" : "#EF4444" }}>{rate}%</span>
                <span style={{ fontSize: "12px", color: conf >= 80 ? "#10B981" : conf >= 60 ? "#F59E0B" : "#EF4444",
                  fontFamily: "'DM Mono', monospace" }}>{conf ? `${conf}%` : "—"}</span>
              </div>
            );
          })}
        </Card>
      )}

      {/* Escalation Reasons */}
      {escReasons.length > 0 && (
        <Card t={t} style={{ overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>
              Why Are Tickets Escalating?
            </div>
            <span style={{ fontSize: "11px", color: t.textMuted }}>Last 30 days</span>
          </div>
          {escReasons.slice(0, 8).map((item, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: `1px solid ${t.borderLight}`,
              transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: item.reasons.length > 0 ? "6px" : "0" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{item.intent}</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#FB7185",
                  fontFamily: "'DM Mono', monospace", background: "#FB718514",
                  padding: "2px 8px", borderRadius: "5px" }}>
                  {item.count} escalated
                </span>
              </div>
              {item.reasons.length > 0 && (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {item.reasons.slice(0, 3).map((r, j) => (
                    <span key={j} style={{ fontSize: "11px", color: "#F59E0B",
                      background: "#F59E0B14", padding: "2px 8px", borderRadius: "4px",
                      border: "1px solid #F59E0B25" }}>
                      ⚠ {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* AI-Generated Insights */}
      <Card t={t} style={{ overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>AI Insights</span>
            <span style={{ marginLeft: "8px", fontSize: "11px", color: t.textMuted }}>
              Generated by Claude analysis
            </span>
          </div>
          <button onClick={generateInsights} disabled={insGenerating}
            style={{ padding: "5px 12px", background: `${accent}14`, border: `1px solid ${accent}30`,
              borderRadius: "6px", color: accent, fontSize: "11px", fontWeight: "600",
              cursor: "pointer", opacity: insGenerating ? 0.7 : 1 }}>
            {insGenerating ? "Analyzing…" : "↻ Regenerate"}
          </button>
        </div>
        {aiInsights.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
            {insGenerating ? "AI is analyzing your conversations…" : "Click \"Generate AI Insights\" above to analyze your data."}
          </div>
        ) : (
          aiInsights.slice(0, 7).map((ins, i) => {
            const sevColor = ins.severity === "critical" ? "#EF4444"
              : ins.severity === "high" ? "#F59E0B"
              : ins.severity === "medium" ? accent : "#34D399";
            const typeColor = ins.insight_type === "knowledge_gap" ? "#06B6D4"
              : ins.insight_type === "rising_issue" ? "#F59E0B"
              : ins.insight_type === "automation_opportunity" ? "#34D399" : t.textMuted;
            return (
              <div key={ins.id || i} style={{ padding: "14px 16px",
                borderBottom: i < aiInsights.length - 1 ? `1px solid ${t.borderLight}` : "none",
                transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    background: sevColor, marginTop: "5px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px",
                      flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{ins.title}</span>
                      <span style={{ fontSize: "9px", fontWeight: "700", padding: "1px 6px",
                        borderRadius: "4px", background: `${sevColor}18`, color: sevColor,
                        textTransform: "uppercase" }}>{ins.severity}</span>
                      {ins.insight_type && (
                        <span style={{ fontSize: "9px", padding: "1px 6px",
                          borderRadius: "4px", background: `${typeColor}14`, color: typeColor }}>
                          {ins.insight_type.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.5" }}>
                      {ins.description}
                    </div>
                  </div>
                  {ins.id && (
                    <button onClick={() => resolveInsight(ins.id)}
                      style={{ background: "none", border: `1px solid ${t.border}`,
                        borderRadius: "5px", color: t.textMuted, fontSize: "10px",
                        padding: "3px 8px", cursor: "pointer", flexShrink: 0 }}>
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Improvement Opportunities */}
      {(totalP > 0 || total30 > 0) && (
        <>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
            {oppFilters.map(f => (
              <Pill key={f} active={oppFilter === f} accent={accent} onClick={() => setOppFilter(f)} t={t}>
                {f}{f !== "All" && <span style={{ marginLeft: "5px", opacity: 0.7 }}>({allOpps.filter(o => FILTER_TYPE[f] === null || o.type === FILTER_TYPE[f]).length})</span>}
              </Pill>
            ))}
          </div>

          <Card t={t} style={{ overflow: "hidden", marginBottom: "20px" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, fontSize: "13px", fontWeight: "700", color: t.text }}>
              Improvement Opportunities
              <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: "400", color: t.textMuted }}>({filteredOpps.length})</span>
            </div>
            {filteredOpps.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "13px" }}>
                {allOpps.length === 0
                  ? "Great job — no issues detected yet. Opportunities appear as data builds up."
                  : "No opportunities in this category."}
              </div>
            ) : filteredOpps.map((opp, i) => {
              const done = completedIdxs.has(i);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px",
                  padding: "13px 16px", borderBottom: `1px solid ${t.borderLight}`,
                  opacity: done ? 0.45 : 1, transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!done) e.currentTarget.style.background = t.surfaceHover; }}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                    background: done ? t.textMuted : (typeColors[opp.type] || accent) }} />
                  <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "150px",
                    color: done ? t.textMuted : (typeColors[opp.type] || accent) }}>
                    {done ? "✓ " : ""}{opp.action}
                  </span>
                  <span style={{ flex: 1, fontSize: "12px", color: done ? t.textMuted : t.textSub }}>
                    {opp.detail}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: `${Math.min(80, opp.impact * 8)}px`, height: "5px", borderRadius: "3px",
                      background: done ? t.border : `linear-gradient(90deg,${accent},${accent}70)`, minWidth: "16px" }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: "700",
                      color: done ? t.textMuted : "#10B981", minWidth: "40px", textAlign: "right" }}>
                      +{opp.impact}%
                    </span>
                  </div>
                  <button
                    onClick={() => { if (!done) setActionOpp({ opp, idx: i }); }}
                    style={{ background: done ? t.surfaceHover : accent,
                      border: done ? `1px solid ${t.border}` : "none",
                      borderRadius: "6px", color: done ? t.textMuted : "#fff",
                      fontSize: "11px", padding: "5px 12px",
                      cursor: done ? "default" : "pointer",
                      fontWeight: "600", whiteSpace: "nowrap", transition: "opacity 0.1s" }}>
                    {done ? "✓ Done" : "Take Action →"}
                  </button>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {/* Take Action modal */}
      {actionOpp && (
        <TakeActionModal
          opp={actionOpp.opp}
          t={t} accent={accent}
          onClose={() => setActionOpp(null)}
          onDone={() => setCompletedIdxs(s => { const n = new Set(s); n.add(actionOpp.idx); return n; })}
        />
      )}
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════════════════
// THEME CUSTOMIZER PANEL
// ══════════════════════════════════════════════════════════════════════════════
function ThemePanel({ darkMode, setDarkMode, accentIdx, setAccentIdx, fontIdx, setFontIdx, t, accent }) {
  return (
    <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Dark/Light */}
      <div>
        <div style={{ fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase",
          letterSpacing: "0.09em", marginBottom: "9px" }}>Appearance</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ label: "🌙 Dark", val: true }, { label: "☀️ Light", val: false }].map(opt => (
            <button key={String(opt.val)} onClick={() => setDarkMode(opt.val)} style={{
              flex: 1, padding: "7px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600",
              background: darkMode === opt.val ? `${accent}18` : t.surfaceHover,
              color: darkMode === opt.val ? accent : t.textSub,
              border: `1.5px solid ${darkMode === opt.val ? accent : t.border}`,
              transition: "all 0.12s",
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Accent */}
      <div>
        <div style={{ fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase",
          letterSpacing: "0.09em", marginBottom: "9px" }}>Accent Color</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "5px" }}>
          {ACCENT_PRESETS.map((p, i) => (
            <button key={p.name} onClick={() => setAccentIdx(i)} style={{
              padding: "7px 8px", borderRadius: "8px", cursor: "pointer", fontSize: "11px",
              fontWeight: accentIdx === i ? "600" : "400",
              background: accentIdx === i ? (p.glow || `${p.color}18`) : t.surfaceHover,
              color: accentIdx === i ? p.color : t.textSub,
              border: `1.5px solid ${accentIdx === i ? p.color : t.border}`,
              display: "flex", alignItems: "center", gap: "6px", transition: "all 0.12s",
            }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${p.color}, ${p.dark})` }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div>
        <div style={{ fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase",
          letterSpacing: "0.09em", marginBottom: "9px" }}>Font</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {FONT_OPTIONS.map((f, i) => (
            <button key={f.name} onClick={() => setFontIdx(i)} style={{
              padding: "7px 11px", borderRadius: "7px", cursor: "pointer", fontSize: "12px",
              background: fontIdx === i ? `${accent}14` : t.surfaceHover,
              color: fontIdx === i ? accent : t.textSub,
              border: `1.5px solid ${fontIdx === i ? accent : t.border}`,
              textAlign: "left", fontFamily: `'${f.name}', sans-serif`, transition: "all 0.12s",
            }}>{f.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
// SECTION: MANAGE → TICKETS  (Advanced Conversation Viewer)
// ══════════════════════════════════════════════════════════════════════════════
function Tickets({ t, accent }) {
  const [search,         setSearch]         = useState("");
  const [statusF,        setStatusF]        = useState("all");
  const [channelF,       setChannelF]       = useState("all");
  const [selected,       setSelected]       = useState(null);
  const [page,           setPage]           = useState(1);
  const [threadMessages, setThreadMessages] = useState([]);
  const [msgsLoading,    setMsgsLoading]    = useState(false);
  const PER_PAGE = 30;

  const { data: raw, loading } = useApi(
    `/api/conversations?client_id=${CLIENT_ID}&limit=200`, null
  );

  // Load real messages when a conversation is selected
  useEffect(() => {
    if (!selected?.id) { setThreadMessages([]); return; }
    setMsgsLoading(true);
    apiFetch(`/api/messages?conversation_id=${selected.id}`).then(msgs => {
      setThreadMessages(msgs || []);
      setMsgsLoading(false);
    });
  }, [selected?.id]);

  const conversations = (raw || []);

  const q = search.toLowerCase();
  const filtered = conversations.filter(c => {
    const matchStatus  = statusF  === "all" || c.status   === statusF;
    const matchChannel = channelF === "all" || c.channel  === channelF;
    const matchSearch  = !q || (c.customer_name||"").toLowerCase().includes(q)
      || (c.customer_email||"").toLowerCase().includes(q)
      || (c.subject||"").toLowerCase().includes(q)
      || (c.intent||"").toLowerCase().includes(q);
    return matchStatus && matchChannel && matchSearch;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore   = filtered.length > paginated.length;

  const sentColors = { positive: "#34D399", neutral: "#7A8DB3", negative: "#FBBF24", angry: "#FB7185" };
  const statColors = { open: "#4F8EF7", escalated: "#FB7185", resolved: "#34D399", pending: "#FBBF24" };

  const col = { border: `1px solid ${t.border}`, borderRadius: "0" };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 50px)", overflow: "hidden", background: t.bg }}>

      {/* ── Left panel ── */}
      <div style={{ width: "340px", flexShrink: 0, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column", background: t.sidebar }}>

        {/* Header + filters */}
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              Conversations
            </span>
            <span style={{ fontSize: "11px", color: t.textMuted,
              background: t.surfaceHover, padding: "2px 8px", borderRadius: "999px",
              border: `1px solid ${t.border}` }}>{filtered.length}</span>
          </div>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px",
            background: t.surfaceHover, border: `1px solid ${t.border}`,
            borderRadius: "8px", padding: "7px 11px", marginBottom: "8px" }}>
            <span style={{ color: t.textMuted, fontSize: "12px" }}>⌕</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search conversations…"
              style={{ background: "transparent", border: "none", color: t.text,
                fontSize: "12px", flex: 1, outline: "none" }} />
          </div>
          {/* Filter row */}
          <div style={{ display: "flex", gap: "5px" }}>
            {["all","open","escalated","resolved"].map(s => (
              <button key={s} onClick={() => { setStatusF(s); setPage(1); }} style={{
                padding: "4px 9px", borderRadius: "6px", border: "none", cursor: "pointer",
                fontSize: "10.5px", fontWeight: statusF === s ? "700" : "400",
                background: statusF === s ? `${statColors[s] || accent}18` : t.surfaceHover,
                color: statusF === s ? (statColors[s] || accent) : t.textMuted,
              }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
            ))}
            <select value={channelF} onChange={e => { setChannelF(e.target.value); setPage(1); }}
              style={{ marginLeft: "auto", background: t.surfaceHover, border: `1px solid ${t.border}`,
                borderRadius: "6px", color: t.textSub, fontSize: "10.5px", padding: "3px 6px",
                cursor: "pointer", outline: "none" }}>
              {["all","email","chat","whatsapp","sms"].map(ch => (
                <option key={ch} value={ch}>{ch === "all" ? "All channels" : ch.charAt(0).toUpperCase()+ch.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading…
            </div>
          )}
          {!loading && paginated.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              No conversations match your filters.
            </div>
          )}
          {paginated.map(conv => {
            const isActive = selected?.id === conv.id;
            const ts = conv.created_at
              ? new Date(conv.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
              : "";
            return (
              <div key={conv.id} onClick={() => setSelected(conv)}
                style={{ padding: "12px 14px", borderBottom: `1px solid ${t.borderLight}`,
                  cursor: "pointer", transition: "background 0.1s",
                  background: isActive ? `${accent}10` : "transparent",
                  borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.surfaceHover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: isActive ? accent : t.text,
                    letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", maxWidth: "180px" }}>
                    {conv.customer_name || conv.customer_email || "Unknown"}
                  </span>
                  <span style={{ fontSize: "10px", color: t.textMuted, flexShrink: 0, marginLeft: "6px" }}>{ts}</span>
                </div>
                <div style={{ fontSize: "11.5px", color: t.textSub, marginBottom: "5px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conv.subject || conv.user_message?.slice(0,60) || "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  {/* Status */}
                  <span style={{ fontSize: "9.5px", fontWeight: "700", padding: "1px 6px",
                    borderRadius: "999px",
                    background: `${statColors[conv.status] || t.textMuted}18`,
                    color: statColors[conv.status] || t.textMuted }}>
                    {conv.status || "open"}
                  </span>
                  {/* Channel */}
                  {conv.channel && (
                    <span style={{ fontSize: "9.5px", color: t.textMuted,
                      background: t.surfaceHover, padding: "1px 5px", borderRadius: "4px" }}>
                      {conv.channel}
                    </span>
                  )}
                  {/* Intent */}
                  {conv.intent && (
                    <span style={{ fontSize: "9.5px", color: accent,
                      background: `${accent}12`, padding: "1px 6px", borderRadius: "4px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: "120px" }}>
                      {conv.intent}
                    </span>
                  )}
                  {/* Escalated flag */}
                  {conv.escalated && (
                    <span style={{ fontSize: "9px", color: "#FB7185" }}>⚠</span>
                  )}
                </div>
              </div>
            );
          })}
          {hasMore && (
            <div style={{ padding: "12px", textAlign: "center" }}>
              <button onClick={() => setPage(p => p+1)}
                style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "7px", color: t.textSub, fontSize: "11px",
                  padding: "6px 16px", cursor: "pointer" }}>
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      {selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Conversation header */}
          <div style={{ padding: "13px 20px", borderBottom: `1px solid ${t.border}`,
            background: t.sidebar, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: t.text,
                  letterSpacing: "-0.02em", marginBottom: "3px" }}>
                  {selected.customer_name || selected.customer_email || "Unknown"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {selected.customer_email && (
                    <span style={{ fontSize: "11px", color: t.textMuted }}>{selected.customer_email}</span>
                  )}
                  {selected.channel && (
                    <span style={{ fontSize: "10px", background: t.surfaceHover,
                      border: `1px solid ${t.border}`, padding: "1px 7px",
                      borderRadius: "5px", color: t.textSub }}>via {selected.channel}</span>
                  )}
                  <span style={{ fontSize: "10px", color: t.textMuted }}>
                    {selected.created_at ? new Date(selected.created_at).toLocaleString() : ""}
                  </span>
                </div>
              </div>
              {/* AI Intelligence Summary */}
              <div style={{ display: "flex", gap: "7px", flexShrink: 0 }}>
                {selected.intent && (
                  <div style={{ background: `${accent}12`, border: `1px solid ${accent}30`,
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Intent</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: accent }}>{selected.intent}</div>
                  </div>
                )}
                {selected.confidence && (
                  <div style={{ background: `#34D39912`, border: "1px solid #34D39930",
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Confidence</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#34D399" }}>
                      {(selected.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                {selected.escalated !== undefined && (
                  <div style={{ background: selected.escalated ? "#FB718512" : "#34D39912",
                    border: `1px solid ${selected.escalated ? "#FB718530" : "#34D39930"}`,
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700",
                      color: selected.escalated ? "#FB7185" : "#34D399" }}>
                      {selected.escalated ? "Escalated" : "Resolved"}
                    </div>
                  </div>
                )}
                {selected.sop_used && (
                  <div style={{ background: "#A78BFA12", border: "1px solid #A78BFA30",
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>SOP Used</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#A78BFA",
                      maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selected.sop_used}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject bar */}
          {selected.subject && (
            <div style={{ padding: "8px 20px", background: `${accent}08`,
              borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              <span style={{ fontSize: "11.5px", color: t.textSub }}>
                <span style={{ color: t.textMuted }}>Subject: </span>{selected.subject}
              </span>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Messages {selected.message_count > 1 ? `(${selected.message_count} exchanges)` : ""}
              </div>
              {selected.escalation_reason && (
                <div style={{ fontSize: "11px", background: "#FB718514",
                  border: "1px solid #FB718530", borderRadius: "6px",
                  padding: "4px 10px", color: "#FB7185", maxWidth: "260px" }}>
                  ⚠ Escalated: {selected.escalation_reason}
                </div>
              )}
            </div>

            {msgsLoading && (
              <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
                Loading messages…
              </div>
            )}

            {/* Render from messages table if available, otherwise fallback to single exchange */}
            {!msgsLoading && (() => {
              const displayMsgs = threadMessages.length > 0
                ? threadMessages.map(m => ({
                    from: m.sender_type === "bot" ? "agent" : m.sender_type === "customer" ? "customer" : "system",
                    name: m.sender_type === "bot" ? "Aria AI" : (selected.customer_name || "Customer"),
                    time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
                    text: m.content,
                    intent: m.intent,
                    confidence: m.confidence,
                  }))
                : [
                    { from: "customer", name: selected.customer_name || selected.customer_email || "Customer",
                      time: selected.created_at ? new Date(selected.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
                      text: selected.user_message || "" },
                    ...(selected.intent ? [{ from: "system", text:
                      `Intent: ${selected.intent}${selected.sop_used ? ` · SOP: ${selected.sop_used}` : ""}${selected.confidence ? ` · Confidence: ${(selected.confidence*100).toFixed(0)}%` : ""}${selected.escalated ? " · Escalated" : ""}` }] : []),
                    { from: "agent", name: "Aria AI",
                      time: selected.created_at ? new Date(new Date(selected.created_at).getTime()+12000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
                      text: selected.bot_response || "" },
                  ];

              return displayMsgs.map((msg, i) => {
                if (msg.from === "system") return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px",
                    justifyContent: "center", margin: "10px 0" }}>
                    <div style={{ flex: 1, height: "1px", background: t.border }} />
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
                      {msg.text.split(" · ").map((tag, j) => {
                        const isIntent    = tag.startsWith("Intent:");
                        const isSOP       = tag.startsWith("SOP:");
                        const isConf      = tag.startsWith("Confidence:");
                        const isEscalated = tag === "Escalated";
                        const color = isIntent ? accent : isSOP ? "#A78BFA" : isConf ? "#34D399"
                          : isEscalated ? "#FB7185" : t.textMuted;
                        return (
                          <span key={j} style={{ fontSize: "10px", color, background: `${color}14`,
                            padding: "2px 8px", borderRadius: "5px", fontWeight: "600",
                            border: `1px solid ${color}25` }}>
                            {isIntent ? "⚡ " : isSOP ? "📋 " : isConf ? "◎ " : isEscalated ? "⚠ " : "✓ "}{tag}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ flex: 1, height: "1px", background: t.border }} />
                  </div>
                );

                const isCustomer = msg.from === "customer";
                const isAgent    = msg.from === "agent";
                return (
                  <div key={i} style={{
                    display: "flex", flexDirection: "column",
                    alignItems: isCustomer ? "flex-start" : "flex-end",
                    marginBottom: "14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px",
                      flexDirection: isCustomer ? "row" : "row-reverse" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%",
                        background: isCustomer ? t.surfaceHover : `linear-gradient(135deg, ${accent}, ${accent}99)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: "700",
                        color: isCustomer ? t.textSub : "#fff",
                        border: `1px solid ${t.border}` }}>
                        {(msg.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: t.textSub }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize: "10px", color: t.textMuted }}>{msg.time}</span>
                      {isAgent && (
                        <span style={{ fontSize: "9px", background: `${accent}14`,
                          color: accent, padding: "1px 5px", borderRadius: "4px",
                          fontWeight: "700" }}>AI</span>
                      )}
                    </div>
                    <div style={{
                      maxWidth: "74%", padding: "11px 14px", borderRadius: "12px",
                      borderBottomLeftRadius: isCustomer ? "3px" : "12px",
                      borderBottomRightRadius: isAgent ? "3px" : "12px",
                      background: isCustomer ? t.surfaceHover : `${accent}18`,
                      border: `1px solid ${isCustomer ? t.border : accent + "30"}`,
                      fontSize: "13px", color: t.text, lineHeight: "1.6",
                      boxShadow: isAgent ? `0 2px 12px ${accent}12` : "none",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Actions bar */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${t.border}`,
            background: t.sidebar, display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
                borderRadius: "7px", color: t.textSub, fontSize: "12px",
                padding: "6px 14px", cursor: "pointer" }}>
                Assign to Agent
              </button>
              <button style={{ background: "#FB718514", border: "1px solid #FB718530",
                borderRadius: "7px", color: "#FB7185", fontSize: "12px",
                padding: "6px 14px", cursor: "pointer" }}>
                Escalate
              </button>
            </div>
            <button style={{ background: "#34D39914", border: "1px solid #34D39930",
              borderRadius: "7px", color: "#34D399", fontSize: "12px",
              fontWeight: "600", padding: "6px 14px", cursor: "pointer" }}>
              Mark Resolved
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "10px", color: t.textMuted }}>
          <div style={{ fontSize: "28px" }}>◧</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.textSub }}>Select a conversation</div>
          <div style={{ fontSize: "12px" }}>Click any item on the left to view the thread</div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SECTION: MANAGE → EVALUATIONS
// ══════════════════════════════════════════════════════════════════════════════
function Evaluations({ t, accent, evaluatedIds, setEvaluatedIds }) {
  const [period, setPeriod] = useState("week");
  const [evalTicket, setEvalTicket] = useState(null);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [filterTask, setFilterTask] = useState("all");
  const [filterIssue, setFilterIssue] = useState("all");
  const [filterSop, setFilterSop] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");

  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  const { data: rawConvs, loading: convsLoading } = useApi(`/api/conversations?client_id=${CLIENT_ID}&limit=500`, null);
  const { data: analytics7  } = useApi(`/api/analytics?client_id=${CLIENT_ID}&days=7`,  null);
  const { data: analytics30 } = useApi(`/api/analytics?client_id=${CLIENT_ID}&days=30`, null);
  const { data: analytics1  } = useApi(`/api/analytics?client_id=${CLIENT_ID}&days=1`,  null);
  const { data: rawIntentsEval } = useApi(`/api/analytics/intents?client_id=${CLIENT_ID}&limit=30`, null);
  const { data: rawSopsEval    } = useApi(`/api/sops?client_id=${CLIENT_ID}`, null);
  const { data: rawReviewsEval } = useApi(`/api/reviews?client_id=${CLIENT_ID}`, null);

  const intentOptions  = (rawIntentsEval || []).map(i => i.intent).filter(Boolean);
  const sopOptions     = (rawSopsEval || []).map(s => s.name).filter(Boolean);
  const channelOptions = ["email","chat","whatsapp","sms"];

  // Build ticket list from real conversations (non-escalated = AI managed)
  const allEvalTickets = (rawConvs || [])
    .filter(c => !c.escalated)
    .filter(c => filterIssue   === "all" || c.intent   === filterIssue)
    .filter(c => filterSop     === "all" || c.sop_used === filterSop)
    .filter(c => filterChannel === "all" || c.channel  === filterChannel)
    .map(c => ({
      id:          c.id,
      customer:    c.customer_name || c.customer_email || "Customer",
      email:       c.customer_email,
      channel:     c.channel,
      status:      c.status,
      sopTag:      c.sop_used || "Agent",
      champStatus: "AI Managed",
      preview:     (c.user_message || "").slice(0, 60),
      messages: [
        { from: "customer", name: c.customer_name || "Customer",
          time: c.created_at ? new Date(c.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
          text: c.user_message || "" },
        ...(c.intent ? [{ from: "system", text:
          `Issue Type: ${c.intent}${c.sop_used ? ` · SOP: ${c.sop_used}` : ""}${c.confidence ? ` · Confidence: ${(c.confidence*100).toFixed(0)}%` : ""}` }] : []),
        { from: "agent", name: "Aria AI",
          time: c.created_at ? new Date(new Date(c.created_at).getTime()+12000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
          text: c.bot_response || "" },
      ],
    }));

  const pendingTickets = allEvalTickets.filter(tk => !evaluatedIds.has(tk.id));
  const doneCount      = allEvalTickets.length - pendingTickets.length;

  // Real analytics for stats table
  const s1  = analytics1?.summary  || {};
  const s7  = analytics7?.summary  || {};
  const s30 = analytics30?.summary || {};
  const reviews = rawReviewsEval || [];
  const positiveReviews = reviews.filter(r => r.rating === "positive").length;
  const totalReviews    = reviews.length;

  function accStr(reviewed, total) {
    if (!total) return "N/A";
    if (!reviewed) return "0 reviewed";
    const pct = Math.round((reviewed / total) * 100);
    return `${pct}% positive (${reviewed} reviewed)`;
  }

  const rows = [
    { label: "Conversations",
      cols: [
        `${(s1.total_messages||0).toLocaleString()} total`,
        `${(s7.total_messages||0).toLocaleString()} total`,
        `${(s30.total_messages||0).toLocaleString()} total`,
      ],
      accuracy: [
        `${s1.containment_rate||"0.0"}% contained`,
        `${s7.containment_rate||"0.0"}% contained`,
        `${s30.containment_rate||"0.0"}% contained`,
      ]
    },
    { label: "AI Handled",
      cols: [
        `${(s1.automated_responses||0).toLocaleString()} automated`,
        `${(s7.automated_responses||0).toLocaleString()} automated`,
        `${(s30.automated_responses||0).toLocaleString()} automated`,
      ],
      accuracy: [
        `${(s1.escalations||0)} escalated`,
        `${(s7.escalations||0)} escalated`,
        `${(s30.escalations||0)} escalated`,
      ]
    },
    { label: "AI Response Quality",
      cols: [
        `${totalReviews} total reviews`,
        `${totalReviews} total reviews`,
        `${totalReviews} total reviews`,
      ],
      accuracy: [
        accStr(positiveReviews, totalReviews),
        accStr(positiveReviews, totalReviews),
        accStr(positiveReviews, totalReviews),
      ]
    },
  ];

  function openTicket(tk) {
    setEvalTicket(tk);
    setRating(null);
    setFeedback("");
    setJustSubmitted(false);
  }

  async function handleSubmit() {
    if (!rating || !evalTicket) return;
    setSubmitting(true);

    // Extract issue type from system message
    const sysMsg = evalTicket.messages.find(m => m.from === "system");
    const issueType = sysMsg ? (sysMsg.text.split("Issue Type: ")[1]?.split(" · ")[0] || "General Support") : "General Support";

    // Last AI response text
    const aiMsgs = evalTicket.messages.filter(m => m.from === "agent");
    const aiResponse = aiMsgs[aiMsgs.length - 1]?.text || "";

    // Save to API
    try {
      await fetch(`${API_URL}/api/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:   CLIENT_ID,
          ticket_id:   evalTicket.id,
          customer:    evalTicket.customer,
          issue_type:  issueType,
          sop_used:    evalTicket.sopTag || null,
          ai_response: aiResponse,
          rating,
          feedback: feedback.trim() || (rating === "positive" ? "No issues — AI handled this correctly." : "No specific feedback provided."),
          reviewer: "Team",
        }),
      });
    } catch(e) { console.error("Review save failed:", e); }

    setEvaluatedIds(prev => new Set([...prev, evalTicket.id]));

    // Find the next pending ticket (excluding the one just submitted)
    const nextPending = pendingTickets.filter(tk => tk.id !== evalTicket.id);

    setTimeout(() => {
      setSubmitting(false);
      setJustSubmitted(true);
      setTimeout(() => {
        if (nextPending.length > 0) {
          openTicket(nextPending[0]);
        } else {
          setEvalTicket(null);
          setJustSubmitted(false);
        }
      }, 1200);
    }, 400);
  }

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* Left — filters + stats */}
      <div style={{ flex: 1 }}>
        <SectionHeader title="Evaluations" sub="Review AI agent performance across triage, SOP execution, and response quality." t={t} />

        {/* Filter row */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          <select value={filterIssue} onChange={e => setFilterIssue(e.target.value)}
            style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 12px",
              outline: "none", cursor: "pointer", width: "340px" }}>
            <option value="all">Issue Types (All)</option>
            {intentOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterSop} onChange={e => setFilterSop(e.target.value)}
            style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 12px",
              outline: "none", cursor: "pointer", width: "340px" }}>
            <option value="all">SOPs (All)</option>
            {sopOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
            style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 12px",
              outline: "none", cursor: "pointer", width: "340px" }}>
            <option value="all">Channels (All)</option>
            {channelOptions.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
          </select>
          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="date" style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "8px 12px", outline: "none", cursor: "pointer" }} />
            <span style={{ color: t.textMuted, fontSize: "13px" }}>to</span>
            <input type="date" style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "8px 12px", outline: "none", cursor: "pointer" }} />
            <button style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "13px", fontWeight: "600", padding: "8px 18px", cursor: "pointer" }}>Apply</button>
          </div>
        </div>

        {/* Period toggle */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {[["today","Today"],["week","Last 7 Days"],["month","Last 30 Days"]].map(([val,label]) => (
            <Pill key={val} active={period === val} accent={accent} onClick={() => setPeriod(val)} t={t}>{label}</Pill>
          ))}
        </div>

        {/* Stats table */}
        <Card t={t} style={{ overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            padding: "10px 16px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span></span><span>Today</span><span>Last 7 days</span><span>Last 30 days</span>
          </div>
          {rows.map((row, ri) => (
            <div key={row.label} style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${t.borderLight}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                padding: "12px 16px", alignItems: "start" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{row.label}</span>
                {row.cols.map((col, ci) => (
                  <div key={ci}>
                    <div style={{ fontSize: "12px", color: t.textSub }}>{col}</div>
                    <div style={{ fontSize: "11px", color: row.accuracy[ci] === "N/A" ? t.textMuted : "#10B981", marginTop: "2px" }}>
                      {row.accuracy[ci]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {convsLoading && (
          <div style={{ padding: "20px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>Loading conversations…</div>
        )}

        {/* Progress + ticket list */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>
            Tickets Pending Evaluation
            <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: "400", color: t.textMuted }}>
              ({pendingTickets.length} remaining · {doneCount} evaluated)
            </span>
          </div>
          {pendingTickets.length > 0 && (
            <button onClick={() => openTicket(pendingTickets[0])} style={{
              background: accent, border: "none", borderRadius: "7px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "6px 14px", cursor: "pointer",
            }}>Start Queue →</button>
          )}
        </div>

        {/* Progress bar */}
        {allEvalTickets.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
                width: `${(doneCount / allEvalTickets.length) * 100}%`, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>
              {doneCount} of {allEvalTickets.length} evaluated
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {allEvalTickets.map((tk, i) => {
            const isDone   = evaluatedIds.has(tk.id);
            const isActive = evalTicket?.id === tk.id;
            return (
              <div key={tk.id} onClick={() => !isDone && openTicket(tk)}
                style={{ display: "flex", alignItems: "center", gap: "14px",
                  background: isActive ? `${accent}12` : isDone ? t.surfaceHover : t.surface,
                  border: `1px solid ${isActive ? accent : isDone ? t.borderLight : t.border}`,
                  borderRadius: "10px", padding: "11px 16px",
                  cursor: isDone ? "default" : "pointer",
                  opacity: isDone ? 0.6 : 1, transition: "all 0.15s" }}
                onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = `${accent}08`; }}
                onMouseLeave={e => { if (!isDone) e.currentTarget.style.background = isActive ? `${accent}12` : t.surface; }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                  background: isDone ? "#10B98120" : `${accent}20`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                  {isDone ? "✓" : "⚡"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{tk.customer}</div>
                  <div style={{ fontSize: "11px", color: t.textSub }}>{tk.sopTag} · #{tk.id}</div>
                </div>
                {isDone
                  ? <span style={{ fontSize: "11px", color: "#10B981", fontWeight: "600" }}>Evaluated ✓</span>
                  : <span style={{ fontSize: "11px", color: accent }}>
                      {isActive ? "Evaluating…" : `#${pendingTickets.indexOf(tk) + 1} in queue`}
                    </span>
                }
              </div>
            );
          })}
          {pendingTickets.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#10B981", fontSize: "13px", fontWeight: "600",
              background: "#10B98110", borderRadius: "10px", border: "1px solid #10B98130" }}>
              ✓ All tickets evaluated — check Reviews to see your submitted feedback.
            </div>
          )}
        </div>
      </div>

      {/* Right — evaluation panel */}
      {evalTicket && (
        <div style={{ width: "380px", flexShrink: 0 }}>
          <Card t={t} style={{ padding: "20px", position: "sticky", top: "20px" }}>

            {/* Header with progress */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Evaluate Ticket</div>
                <div style={{ fontSize: "11px", color: t.textSub, marginTop: "2px" }}>#{evalTicket.id} · {evalTicket.customer}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: t.textMuted }}>
                  {pendingTickets.findIndex(tk => tk.id === evalTicket.id) + 1} of {pendingTickets.length} pending
                </div>
                {pendingTickets.length > 1 && (
                  <button onClick={() => {
                    const idx = pendingTickets.findIndex(tk => tk.id === evalTicket.id);
                    const next = pendingTickets[(idx + 1) % pendingTickets.length];
                    openTicket(next);
                  }} style={{ background: "none", border: "none", color: accent, fontSize: "11px",
                    cursor: "pointer", padding: 0, marginTop: "2px" }}>Skip →</button>
                )}
              </div>
            </div>

            {/* Conversation preview */}
            <div style={{ background: t.surfaceHover, borderRadius: "8px", padding: "12px", marginBottom: "16px",
              maxHeight: "220px", overflowY: "auto" }}>
              {evalTicket.messages.filter(m => m.from !== "system").map((msg, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: msg.from === "agent" ? accent : t.textSub }}>
                    {msg.from === "agent" ? "Aria AI" : evalTicket.customer}:
                  </span>
                  <p style={{ fontSize: "12px", color: t.text, marginTop: "2px", lineHeight: "1.5", margin: "2px 0 0" }}>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div style={{ fontSize: "12px", fontWeight: "600", color: t.text, marginBottom: "10px" }}>Rate AI Performance</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              {[["positive","👍","#10B981"],["needs_work","👎","#EF4444"]].map(([val, icon, color]) => (
                <button key={val} onClick={() => setRating(val)} style={{
                  flex: 1, padding: "12px", borderRadius: "10px", cursor: "pointer", fontSize: "20px",
                  background: rating === val ? `${color}20` : t.surfaceHover,
                  border: `2px solid ${rating === val ? color : t.border}`,
                  transition: "all 0.15s",
                }}>{icon}</button>
              ))}
            </div>

            {/* Feedback */}
            <div style={{ fontSize: "12px", fontWeight: "600", color: t.text, marginBottom: "8px" }}>
              Feedback {rating === "needs_work" ? "(required)" : "(optional)"}
            </div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
              placeholder={rating === "needs_work"
                ? "What should the AI have done differently?"
                : "Any notes about this response? (optional)"}
              style={{ width: "100%", background: t.surfaceHover,
                border: `1px solid ${rating === "needs_work" && !feedback.trim() ? "#F59E0B" : t.border}`,
                borderRadius: "8px", color: t.text, fontSize: "12px", padding: "10px 12px",
                fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: "1.5",
                transition: "border-color 0.15s", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = (rating === "needs_work" && !feedback.trim()) ? "#F59E0B" : t.border}
            />

            <button
              onClick={handleSubmit}
              disabled={!rating || submitting || (rating === "needs_work" && !feedback.trim())}
              style={{
                width: "100%", marginTop: "12px", padding: "11px",
                background: justSubmitted ? "#059669" : (!rating || (rating === "needs_work" && !feedback.trim())) ? t.border : accent,
                border: "none", borderRadius: "8px", color: "#fff",
                fontSize: "13px", fontWeight: "600",
                cursor: (!rating || submitting || (rating === "needs_work" && !feedback.trim())) ? "default" : "pointer",
                transition: "all 0.2s",
              }}>
              {justSubmitted ? "✓ Submitted — loading next…"
                : submitting ? "Submitting…"
                : pendingTickets.length > 1 ? "Submit & Next →"
                : "Submit Evaluation"}
            </button>

            {rating === "needs_work" && !feedback.trim() && (
              <p style={{ fontSize: "11px", color: "#F59E0B", marginTop: "6px", textAlign: "center" }}>
                Please add feedback when marking as needs improvement.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: MANAGE → REVIEWS
// ══════════════════════════════════════════════════════════════════════════════
function Reviews({ t, accent }) {
  const [filter, setFilter] = useState("all");

  const { data: rawReviews } = useApi(`/api/reviews?client_id=${CLIENT_ID}`, null);
  const reviews = rawReviews || [];

  const filtered = reviews.filter(r =>
    filter === "all" ? true : filter === "positive" ? r.rating === "positive" : r.rating === "needs_work"
  );

  const positiveCount = reviews.filter(r => r.rating === "positive").length;
  const positivePct   = reviews.length ? Math.round((positiveCount / reviews.length) * 100) : 0;
  const needsWorkItems = reviews.filter(r => r.rating === "needs_work");
  const topIssue = needsWorkItems.length
    ? (needsWorkItems[0].issue_type || "General") + " — " + (needsWorkItems[0].feedback || "").slice(0, 40) + "…"
    : "None flagged yet";

  return (
    <div>
      <SectionHeader title="Reviews" sub="Submitted evaluations and AI improvement feedback from your team." t={t} />

      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Reviews This Week", val: reviews.length, color: accent,    icon: "📋" },
          { label: "Positive Rating",         val: `${positivePct}%`,   color: "#10B981", icon: "👍" },
          { label: "Top Issue Flagged",        val: topIssue,            color: "#F59E0B", icon: "⚠" },
        ].map(s => (
          <Card key={s.label} t={t} style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "10px", color: t.textSub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{s.label}</div>
              <div style={{ fontSize: typeof s.val === "number" ? "24px" : "13px", fontWeight: "700", color: s.color,
                fontFamily: typeof s.val === "number" ? "'DM Mono', monospace" : "inherit" }}>{s.val}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[["all","All Reviews"],["positive","👍 Positive"],["needs_work","👎 Needs Improvement"]].map(([val,label]) => (
          <Pill key={val} active={filter === val} accent={accent} onClick={() => setFilter(val)} t={t}>{label}</Pill>
        ))}
      </div>

      {/* Review cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(review => (
          <Card key={review.id} t={t} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              {/* Rating badge */}
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                background: review.rating === "positive" ? "#10B98120" : "#EF444420",
                border: `1px solid ${review.rating === "positive" ? "#10B98140" : "#EF444440"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                {review.rating === "positive" ? "👍" : "👎"}
              </div>

              <div style={{ flex: 1 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{review.customer}</span>
                  <Tag color={accent}>{review.issue_type || "General"}</Tag>
                  <Tag color="#8B5CF6">{review.sop_used || "Agent"}</Tag>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: t.textMuted, whiteSpace: "nowrap" }}>
                    {review.reviewer} · {review.created_at ? new Date(review.created_at).toLocaleString() : ""}
                  </span>
                </div>

                {/* AI response reviewed */}
                <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: accent, textTransform: "uppercase",
                    letterSpacing: "0.05em", marginBottom: "4px" }}>AI Response Reviewed</div>
                  <p style={{ fontSize: "12px", color: t.text, lineHeight: "1.5" }}>"{review.ai_response}"</p>
                </div>

                {/* Feedback */}
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "12px", color: review.rating === "positive" ? "#10B981" : "#F59E0B",
                    fontWeight: "700", minWidth: "80px" }}>
                    {review.rating === "positive" ? "✓ Good" : "⚠ Improve"}
                  </span>
                  <p style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.5", flex: 1 }}>{review.feedback}</p>
                </div>
              </div>

              {/* Ticket ref */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: "10px", color: t.textMuted }}>Ticket</div>
                <div style={{ fontSize: "12px", color: accent, fontFamily: "'DM Mono', monospace", fontWeight: "600" }}>#{review.ticket_id || review.id}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// SECTION: OVERVIEW (DASHBOARD HOME)
// ══════════════════════════════════════════════════════════════════════════════
function StatCard({ label, value, sub, color, icon, trend, t, accent }) {
  return (
    <Card t={t} style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
          textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px",
          background: `${color}18`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "14px" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "28px", fontWeight: "700", color: t.text,
        letterSpacing: "-0.04em", fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {trend !== undefined && (
          <span style={{ fontSize: "11px", fontWeight: "700",
            color: trend >= 0 ? "#34D399" : "#FB7185" }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
        <span style={{ fontSize: "11px", color: t.textMuted }}>{sub}</span>
      </div>
    </Card>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ height: "4px", borderRadius: "999px", background: "#1E2A3E",
      overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${Math.min(100,(value/max)*100)}%`,
        background: color, borderRadius: "999px", transition: "width 0.8s ease" }} />
    </div>
  );
}

function Overview({ t, accent }) {
  const { data: a7  } = useApi(`/api/analytics?client_id=${CLIENT_ID}&days=7`,  null);
  const { data: a30 } = useApi(`/api/analytics?client_id=${CLIENT_ID}&days=30`, null);
  const { data: intents } = useApi(`/api/analytics/intents?client_id=${CLIENT_ID}&limit=6`, null);
  const { data: insightsRaw } = useApi(`/api/insights?client_id=${CLIENT_ID}&limit=5`, null);

  const s7  = a7?.summary  || {};
  const s30 = a30?.summary || {};

  const total7      = s7.total_messages      || 0;
  const automated7  = s7.automated_responses || 0;
  const escalated7  = s7.escalations         || 0;
  const total30     = s30.total_messages      || 0;
  const automated30 = s30.automated_responses || 0;

  const autoRate7  = total7  > 0 ? ((automated7  / total7)  * 100).toFixed(1) : "0.0";
  const autoRate30 = total30 > 0 ? ((automated30 / total30) * 100).toFixed(1) : "0.0";
  const escRate    = total7  > 0 ? ((escalated7  / total7)  * 100).toFixed(1) : "0.0";
  const hoursSaved = (automated7 * 4.2 / 60).toFixed(1); // avg 4.2 min per ticket
  const costSaved  = (automated7 * 8.50).toFixed(0);     // avg $8.50 per human-handled ticket
  const trendAuto  = total30 > 0 ? +(parseFloat(autoRate7) - parseFloat(autoRate30)).toFixed(1) : null;

  const insights = insightsRaw || [];
  const sevColors = { critical: "#FB7185", high: "#FBBF24", medium: "#4F8EF7", low: "#34D399" };
  const sevOrder  = { critical: 0, high: 1, medium: 2, low: 3 };

  return (
    <div>
      <SectionHeader title="Overview" sub={`Performance snapshot · Last 7 days`} t={t} />

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", marginBottom: "24px" }}>
        <StatCard label="Conversations"    value={total7.toLocaleString()}   sub="last 7 days"         color="#4F8EF7" icon="💬" trend={null}       t={t} accent={accent} />
        <StatCard label="Automation Rate"  value={`${autoRate7}%`}           sub="AI handled"          color="#34D399" icon="⚡" trend={trendAuto}   t={t} accent={accent} />
        <StatCard label="Escalation Rate"  value={`${escRate}%`}             sub="needed human"        color="#FBBF24" icon="⚠" trend={null}        t={t} accent={accent} />
        <StatCard label="Hours Saved"      value={`${hoursSaved}h`}          sub="est. this week"      color="#A78BFA" icon="⏱" trend={null}        t={t} accent={accent} />
        <StatCard label="Cost Saved"       value={`$${parseInt(costSaved).toLocaleString()}`} sub="est. this week" color="#2DD4BF" icon="💰" trend={null} t={t} accent={accent} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        {/* Top intents */}
        <Card t={t} style={{ padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
            letterSpacing: "-0.02em", marginBottom: "16px" }}>Top Issue Types</div>
          {(intents || []).length === 0 ? (
            <div style={{ fontSize: "12px", color: t.textMuted, padding: "20px 0", textAlign: "center" }}>
              No data yet — conversations will appear here.
            </div>
          ) : (intents || []).map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "11px" }}>
              <span style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace",
                width: "16px", textAlign: "right" }}>{i+1}</span>
              <span style={{ fontSize: "12.5px", color: t.textSub, flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.intent}</span>
              <MiniBar value={item.count} max={(intents||[])[0]?.count || 1} color={accent} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: t.text,
                fontFamily: "'DM Mono', monospace", minWidth: "28px", textAlign: "right" }}>{item.count}</span>
            </div>
          ))}
        </Card>

        {/* Volume + rate summary */}
        <Card t={t} style={{ padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
            letterSpacing: "-0.02em", marginBottom: "16px" }}>7-Day vs 30-Day</div>
          {[
            { label: "Total conversations", v7: total7,      v30: total30,      color: "#4F8EF7", fmt: v => v.toLocaleString() },
            { label: "AI handled",          v7: automated7,  v30: automated30,  color: "#34D399", fmt: v => v.toLocaleString() },
            { label: "Automation rate",     v7: parseFloat(autoRate7), v30: parseFloat(autoRate30), color: "#A78BFA", fmt: v => v + "%" },
            { label: "Escalations",         v7: escalated7,  v30: s30.escalations || 0, color: "#FBBF24", fmt: v => v.toLocaleString() },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 0", borderBottom: i < 3 ? `1px solid ${t.borderLight}` : "none" }}>
              <span style={{ fontSize: "12px", color: t.textSub }}>{row.label}</span>
              <div style={{ display: "flex", gap: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: row.color,
                  fontFamily: "'DM Mono', monospace" }}>{row.fmt(row.v7)}</span>
                <span style={{ fontSize: "12px", color: t.textMuted,
                  fontFamily: "'DM Mono', monospace" }}>{row.fmt(row.v30)}</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "8px" }}>
            <span style={{ fontSize: "10px", color: t.textMuted }}>← 7d</span>
            <span style={{ fontSize: "10px", color: t.textMuted }}>30d →</span>
          </div>
        </Card>
      </div>

      {/* AI Insights preview */}
      {insights.length > 0 && (
        <Card t={t} style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text,
              letterSpacing: "-0.02em" }}>AI Insights</span>
            <span style={{ fontSize: "11px", color: t.textMuted }}>{insights.length} active</span>
          </div>
          {insights.sort((a,b) => (sevOrder[a.severity]||99) - (sevOrder[b.severity]||99)).map((ins, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px",
              padding: "13px 18px", borderBottom: i < insights.length-1 ? `1px solid ${t.borderLight}` : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", marginTop: "5px", flexShrink: 0,
                background: sevColors[ins.severity] || t.textMuted }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: t.text,
                  marginBottom: "3px", letterSpacing: "-0.01em" }}>{ins.title}</div>
                <div style={{ fontSize: "11.5px", color: t.textSub, lineHeight: "1.5" }}>{ins.description}</div>
              </div>
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px",
                borderRadius: "999px", flexShrink: 0,
                background: `${sevColors[ins.severity] || t.textMuted}18`,
                color: sevColors[ins.severity] || t.textMuted,
                border: `1px solid ${sevColors[ins.severity] || t.textMuted}30`,
                textTransform: "uppercase" }}>
                {ins.severity || "info"}
              </span>
            </div>
          ))}
        </Card>
      )}

      {!total7 && insights.length === 0 && (
        <Card t={t} style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🚀</div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text,
            marginBottom: "6px", letterSpacing: "-0.02em" }}>Ready to go</div>
          <div style={{ fontSize: "13px", color: t.textSub, lineHeight: "1.6" }}>
            Connect a channel and send your first message.<br/>
            Real-time stats will appear here automatically.
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: AUTOMATION CENTER
// ══════════════════════════════════════════════════════════════════════════════
// DEFAULT_RULES removed — rules are loaded from /api/automation and persisted in Supabase

const OP_LABELS = {
  equals: "=", not_equals: "≠", contains: "contains",
  not_contains: "doesn't contain", less_than: "<", greater_than: ">",
  starts_with: "starts with",
};
const ACTION_COLORS = {
  escalate: "#FB7185", resolve: "#34D399", tag: "#4F8EF7",
  notify: "#FBBF24", assign: "#A78BFA",
};

function AutomationRuleModal({ rule, t, accent, onSave, onClose }) {
  const [name,      setName]      = useState(rule?.name || "");
  const [field,     setField]     = useState(rule?.condition?.field || "intent");
  const [op,        setOp]        = useState(rule?.condition?.op || "contains");
  const [value,     setValue]     = useState(rule?.condition?.value || "");
  const [actionType,setActionType]= useState(rule?.action?.type || "escalate");

  const actionLabels = {
    escalate: "Escalate to Human Agent", resolve: "Mark as Resolved",
    tag: "Add Tag", notify: "Send Notification", assign: "Assign to Team",
  };
  const fields = ["intent","sentiment","confidence","channel","status","customer_email","subject"];
  const ops    = ["contains","not_contains","equals","not_equals","less_than","greater_than","starts_with"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px",
        width: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", color: t.text,
            letterSpacing: "-0.02em" }}>{rule ? "Edit Rule" : "New Automation Rule"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: t.textMuted, cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Rule Name
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Escalate angry customers"
              style={{ width: "100%", background: t.surfaceHover, border: `1px solid ${t.border}`,
                borderRadius: "8px", color: t.text, fontSize: "13px", padding: "9px 12px",
                fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = t.border} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Condition — IF
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={field} onChange={e => setField(e.target.value)}
                style={{ flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text, fontSize: "12px", padding: "8px 10px",
                  fontFamily: "inherit", outline: "none" }}>
                {fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={op} onChange={e => setOp(e.target.value)}
                style={{ flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text, fontSize: "12px", padding: "8px 10px",
                  fontFamily: "inherit", outline: "none" }}>
                {ops.map(o => <option key={o} value={o}>{OP_LABELS[o]}</option>)}
              </select>
              <input value={value} onChange={e => setValue(e.target.value)}
                placeholder="value"
                style={{ flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text, fontSize: "12px", padding: "8px 10px",
                  fontFamily: "inherit", outline: "none" }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Action — THEN
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
              {Object.entries(actionLabels).map(([type, label]) => (
                <button key={type} onClick={() => setActionType(type)} style={{
                  padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                  background: actionType === type ? `${ACTION_COLORS[type]}18` : t.surfaceHover,
                  border: `1.5px solid ${actionType === type ? ACTION_COLORS[type] : t.border}`,
                  color: actionType === type ? ACTION_COLORS[type] : t.textSub,
                  fontSize: "11px", fontWeight: actionType === type ? "600" : "400",
                  textAlign: "left" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
            borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: t.textSub }}>
            <span style={{ color: t.textMuted }}>Preview: </span>
            IF <span style={{ color: accent, fontWeight: "600" }}>{field}</span>{" "}
            <span style={{ color: t.textMuted }}>{OP_LABELS[op] || op}</span>{" "}
            "<span style={{ color: accent, fontWeight: "600" }}>{value}</span>"
            {" "}→ THEN <span style={{ color: ACTION_COLORS[actionType], fontWeight: "600" }}>{actionLabels[actionType]}</span>
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "8px 18px", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave({ name, condition: { field, op, value }, action: { type: actionType, label: actionLabels[actionType] } })}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "13px", fontWeight: "600", padding: "8px 22px", cursor: "pointer" }}>
            {rule ? "Save Changes" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Automation({ t, accent }) {
  const [rules, setRules]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule]   = useState(null);
  const [tab, setTab]             = useState("rules");

  async function loadRules() {
    setLoading(true);
    const data = await apiFetch(`/api/automation?client_id=${CLIENT_ID}`);
    setRules(data || []);
    setLoading(false);
  }
  useEffect(() => { loadRules(); }, []);

  const totalTriggered = rules.reduce((s, r) => s + (r.triggered || 0), 0);
  const activeCount    = rules.filter(r => r.active).length;

  async function handleSave(data) {
    if (editRule) {
      const res  = await fetch(`${API_URL}/api/automation/${editRule.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      if (updated?.id) setRules(r => r.map(x => x.id === updated.id ? updated : x));
    } else {
      const res  = await fetch(`${API_URL}/api/automation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, ...data }),
      });
      const created = await res.json();
      if (created?.id) setRules(r => [...r, created]);
    }
    setShowModal(false); setEditRule(null);
  }

  async function deleteRule(id) {
    setRules(r => r.filter(x => x.id !== id));
    await fetch(`${API_URL}/api/automation/${id}`, { method: "DELETE" });
  }

  async function toggleRule(id, val) {
    setRules(r => r.map(x => x.id === id ? { ...x, active: val } : x));
    await fetch(`${API_URL}/api/automation/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: val }),
    });
  }

  return (
    <div>
      <SectionHeader
        title="Automation Center"
        sub="Define IF/THEN rules that fire automatically during conversations."
        t={t}
        action={
          <button onClick={() => { setEditRule(null); setShowModal(true); }}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "8px 16px", cursor: "pointer" }}>
            + New Rule
          </button>
        }
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Active Rules",      value: activeCount,      color: "#34D399" },
          { label: "Total Rules",       value: rules.length,     color: accent     },
          { label: "Times Triggered",   value: totalTriggered,   color: "#A78BFA"  },
        ].map((s, i) => (
          <Card key={i} t={t} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "6px",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: s.color,
              letterSpacing: "-0.04em", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {["rules", "logs"].map(tb => (
          <Pill key={tb} active={tab === tb} accent={accent} onClick={() => setTab(tb)} t={t}>
            {tb === "rules" ? "Automation Rules" : "Trigger Log"}
          </Pill>
        ))}
      </div>

      {tab === "rules" && (
        <Card t={t} style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 180px 100px 60px 80px",
            padding: "10px 18px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>Rule</span><span>Condition</span><span>Action</span>
            <span>Triggered</span><span>Active</span><span></span>
          </div>
          {loading && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading rules…
            </div>
          )}
          {!loading && rules.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              No automation rules yet. Click "+ New Rule" to create one.
            </div>
          )}
          {rules.map((rule, i) => (
            <div key={rule.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 200px 180px 100px 60px 80px",
                alignItems: "center", padding: "13px 18px",
                borderBottom: i < rules.length-1 ? `1px solid ${t.borderLight}` : "none",
                transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {/* Name */}
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: "600", color: t.text,
                  letterSpacing: "-0.01em", marginBottom: "2px" }}>{rule.name}</div>
                <div style={{ fontSize: "10.5px", color: t.textMuted }}>
                  Triggered: {(rule.triggered || 0).toLocaleString()}
                  {rule.last_triggered ? ` · Last: ${new Date(rule.last_triggered).toLocaleDateString()}` : ""}
                </div>
              </div>
              {/* Condition */}
              <div style={{ fontSize: "11px", color: t.textSub, fontFamily: "'DM Mono', monospace" }}>
                <span style={{ color: accent }}>{rule.condition?.field}</span>{" "}
                <span style={{ color: t.textMuted }}>{OP_LABELS[rule.condition?.op]}</span>{" "}
                "<span style={{ color: t.text }}>{rule.condition?.value}</span>"
              </div>
              {/* Action */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 9px",
                  borderRadius: "999px",
                  background: `${ACTION_COLORS[rule.action?.type] || t.textMuted}18`,
                  color: ACTION_COLORS[rule.action?.type] || t.textMuted,
                  border: `1px solid ${ACTION_COLORS[rule.action?.type] || t.textMuted}30` }}>
                  {rule.action?.label}
                </span>
              </div>
              {/* Triggered count */}
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                fontFamily: "'DM Mono', monospace" }}>{(rule.triggered || 0).toLocaleString()}</div>
              {/* Toggle */}
              <Toggle value={rule.active} onChange={v => toggleRule(rule.id, v)} accent={accent} />
              {/* Edit / Delete */}
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button onClick={() => { setEditRule(rule); setShowModal(true); }}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                    color: t.textSub, fontSize: "11px", padding: "4px 9px", cursor: "pointer" }}>Edit</button>
                <button onClick={() => deleteRule(rule.id)}
                  style={{ background: "none", border: "none", color: "#EF4444",
                    fontSize: "14px", cursor: "pointer", padding: "2px 5px" }}>×</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "logs" && (
        <Card t={t} style={{ padding: "28px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>◎</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "4px" }}>
            Trigger log coming soon
          </div>
          <div style={{ fontSize: "12px", color: t.textSub }}>
            Every rule trigger will be logged here with full context and the conversation that caused it.
          </div>
        </Card>
      )}

      {showModal && (
        <AutomationRuleModal
          rule={editRule} t={t} accent={accent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditRule(null); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: CHANNELS
// ══════════════════════════════════════════════════════════════════════════════
function Channels({ t, accent }) {
  const { data: rawConfig } = useApi(`/api/channels?client_id=${CLIENT_ID}`, null);
  const [config, setConfig] = useState({});

  useEffect(() => { if (rawConfig) setConfig(rawConfig); }, [rawConfig]);

  const CHANNEL_DEFS = [
    { key: "email",       name: "Email",        icon: "✉", desc: "Gmail, Outlook, custom SMTP"       },
    { key: "zendesk",     name: "Zendesk",      icon: "Z", desc: "Sync tickets bidirectionally"       },
    { key: "webhook",     name: "API Webhook",  icon: "⚡",desc: "Any custom source via webhook"      },
    { key: "whatsapp",    name: "WhatsApp",     icon: "W", desc: "WhatsApp Business API via Twilio"   },
    { key: "livechat",    name: "Live Chat",    icon: "💬",desc: "Embedded chat widget for your site" },
    { key: "slack",       name: "Slack",        icon: "S", desc: "Internal escalation & alerts"       },
    { key: "instagram",   name: "Instagram",    icon: "I", desc: "DMs and post comments"              },
    { key: "sms",         name: "SMS / Twilio", icon: "T", desc: "SMS conversations via Twilio"       },
    { key: "messenger",   name: "Facebook Messenger", icon: "M", desc: "Facebook Page DMs"            },
    { key: "twitter",     name: "X / Twitter",  icon: "X", desc: "DMs and @mentions"                 },
    { key: "intercom",    name: "Intercom",     icon: "◎", desc: "Sync Intercom conversations"        },
    { key: "freshdesk",   name: "Freshdesk",    icon: "F", desc: "Sync Freshdesk tickets"             },
  ];

  const accentMap = {
    email: "#4F8EF7", zendesk: "#2DD4BF", webhook: "#FBBF24",
    whatsapp: "#34D399", livechat: accent, slack: "#A78BFA",
    instagram: "#FB7185", sms: "#F97316", messenger: "#60A5FA",
    twitter: "#1DA1F2", intercom: "#6366F1", freshdesk: "#22D3EE",
  };

  async function toggleChannel(key) {
    const newVal = { connected: !config[key]?.connected };
    const updated = { ...config, [key]: newVal };
    setConfig(updated);
    await fetch(`${API_URL}/api/channels`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, [key]: newVal }),
    });
  }

  return (
    <div>
      <SectionHeader title="Channels" sub="Connect the sources where your customers reach you. Aria handles all channels with one brain." t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "12px" }}>
        {CHANNEL_DEFS.map(ch => {
          const connected = !!(config[ch.key]?.connected);
          const color = accentMap[ch.key] || accent;
          return (
            <Card key={ch.name} t={t} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px",
                  background: `${color}18`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "15px", fontWeight: "800", color }}>
                  {ch.icon}
                </div>
                <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 9px", borderRadius: "999px",
                  background: connected ? "#34D39918" : t.surfaceHover,
                  color: connected ? "#34D399" : t.textMuted,
                  border: `1px solid ${connected ? "#34D39940" : t.border}` }}>
                  {connected ? "● Connected" : "Not connected"}
                </span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "4px",
                letterSpacing: "-0.01em" }}>{ch.name}</div>
              <div style={{ fontSize: "11.5px", color: t.textSub, marginBottom: "14px", lineHeight: "1.5" }}>{ch.desc}</div>
              <button onClick={() => toggleChannel(ch.key)} style={{ background: connected ? t.surfaceHover : accent,
                border: connected ? `1px solid ${t.border}` : "none",
                borderRadius: "8px", color: connected ? t.textSub : "#fff",
                fontSize: "12px", fontWeight: "600", padding: "7px 14px", cursor: "pointer", width: "100%" }}>
                {connected ? "Disconnect" : "Connect"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: TEAM
// ══════════════════════════════════════════════════════════════════════════════
function Team({ t, accent }) {
  const { data: rawMembers, loading: membersLoading, refetch: refetchMembers } = useApi(`/api/team?client_id=${CLIENT_ID}`, null);
  const members = rawMembers || [];
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Agent");
  const [inviting, setInviting] = useState(false);

  const roleColors = { Admin: "#4F8EF7", Agent: "#34D399", "AI Agent": accent };

  function getInitials(name) {
    return (name || "?").split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2);
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviting(true);
    await fetch(`${API_URL}/api/team`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole }),
    });
    setInviteName(""); setInviteEmail(""); setInviteRole("Agent");
    setShowInvite(false); setInviting(false);
    refetchMembers();
  }

  async function toggleMemberActive(member) {
    await fetch(`${API_URL}/api/team/${member.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    refetchMembers();
  }

  const [rules, setRules] = useState([
    { label: "Escalate if no SOP matches", on: true },
    { label: "Escalate on sentiment: angry / threatening", on: true },
    { label: "Auto-assign when escalated", on: false },
    { label: "Notify team on Slack for escalations", on: false },
  ]);
  return (
    <div>
      <SectionHeader title="Team" sub="Manage who can access this workspace and configure AI handoff rules." t={t} />
      <Card t={t} style={{ overflow: "hidden", marginBottom: "16px" }}>
        <div style={{ padding: "13px 18px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>Members ({members.length})</span>
          <button onClick={() => setShowInvite(v => !v)} style={{ background: accent, border: "none", borderRadius: "7px", color: "#fff",
            fontSize: "12px", fontWeight: "600", padding: "6px 14px", cursor: "pointer" }}>+ Invite</button>
        </div>

        {showInvite && (
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, background: t.surfaceHover }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name"
                style={{ flex: 1, minWidth: "140px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "7px",
                  color: t.text, fontSize: "12px", padding: "7px 11px", outline: "none" }}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = t.border} />
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email"
                style={{ flex: 1, minWidth: "160px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "7px",
                  color: t.text, fontSize: "12px", padding: "7px 11px", outline: "none" }}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = t.border} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "7px",
                  color: t.text, fontSize: "12px", padding: "7px 11px", outline: "none" }}>
                {["Admin","Agent","Viewer"].map(r => <option key={r}>{r}</option>)}
              </select>
              <button onClick={handleInvite} disabled={inviting}
                style={{ background: accent, border: "none", borderRadius: "7px", color: "#fff",
                  fontSize: "12px", fontWeight: "600", padding: "7px 14px", cursor: "pointer" }}>
                {inviting ? "Saving…" : "Add"}
              </button>
              <button onClick={() => setShowInvite(false)}
                style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "7px",
                  color: t.textSub, fontSize: "12px", padding: "7px 12px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {membersLoading && (
          <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>Loading team…</div>
        )}

        {!membersLoading && members.length === 0 && (
          <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
            No team members yet. Add your first member above.
          </div>
        )}

        {members.map((m, i) => (
          <div key={m.id || i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px",
            borderBottom: i < members.length - 1 ? `1px solid ${t.borderLight}` : "none" }}
            onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: m.is_ai ? `linear-gradient(135deg,${accent},${accent}88)` : t.surfaceHover,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10.5px", fontWeight: "700", color: m.is_ai ? "#fff" : t.textSub,
              border: `2px solid ${m.active ? "#34D39940" : t.border}` }}>
              {getInitials(m.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, letterSpacing: "-0.01em" }}>{m.name}</div>
              <div style={{ fontSize: "11px", color: t.textMuted }}>{m.email}</div>
            </div>
            <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "2px 9px", borderRadius: "999px",
              background: `${roleColors[m.role] || t.textMuted}18`,
              color: roleColors[m.role] || t.textMuted }}>
              {m.role}
            </span>
            <div onClick={() => toggleMemberActive(m)} style={{ width: "7px", height: "7px", borderRadius: "50%",
              cursor: "pointer", background: m.active ? "#34D399" : t.textMuted,
              title: m.active ? "Active — click to deactivate" : "Inactive — click to activate" }} />
          </div>
        ))}
      </Card>

      <Card t={t} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "14px",
          letterSpacing: "-0.01em" }}>AI Handoff Rules</div>
        {rules.map((rule, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", borderBottom: i < rules.length - 1 ? `1px solid ${t.borderLight}` : "none" }}>
            <span style={{ fontSize: "12.5px", color: t.textSub }}>{rule.label}</span>
            <Toggle value={rule.on} onChange={v => setRules(r => r.map((x,j) => j===i ? {...x,on:v} : x))} accent={accent} />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: LIVE CHAT PLACEHOLDER
// ══════════════════════════════════════════════════════════════════════════════
function LiveChat({ t, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "14px" }}>💬</div>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "8px",
          letterSpacing: "-0.02em" }}>Live Chat Monitor</div>
        <div style={{ fontSize: "13px", color: t.textSub, maxWidth: "300px", lineHeight: "1.6", marginBottom: "20px" }}>
          Real-time view of active conversations across all channels. Connect your channels to enable.
        </div>
        <button onClick={() => {}} style={{ background: accent, border: "none", borderRadius: "9px",
          color: "#fff", fontSize: "13px", fontWeight: "600", padding: "10px 22px", cursor: "pointer" }}>
          Connect Channels
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function ChatKing() {
  const [darkMode,       setDarkMode]       = useState(true);
  const [accentIdx,      setAccentIdx]      = useState(0);
  const [fontIdx,        setFontIdx]        = useState(0);
  const [nav,            setNav]            = useState("overview");
  const [showTheme,      setShowTheme]      = useState(false);
  const [sideCollapsed,  setSideCollapsed]  = useState(false);
  const [clients,        setClients]        = useState([]);
  const [activeClient,   setActiveClient]   = useState(null);
  const [showClientMenu, setShowClientMenu] = useState(false);

  const [evaluatedIds, setEvaluatedIds] = useState(new Set());
  const themeRef = useRef(null);

  // Load clients from API
  useEffect(() => {
    apiFetch("/api/settings/clients").then(data => {
      if (data && data.length) {
        setClients(data);
        setActiveClient(data[0]);
      }
    });
  }, []);

  const t      = THEMES[darkMode ? "dark" : "light"];
  const acc    = ACCENT_PRESETS[accentIdx];
  const accent = acc.color;
  const font   = FONT_OPTIONS[fontIdx].name;

  useEffect(() => {
    const h = e => { if (themeRef.current && !themeRef.current.contains(e.target)) setShowTheme(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const navGroups = [
    {
      label: "Platform", items: [
        { id: "overview",           label: "Overview",         icon: "⬡" },
      ]
    },
    {
      label: "Build", items: [
        { id: "agent-overview",     label: "Agent",            icon: "◈" },
        { id: "agent-context",      label: "Business Context", icon: "", indent: true },
        { id: "agent-escalations",  label: "Escalations",      icon: "", indent: true },
        { id: "agent-tone",         label: "Tone & Style",     icon: "", indent: true },
        { id: "agent-capabilities", label: "Capabilities",     icon: "", indent: true },
        { id: "issue-types",  label: "Issue Types",    icon: "◉" },
        { id: "sops",         label: "SOPs",           icon: "⬟" },
        { id: "knowledge",    label: "Knowledge Base", icon: "⬡" },
        { id: "tools",        label: "Tools",          icon: "⚙" },
        { id: "insights",     label: "Insights",       icon: "✦" },
      ]
    },
    {
      label: "Manage", items: [
        { id: "tickets",    label: "Conversations", icon: "◧" },
        { id: "live",       label: "Live Chat",     icon: "◍" },
        { id: "automation", label: "Automation",    icon: "⚡" },
        { id: "evaluations",label: "Evaluations",   icon: "◫" },
        { id: "reviews",    label: "Reviews",       icon: "◩" },
      ]
    },
    {
      label: "Configure", items: [
        { id: "channels",   label: "Channels",      icon: "⬕" },
        { id: "team",       label: "Team",           icon: "◎" },
      ]
    },
  ];

  function getSubTab() {
    if (nav === "agent-context")      return "context";
    if (nav === "agent-escalations")  return "escalations";
    if (nav === "agent-tone")         return "tone";
    if (nav === "agent-capabilities") return "capabilities";
    return null;
  }
  const isAgentTab = nav.startsWith("agent");

  function renderContent() {
    const subTab = getSubTab();
    if (nav === "overview")    return <Overview       t={t} accent={accent} />;
    if (isAgentTab)            return <AgentOverview  t={t} accent={accent} defaultSub={subTab} />;
    if (nav === "issue-types") return <IssueTypes     t={t} accent={accent} />;
    if (nav === "sops")        return <SOPs           t={t} accent={accent} />;
    if (nav === "knowledge")   return <KnowledgeBase  t={t} accent={accent} />;
    if (nav === "tools")       return <Tools          t={t} accent={accent} />;
    if (nav === "insights")    return <Insights       t={t} accent={accent} />;
    if (nav === "tickets")     return <Tickets        t={t} accent={accent} />;
    if (nav === "live")        return <LiveChat       t={t} accent={accent} />;
    if (nav === "automation")  return <Automation     t={t} accent={accent} />;
    if (nav === "evaluations") return <Evaluations    t={t} accent={accent} evaluatedIds={evaluatedIds} setEvaluatedIds={setEvaluatedIds} />;
    if (nav === "reviews")     return <Reviews        t={t} accent={accent} />;
    if (nav === "channels")    return <Channels       t={t} accent={accent} />;
    if (nav === "team")        return <Team           t={t} accent={accent} />;
    return null;
  }

  const navGroup = ["tickets","live","automation","evaluations","reviews"].includes(nav) ? "Manage"
    : ["channels","team"].includes(nav) ? "Configure"
    : nav === "overview" ? "Platform" : "Build";
  const navLabel = {
    "overview":"Overview","agent-overview":"Agent","issue-types":"Issue Types","sops":"SOPs",
    "knowledge":"Knowledge Base","tools":"Tools","insights":"Insights","tickets":"Conversations",
    "live":"Live Chat","automation":"Automation","evaluations":"Evaluations","reviews":"Reviews",
    "channels":"Channels","team":"Team",
  }[nav] || "Overview";

  const fontImport = FONT_OPTIONS.map(f => `family=${f.import}`).join("&");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden",
      background: t.bgSolid, fontFamily: `'${font}', sans-serif`, color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?${fontImport}&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .page-enter { animation: fadeSlide 0.2s ease; }
        button { font-family: inherit; }
        input, textarea, select { font-family: inherit; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sideCollapsed ? "52px" : "214px", flexShrink: 0,
        background: t.sidebar, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "15px 13px 12px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
            background: `linear-gradient(135deg, ${accent} 0%, ${acc.dark} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "800", color: "#fff",
            boxShadow: `0 2px 10px ${accent}50` }}>K</div>
          {!sideCollapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>ChatKing</div>
              <div style={{ fontSize: "9px", color: accent, letterSpacing: "0.09em",
                textTransform: "uppercase", fontWeight: "600" }}>AI Support</div>
            </div>
          )}
        </div>

        {/* Client selector */}
        {!sideCollapsed && (
          <div style={{ padding: "7px 9px", borderBottom: `1px solid ${t.border}`, flexShrink: 0, position: "relative" }}>
            <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
              padding: "6px 10px", display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}
              onClick={() => clients.length > 1 && setShowClientMenu(v => !v)}
              onMouseEnter={e => e.currentTarget.style.background = t.surfaceActive}
              onMouseLeave={e => e.currentTarget.style.background = t.surfaceHover}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399", flexShrink: 0 }} />
              <span style={{ fontSize: "11.5px", color: t.text, flex: 1, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeClient?.name || "Loading…"}
              </span>
              {clients.length > 1 && <span style={{ fontSize: "9px", color: t.textMuted }}>▾</span>}
            </div>
            {showClientMenu && clients.length > 1 && (
              <div style={{ position: "absolute", left: "9px", right: "9px", top: "100%", zIndex: 100,
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                {clients.map(c => (
                  <div key={c.id} onClick={() => { setActiveClient(c); setShowClientMenu(false); }}
                    style={{ padding: "8px 12px", fontSize: "12px", color: t.text, cursor: "pointer",
                      background: activeClient?.id === c.id ? `${accent}14` : "transparent",
                      borderBottom: `1px solid ${t.borderLight}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                    onMouseLeave={e => e.currentTarget.style.background = activeClient?.id === c.id ? `${accent}14` : "transparent"}>
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "7px 5px", overflowY: "auto" }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: "2px" }}>
              {!sideCollapsed && (
                <div style={{ fontSize: "9.5px", fontWeight: "700", color: t.textMuted,
                  letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 10px 3px" }}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => (
                <NavItem key={item.id} {...item} t={t} accent={accent}
                  active={isAgentTab && item.id === "agent-overview"
                    ? nav.startsWith("agent") : nav === item.id}
                  onClick={() => setNav(item.id)}
                  label={sideCollapsed ? "" : item.label} />
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${t.border}`, padding: "7px 5px", flexShrink: 0 }}>
          <div ref={themeRef} style={{ position: "relative" }}>
            <button onClick={() => setShowTheme(v => !v)} style={{
              display: "flex", alignItems: "center", gap: "9px",
              padding: "7px 12px", borderRadius: "7px", border: "none", cursor: "pointer",
              background: showTheme ? `${accent}14` : "transparent",
              color: showTheme ? accent : t.textSub,
              fontSize: "12.5px", width: "100%", textAlign: "left", transition: "all 0.12s",
            }}
            onMouseEnter={e => { if (!showTheme) { e.currentTarget.style.background = t.sidebarHover; e.currentTarget.style.color = t.text; }}}
            onMouseLeave={e => { if (!showTheme) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textSub; }}}>
              <span style={{ fontSize: "13px", width: "16px", textAlign: "center", opacity: 0.7 }}>⬡</span>
              {!sideCollapsed && <span>Appearance</span>}
            </button>
            {showTheme && (
              <div style={{ position: "fixed", left: sideCollapsed ? "60px" : "222px", bottom: "54px",
                zIndex: 200, background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: "14px", width: "268px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`,
                  fontSize: "12px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
                  Customize
                </div>
                <ThemePanel darkMode={darkMode} setDarkMode={setDarkMode}
                  accentIdx={accentIdx} setAccentIdx={setAccentIdx}
                  fontIdx={fontIdx} setFontIdx={setFontIdx} t={t} accent={accent} />
              </div>
            )}
          </div>

          <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "9px", marginTop: "2px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${accent}, ${acc.dark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: "700", color: "#fff" }}>
              {(activeClient?.name || "?").charAt(0).toUpperCase()}
            </div>
            {!sideCollapsed && (
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: "11.5px", color: t.text, fontWeight: "600",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  letterSpacing: "-0.02em" }}>{activeClient?.name || "My Workspace"}</div>
                <div style={{ fontSize: "10px", color: t.textMuted }}>{activeClient?.plan || "Admin"}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: "50px", flexShrink: 0, borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 22px", background: t.sidebar }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setSideCollapsed(v => !v)}
              style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer",
                fontSize: "15px", padding: "4px 6px", borderRadius: "6px", lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = t.textMuted; }}>
              ☰
            </button>
            <div style={{ width: "1px", height: "14px", background: t.border, margin: "0 2px" }} />
            <span style={{ fontSize: "11px", color: t.textMuted }}>{navGroup}</span>
            <span style={{ color: t.border }}>›</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: t.text, letterSpacing: "-0.02em" }}>{navLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px",
              background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "999px", padding: "4px 11px", fontSize: "11px", color: t.textSub }}>
              <span style={{ color: "#34D399", fontSize: "7px" }}>●</span> All systems operational
            </div>
            <button style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", width: "32px", height: "32px", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: "14px", color: t.textSub, position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.background = t.surfaceActive; e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.color = t.textSub; }}>
              🔔
              <span style={{ position: "absolute", top: "6px", right: "6px", width: "6px", height: "6px",
                borderRadius: "50%", background: "#FB7185", border: `1.5px solid ${t.sidebar}` }} />
            </button>
            <button style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "7px", padding: "5px 11px", fontSize: "11.5px", color: t.textSub,
              cursor: "pointer", fontWeight: "500" }}
              onMouseEnter={e => e.currentTarget.style.color = t.text}
              onMouseLeave={e => e.currentTarget.style.color = t.textSub}>
              Docs ↗
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div className="page-enter" key={nav} style={{
            padding: nav === "tickets" ? "0" : "28px 30px",
            maxWidth: nav === "tickets" ? "none" : "1100px",
            width: "100%", minHeight: "100%",
            overflow: nav === "tickets" ? "hidden" : "visible",
          }}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
