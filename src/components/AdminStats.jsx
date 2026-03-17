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

function ReadinessPanel({ title, readiness, t, accent, emptyText }) {
  const blockers = readiness?.blockers || [];
  const warnings = readiness?.warnings || [];
  const status = readiness?.status || "unknown";
  const statusColor = status === "ready"
    ? "#34D399"
    : status === "ready_with_warnings"
      ? "#F59E0B"
      : "#FB7185";

  return (
    <Card t={t} style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{title}</div>
        <Tag color={statusColor}>{status.replace(/_/g, " ")}</Tag>
      </div>
      {!readiness ? (
        <div style={{ padding: "20px 16px", fontSize: "12px", color: t.textMuted }}>{emptyText}</div>
      ) : (
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: blockers.length || warnings.length ? "12px" : "0" }}>
            <Pill t={t} accent={statusColor} active={false}>Blockers: {blockers.length}</Pill>
            <Pill t={t} accent={accent} active={false}>Warnings: {warnings.length}</Pill>
          </div>
          {blockers.length ? blockers.map((item) => (
            <div key={item.code} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.18)", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#FB7185", marginBottom: "4px" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: 1.5 }}>{item.detail}</div>
            </div>
          )) : null}
          {warnings.length ? warnings.map((item) => (
            <div key={item.code} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", marginBottom: "4px" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: 1.5 }}>{item.detail}</div>
            </div>
          )) : null}
          {!blockers.length && !warnings.length ? (
            <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: 1.5 }}>
              No readiness blockers or warnings detected.
            </div>
          ) : null}
        </div>
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
  const readiness = data?.readiness || {};
  const behaviorGovernance = data?.behavior_governance || {};
  const protections = data?.protections || {};
  const ingressRuntime = protections?.ingress_runtime || {};
  const protectionIndicators = protections?.indicators || {};

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
        sub="Operational health for the current workspace plus process-local backend telemetry. Queue counts are workspace-specific; request and AI counters reflect the current backend process, not a global tenant-wide total."
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
        <StatCard title="Requests" value={requestMetrics.total || 0} sub="Process-local request count since this backend instance started." color={accent} t={t} />
        <StatCard title="AI Responses" value={aiMetrics.total || 0} sub="Process-local AI reply count across this backend instance." color="#10B981" t={t} />
        <StatCard title="Queue Backlog" value={(queue.pending || 0) + (queue.retry || 0) + (queue.processing || 0)} sub="Pending, retry, and processing jobs for this workspace." color="#F59E0B" t={t} />
        <StatCard title="Failures" value={(requestMetrics.byStatusClass?.["5xx"] || 0) + (jobMetrics.failed || 0)} sub="Server errors plus failed background jobs." color="#FB7185" t={t} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        <KeyValueList title="AI Generation Mode (Process)" items={Object.entries(aiMetrics.byGenerationMode || {})} t={t} accent={accent} empty="No AI replies recorded yet." />
        <KeyValueList title="Queue Counts" items={Object.entries({
          pending: queue.pending || 0,
          retry: queue.retry || 0,
          processing: queue.processing || 0,
          failed: queue.failed || 0,
          completed: queue.completed || 0,
        })} t={t} accent="#F59E0B" />
        <KeyValueList title="Request Status Classes (Process)" items={Object.entries(requestMetrics.byStatusClass || {})} t={t} accent="#FB7185" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        <Card t={t} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Worker Health</div>
            <Tag color={jobMetrics.failed > 0 ? "#F59E0B" : "#34D399"}>{jobMetrics.failed > 0 ? "Needs review" : "Stable"}</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <StatCard title="Avg Job Lag" value={jobMetrics.avgLagMs || 0} sub="Time from enqueue to worker pickup." color={accent} t={t} />
            <StatCard title="Avg Job Duration" value={jobMetrics.avgDurationMs || 0} sub="Average Average worker execution time on this backend deployment." color={accent} t={t} />
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        <ReadinessPanel
          title="Platform Readiness"
          readiness={readiness.platform}
          t={t}
          accent={accent}
          emptyText="Platform launch readiness appears here after the backend returns readiness data."
        />
        <ReadinessPanel
          title="Workspace Go-Live"
          readiness={readiness.workspace}
          t={t}
          accent={accent}
          emptyText="Workspace go-live readiness appears here for the active client."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
        <Card t={t} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Client Protections</div>
            <Tag color={protections.rollout_mode === "sandbox" ? "#F59E0B" : protections.live_ingress_enabled === false ? "#FB7185" : "#34D399"}>
              {(protections.rollout_mode || "full_production").replace(/_/g, " ")}
            </Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <StatCard title="Req / Hour" value={protections.protections?.request_ceiling_per_hour || 0} sub="Configured hourly ceiling for live ingress." color={accent} t={t} />
            <StatCard title="Burst / Minute" value={protections.protections?.burst_ceiling_per_minute || 0} sub="Configured short-window burst control." color="#06B6D4" t={t} />
          </div>
          <KeyValueList
            title="Protection Indicators"
            items={Object.entries({
              live_ingress_enabled: protections.live_ingress_enabled !== false ? "yes" : "no",
              ai_cost_threshold_exceeded: protectionIndicators.ai_cost_threshold_exceeded ? "yes" : "no",
              fallback_spike: protectionIndicators.fallback_spike ? "yes" : "no",
              queue_pressure: protectionIndicators.queue_pressure ? "yes" : "no",
              recently_rate_limited: protectionIndicators.recently_rate_limited ? "yes" : "no",
            })}
            t={t}
            accent="#8B5CF6"
          />
        </Card>
        <Card t={t} style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Ingress Runtime</div>
            <Tag color={(ingressRuntime.blocked_last_hour || 0) > 0 ? "#F59E0B" : "#34D399"}>
              {(ingressRuntime.blocked_last_hour || 0) > 0 ? "Throttling observed" : "Clear"}
            </Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <StatCard title="Req Last Minute" value={ingressRuntime.requests_last_minute || 0} sub="Process-local live ingress samples." color={accent} t={t} />
            <StatCard title="Req Last Hour" value={ingressRuntime.requests_last_hour || 0} sub="Process-local rolling hour samples." color="#10B981" t={t} />
          </div>
          <KeyValueList
            title="Rate Limit Activity"
            items={Object.entries({
              blocked_last_hour: ingressRuntime.blocked_last_hour || 0,
              blocked_total: ingressRuntime.blocked_total || 0,
              last_block_reason: ingressRuntime.last_block_reason || "none",
            })}
            t={t}
            accent="#F59E0B"
          />
        </Card>
      </div>

      <KeyValueList
        title="Behavior Versions"
        items={Object.entries({
          playbook_normalization: behaviorGovernance.versions?.playbook_normalization || "unknown",
          policy_engine: behaviorGovernance.versions?.policy_engine || "unknown",
          response_pipeline: behaviorGovernance.versions?.response_pipeline || "unknown",
          eval_runner: behaviorGovernance.versions?.eval_runner || "unknown",
          playbook_fingerprint: behaviorGovernance.playbook_fingerprint || "n/a",
          response_config_fingerprint: behaviorGovernance.response_config_fingerprint || "n/a",
        })}
        t={t}
        accent="#8B5CF6"
        empty="No behavior version data yet."
      />

      <KeyValueList title="Busiest Routes (Process)" items={requestRouteRows} t={t} accent={accent} empty="No request traffic recorded yet." />
    </div>
  );
}


