import { getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, Tag } from "./ui";

function getValueAtPath(source, path, fallback = true) {
  const parts = String(path || "").split(".").filter(Boolean);
  let current = source;
  for (const part of parts) {
    if (!current || typeof current !== "object") return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
}

export function isSimpleClientMode(activeClient) {
  const rolloutMode = String(activeClient?.rollout_mode || "").toLowerCase();
  const advancedControls = getValueAtPath(activeClient?.entitlements, "features.advanced_controls", true);
  return rolloutMode === "sandbox" || rolloutMode === "pilot" || advancedControls === false;
}

function hasMeaningfulSettings(settings = {}) {
  const ignoredKeys = new Set([
    "id",
    "client_id",
    "created_at",
    "updated_at",
    "entitlements",
    "protections",
    "rollout_mode",
  ]);

  return Object.entries(settings || {}).some(([key, value]) => {
    if (ignoredKeys.has(key)) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return true;
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return false;
  });
}

function statusTone(status) {
  if (status === "done") return "#34D399";
  if (status === "optional") return "#A78BFA";
  return "#FBBF24";
}

function statusLabel(status) {
  if (status === "done") return "Configured";
  if (status === "optional") return "Optional";
  return "Recommended";
}

export function SetupChecklistCard({ t, accent, activeClient, onNavigate }) {
  const clientId = getActiveClientId();
  const simpleMode = isSimpleClientMode(activeClient);

  const { data: settings } = useApi(clientId ? `/api/settings?client_id=${clientId}` : null, null, [clientId]);
  const { data: issueTypes = [] } = useApi(clientId ? `/api/issue-types?client_id=${clientId}` : null, [], [clientId]);
  const { data: sops = [] } = useApi(clientId ? `/api/sops?client_id=${clientId}` : null, [], [clientId]);
  const { data: knowledge = [] } = useApi(clientId ? `/api/knowledge?client_id=${clientId}` : null, [], [clientId]);
  const { data: memory = [] } = useApi(clientId ? `/api/client-memory?client_id=${clientId}` : null, [], [clientId]);
  const { data: tools = [] } = useApi(clientId ? `/api/tools?client_id=${clientId}` : null, [], [clientId]);
  const { data: evalRuns = [] } = useApi(clientId ? `/api/eval/runs?client_id=${clientId}&limit=3` : null, [], [clientId]);

  const steps = [
    {
      key: "agent-overview",
      title: "Playbook",
      summary: "Set identity, business rules, tone, escalations, and capabilities first.",
      countLabel: hasMeaningfulSettings(settings) ? "Configured" : "Not configured",
      status: hasMeaningfulSettings(settings) ? "done" : "recommended",
    },
    {
      key: "issue-types",
      title: "Issue Types",
      summary: "Create broad categories like refund, late delivery, or cancellation.",
      countLabel: `${issueTypes.length} defined`,
      status: issueTypes.length > 0 ? "done" : "recommended",
    },
    {
      key: "sops",
      title: "SOPs",
      summary: "Add operational workflows the AI should follow once it knows the issue type.",
      countLabel: `${sops.length} saved`,
      status: sops.length > 0 ? "done" : "recommended",
    },
    {
      key: "knowledge",
      title: "Knowledge Base",
      summary: "Store factual answers, policies, and product information customers ask about.",
      countLabel: `${knowledge.filter((item) => item.status === "published").length} published`,
      status: knowledge.some((item) => item.status === "published") ? "done" : "recommended",
    },
    {
      key: "client-memory",
      title: "Client Memory",
      summary: "Add repeated client-specific patterns only after SOPs and KB are stable.",
      countLabel: `${memory.filter((item) => item.status === "approved").length} approved`,
      status: memory.some((item) => item.status === "approved") ? "done" : simpleMode ? "optional" : "recommended",
    },
    {
      key: "tools",
      title: "Tools / Integrations",
      summary: "Connect safe lookups first. Add action tools only after the AI is stable.",
      countLabel: `${tools.filter((item) => item.status === "active").length} active`,
      status: tools.some((item) => item.status === "active") ? "done" : simpleMode ? "optional" : "recommended",
    },
    {
      key: "ai-test",
      title: "AI Test / Evaluations",
      summary: "Run realistic conversations and regression checks before live rollout.",
      countLabel: `${evalRuns.length} recent eval runs`,
      status: evalRuns.length > 0 ? "done" : "recommended",
    },
  ];

  return (
    <Card t={t} style={{ padding: "18px 20px", marginBottom: "24px" }} glow accent={accent}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "800", color: t.text, letterSpacing: "-0.02em" }}>
            Guided setup order
          </div>
          <div style={{ fontSize: "12px", color: t.textSub, marginTop: "5px", lineHeight: "1.7", maxWidth: "780px" }}>
            Keep the setup layered: teach behavior first, then classification, then workflows, then factual content, then memory, then tools. Testing should happen throughout, but it matters most once the first four layers exist.
          </div>
        </div>
        <Tag color={simpleMode ? "#A78BFA" : accent}>{simpleMode ? "Simple mode" : "Full mode"}</Tag>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {steps.map((step, index) => {
          const tone = statusTone(step.status);
          return (
            <div key={step.key} style={{ border: `1px solid ${t.border}`, borderRadius: "16px", padding: "14px 16px", background: t.surface }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "999px", background: `${tone}18`, color: tone, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                      {index + 1}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>{step.title}</span>
                    <Pill color={tone}>{statusLabel(step.status)}</Pill>
                  </div>
                  <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.7" }}>{step.summary}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "11px", color: t.textMuted }}>{step.countLabel}</span>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(step.key)}
                    style={{ background: accent, border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", padding: "9px 14px", cursor: "pointer" }}
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PageGuideCard({ t, accent, title = "How to use this page", belongs = [], doesntBelong = [], exampleTitle = "Good example", exampleText = "", simpleModeNote = "" }) {
  return (
    <Card t={t} style={{ padding: "18px 20px", marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "13px", fontWeight: "800", color: t.text, letterSpacing: "-0.02em" }}>{title}</div>
        <Tag color={accent}>Setup guidance</Tag>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        <div style={{ border: `1px solid ${t.border}`, borderRadius: "14px", padding: "14px", background: `${accent}08` }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            What belongs here
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {belongs.map((item) => (
              <div key={item} style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.6" }}>• {item}</div>
            ))}
          </div>
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: "14px", padding: "14px", background: "rgba(251, 191, 36, 0.06)" }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            What does not belong here
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {doesntBelong.map((item) => (
              <div key={item} style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.6" }}>• {item}</div>
            ))}
          </div>
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: "14px", padding: "14px", background: t.surface }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            {exampleTitle}
          </div>
          <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.75", whiteSpace: "pre-wrap" }}>{exampleText}</div>
        </div>
      </div>

      {simpleModeNote && (
        <div style={{ marginTop: "12px", fontSize: "12px", color: t.textSub, lineHeight: "1.7" }}>
          <strong style={{ color: t.text }}>Simple mode:</strong> {simpleModeNote}
        </div>
      )}
    </Card>
  );
}
