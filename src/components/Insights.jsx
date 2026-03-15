import { useEffect, useState } from "react";
import { apiFetch, apiJson, getActiveClientId } from "../lib/api";
import { runBackgroundJobFlow } from "../lib/backgroundJobs";
import { useApi } from "../lib/useApi";
import { Card, JobStatusNotice, Pill, SectionHeader } from "./ui";
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
function TakeActionModal({ opp, t, accent, onClose, onDone }) {
  const clientId = getActiveClientId();
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
    const data = await apiJson("/api/knowledge/suggestions", {
      method: "POST",
      body: { client_id: clientId },
    });
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
    await apiJson("/api/knowledge", {
      method: "POST",
      body: { client_id: clientId, title: kbTitle, content: kbContent, status: "draft" },
    });
    setSaving(false);
    setSavedMsg("KB article saved as draft in Knowledge Base.");
    setTimeout(() => { onDone(); onClose(); }, 1400);
  }

  async function saveSOP() {
    if (!sopName) return;
    setSaving(true);
    await apiJson("/api/sops", {
      method: "POST",
      body: {
        client_id: clientId,
        title: sopName,
        instructions: sopInstr,
        trigger_conditions: { rules: sopIssues.split(",").map((s) => s.trim()).filter(Boolean) },
        status: "draft",
      },
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
export function Insights({ t, accent }) {
  const clientId = getActiveClientId();
  const [oppFilter,      setOppFilter]      = useState("All");
  const [completedIdxs,  setCompletedIdxs]  = useState(new Set());
  const [actionOpp,      setActionOpp]      = useState(null);
  const [aiInsights,     setAiInsights]     = useState([]);
  const [insGenerating,  setInsGenerating]  = useState(false);
  const [escReasons,     setEscReasons]     = useState([]);
  const [lastRefresh,    setLastRefresh]    = useState(null);
  const [refreshTick,    setRefreshTick]    = useState(0);
  const [jobNotice,      setJobNotice]      = useState(null);
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
  const { data: aPrimary, loading } = useApi(`/api/analytics?client_id=${clientId}&${periodQs}`, null, [clientId, refreshTick, periodQs]);
  const { data: a30 }               = useApi(`/api/analytics?client_id=${clientId}&days=30`, null, [clientId, refreshTick]);
  const { data: rawIntents }        = useApi(`/api/analytics/intents?client_id=${clientId}&limit=20&${periodQs}`, null, [clientId, refreshTick, periodQs]);
  const { data: rawKB }             = useApi(`/api/knowledge?client_id=${clientId}`, null, [clientId]);

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
    apiFetch(`/api/insights?client_id=${clientId}`).then(d => setAiInsights(d || []));
    apiFetch(`/api/insights/escalation-reasons?client_id=${clientId}&${periodQs}`).then(d => setEscReasons(d || []));
  }, [clientId, refreshTick, periodQs]);

  async function generateInsights() {
    setInsGenerating(true);
    try {
      await runBackgroundJobFlow({
        title: "AI insights refresh",
        path: "/api/insights/generate",
        body: { client_id: clientId },
        setNotice: setJobNotice,
      });
      setRefreshTick((tick) => tick + 1);
      setLastRefresh(new Date());
    } catch (error) {
      console.error(error);
      setJobNotice({
        title: "AI insights refresh",
        status: "failed",
        detail: error.message,
      });
    }
    setInsGenerating(false);
  }

  async function resolveInsight(id) {
    setAiInsights(prev => prev.filter(i => i.id !== id));
    await apiJson(`/api/insights/${id}/resolve?client_id=${clientId}`, {
      method: "PATCH",
      body: { client_id: clientId },
    });
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

      <JobStatusNotice job={jobNotice} t={t} accent={accent} />

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

