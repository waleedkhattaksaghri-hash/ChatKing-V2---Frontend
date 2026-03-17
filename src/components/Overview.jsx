import { getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, SectionHeader } from "./ui";
import { SetupChecklistCard } from "./SetupGuidance";
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

export function Overview({ t, accent, activeClient, onNavigate }) {
  const clientId = getActiveClientId();
  const { data: a7  } = useApi(`/api/analytics?client_id=${clientId}&days=7`,  null);
  const { data: a30 } = useApi(`/api/analytics?client_id=${clientId}&days=30`, null);
  const { data: intents } = useApi(`/api/analytics/intents?client_id=${clientId}&limit=6`, null);
  const { data: insightsRaw } = useApi(`/api/insights?client_id=${clientId}&limit=5`, null);

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
      <SetupChecklistCard t={t} accent={accent} activeClient={activeClient} onNavigate={onNavigate} />

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


