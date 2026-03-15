import { useState, useEffect, useRef } from "react";
import { apiFetch, apiJson, getActiveClientId, getAdminSessionStatus, getConfigWarning, loginAdminSession, logoutAdminSession, requestAdminLoginCode, setActiveClientId, verifyAdminLoginCode } from "./lib/api";
import { runBackgroundJobFlow } from "./lib/backgroundJobs";
import { AIInsightsPanel } from "./components/AIInsightsPanel";
import { KnowledgeBase } from "./components/KnowledgeBase";
import { ClientMemory } from "./components/ClientMemory";
import { Tools } from "./components/Tools";
import { AITestPanel } from "./components/AITestPanel";
import { Insights } from "./components/Insights";
import { IssueTypes } from "./components/IssueTypes";
import { Overview } from "./components/Overview";
import { SOPs } from "./components/SOPs";
import { Automation } from "./components/Automation";
import { Tickets } from "./components/Tickets";
import { Evaluations } from "./components/Evaluations";
import { Reviews } from "./components/Reviews";
import { Channels } from "./components/Channels";
import { Team } from "./components/Team";
import { Companies } from "./components/Companies";
import { AdminStats } from "./components/AdminStats";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { RichTextEditor } from "./components/RichTextEditor";
import { Card, JobStatusNotice, Pill, SectionHeader, Tag, Toggle } from "./components/ui";
import { useApi } from "./lib/useApi";
import { richTextToPlainText } from "./lib/richText";
import "./App.css";

// ── API Config ────────────────────────────────────────────────────────────────

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

const APPEARANCE_STORAGE_KEY = "chatking:appearance";

function readAppearanceSettings() {
  if (typeof window === "undefined") {
    return { darkMode: true, accentIdx: 0, fontIdx: 0, sideCollapsed: false };
  }

  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return { darkMode: true, accentIdx: 0, fontIdx: 0, sideCollapsed: false };
    const parsed = JSON.parse(raw);
    return {
      darkMode: parsed.darkMode !== false,
      accentIdx: Number.isInteger(parsed.accentIdx) ? parsed.accentIdx : 0,
      fontIdx: Number.isInteger(parsed.fontIdx) ? parsed.fontIdx : 0,
      sideCollapsed: !!parsed.sideCollapsed,
    };
  } catch {
    return { darkMode: true, accentIdx: 0, fontIdx: 0, sideCollapsed: false };
  }
}

function writeAppearanceSettings(settings) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures; the UI still works with in-memory state.
  }
}

function useUndoState(initialValue) {
  const [value, setValueState] = useState(initialValue);
  const [history, setHistory] = useState([]);

  function setValue(nextValue) {
    setHistory((current) => [...current, value]);
    setValueState(nextValue);
  }

  function undo() {
    setHistory((current) => {
      if (current.length === 0) return current;
      const previousValue = current[current.length - 1];
      setValueState(previousValue);
      return current.slice(0, -1);
    });
  }

  return [value, setValue, undo, history.length > 0];
}
// ── Helpers ───────────────────────────────────────────────────────────────────

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
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: indent ? "7px 14px 7px 42px" : "9px 12px",
        borderRadius: "14px",
        border: "none",
        cursor: "pointer",
        background: active ? `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)` : hov ? t.sidebarHover : "transparent",
        color: active ? t.text : hov ? t.text : t.textSub,
        fontSize: indent ? "12px" : "12.5px",
        fontWeight: active ? "700" : indent ? "500" : "600",
        width: "100%",
        textAlign: "left",
        position: "relative",
        transition: "all 0.16s ease",
        letterSpacing: "-0.02em",
        boxShadow: active && !indent ? `inset 0 0 0 1px ${accent}26, 0 16px 30px ${accent}14` : "none",
      }}
    >
      {active && !indent && (
        <span
          style={{
            position: "absolute",
            left: "-2px",
            top: "18%",
            height: "64%",
            width: "4px",
            borderRadius: "0 999px 999px 0",
            background: accent,
          }}
        />
      )}
      {!indent && icon && (
        <span
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "9px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: active ? `${accent}18` : hov ? t.surfaceHover : t.input,
            color: active ? accent : hov ? t.text : t.textSub,
            border: `1px solid ${active ? `${accent}28` : t.border}`,
            fontSize: "10px",
            fontWeight: "800",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      )}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {badge && (
        <span
          style={{
            background: "#EF4444",
            color: "#fff",
            borderRadius: "999px",
            fontSize: "9.5px",
            padding: "2px 6px",
            fontWeight: "700",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function ThemePanel({ darkMode, setDarkMode, accentIdx, setAccentIdx, fontIdx, setFontIdx, sideCollapsed, setSideCollapsed, t, accent }) {
  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Mode</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px", borderRadius: "14px", background: t.surfaceHover, border: `1px solid ${t.border}` }}>
            <div>
              <div style={{ fontSize: "13px", color: t.text, fontWeight: "700" }}>{darkMode ? "Night mode" : "Day mode"}</div>
              <div style={{ fontSize: "11.5px", color: t.textSub, marginTop: "4px" }}>Theme stays fixed until someone changes it.</div>
            </div>
            <Toggle value={darkMode} onChange={setDarkMode} accent={accent} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Accent</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            {ACCENT_PRESETS.map((preset, idx) => {
              const active = accentIdx === idx;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setAccentIdx(idx)}
                  style={{
                    borderRadius: "14px",
                    border: `1px solid ${active ? preset.color : t.border}`,
                    background: active ? `${preset.color}16` : t.surfaceHover,
                    padding: "10px",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: active ? `0 14px 30px ${preset.glow}` : "none",
                  }}
                >
                  <div style={{ width: "100%", height: "20px", borderRadius: "999px", background: `linear-gradient(90deg, ${preset.color}, ${preset.dark})`, marginBottom: "8px" }} />
                  <div style={{ fontSize: "11.5px", color: active ? t.text : t.textSub, fontWeight: "700" }}>{preset.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Font</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {FONT_OPTIONS.map((option, idx) => {
              const active = fontIdx === idx;
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => setFontIdx(idx)}
                  style={{
                    borderRadius: "12px",
                    border: `1px solid ${active ? accent : t.border}`,
                    background: active ? `${accent}14` : t.surfaceHover,
                    color: active ? t.text : t.textSub,
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: active ? "700" : "500",
                    cursor: "pointer",
                  }}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px", borderRadius: "14px", background: t.surfaceHover, border: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontSize: "13px", color: t.text, fontWeight: "700" }}>Compact navigation</div>
            <div style={{ fontSize: "11.5px", color: t.textSub, marginTop: "4px" }}>Reduce the sidebar footprint when needed.</div>
          </div>
          <Toggle value={sideCollapsed} onChange={setSideCollapsed} accent={accent} />
        </div>
      </div>
    </div>
  );
}

function AgentOverview({ t, accent, defaultSub, activeClient }) {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [editorSection, setEditorSection] = useState(defaultSub || "");
  const [editorSnapshot, setEditorSnapshot] = useState(null);
  const [botName, setBotName, undoBotName, canUndoBotName] = useUndoState("Aria");
  const [greeting, setGreeting, undoGreeting, canUndoGreeting] = useUndoState("Hi! I'm Aria, your support assistant. How can I help you today?");
  const [fallback, setFallback, undoFallback, canUndoFallback] = useUndoState("I'm sorry, I didn't quite catch that. Let me connect you with a human agent.");
  const [confidenceThreshold, setConfidenceThreshold, undoConfidenceThreshold, canUndoConfidenceThreshold] = useUndoState("0.72");

  const [contextText,     setContextText,     undoContext,     canUndoContext    ] = useUndoState(
  `We are a Shopify-based ecommerce store helping customers with orders, shipping, returns, billing, promotions, and product questions.
  The agent should only rely on verified store policy, linked SOPs, and published Knowledge Base content.
  Do not invent shipping guarantees, refund promises, stock availability, or promotional exceptions.
  If customer details or order details are missing, ask a focused clarifying question before taking a position.`);

  const [escalationsText, setEscalationsText, undoEscalations, canUndoEscalations] = useUndoState(
  `Any mention of legal action, lawsuit, attorney, regulator, or chargeback
  Threats of violence, harassment, or abusive language
  Requests involving fraud, identity issues, or account compromise
  Refund or compensation requests beyond approved policy thresholds
  Cases where order/account data cannot be verified
  Any situation where published policy does not clearly support the requested outcome`);

  const [toneChat,    setToneChat,    undoToneChat,    canUndoToneChat   ] = useUndoState("Friendly, confident, and concise. Lead with empathy, then give the clearest next step. Keep most replies to 2 short paragraphs or a short bullet list. Ask one focused clarifying question when needed instead of making assumptions.");
    const [toneEmail,   setToneEmail,   undoToneEmail,   canUndoToneEmail  ] = useUndoState("Professional, warm, and structured. Start with a clear greeting, explain the answer in 2 to 4 short paragraphs, and end with a helpful next step. Use policy-backed wording and avoid overly robotic phrasing.");
    const [toneWA,      setToneWA,      undoToneWA,      canUndoToneWA     ] = useUndoState("Conversational and brief. Keep replies under 100 words when possible, stay clear and helpful, and use emojis rarely.");

  const [allowedText, setAllowedText, undoAllowed,     canUndoAllowed    ] = useUndoState(
  `Answer order status questions using verified tracking or fulfillment status
  Explain return, refund, shipping, and promotion policies from approved SOPs and Knowledge Base articles
  Ask clarifying questions when order details or product details are missing
  Guide customers on allowed next steps for cancellations, replacements, or billing questions
  Escalate to a human when policy, verification, or risk rules require it`);

  const [blockedText, setBlockedText, undoBlocked,     canUndoBlocked    ] = useUndoState(
  `Promise refunds, credits, replacements, or exceptions not supported by policy
  Invent tracking updates, delivery guarantees, stock availability, or processing times
  Override billing, payment, or account records directly
  Approve high-risk compensation or legal resolutions
  Pretend to have completed an operational action that requires a human or external system`);

  const [snapshot, setSnapshot] = useState(null);
  const identityRef = useRef(null);
  const contextRef = useRef(null);
  const escalationsRef = useRef(null);
  const toneRef = useRef(null);
  const capabilitiesRef = useRef(null);
  const activeClientId = activeClient?.id || getActiveClientId();

  function applySettingsSnapshot(s) {
    const nextSnapshot = {
      botName: s.bot_name ?? botName,
      greeting: s.greeting ?? greeting,
      fallback: s.fallback ?? fallback,
      confidenceThreshold: String(s.confidence_threshold ?? confidenceThreshold),
      contextText: s.context_text ?? contextText,
      escalationsText: s.escalations_text ?? escalationsText,
      toneChat: s.tone_chat ?? toneChat,
      toneEmail: s.tone_email ?? toneEmail,
      toneWA: s.tone_whatsapp ?? toneWA,
      allowedText: s.capabilities_allowed ?? allowedText,
      blockedText: s.capabilities_blocked ?? blockedText,
    };

    setBotName(nextSnapshot.botName);
    setGreeting(nextSnapshot.greeting);
    setFallback(nextSnapshot.fallback);
    setConfidenceThreshold(nextSnapshot.confidenceThreshold);
    setContextText(nextSnapshot.contextText);
    setEscalationsText(nextSnapshot.escalationsText);
    setToneChat(nextSnapshot.toneChat);
    setToneEmail(nextSnapshot.toneEmail);
    setToneWA(nextSnapshot.toneWA);
    setAllowedText(nextSnapshot.allowedText);
    setBlockedText(nextSnapshot.blockedText);
    setSnapshot(nextSnapshot);
    setSaved(false);
  }

  useEffect(() => {
    if (!activeClientId) return;

    apiFetch(`/api/settings?client_id=${activeClientId}`).then((s) => {
      if (!s) return;
      applySettingsSnapshot(s);
    });
  }, [activeClientId]);

  useEffect(() => {
    if (defaultSub) {
      openEditor(defaultSub);
    }
  }, [defaultSub]);

  function buildSavePayload(section = "all") {
    const payload = { client_id: activeClientId };

    if (section === "all" || section === "identity") {
      payload.bot_name = botName;
      payload.greeting = greeting;
      payload.fallback = fallback;
      payload.confidence_threshold = Number(confidenceThreshold || 0.72);
    }
    if (section === "all" || section === "context") {
      payload.context_text = contextText;
    }
    if (section === "all" || section === "escalations") {
      payload.escalations_text = escalationsText;
    }
    if (section === "all" || section === "tone") {
      payload.tone_chat = toneChat;
      payload.tone_email = toneEmail;
      payload.tone_whatsapp = toneWA;
    }
    if (section === "all" || section === "capabilities") {
      payload.capabilities_allowed = allowedText;
      payload.capabilities_blocked = blockedText;
    }

    return payload;
  }

  function getSectionSnapshot(sectionId) {
    if (sectionId === "identity") {
      return { botName, greeting, fallback, confidenceThreshold };
    }
    if (sectionId === "context") {
      return { contextText };
    }
    if (sectionId === "escalations") {
      return { escalationsText };
    }
    if (sectionId === "tone") {
      return { toneChat, toneEmail, toneWA };
    }
    if (sectionId === "capabilities") {
      return { allowedText, blockedText };
    }
    return {};
  }

  function restoreSectionSnapshot(sectionId, snapshot) {
    if (!snapshot) return;
    if (sectionId === "identity") {
      if (snapshot.botName !== undefined) setBotName(snapshot.botName);
      if (snapshot.greeting !== undefined) setGreeting(snapshot.greeting);
      if (snapshot.fallback !== undefined) setFallback(snapshot.fallback);
      if (snapshot.confidenceThreshold !== undefined) setConfidenceThreshold(snapshot.confidenceThreshold);
    }
    if (sectionId === "context" && snapshot.contextText !== undefined) {
      setContextText(snapshot.contextText);
    }
    if (sectionId === "escalations" && snapshot.escalationsText !== undefined) {
      setEscalationsText(snapshot.escalationsText);
    }
    if (sectionId === "tone") {
      if (snapshot.toneChat !== undefined) setToneChat(snapshot.toneChat);
      if (snapshot.toneEmail !== undefined) setToneEmail(snapshot.toneEmail);
      if (snapshot.toneWA !== undefined) setToneWA(snapshot.toneWA);
    }
    if (sectionId === "capabilities") {
      if (snapshot.allowedText !== undefined) setAllowedText(snapshot.allowedText);
      if (snapshot.blockedText !== undefined) setBlockedText(snapshot.blockedText);
    }
  }

  function openEditor(sectionId) {
    setEditorSnapshot(getSectionSnapshot(sectionId));
    setEditorSection(sectionId);
  }

  function closeEditor() {
    if (editorSection) {
      restoreSectionSnapshot(editorSection, editorSnapshot);
    }
    setEditorSection("");
    setEditorSnapshot(null);
  }

  async function saveEditor() {
    await saveSection(editorSection || "all");
    setEditorSection("");
    setEditorSnapshot(null);
  }

  async function saveSection(section = "all") {
    if (!activeClientId) {
      setSaveError("No active workspace selected.");
      return;
    }

    setSaveError("");
    setSavingKey(section);

    try {
      const savedSettings = await apiJson("/api/settings", {
        method: "PUT",
        body: buildSavePayload(section),
      });
      if (savedSettings) {
        applySettingsSnapshot(savedSettings);
      }
      setSaved(section === "all");
      setSavedKey(section);
      setTimeout(() => {
        setSaved(false);
        setSavedKey((current) => (current === section ? "" : current));
      }, 2000);
    } catch (error) {
      setSaveError(error.message || "Failed to save playbook changes.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleSave() {
    await saveSection("all");
  }

  function handleDiscard() {
    if (!snapshot) return;
    setBotName(snapshot.botName);
    setGreeting(snapshot.greeting);
    setFallback(snapshot.fallback);
    setConfidenceThreshold(snapshot.confidenceThreshold);
    setContextText(snapshot.contextText);
    setEscalationsText(snapshot.escalationsText);
    setToneChat(snapshot.toneChat);
    setToneEmail(snapshot.toneEmail);
    setToneWA(snapshot.toneWA);
    setAllowedText(snapshot.allowedText);
    setBlockedText(snapshot.blockedText);
  }

  const taStyle = {
    background: t.surfaceHover,
    border: `1px solid ${t.border}`,
    borderRadius: "12px",
    color: t.text,
    fontSize: "14px",
    lineHeight: "1.75",
    padding: "16px",
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const guideStyle = {
    fontSize: "12.5px",
    color: t.textSub,
    lineHeight: "1.7",
  };

  function UndoBtn({ onUndo, canUndo }) {
    return (
      <button onClick={onUndo} disabled={!canUndo} style={{
        background: "none",
        border: "none",
        cursor: canUndo ? "pointer" : "default",
        color: canUndo ? accent : t.textMuted,
        fontSize: "12px",
        fontFamily: "inherit",
        padding: "0",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        opacity: canUndo ? 1 : 0.4,
        transition: "opacity 0.15s",
      }}>Undo</button>
    );
  }

  function FieldHeader({ title, onUndo, canUndo, saveSectionId = "" }) {
    const isSaving = savingKey === saveSectionId;
    const isSaved = savedKey === saveSectionId;

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "12px" }}>
        <span style={{ fontSize: "18px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em" }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <UndoBtn onUndo={onUndo} canUndo={canUndo} />
          {saveSectionId ? (
            <button
              type="button"
              onClick={() => saveSection(saveSectionId)}
              disabled={!!savingKey}
              style={{
                background: isSaved ? "#059669" : accent,
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "700",
                padding: "8px 14px",
                cursor: savingKey ? "default" : "pointer",
                opacity: savingKey && !isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  function previewText(value, fallbackValue = "No instructions added yet.") {
      const normalized = richTextToPlainText(value || "").replace(/\s+/g, " ").trim();
      if (!normalized) return fallbackValue;
      return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
    }

  function renderEditorContent() {
    if (editorSection === "identity") {
      return (
        <div ref={identityRef} style={{ scrollMarginTop: "96px" }}>
          <FieldHeader title="Core Settings" onUndo={() => { undoBotName(); undoGreeting(); undoFallback(); undoConfidenceThreshold(); }} canUndo={canUndoBotName || canUndoGreeting || canUndoFallback || canUndoConfidenceThreshold} saveSectionId="identity" />
          <p style={{ ...guideStyle, marginBottom: "16px" }}>These values influence the agent opening, fallback behavior, and how conservative it should be before escalating or asking a clarifying question.</p>
          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "1fr 160px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textSub, marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Bot Name</label>
              <input value={botName} onChange={e => setBotName(e.target.value)} style={{ ...taStyle, resize: "none", padding: "14px 16px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textSub, marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Confidence Threshold</label>
              <input value={confidenceThreshold} onChange={e => setConfidenceThreshold(e.target.value)} type="number" min="0" max="1" step="0.01" style={{ ...taStyle, resize: "none", padding: "14px 16px" }} />
            </div>
          </div>
          <div style={{ display: "grid", gap: "18px", marginTop: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textSub, marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Greeting</label>
                <RichTextEditor
                  value={greeting}
                  onChange={setGreeting}
                  accent={accent}
                  minHeight={180}
                  placeholder="Example: Hi there, thanks for reaching out. I’m Aria and I’ll help with this today."
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textSub, marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Fallback</label>
                <RichTextEditor
                  value={fallback}
                  onChange={setFallback}
                  accent={accent}
                  minHeight={180}
                  placeholder="Example: I’m sorry, I don’t have enough verified information to answer that confidently. Let me connect you with a human agent."
                />
              </div>
            </div>
          </div>
        );
      }

    if (editorSection === "context") {
      return (
        <div ref={contextRef} style={{ scrollMarginTop: "96px" }}>
          <FieldHeader title="Business Context" onUndo={undoContext} canUndo={canUndoContext} saveSectionId="context" />
          <p style={{ ...guideStyle, marginBottom: "14px" }}>Describe what the business is, what it does not do, its policy boundaries, customer promises, and important operating constraints. This becomes the agent's standing behavior layer before retrieval starts.</p>
            <RichTextEditor
              value={contextText}
              onChange={setContextText}
              accent={accent}
              minHeight={320}
              placeholder="Examples: services offered, exclusions, refund timing, contractor model, reassignment rules, policy boundaries..."
            />
          </div>
        );
      }

    if (editorSection === "escalations") {
      return (
        <div ref={escalationsRef} style={{ scrollMarginTop: "96px" }}>
          <FieldHeader title="Escalations" onUndo={undoEscalations} canUndo={canUndoEscalations} saveSectionId="escalations" />
          <p style={{ ...guideStyle, marginBottom: "14px" }}>List the situations where the agent must hand off to a human. This protects quality and keeps the model from wasting turns on risky or sensitive conversations.</p>
            <RichTextEditor
              value={escalationsText}
              onChange={setEscalationsText}
              accent={accent}
              minHeight={320}
              placeholder="Examples: legal threats, abuse, press inquiries, fraud claims, child safety, large refunds..."
            />
          </div>
        );
      }

    if (editorSection === "tone") {
      return (
        <div ref={toneRef} style={{ scrollMarginTop: "96px" }}>
          <FieldHeader title="Tone & Style" onUndo={() => { undoToneChat(); undoToneEmail(); undoToneWA(); }} canUndo={canUndoToneChat || canUndoToneEmail || canUndoToneWA} saveSectionId="tone" />
          <p style={{ ...guideStyle, marginBottom: "16px" }}>Keep this section about delivery style only: tone, brevity, structure, and formatting. Put policy facts in Business Context, SOPs, or Knowledge Base instead.</p>
          <div style={{ display: "grid", gap: "18px" }}>
            {[{ label: "Chat", value: toneChat, set: setToneChat, undo: undoToneChat, canUndo: canUndoToneChat, placeholder: "Short replies, helpful tone, bullets, empathy, next steps..." }, { label: "Email", value: toneEmail, set: setToneEmail, undo: undoToneEmail, canUndo: canUndoToneEmail, placeholder: "Greeting style, paragraph structure, professionalism, closing..." }, { label: "WhatsApp", value: toneWA, set: setToneWA, undo: undoToneWA, canUndo: canUndoToneWA, placeholder: "Conversational, brief, emoji rules, message length..." }].map(({ label, value, set, undo, canUndo, placeholder }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: accent, background: `${accent}18`, padding: "3px 12px", borderRadius: "999px" }}>{label}</span>
                  <UndoBtn onUndo={undo} canUndo={canUndo} />
                </div>
                  <RichTextEditor
                    value={value}
                    onChange={set}
                    accent={accent}
                    minHeight={220}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
        </div>
      );
    }

    if (editorSection === "capabilities") {
      return (
        <div ref={capabilitiesRef} style={{ scrollMarginTop: "96px" }}>
          <FieldHeader title="Capabilities" onUndo={() => { undoAllowed(); undoBlocked(); }} canUndo={canUndoAllowed || canUndoBlocked} saveSectionId="capabilities" />
          <p style={{ ...guideStyle, marginBottom: "16px" }}>Define what the agent may and may not do. This gives the backend a clean action envelope and reduces hallucinations, unsafe promises, and avoidable human follow-up.</p>
          <div style={{ display: "grid", gap: "18px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#10B981", letterSpacing: "0.06em", textTransform: "uppercase" }}>Allowed</span>
                <UndoBtn onUndo={undoAllowed} canUndo={canUndoAllowed} />
              </div>
                <RichTextEditor
                  value={allowedText}
                  onChange={setAllowedText}
                  accent="#10B981"
                  minHeight={260}
                  placeholder="Examples: lookup status, send approved updates, apply small refunds, collect missing information..."
                />
              </div>
              <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#EF4444", letterSpacing: "0.06em", textTransform: "uppercase" }}>Not Allowed</span>
                <UndoBtn onUndo={undoBlocked} canUndo={canUndoBlocked} />
              </div>
                <RichTextEditor
                  value={blockedText}
                  onChange={setBlockedText}
                  accent="#EF4444"
                  minHeight={260}
                  placeholder="Examples: invent policies, approve large compensation, override billing, promise guarantees..."
                />
              </div>
            </div>
          </div>
      );
    }

    return null;
  }

  function SectionBar({ id, title, description, preview }) {
    return (
      <Card t={t} style={{ padding: "18px 20px", cursor: "pointer" }} onClick={() => openEditor(id)}>
        <div style={{ display: "flex", alignItems: "stretch", gap: "16px" }}>
          <div style={{ width: "6px", borderRadius: "999px", background: `${accent}88`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>{title}</div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openEditor(id);
                }}
                style={{
                  background: `${accent}14`,
                  border: `1px solid ${t.border}`,
                  borderRadius: "999px",
                  color: accent,
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "7px 12px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Open
              </button>
            </div>
            <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.6", marginBottom: "10px" }}>{description}</div>
            <div style={{ fontSize: "13px", color: t.text, lineHeight: "1.7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {previewText(preview)}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <SectionHeader title="Agent Overview" sub="Write the playbook like one clear internal document. ChatKing still saves each section separately so the backend can keep responses grounded, deterministic, and cheaper to run." t={t} />

      <div style={{ marginBottom: "14px", fontSize: "12px", color: t.textSub }}>
        Saving to: <span style={{ color: t.text, fontWeight: "700" }}>{activeClient?.name || "Current Workspace"}</span>
        {activeClientId ? <span style={{ marginLeft: "8px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>{activeClientId}</span> : null}
      </div>

      {saveError ? (
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "#FB718514", border: "1px solid #FB718540", color: "#FB7185", fontSize: "12px", marginBottom: "18px" }}>
          {saveError}
        </div>
      ) : null}

      <Card t={t} style={{ padding: "18px 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "18px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Response Pipeline</div>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                "Business Context and Capabilities shape behavior first.",
                "SOP is the first factual source and overrides other sources when relevant.",
                "Knowledge Base is the next factual source for verified answers.",
                "Issue Types classify, route, clarify, and escalate.",
                "If evidence is weak, the agent clarifies or escalates instead of guessing.",
              ].map((rule) => (
                <div key={rule} style={guideStyle}>{rule}</div>
              ))}
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: "16px", background: t.surfaceHover, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>How To Set This Up</div>
            <div style={guideStyle}>Keep these sections short, operational, and non-repetitive. That lowers token usage and lets the backend rely on SOP and Knowledge Base evidence before spending extra AI calls.</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gap: "14px" }}>
        <SectionBar id="identity" title="Core Settings" description="Bot identity, greeting, fallback behavior, and confidence threshold." preview={`${botName}. Greeting: ${greeting} Fallback: ${fallback}`} />
        <SectionBar id="context" title="Business Context" description="The standing business rules, policies, and operating constraints the agent should follow first." preview={contextText} />
        <SectionBar id="escalations" title="Escalations" description="The situations where the AI must stop and hand the ticket to a human." preview={escalationsText} />
        <SectionBar id="tone" title="Tone & Style" description="Channel-specific response style for chat, email, and WhatsApp." preview={`Chat: ${toneChat} Email: ${toneEmail} WhatsApp: ${toneWA}`} />
        <SectionBar id="capabilities" title="Capabilities" description="What the agent is allowed to do, and what it must never do on its own." preview={`Allowed: ${allowedText} Blocked: ${blockedText}`} />
      </div>

      {editorSection && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3, 7, 18, 0.55)", zIndex: 180, display: "flex", justifyContent: "flex-end" }}>
          <div style={{
            width: "min(860px, 100%)",
            height: "100%",
            background: t.surface,
            borderLeft: `1px solid ${t.border}`,
            boxShadow: "-12px 0 44px rgba(2, 6, 23, 0.28)",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em" }}>
                  {editorSection === "identity" ? "Core Settings" :
                    editorSection === "context" ? "Business Context" :
                    editorSection === "escalations" ? "Escalations" :
                    editorSection === "tone" ? "Tone & Style" :
                    editorSection === "capabilities" ? "Capabilities" : "Edit Section"}
                </div>
                <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>
                  Edit the full section here. Saving still uses the existing linked settings payload.
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "24px", lineHeight: 1, padding: "4px 6px" }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {renderEditorContent()}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "18px 24px", borderTop: `1px solid ${t.border}` }}>
              <button
                type="button"
                onClick={closeEditor}
                style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 20px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditor}
                style={{
                  background: saved ? "#059669" : accent,
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "9px 24px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {saved ? "Saved" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
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
            {form.status === "active" ? "Active" : "Draft"}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
          cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px 8px" }}>X</button>
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
                    fontSize: "13px", padding: "0 0 0 4px", lineHeight: 1, flexShrink: 0 }}>X</button>
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
                onMouseLeave={e => e.currentTarget.style.color = "#FB718580"}>X</button>
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

export default function ChatKing() {
  const appearanceDefaults = readAppearanceSettings();
  const [darkMode,       setDarkMode]       = useState(appearanceDefaults.darkMode);
  const [accentIdx,      setAccentIdx]      = useState(appearanceDefaults.accentIdx);
  const [fontIdx,        setFontIdx]        = useState(appearanceDefaults.fontIdx);
  const [nav,            setNav]            = useState("overview");
  const [showTheme,      setShowTheme]      = useState(false);
  const [sideCollapsed,  setSideCollapsed]  = useState(appearanceDefaults.sideCollapsed);
  const [clients,        setClients]        = useState([]);
  const [activeClient,   setActiveClient]   = useState(null);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authSession, setAuthSession] = useState(null);

  const [evaluatedIds, setEvaluatedIds] = useState(new Set());
  const themeRef = useRef(null);
  const configWarning = import.meta.env.DEV ? getConfigWarning() : "";

  async function loadSession() {
    const session = await getAdminSessionStatus();
    setAuthenticated(!!session?.authenticated);
    setAuthSession(session?.authenticated ? session : null);
    setAuthChecked(true);
    return session;
  }

  async function loadClients() {
    const data = await apiFetch("/api/settings/clients");
    if (data && data.length) {
      setClients(data);
      const preferredId = getActiveClientId();
      const preferredClient = data.find((client) => client.id === preferredId) || data[0];
      setActiveClientId(preferredClient.id);
      setActiveClient(preferredClient);
      return;
    }

    setClients([]);
    setActiveClient(null);
  }

  async function handleRequestLoginCode(email) {
    return requestAdminLoginCode(email);
  }

  async function handleVerifyLoginCode(email, code) {
    const session = await verifyAdminLoginCode(email, code);
    setAuthenticated(!!session?.authenticated);
    setAuthSession(session?.authenticated ? session : null);
    if (session?.authenticated) {
      await loadClients();
    }
    return session;
  }

  async function handleLegacyTokenLogin(token) {
    const session = await loginAdminSession(token);
    setAuthenticated(!!session?.authenticated);
    setAuthSession(session?.authenticated ? session : null);
    if (session?.authenticated) {
      await loadClients();
    }
    return session;
  }

  async function handleLogout() {
    await logoutAdminSession();
    setAuthenticated(false);
    setAuthSession(null);
    setClients([]);
    setActiveClient(null);
  }

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!authChecked || !authenticated) return;
    loadClients();
  }, [authChecked, authenticated]);

  useEffect(() => {
    function handleUnauthorized() {
      setAuthenticated(false);
      setAuthSession(null);
      setClients([]);
      setActiveClient(null);
      setAuthChecked(true);
    }

    window.addEventListener("chatking:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("chatking:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    writeAppearanceSettings({ darkMode, accentIdx, fontIdx, sideCollapsed });
  }, [darkMode, accentIdx, fontIdx, sideCollapsed]);

  const t      = THEMES[darkMode ? "dark" : "light"];
  const acc    = ACCENT_PRESETS[accentIdx];
  const accent = acc.color;
  const font   = FONT_OPTIONS[fontIdx].name;

  useEffect(() => {
    const h = e => { if (themeRef.current && !themeRef.current.contains(e.target)) setShowTheme(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const background = darkMode
      ? `radial-gradient(circle at top left, ${acc.glow} 0%, transparent 28%), radial-gradient(circle at top right, rgba(255,255,255,0.04) 0%, transparent 20%), linear-gradient(180deg, ${t.bgSolid} 0%, ${t.bg} 100%)`
      : `radial-gradient(circle at top left, ${acc.glow} 0%, transparent 24%), radial-gradient(circle at top right, rgba(79,142,247,0.08) 0%, transparent 18%), linear-gradient(180deg, ${t.bgSolid} 0%, ${t.bg} 100%)`;

    root.style.background = t.bgSolid;
    root.style.color = t.text;
    root.dataset.theme = darkMode ? "dark" : "light";
    body.style.background = background;
    body.style.color = t.text;

    return () => {
      root.removeAttribute("data-theme");
    };
  }, [acc.glow, darkMode, t.bg, t.bgSolid, t.text]);

  if (!authChecked || !authenticated) {
    return (
      <AdminLoginScreen
        t={t}
        accent={accent}
        status={{ checking: !authChecked }}
        onRequestCode={handleRequestLoginCode}
        onVerifyCode={handleVerifyLoginCode}
        onLegacyLogin={handleLegacyTokenLogin}
      />
    );
  }

  const navGroups = [
    {
      label: "Platform", items: [
        { id: "overview", label: "Overview", icon: "OV" },
      ]
    },
    {
      label: "Build", items: [
        { id: "agent-overview", label: "Agent Playbook", icon: "AG" },
        { id: "issue-types", label: "Issue Types",    icon: "IT" },
        { id: "sops",        label: "SOPs",           icon: "SO" },
        { id: "knowledge",   label: "Knowledge Base", icon: "KB" },
        { id: "client-memory", label: "Client Memory", icon: "MB" },
        { id: "ai-test",     label: "AI Test",        icon: "TS" },
        { id: "tools",       label: "Tools",          icon: "TL" },
        { id: "admin-stats", label: "Admin Stats",    icon: "ST" },
        { id: "insights",    label: "Insights",       icon: "IN" },
      ]
    },
    {
      label: "Manage", items: [
        { id: "tickets",     label: "Conversations", icon: "CV" },
        { id: "automation",  label: "Automation",    icon: "AU" },
        { id: "evaluations", label: "Evaluations",   icon: "EV" },
        { id: "reviews",     label: "Reviews",       icon: "RV" },
      ]
    },
    {
      label: "Configure", items: [
        { id: "companies", label: "Companies", icon: "CO" },
        { id: "channels",  label: "Channels",  icon: "CH" },
        { id: "team",      label: "Team",      icon: "TM" },
      ]
    },
  ];

  function getSubTab() {
    return null;
  }
  const isAgentTab = nav === "agent-overview";

  function renderContent() {
    const subTab = getSubTab();
    if (nav === "overview")    return <Overview t={t} accent={accent} />;
    if (isAgentTab)             return <AgentOverview t={t} accent={accent} defaultSub={subTab} activeClient={activeClient} />;
    if (nav === "issue-types") return <IssueTypes t={t} accent={accent} />;
    if (nav === "sops")        return <SOPs t={t} accent={accent} />;
    if (nav === "knowledge")   return <KnowledgeBase t={t} accent={accent} />;
    if (nav === "client-memory") return <ClientMemory t={t} accent={accent} />;
    if (nav === "ai-test")     return <AITestPanel t={t} accent={accent} />;
    if (nav === "tools")       return <Tools t={t} accent={accent} />;
    if (nav === "admin-stats") return <AdminStats t={t} accent={accent} />;
    if (nav === "insights")    return <Insights t={t} accent={accent} />;
    if (nav === "tickets")     return <Tickets t={t} accent={accent} />;
    if (nav === "automation")  return <Automation t={t} accent={accent} />;
    if (nav === "evaluations") return <Evaluations t={t} accent={accent} evaluatedIds={evaluatedIds} setEvaluatedIds={setEvaluatedIds} />;
    if (nav === "reviews")     return <Reviews t={t} accent={accent} />;
    if (nav === "companies")   return <Companies t={t} accent={accent} activeClient={activeClient} onActivateClient={handleActivateClient} onClientsChanged={loadClients} />;
    if (nav === "channels")    return <Channels t={t} accent={accent} />;
    if (nav === "team")        return <Team t={t} accent={accent} />;
    return null;
  }

  function handleActivateClient(client) {
    if (!client?.id) return;
    setActiveClientId(client.id);
    setActiveClient(client);
    setShowClientMenu(false);
  }

  const navGroup = ["tickets", "automation", "evaluations", "reviews"].includes(nav) ? "Manage"
    : ["companies", "channels", "team"].includes(nav) ? "Configure"
    : nav === "overview" ? "Platform" : "Build";
  const navLabel = {
    "overview": "Overview",
    "agent-overview": "Agent Playbook",
    "issue-types": "Issue Types",
    "sops": "SOPs",
    "knowledge": "Knowledge Base",
    "client-memory": "Client Memory",
    "ai-test": "AI Test",
    "tools": "Tools",
    "admin-stats": "Admin Stats",
    "insights": "Insights",
    "tickets": "Conversations",
    "automation": "Automation",
    "evaluations": "Evaluations",
    "reviews": "Reviews",
    "companies": "Companies",
    "channels": "Channels",
    "team": "Team",
  }[nav] || "Overview";

  const fontImport = FONT_OPTIONS.map(f => `family=${f.import}`).join("&");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      overflow: "hidden",
      background: `radial-gradient(circle at top left, ${acc.glow} 0%, transparent 28%), radial-gradient(circle at top right, rgba(255,255,255,0.04) 0%, transparent 20%), linear-gradient(180deg, ${t.bgSolid} 0%, ${t.bg} 100%)`,
      fontFamily: `'${font}', sans-serif`,
      color: t.text,
      position: "relative",
    }}>
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
      {configWarning && (
        <div style={{
          position: "fixed",
          top: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          background: "#7F1D1D",
          color: "#FEE2E2",
          border: "1px solid #EF4444",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
        }}>
          {configWarning} Update `.env` from `.env.example`.
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent 30%)" }} />

      {/* Sidebar */}
      <aside style={{
        width: sideCollapsed ? "76px" : "248px", flexShrink: 0,
        background: `${t.sidebar}ee`, backdropFilter: "blur(20px)", borderRight: `1px solid ${t.border}`,
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
                {activeClient?.name || "Loading..."}
              </span>
              {clients.length > 1 && <span style={{ fontSize: "9px", color: t.textMuted }}>v</span>}
            </div>
            {showClientMenu && clients.length > 1 && (
              <div style={{ position: "absolute", left: "9px", right: "9px", top: "100%", zIndex: 100,
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                {clients.map(c => (
                  <div key={c.id} onClick={() => handleActivateClient(c)}
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
              padding: "9px 12px", borderRadius: "14px", border: "none", cursor: "pointer",
              background: showTheme ? `${accent}14` : "transparent",
              color: showTheme ? accent : t.textSub,
              fontSize: "12.5px", width: "100%", textAlign: "left", transition: "all 0.12s",
            }}
            onMouseEnter={e => { if (!showTheme) { e.currentTarget.style.background = t.sidebarHover; e.currentTarget.style.color = t.text; }}}
            onMouseLeave={e => { if (!showTheme) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textSub; }}}>
              <span style={{ fontSize: "10px", width: "22px", height: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: `${accent}16`, color: accent, fontWeight: "800", letterSpacing: "0.04em" }}>AP</span>
              {!sideCollapsed && <span>Appearance</span>}
            </button>
            {showTheme && (
              <div style={{ position: "absolute", left: sideCollapsed ? "0" : "0", bottom: "calc(100% + 12px)",
                zIndex: 200, background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: "14px", width: sideCollapsed ? "252px" : "268px",
                boxShadow: "0 18px 44px rgba(2, 6, 23, 0.32)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`,
                  fontSize: "12px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
                  Customize
                </div>
                <ThemePanel darkMode={darkMode} setDarkMode={setDarkMode}
                  accentIdx={accentIdx} setAccentIdx={setAccentIdx}
                  fontIdx={fontIdx} setFontIdx={setFontIdx}
                  sideCollapsed={sideCollapsed} setSideCollapsed={setSideCollapsed}
                  t={t} accent={accent} />
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
        <header style={{ height: "64px", flexShrink: 0, borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", background: `${t.sidebar}dd`, backdropFilter: "blur(16px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setSideCollapsed(v => !v)}
              style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer",
                fontSize: "15px", padding: "4px 6px", borderRadius: "6px", lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = t.textMuted; }}>
              |||
            </button>
            <div style={{ width: "1px", height: "14px", background: t.border, margin: "0 2px" }} />
            <span style={{ fontSize: "11px", color: t.textMuted }}>{navGroup}</span>
            <span style={{ color: t.border }}>/</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: t.text, letterSpacing: "-0.02em" }}>{navLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px",
              background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "999px", padding: "4px 11px", fontSize: "11px", color: t.textSub }}>
              <span style={{ color: "#34D399", fontSize: "7px" }}>OK</span> All systems operational
            </div>
            <button style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", width: "32px", height: "32px", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: "14px", color: t.textSub, position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.background = t.surfaceActive; e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.color = t.textSub; }}>
              !
              <span style={{ position: "absolute", top: "6px", right: "6px", width: "6px", height: "6px",
                borderRadius: "50%", background: "#FB7185", border: `1.5px solid ${t.sidebar}` }} />
            </button>
            <button style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "7px", padding: "5px 11px", fontSize: "11.5px", color: t.textSub,
              cursor: "pointer", fontWeight: "500" }}
              onMouseEnter={e => e.currentTarget.style.color = t.text}
              onMouseLeave={e => e.currentTarget.style.color = t.textSub}>
              Docs
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div className="page-enter" key={`${nav}:${activeClient?.id || getActiveClientId()}`} style={{
            padding: nav === "tickets" ? "0" : "34px 36px",
            maxWidth: nav === "tickets" ? "none" : "1520px",
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































