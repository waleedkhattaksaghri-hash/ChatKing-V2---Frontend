import { useMemo } from "react";
import { getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader, Tag } from "./ui";

function metricValue(value) {
  if (value === null || value === undefined) return "0";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
  }
  return String(value);
}

function StatCard({ title, value, sub, color, t }) {
  return (
    <Card t={t} style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: "11px", color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </div>
      <div style={{ fontSize: "28px", fontWeight: "700", color: color || t.text, fontFamily: "'DM Mono', monospace", marginBottom: "6px" }}>
        {metricValue(value)}
      </div>
      <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: 1.5 }}>
        {sub}
      </div>
    </Card>
  );
}

function KeyValueList({ title, items, t, accent, empty = "No data yet." }) {
  return (
    <Card t={t} style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, fontSize: "13px", fontWeight: "700", color: t.text }}>
        {title}
      </div>
      {!items.length ? (
        <div style={{ padding: "20px 16px", fontSize: "12px", color: t.textMuted }}>{empty}</div>
      ) : (
        items.map(([label, value], index) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "12px 16px",
              borderBottom: index < items.length - 1 ? `1px solid ${t.borderLight}` : "none",
            }}
          >
            <div style={{ fontSize: "12px", color: t.textSub }}>{label}</div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: accent, fontFamily: "'DM Mono', monospace" }}>
              {metricValue(value)}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

export function AdminStats({ t, accent }) {
  const clientId = getActiveClientId();
  const { data, loading, error, refetch } = useApi(
    clientId ? `/api/jobs/stats/summary?client_id=${clientId}` : null,
    null,
    [clientId]
  );

  const metrics = data?.metrics || {};
  const requestMetrics = metrics.requests || {};
  const aiMetrics = metrics.ai || {};
  const jobMetrics = metrics.jobs || {};
  const queue = data?.jobs || {};

  const requestRouteRows = useMemo(() => {
    return Object.entries(requestMetrics.byRoute || {})
      .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0))
      .slice(0, 8)
      .map(([route, stat]) => [
        route,
        `${metricValue(stat.count)} req · ${metricValue(stat.avgDurationMs)} ms avg`,
      ]);
  }, [requestMetrics]);

  return (
    <div>
      <SectionHeader
        title="Admin Stats"
        sub="Operational health for the current workspace. Use this to verify AI usage, queue health, request volume, and failure signals before you scale further."
        t={t}
        action={(
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              border: `1px solid ${t.border}`,
              background: t.surfaceHover,
              color: t.text,
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        )}
      />

      <Card t={t} style={{ padding: "16px 18px", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "12px", color: t.textSub }}>Workspace</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, marginTop: "4px" }}>{clientId || "No active client"}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Pill t={t} accent={accent} active>{loading ? "Loading" : "Live Metrics"}</Pill>
            <Tag color={error ? "#FB7185" : "#34D399"}>{error ? "Degraded" : "Healthy"}</Tag>
          </div>
        </div>
        {error && (
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#FB7185" }}>
            Failed to load stats. Verify the backend is running and the current workspace has access to `/api/jobs/stats/summary`.
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "18px" }}>
        <StatCard title="Requests" value={requestMetrics.total || 0} sub="Total requests seen since the current backend process started." color={accent} t={t} />
        <StatCard title="AI Responses" value={aiMetrics.total || 0} sub="Customer replies processed through the response pipeline." color="#10B981" t={t} />
        <StatCard title="Queue Backlog" value={(queue.pending || 0) + (queue.retry || 0) + (queue.processing || 0)} sub="Pending, retry, and processing jobs for this workspace." color="#F59E0B" t={t} />
        <StatCard title="Failures" value={(requestMetrics.byStatusClass?.["5xx"] || 0) + (jobMetrics.failed || 0)} sub="Server errors plus failed background jobs." color="#FB7185" t={t} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        <KeyValueList title="AI Generation Mode" items={Object.entries(aiMetrics.byGenerationMode || {})} t={t} accent={accent} empty="No AI replies recorded yet." />
        <KeyValueList title="Queue Counts" items={Object.entries({
          pending: queue.pending || 0,
          retry: queue.retry || 0,
          processing: queue.processing || 0,
          failed: queue.failed || 0,
          completed: queue.completed || 0,
        })} t={t} accent="#F59E0B" />
        <KeyValueList title="Request Status Classes" items={Object.entries(requestMetrics.byStatusClass || {})} t={t} accent="#FB7185" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        <Card t={t} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Worker Health</div>
            <Tag color={jobMetrics.failed > 0 ? "#F59E0B" : "#34D399"}>{jobMetrics.failed > 0 ? "Needs review" : "Stable"}</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <StatCard title="Avg Job Lag" value={jobMetrics.avgLagMs || 0} sub="Time from enqueue to worker pickup." color={accent} t={t} />
            <StatCard title="Avg Job Duration" value={jobMetrics.avgDurationMs || 0} sub="Average worker execution time." color={accent} t={t} />
          </div>
        </Card>
        <Card t={t} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Channel Mix</div>
            <Tag color={accent}>AI Traffic</Tag>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.entries(aiMetrics.byChannel || {}).length ? Object.entries(aiMetrics.byChannel || {}).map(([channel, count]) => (
              <Pill key={channel} t={t} accent={accent} active={false}>
                {channel}: {metricValue(count)}
              </Pill>
            )) : (
              <div style={{ fontSize: "12px", color: t.textMuted }}>No channel traffic recorded yet.</div>
            )}
          </div>
        </Card>
      </div>

      <KeyValueList title="Busiest Routes" items={requestRouteRows} t={t} accent={accent} empty="No request traffic recorded yet." />
    </div>
  );
}
