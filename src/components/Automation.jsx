import { useEffect, useState } from "react";
import { apiFetch, apiJson, getActiveClientId } from "../lib/api";
import { Card, Pill, SectionHeader, Toggle } from "./ui";

const OP_LABELS = {
  equals: "=", not_equals: "≠", contains: "contains",
  not_contains: "doesn't contain", less_than: "<", greater_than: ">",
  starts_with: "starts with",
};
const ACTION_COLORS = {
  escalate: "#FB7185", resolve: "#34D399", tag: "#4F8EF7",
  notify: "#FBBF24", assign: "#A78BFA",
};

function AutomationRuleModal({ rule, t, accent, onSave, onClose }) {
  const [name,      setName]      = useState(rule?.name || "");
  const [field,     setField]     = useState(rule?.condition?.field || "intent");
  const [op,        setOp]        = useState(rule?.condition?.op || "contains");
  const [value,     setValue]     = useState(rule?.condition?.value || "");
  const [actionType,setActionType]= useState(rule?.action?.type || "escalate");

  const actionLabels = {
    escalate: "Escalate to Human Agent", resolve: "Mark as Resolved",
    tag: "Add Tag", notify: "Send Notification", assign: "Assign to Team",
  };
  const fields = ["intent","sentiment","confidence","channel","status","customer_email","subject"];
  const ops    = ["contains","not_contains","equals","not_equals","less_than","greater_than","starts_with"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px",
        width: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", color: t.text,
            letterSpacing: "-0.02em" }}>{rule ? "Edit Rule" : "New Automation Rule"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: t.textMuted, cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Rule Name
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Escalate angry customers"
              style={{ width: "100%", background: t.surfaceHover, border: `1px solid ${t.border}`,
                borderRadius: "8px", color: t.text, fontSize: "13px", padding: "9px 12px",
                fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = t.border} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Condition — IF
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={field} onChange={e => setField(e.target.value)}
                style={{ flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text, fontSize: "12px", padding: "8px 10px",
                  fontFamily: "inherit", outline: "none" }}>
                {fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={op} onChange={e => setOp(e.target.value)}
                style={{ flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text, fontSize: "12px", padding: "8px 10px",
                  fontFamily: "inherit", outline: "none" }}>
                {ops.map(o => <option key={o} value={o}>{OP_LABELS[o]}</option>)}
              </select>
              <input value={value} onChange={e => setValue(e.target.value)}
                placeholder="value"
                style={{ flex: 1, background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "8px", color: t.text, fontSize: "12px", padding: "8px 10px",
                  fontFamily: "inherit", outline: "none" }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Action — THEN
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
              {Object.entries(actionLabels).map(([type, label]) => (
                <button key={type} onClick={() => setActionType(type)} style={{
                  padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                  background: actionType === type ? `${ACTION_COLORS[type]}18` : t.surfaceHover,
                  border: `1.5px solid ${actionType === type ? ACTION_COLORS[type] : t.border}`,
                  color: actionType === type ? ACTION_COLORS[type] : t.textSub,
                  fontSize: "11px", fontWeight: actionType === type ? "600" : "400",
                  textAlign: "left" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
            borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: t.textSub }}>
            <span style={{ color: t.textMuted }}>Preview: </span>
            IF <span style={{ color: accent, fontWeight: "600" }}>{field}</span>{" "}
            <span style={{ color: t.textMuted }}>{OP_LABELS[op] || op}</span>{" "}
            "<span style={{ color: accent, fontWeight: "600" }}>{value}</span>"
            {" "}→ THEN <span style={{ color: ACTION_COLORS[actionType], fontWeight: "600" }}>{actionLabels[actionType]}</span>
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "8px 18px", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave({ name, condition: { field, op, value }, action: { type: actionType, label: actionLabels[actionType] } })}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "13px", fontWeight: "600", padding: "8px 22px", cursor: "pointer" }}>
            {rule ? "Save Changes" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Automation({ t, accent }) {
  const clientId = getActiveClientId();
  const [rules, setRules]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule]   = useState(null);
  const [tab, setTab]             = useState("rules");

  async function loadRules() {
    setLoading(true);
    const data = await apiFetch(`/api/automation?client_id=${clientId}`);
    setRules(data || []);
    setLoading(false);
  }
  useEffect(() => { loadRules(); }, [clientId]);

  const totalTriggered = rules.reduce((s, r) => s + (r.triggered || 0), 0);
  const activeCount    = rules.filter(r => r.active).length;

  async function handleSave(data) {
    if (editRule) {
      const updated = await apiJson(`/api/automation/${editRule.id}?client_id=${encodeURIComponent(clientId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: { client_id: clientId, ...data },
      });
      if (updated?.id) setRules(r => r.map(x => x.id === updated.id ? updated : x));
    } else {
      const created = await apiJson("/api/automation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: { client_id: clientId, ...data },
      });
      if (created?.id) setRules(r => [...r, created]);
    }
    setShowModal(false); setEditRule(null);
  }

  async function deleteRule(id) {
    setRules(r => r.filter(x => x.id !== id));
    await apiJson(`/api/automation/${id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });
  }

  async function toggleRule(id, val) {
    setRules(r => r.map(x => x.id === id ? { ...x, active: val } : x));
    await apiJson(`/api/automation/${id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: { client_id: clientId, active: val },
    });
  }

  return (
    <div>
      <SectionHeader
        title="Automation Center"
        sub="Define IF/THEN rules that fire automatically during conversations."
        t={t}
        action={
          <button onClick={() => { setEditRule(null); setShowModal(true); }}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "8px 16px", cursor: "pointer" }}>
            + New Rule
          </button>
        }
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Active Rules",      value: activeCount,      color: "#34D399" },
          { label: "Total Rules",       value: rules.length,     color: accent     },
          { label: "Times Triggered",   value: totalTriggered,   color: "#A78BFA"  },
        ].map((s, i) => (
          <Card key={i} t={t} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "6px",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: s.color,
              letterSpacing: "-0.04em", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {["rules", "logs"].map(tb => (
          <Pill key={tb} active={tab === tb} accent={accent} onClick={() => setTab(tb)} t={t}>
            {tb === "rules" ? "Automation Rules" : "Trigger Log"}
          </Pill>
        ))}
      </div>

      {tab === "rules" && (
        <Card t={t} style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 180px 100px 60px 80px",
            padding: "10px 18px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>Rule</span><span>Condition</span><span>Action</span>
            <span>Triggered</span><span>Active</span><span></span>
          </div>
          {loading && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading rules…
            </div>
          )}
          {!loading && rules.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              No automation rules yet. Click "+ New Rule" to create one.
            </div>
          )}
          {rules.map((rule, i) => (
            <div key={rule.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 200px 180px 100px 60px 80px",
                alignItems: "center", padding: "13px 18px",
                borderBottom: i < rules.length-1 ? `1px solid ${t.borderLight}` : "none",
                transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {/* Name */}
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: "600", color: t.text,
                  letterSpacing: "-0.01em", marginBottom: "2px" }}>{rule.name}</div>
                <div style={{ fontSize: "10.5px", color: t.textMuted }}>
                  Triggered: {(rule.triggered || 0).toLocaleString()}
                  {rule.last_triggered ? ` · Last: ${new Date(rule.last_triggered).toLocaleDateString()}` : ""}
                </div>
              </div>
              {/* Condition */}
              <div style={{ fontSize: "11px", color: t.textSub, fontFamily: "'DM Mono', monospace" }}>
                <span style={{ color: accent }}>{rule.condition?.field}</span>{" "}
                <span style={{ color: t.textMuted }}>{OP_LABELS[rule.condition?.op]}</span>{" "}
                "<span style={{ color: t.text }}>{rule.condition?.value}</span>"
              </div>
              {/* Action */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 9px",
                  borderRadius: "999px",
                  background: `${ACTION_COLORS[rule.action?.type] || t.textMuted}18`,
                  color: ACTION_COLORS[rule.action?.type] || t.textMuted,
                  border: `1px solid ${ACTION_COLORS[rule.action?.type] || t.textMuted}30` }}>
                  {rule.action?.label}
                </span>
              </div>
              {/* Triggered count */}
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                fontFamily: "'DM Mono', monospace" }}>{(rule.triggered || 0).toLocaleString()}</div>
              {/* Toggle */}
              <Toggle value={rule.active} onChange={v => toggleRule(rule.id, v)} accent={accent} />
              {/* Edit / Delete */}
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button onClick={() => { setEditRule(rule); setShowModal(true); }}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                    color: t.textSub, fontSize: "11px", padding: "4px 9px", cursor: "pointer" }}>Edit</button>
                <button onClick={() => deleteRule(rule.id)}
                  style={{ background: "none", border: "none", color: "#EF4444",
                    fontSize: "14px", cursor: "pointer", padding: "2px 5px" }}>×</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "logs" && (
        <Card t={t} style={{ padding: "28px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>◎</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "4px" }}>
            Trigger log coming soon
          </div>
          <div style={{ fontSize: "12px", color: t.textSub }}>
            Every rule trigger will be logged here with full context and the conversation that caused it.
          </div>
        </Card>
      )}

      {showModal && (
        <AutomationRuleModal
          rule={editRule} t={t} accent={accent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditRule(null); }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: CHANNELS

