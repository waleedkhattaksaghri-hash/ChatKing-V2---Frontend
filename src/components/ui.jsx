import { useState } from "react";

export function Toggle({ value, onChange, accent }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: "40px",
        height: "22px",
        borderRadius: "999px",
        cursor: "pointer",
        background: value ? accent : "#273449",
        position: "relative",
        transition: "background 0.18s ease, box-shadow 0.18s ease",
        flexShrink: 0,
        boxShadow: value ? `0 0 0 1px ${accent}55, 0 10px 24px ${accent}30` : "inset 0 0 0 1px rgba(148,163,184,0.18)",
        border: "none",
        padding: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.18s ease",
          boxShadow: "0 4px 10px rgba(15,23,42,0.22)",
        }}
      />
    </button>
  );
}

export function Tag({ children, color = "#34D399", bg }) {
  return (
    <span
      style={{
        background: bg || `${color}14`,
        color,
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "700",
        padding: "3px 9px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        border: `1px solid ${color}30`,
      }}
    >
      {children}
    </span>
  );
}

export function JobStatusNotice({ job, t, accent }) {
  if (!job) return null;

  const tone = job.status === "failed" ? "#FB7185" : job.status === "completed" ? "#34D399" : accent;

  return (
    <div
      style={{
        marginBottom: "18px",
        padding: "14px 16px",
        borderRadius: "14px",
        border: `1px solid ${tone}35`,
        background: `linear-gradient(180deg, ${tone}14 0%, ${tone}08 100%)`,
        boxShadow: `0 14px 32px ${tone}0f`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: tone, marginBottom: "4px" }}>
            {job.title || "Background job"}
          </div>
          <div style={{ fontSize: "12px", color: t.textSub }}>
            {job.detail || "Running in the background."}
          </div>
        </div>
        <Tag color={tone}>{job.status || "pending"}</Tag>
      </div>
      {job.jobId && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: t.textMuted }}>
          Job ID: {job.jobId}
        </div>
      )}
    </div>
  );
}

export function Pill({ children, active, accent = "#4F8EF7", onClick, t, color }) {
  const [hov, setHov] = useState(false);
  const passiveColor = color || accent;
  const interactive = typeof onClick === "function" || typeof active !== "undefined" || !!t;

  if (!interactive) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: "999px",
          border: `1px solid ${passiveColor}26`,
          background: `${passiveColor}14`,
          color: passiveColor,
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "6px 14px",
        borderRadius: "999px",
        border: active ? `1.5px solid ${accent}` : `1.5px solid ${t.border}`,
        background: active ? `${accent}16` : hov ? t.surfaceHover : "transparent",
        color: active ? accent : hov ? t.text : t.textSub,
        fontSize: "12px",
        fontWeight: active ? "700" : "500",
        cursor: "pointer",
        transition: "all 0.16s ease",
        whiteSpace: "nowrap",
        letterSpacing: "-0.01em",
        boxShadow: active ? `0 10px 24px ${accent}18` : "none",
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, t, style = {}, glow, accent }) {
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${t.surface} 0%, ${t.surfaceHover} 100%)`,
        border: `1px solid ${t.border}`,
        borderRadius: "20px",
        boxShadow: glow
          ? `0 0 0 1px ${accent}20, 0 22px 60px ${accent}18`
          : "0 18px 46px rgba(2, 6, 23, 0.16)",
        backdropFilter: "blur(18px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ title, sub, t, action }) {
  return (
    <div style={{ marginBottom: "26px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: t.text, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
          {title}
        </h2>
        {sub && <p style={{ fontSize: "13px", color: t.textSub, marginTop: "8px", lineHeight: "1.6", maxWidth: "760px" }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
