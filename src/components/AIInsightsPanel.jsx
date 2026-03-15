import { useState } from "react";
import { getActiveClientId } from "../lib/api";
import { runBackgroundJobFlow } from "../lib/backgroundJobs";
import { useApi } from "../lib/useApi";
import { Card, JobStatusNotice, Pill } from "./ui";

export function AIInsightsPanel({ t, accent }) {
  const clientId = getActiveClientId();
  const { data: raw, loading, refetch } = useApi(`/api/insights?client_id=${clientId}&limit=20`, null);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState("all");
  const [jobNotice, setJobNotice] = useState(null);

  const insights = raw || [];
  const sevColors = { critical: "#FB7185", high: "#FBBF24", medium: "#4F8EF7", low: "#34D399" };
  const typeColors = { knowledge_gap: "#A78BFA", rising_issue: "#FB7185", automation_opportunity: "#34D399" };
  const typeLabels = { knowledge_gap: "Knowledge Gap", rising_issue: "Rising Issue", automation_opportunity: "Automation Opp." };

  const filters = ["all", "critical", "high", "knowledge_gap", "rising_issue", "automation_opportunity"];
  const filtered = insights.filter((insight) => {
    if (filter === "all") return true;
    return insight.severity === filter || insight.insight_type === filter;
  });

  async function generateInsights() {
    setGenerating(true);
    try {
      await runBackgroundJobFlow({
        title: "AI insight analysis",
        path: "/api/insights/generate",
        body: { client_id: clientId },
        setNotice: setJobNotice,
      });
      await refetch();
    } catch (error) {
      console.error(error);
      setJobNotice({ title: "AI insight analysis", status: "failed", detail: error.message });
    }
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

      <JobStatusNotice job={jobNotice} t={t} accent={accent} />

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {filters.map((item) => (
          <Pill key={item} active={filter === item} accent={accent} onClick={() => setFilter(item)} t={t}>
            {item === "all" ? "All" : item === "knowledge_gap" ? "Knowledge Gaps" : item === "rising_issue" ? "Rising Issues" : item === "automation_opportunity" ? "Automation" : item.charAt(0).toUpperCase() + item.slice(1)}
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
          {filtered.map((insight, index) => (
            <div key={insight.id || index} style={{ display: "flex", alignItems: "flex-start", gap: "14px",
              padding: "14px 18px", borderBottom: index < filtered.length - 1 ? `1px solid ${t.borderLight}` : "none",
              transition: "background 0.1s" }}
              onMouseEnter={(event) => event.currentTarget.style.background = t.surfaceHover}
              onMouseLeave={(event) => event.currentTarget.style.background = "transparent"}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "4px", flexShrink: 0,
                background: sevColors[insight.severity] || t.textMuted }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: t.text,
                    letterSpacing: "-0.01em" }}>{insight.title}</span>
                  <span style={{ fontSize: "10px", fontWeight: "700", padding: "1px 7px",
                    borderRadius: "999px",
                    background: `${typeColors[insight.insight_type] || t.textMuted}18`,
                    color: typeColors[insight.insight_type] || t.textMuted,
                    border: `1px solid ${typeColors[insight.insight_type] || t.textMuted}30` }}>
                    {typeLabels[insight.insight_type] || insight.insight_type}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.55" }}>{insight.description}</div>
                {insight.created_at && (
                  <div style={{ fontSize: "10.5px", color: t.textMuted, marginTop: "5px" }}>
                    {new Date(insight.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px",
                borderRadius: "999px", flexShrink: 0,
                background: `${sevColors[insight.severity] || t.textMuted}18`,
                color: sevColors[insight.severity] || t.textMuted,
                border: `1px solid ${sevColors[insight.severity] || t.textMuted}30`,
                textTransform: "uppercase" }}>
                {insight.severity || "info"}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
