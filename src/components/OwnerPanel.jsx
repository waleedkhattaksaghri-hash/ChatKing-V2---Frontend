import { useMemo, useState } from "react";
import { apiJson } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader, Toggle } from "./ui";

const ROLLOUT_MODES = [
  ["sandbox", "Sandbox"],
  ["pilot", "Pilot"],
  ["limited_production", "Limited Production"],
  ["full_production", "Full Production"],
];

const LIVE_ROLLOUT_MODES = [
  ["full_on", "Full On"],
  ["off", "Off"],
  ["percentage", "Percentage"],
  ["time_window", "Time Window"],
  ["percentage_in_window", "Percentage In Window"],
];

const PROTECTION_FIELDS = [
  ["request_ceiling_per_hour", "Request Ceiling / Hour"],
  ["burst_ceiling_per_minute", "Burst Ceiling / Minute"],
  ["ai_cost_alert_threshold_usd", "AI Cost Alert Threshold (USD)"],
  ["fallback_spike_threshold_pct", "Fallback Spike Threshold (%)"],
  ["queue_backlog_warning_threshold", "Queue Backlog Warning"],
];

const TOOL_ROLLOUT_FIELDS = [
  ["allow_read_tools", "Allow Read-Only Tools"],
  ["allow_write_tools", "Allow Write / Action Tools"],
  ["allow_side_effect_tools", "Allow Side-Effect Tools"],
];

const ENTITLEMENT_GROUPS = [
  {
    key: "pages",
    label: "Pages",
    items: [
      ["overview", "Overview"],
      ["agent_playbook", "Agent Playbook"],
      ["issue_types", "Issue Types"],
      ["sops", "SOPs"],
      ["knowledge", "Knowledge Base"],
      ["client_memory", "Client Memory"],
      ["ai_test", "AI Test"],
      ["tools", "Tools"],
      ["admin_stats", "Admin Stats"],
      ["insights", "Insights"],
      ["conversations", "Conversations"],
      ["automation", "Automation"],
      ["evaluations", "Evaluations"],
      ["reviews", "Reviews"],
      ["companies", "Companies"],
      ["channels", "Channels"],
      ["team", "Team"],
    ],
  },
  {
    key: "features",
    label: "Advanced Features",
    items: [
      ["sandboxes", "Sandboxes and AI Test"],
      ["client_memory", "Client Memory"],
      ["advanced_controls", "Advanced Controls"],
      ["tools", "Tools"],
      ["integrations", "Integrations"],
      ["evals", "Evaluations"],
      ["automation", "Automation"],
    ],
  },
  {
    key: "insights",
    label: "Insights Sections",
    items: [
      ["operational_cards", "Operational Cards"],
      ["retrieval_quality", "Retrieval Quality"],
      ["reliability", "Reliability"],
      ["ai_costs", "AI Costs"],
      ["issue_mix", "Issue Outcome Mix"],
    ],
  },
  {
    key: "modules",
    label: "AI / Config Modules",
    items: [
      ["ai_playbook", "AI Playbook"],
      ["issue_types", "Issue Types"],
      ["sops", "SOPs"],
      ["knowledge_base", "Knowledge Base"],
      ["tools", "Tools"],
      ["integrations", "Integrations"],
      ["client_memory", "Client Memory"],
    ],
  },
];

function cloneEntitlements(entitlements = {}) {
  return JSON.parse(JSON.stringify(entitlements || {}));
}

function setNestedEntitlement(entitlements, groupKey, itemKey, value) {
  const next = cloneEntitlements(entitlements);
  next[groupKey] = { ...(next[groupKey] || {}), [itemKey]: value };
  return next;
}

function cloneProtections(protections = {}) {
  return JSON.parse(JSON.stringify(protections || {}));
}

function readinessTone(status) {
  if (status === "ready") return "#34D399";
  if (status === "ready_with_warnings") return "#F59E0B";
  return "#FB7185";
}

function checklistTone(status) {
  if (status === "pass") return "#34D399";
  if (status === "block") return "#FB7185";
  return "#F59E0B";
}

export function OwnerPanel({ t, accent, activeClient, onClientsChanged }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState(activeClient?.id || null);
  const [draftEntitlements, setDraftEntitlements] = useState(null);
  const [draftRolloutMode, setDraftRolloutMode] = useState(activeClient?.rollout_mode || "full_production");
  const [draftProtections, setDraftProtections] = useState(activeClient?.protections || {});
  const [draftToolRollout, setDraftToolRollout] = useState(activeClient?.tool_rollout || activeClient?.protections?.tool_rollout || {});
  const [draftLiveRollout, setDraftLiveRollout] = useState(activeClient?.live_rollout || activeClient?.protections?.live_rollout || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const { data: clientsRaw, loading, refetch } = useApi(
    "/api/organizations/owner/clients",
    [],
    [refreshTick]
  );

  const clients = clientsRaw || [];
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || clients[0] || null,
    [clients, selectedClientId]
  );
  const { data: readinessPayload } = useApi(
    selectedClient?.id ? `/api/organizations/owner/clients/${selectedClient.id}/readiness` : null,
    null,
    [selectedClient?.id, refreshTick]
  );

  const effectiveEntitlements = draftEntitlements || selectedClient?.entitlements || null;
  const effectiveRolloutMode = draftRolloutMode || selectedClient?.rollout_mode || "full_production";
  const effectiveProtections = draftProtections || selectedClient?.protections || {};
  const effectiveToolRollout = draftToolRollout || selectedClient?.tool_rollout || selectedClient?.protections?.tool_rollout || {};
  const effectiveLiveRollout = draftLiveRollout || selectedClient?.live_rollout || selectedClient?.protections?.live_rollout || {};
  const readiness = readinessPayload?.readiness || null;

  async function handleSave() {
    if (!selectedClient) return;
    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const payload = await apiJson(`/api/organizations/owner/clients/${selectedClient.id}/entitlements`, {
        method: "PUT",
        body: {
          entitlements: effectiveEntitlements,
          rollout_mode: effectiveRolloutMode,
          protections: effectiveProtections,
          tool_rollout: effectiveToolRollout,
          live_rollout: effectiveLiveRollout,
        },
      });

      setDraftEntitlements(payload.entitlements);
      setDraftRolloutMode(payload.rollout_mode || "full_production");
      setDraftProtections(payload.protections || {});
      setDraftToolRollout(payload.tool_rollout || payload.protections?.tool_rollout || {});
      setDraftLiveRollout(payload.live_rollout || payload.protections?.live_rollout || {});
      setSavedMessage("Client access and rollout controls updated.");
      setRefreshTick((current) => current + 1);
      await Promise.all([refetch(), onClientsChanged?.()]);
    } catch (saveError) {
      setError(saveError.message || "Failed to update entitlements.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Owner Panel"
        sub="Platform-level control over workspace pages, dashboards, advanced features, and AI modules."
        t={t}
        action={(
          <button
            type="button"
            onClick={() => {
              setRefreshTick((current) => current + 1);
              refetch();
            }}
            style={{
              background: t.surfaceHover,
              border: `1px solid ${t.border}`,
              borderRadius: "10px",
              color: t.text,
              padding: "9px 14px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        )}
      />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px" }}>
        <Card t={t} style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "12px" }}>Workspaces</div>
          {loading ? (
            <div style={{ fontSize: "12px", color: t.textMuted }}>Loading workspaces...</div>
          ) : !clients.length ? (
            <div style={{ fontSize: "12px", color: t.textMuted }}>No workspaces available.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {clients.map((client) => {
                const active = client.id === (selectedClient?.id || "");
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setDraftEntitlements(cloneEntitlements(client.entitlements));
                      setDraftRolloutMode(client.rollout_mode || "full_production");
                      setDraftProtections(cloneProtections(client.protections));
                      setDraftToolRollout(cloneProtections(client.tool_rollout || client.protections?.tool_rollout));
                      setDraftLiveRollout(cloneProtections(client.live_rollout || client.protections?.live_rollout));
                      setError("");
                      setSavedMessage("");
                    }}
                    style={{
                      border: `1px solid ${active ? accent : t.border}`,
                      borderRadius: "12px",
                      background: active ? `${accent}12` : t.surfaceHover,
                      padding: "14px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{client.name}</div>
                        <div style={{ fontSize: "11px", color: t.textMuted }}>{client.organization?.name || "No organization name"}</div>
                      </div>
                      <Pill color={active ? accent : "#94A3B8"}>{client.plan || "starter"}</Pill>
                    </div>
                    <div style={{ fontSize: "10px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>{client.id}</div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card t={t} style={{ padding: "18px" }}>
          {!selectedClient ? (
            <div style={{ fontSize: "12px", color: t.textMuted }}>Select a workspace to edit its entitlements.</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>{selectedClient.name}</div>
                  <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>
                    {selectedClient.organization?.name || "No organization"} · {selectedClient.domain || "No domain"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Pill color="#60A5FA">Client {selectedClient.id}</Pill>
                  <Pill color="#34D399">{selectedClient.plan || "starter"}</Pill>
                  <Pill color={effectiveRolloutMode === "sandbox" ? "#F59E0B" : effectiveRolloutMode === "pilot" ? "#60A5FA" : effectiveRolloutMode === "limited_production" ? "#8B5CF6" : "#10B981"}>
                    {effectiveRolloutMode.replace(/_/g, " ")}
                  </Pill>
                  {readiness ? (
                    <Pill color={readinessTone(readiness.status)}>
                      {readiness.status.replace(/_/g, " ")}
                    </Pill>
                  ) : null}
                </div>
              </div>

              {error ? <div style={{ color: "#FCA5A5", fontSize: "12px", marginBottom: "12px" }}>{error}</div> : null}
              {savedMessage ? <div style={{ color: "#34D399", fontSize: "12px", marginBottom: "12px" }}>{savedMessage}</div> : null}

              <div style={{ display: "grid", gap: "14px" }}>
                <Card t={t} style={{ padding: "16px 18px", background: t.surfaceHover }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Go-Live Readiness</div>
                      <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>
                        Practical onboarding checklist for pilot and production readiness.
                      </div>
                    </div>
                    <Pill color={readinessTone(readiness?.status)}>{(readiness?.status || "loading").replace(/_/g, " ")}</Pill>
                  </div>
                  {!readiness ? (
                    <div style={{ fontSize: "12px", color: t.textMuted }}>Loading readiness checklist...</div>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                        <Pill color="#FB7185">Blockers: {readiness.summary?.blocker_count || 0}</Pill>
                        <Pill color="#F59E0B">Warnings: {readiness.summary?.warning_count || 0}</Pill>
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        {(readiness.checklist || []).map((item) => (
                          <div key={item.key} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.surface }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "6px", flexWrap: "wrap" }}>
                              <div style={{ fontSize: "12px", fontWeight: "700", color: t.text }}>{item.label}</div>
                              <Pill color={checklistTone(item.status)}>{item.status}</Pill>
                            </div>
                            <div style={{ fontSize: "12px", color: t.textSub, lineHeight: 1.6 }}>{item.detail}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                <Card t={t} style={{ padding: "16px 18px", background: t.surfaceHover }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "12px" }}>Rollout and Protections</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <label style={{ fontSize: "12px", color: t.textSub, fontWeight: "700" }}>Rollout Mode</label>
                      <select
                        value={effectiveRolloutMode}
                        onChange={(event) => {
                          setDraftRolloutMode(event.target.value);
                          setSavedMessage("");
                        }}
                        style={{
                          border: `1px solid ${t.border}`,
                          borderRadius: "10px",
                          background: t.surface,
                          color: t.text,
                          padding: "11px 12px",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      >
                        {ROLLOUT_MODES.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.surface }}>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>Mode behavior</div>
                      <div style={{ fontSize: "11px", color: t.textMuted, lineHeight: 1.6 }}>
                        {effectiveRolloutMode === "sandbox"
                          ? "Sandbox mode disables live webhook ingress and keeps this workspace in validation-only operation."
                          : effectiveRolloutMode === "pilot"
                            ? "Pilot mode keeps live traffic enabled with tighter ceilings and lower alert thresholds."
                            : effectiveRolloutMode === "limited_production"
                              ? "Limited production allows live traffic with moderate safeguards before full rollout."
                              : "Full production keeps live ingress enabled with the most permissive default ceilings."}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                    {PROTECTION_FIELDS.map(([fieldKey, label]) => (
                      <div key={fieldKey} style={{ display: "grid", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: t.textSub, fontWeight: "700" }}>{label}</label>
                        <input
                          type="number"
                          min="0"
                          value={effectiveProtections?.[fieldKey] ?? ""}
                          onChange={(event) => {
                            const nextValue = event.target.value === "" ? "" : Number(event.target.value);
                            setDraftProtections((current) => ({
                              ...(current || selectedClient.protections || {}),
                              [fieldKey]: nextValue,
                            }));
                            setSavedMessage("");
                          }}
                          style={{
                            border: `1px solid ${t.border}`,
                            borderRadius: "10px",
                            background: t.surface,
                            color: t.text,
                            padding: "11px 12px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
                    {TOOL_ROLLOUT_FIELDS.map(([fieldKey, label]) => (
                      <div
                        key={fieldKey}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: `1px solid ${t.border}`,
                          background: t.surface,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: t.text }}>{label}</div>
                          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>tool_rollout.{fieldKey}</div>
                        </div>
                        <Toggle
                          value={effectiveToolRollout?.[fieldKey] !== false}
                          onChange={(nextValue) => {
                            setDraftToolRollout((current) => ({
                              ...(current || selectedClient.tool_rollout || selectedClient.protections?.tool_rollout || {}),
                              [fieldKey]: nextValue,
                            }));
                            setSavedMessage("");
                          }}
                          accent={accent}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: t.text, marginBottom: "10px" }}>Live Traffic Rollout</div>
                    <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "12px", lineHeight: 1.6 }}>
                      Control whether AI is fully on, off, percentage-based, time-boxed, or percentage-limited inside a time window.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: t.textSub, fontWeight: "700" }}>Live Rollout Mode</label>
                        <select
                          value={effectiveLiveRollout?.mode || "full_on"}
                          onChange={(event) => {
                            setDraftLiveRollout((current) => ({
                              ...(current || selectedClient.live_rollout || selectedClient.protections?.live_rollout || {}),
                              mode: event.target.value,
                            }));
                            setSavedMessage("");
                          }}
                          style={{
                            border: `1px solid ${t.border}`,
                            borderRadius: "10px",
                            background: t.surface,
                            color: t.text,
                            padding: "11px 12px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        >
                          {LIVE_ROLLOUT_MODES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: t.textSub, fontWeight: "700" }}>Percentage</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={effectiveLiveRollout?.percentage ?? 100}
                          onChange={(event) => {
                            const nextValue = event.target.value === "" ? "" : Number(event.target.value);
                            setDraftLiveRollout((current) => ({
                              ...(current || selectedClient.live_rollout || selectedClient.protections?.live_rollout || {}),
                              percentage: nextValue,
                            }));
                            setSavedMessage("");
                          }}
                          style={{
                            border: `1px solid ${t.border}`,
                            borderRadius: "10px",
                            background: t.surface,
                            color: t.text,
                            padding: "11px 12px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: t.textSub, fontWeight: "700" }}>Starts At</label>
                        <input
                          type="datetime-local"
                          value={effectiveLiveRollout?.starts_at ? new Date(effectiveLiveRollout.starts_at).toISOString().slice(0, 16) : ""}
                          onChange={(event) => {
                            setDraftLiveRollout((current) => ({
                              ...(current || selectedClient.live_rollout || selectedClient.protections?.live_rollout || {}),
                              starts_at: event.target.value ? new Date(event.target.value).toISOString() : null,
                            }));
                            setSavedMessage("");
                          }}
                          style={{
                            border: `1px solid ${t.border}`,
                            borderRadius: "10px",
                            background: t.surface,
                            color: t.text,
                            padding: "11px 12px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <label style={{ fontSize: "12px", color: t.textSub, fontWeight: "700" }}>Ends At</label>
                        <input
                          type="datetime-local"
                          value={effectiveLiveRollout?.ends_at ? new Date(effectiveLiveRollout.ends_at).toISOString().slice(0, 16) : ""}
                          onChange={(event) => {
                            setDraftLiveRollout((current) => ({
                              ...(current || selectedClient.live_rollout || selectedClient.protections?.live_rollout || {}),
                              ends_at: event.target.value ? new Date(event.target.value).toISOString() : null,
                            }));
                            setSavedMessage("");
                          }}
                          style={{
                            border: `1px solid ${t.border}`,
                            borderRadius: "10px",
                            background: t.surface,
                            color: t.text,
                            padding: "11px 12px",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: `1px solid ${t.border}`,
                          background: t.surface,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: t.text }}>Live rollout enabled</div>
                          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>Master enable for the staged live rollout controller.</div>
                        </div>
                        <Toggle
                          value={effectiveLiveRollout?.enabled !== false}
                          onChange={(nextValue) => {
                            setDraftLiveRollout((current) => ({
                              ...(current || selectedClient.live_rollout || selectedClient.protections?.live_rollout || {}),
                              enabled: nextValue,
                            }));
                            setSavedMessage("");
                          }}
                          accent={accent}
                        />
                      </div>
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: `1px solid ${t.border}`,
                          background: t.surface,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: t.text }}>Kill switch</div>
                          <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>Instantly bypass AI for live ingress without changing the configured rollout plan.</div>
                        </div>
                        <Toggle
                          value={effectiveLiveRollout?.kill_switch === true}
                          onChange={(nextValue) => {
                            setDraftLiveRollout((current) => ({
                              ...(current || selectedClient.live_rollout || selectedClient.protections?.live_rollout || {}),
                              kill_switch: nextValue,
                            }));
                            setSavedMessage("");
                          }}
                          accent={accent}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {ENTITLEMENT_GROUPS.map((group) => (
                  <Card key={group.key} t={t} style={{ padding: "16px 18px", background: t.surfaceHover }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "12px" }}>{group.label}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                      {group.items.map(([itemKey, label]) => {
                        const enabled = effectiveEntitlements?.[group.key]?.[itemKey] !== false;
                        return (
                          <div
                            key={`${group.key}.${itemKey}`}
                            style={{
                              padding: "12px 14px",
                              borderRadius: "12px",
                              border: `1px solid ${t.border}`,
                              background: t.surface,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "12px", fontWeight: "700", color: t.text }}>{label}</div>
                              <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>{group.key}.{itemKey}</div>
                            </div>
                            <Toggle
                              value={enabled}
                              onChange={(nextValue) => {
                                setDraftEntitlements((current) => setNestedEntitlement(current || selectedClient.entitlements, group.key, itemKey, nextValue));
                                setSavedMessage("");
                              }}
                              accent={accent}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setDraftEntitlements(cloneEntitlements(selectedClient.entitlements));
                    setDraftRolloutMode(selectedClient.rollout_mode || "full_production");
                    setDraftProtections(cloneProtections(selectedClient.protections));
                    setDraftToolRollout(cloneProtections(selectedClient.tool_rollout || selectedClient.protections?.tool_rollout));
                    setSavedMessage("");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: `1px solid ${t.border}`,
                    borderRadius: "10px",
                    color: t.textSub,
                    padding: "10px 14px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: accent,
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Entitlements"}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
