import { useState } from "react";
import { getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader, Tag } from "./ui";
// ══════════════════════════════════════════════════════════════════════════════
export function Reviews({ t, accent }) {
  const [filter, setFilter] = useState("all");
  const clientId = getActiveClientId();
  const { data: rawReviews } = useApi(`/api/reviews?client_id=${clientId}`, null);
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
