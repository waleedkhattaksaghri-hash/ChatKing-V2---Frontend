import { useMemo, useState } from "react";
import { apiJson } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader, Toggle } from "./ui";

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

export function OwnerPanel({ t, accent, activeClient, onClientsChanged }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState(activeClient?.id || null);
  const [draftEntitlements, setDraftEntitlements] = useState(null);
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

  const effectiveEntitlements = draftEntitlements || selectedClient?.entitlements || null;

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
        },
      });

      setDraftEntitlements(payload.entitlements);
      setSavedMessage("Entitlements updated.");
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
                </div>
              </div>

              {error ? <div style={{ color: "#FCA5A5", fontSize: "12px", marginBottom: "12px" }}>{error}</div> : null}
              {savedMessage ? <div style={{ color: "#34D399", fontSize: "12px", marginBottom: "12px" }}>{savedMessage}</div> : null}

              <div style={{ display: "grid", gap: "14px" }}>
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
