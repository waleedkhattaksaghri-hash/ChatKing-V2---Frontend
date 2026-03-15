import { useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson, getActiveClientId } from "../lib/api";
import { Card, Pill, SectionHeader } from "./ui";
import { ContentTestModal } from "./ContentTestModal";

function formatTriggerConditions(value) {
  if (!value) return "";
  if (Array.isArray(value?.rules)) return value.rules.join("\n");
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function parseTriggerConditions(value) {
  const raw = String(value || "").trim();
  if (!raw) return {};

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { rules: parsed.map((item) => String(item).trim()).filter(Boolean) };
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return { rules: raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) };
    }
  }

  return { rules: raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) };
}

function createSopDraft(issueTypeId = "") {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    persistedId: null,
    title: "",
    issue_type_id: issueTypeId,
    trigger_conditions_text: "",
    instructions: "",
    status: "draft",
    isDirty: true,
  };
}

function normalizeSop(record = {}) {
  return {
    id: record.id || `legacy-${Math.random().toString(36).slice(2, 7)}`,
    persistedId: record.id || null,
    title: record.title || record.name || "",
    issue_type_id: record.issue_type_id || "",
    trigger_conditions_text: formatTriggerConditions(record.trigger_conditions || record.issues),
    instructions: record.instructions || "",
    status: record.status || (record.active ? "active" : "draft"),
    isDirty: false,
  };
}

function buildSopPayload(sop) {
  return {
    client_id: getActiveClientId(),
    title: String(sop.title || "").trim(),
    instructions: String(sop.instructions || "").trim(),
    issue_type_id: sop.issue_type_id || null,
    trigger_conditions: parseTriggerConditions(sop.trigger_conditions_text),
    status: sop.status || "draft",
  };
}

function SopEditorCard({ sop, issueTypes, t, accent, saving, onChange, onSave, onDelete }) {
  const fieldStyle = {
    width: "100%",
    background: t.surfaceHover,
    border: `1px solid ${t.border}`,
    borderRadius: "12px",
    color: t.text,
    fontSize: "13px",
    lineHeight: "1.7",
    padding: "12px 14px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <Card t={t} style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em" }}>
            {sop.title.trim() || "New SOP"}
          </div>
          <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>
            Detailed workflow linked to an Issue Type.
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Pill color={accent}>{sop.status}</Pill>
          {sop.isDirty && <Pill color="#F59E0B">Unsaved</Pill>}
          <button type="button" onClick={onDelete} style={{ background: "none", border: "none", color: "#FB7185", cursor: "pointer", fontSize: "12px", fontWeight: "700", padding: 0 }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Title
          </label>
          <input
            value={sop.title}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Examples: Refund Workflow, Late Delivery Handling"
            style={{ ...fieldStyle, minHeight: "46px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Linked Issue Type
          </label>
          <select
            value={sop.issue_type_id}
            onChange={(event) => onChange("issue_type_id", event.target.value)}
            style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}
          >
            <option value="">Unlinked</option>
            {issueTypes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Trigger Conditions
          </label>
          <textarea
            value={sop.trigger_conditions_text}
            onChange={(event) => onChange("trigger_conditions_text", event.target.value)}
            rows={4}
            placeholder="One trigger per line, or paste JSON if you want a structured condition object."
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Instructions
          </label>
          <textarea
            value={sop.instructions}
            onChange={(event) => onChange("instructions", event.target.value)}
            rows={8}
            placeholder="Write the operational workflow here. This is where step-by-step handling belongs."
            style={fieldStyle}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{ background: saving ? `${accent}88` : accent, border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", padding: "10px 18px", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : "Save SOP"}
        </button>
      </div>
    </Card>
  );
}

function SopEditorModal({ sop, issueTypes, t, accent, saving, onChange, onSave, onDelete, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 8, 20, 0.72)",
        backdropFilter: "blur(8px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: "860px", maxHeight: "90vh", overflowY: "auto" }}>
        <SopEditorCard
          sop={sop}
          issueTypes={issueTypes}
          t={t}
          accent={accent}
          saving={saving}
          onChange={onChange}
          onSave={onSave}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export function SOPs({ t, accent }) {
  const [sops, setSops] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [editingSopId, setEditingSopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingIds, setSavingIds] = useState({});
  const [testingSop, setTestingSop] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    const clientId = getActiveClientId();

    try {
      const [sopData, issueTypeData] = await Promise.all([
        apiFetch(`/api/sops?client_id=${clientId}`),
        apiFetch(`/api/issue-types?client_id=${clientId}`),
      ]);

      const normalizedSops = (Array.isArray(sopData) ? sopData : []).map(normalizeSop);
      setSops(normalizedSops);
      setIssueTypes(Array.isArray(issueTypeData) ? issueTypeData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load SOPs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const groups = issueTypes.map((issueType) => ({
      ...issueType,
      sops: sops.filter((sop) => sop.issue_type_id === issueType.id),
    }));

    return {
      groups,
      unlinked: sops.filter((sop) => !sop.issue_type_id),
    };
  }, [issueTypes, sops]);
  const editingSop = sops.find((sop) => sop.id === editingSopId) || null;

  function updateSopField(sopId, field, value) {
    setSops((current) => current.map((sop) => sop.id === sopId ? { ...sop, [field]: value, isDirty: true } : sop));
  }

  function addSop(issueTypeId = "") {
    const draft = createSopDraft(issueTypeId);
    setSops((current) => [draft, ...current]);
    setEditingSopId(draft.id);
  }

  async function saveSop(sop) {
    const payload = buildSopPayload(sop);
    if (!payload.title) {
      setError("SOP title is required.");
      return;
    }

    setSavingIds((current) => ({ ...current, [sop.id]: true }));
    setError("");
    const clientId = getActiveClientId();
    const method = sop.persistedId ? "PUT" : "POST";
    const path = sop.persistedId
      ? `/api/sops/${sop.persistedId}?client_id=${encodeURIComponent(clientId)}`
      : "/api/sops";

    try {
      const saved = normalizeSop(await apiJson(path, {
        method,
        body: payload,
      }));
      setSops((current) => {
        const next = current.map((item) => (item.id === sop.id || item.persistedId === saved.persistedId ? saved : item));
        return next.some((item) => item.id === saved.id) ? next : [saved, ...next];
      });
      setEditingSopId(null);
    } catch (saveError) {
      setError(saveError.message || "Failed to save SOP.");
    } finally {
      setSavingIds((current) => ({ ...current, [sop.id]: false }));
    }
  }

  async function deleteSop(sop) {
    setError("");
    const confirmed = window.confirm(`Delete "${sop.title.trim() || "this SOP"}"?`);
    if (!confirmed) return;
    if (!sop.persistedId) {
      setSops((current) => current.filter((item) => item.id !== sop.id));
      if (editingSopId === sop.id) setEditingSopId(null);
      return;
    }

    const clientId = getActiveClientId();
    try {
      await apiJson(`/api/sops/${sop.persistedId}?client_id=${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      });
      setSops((current) => current.filter((item) => item.id !== sop.id));
      if (editingSopId === sop.id) setEditingSopId(null);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete SOP.");
    }
  }

  return (
    <div>
      <SectionHeader
        title="SOPs"
        sub="SOPs are detailed operational workflows. The AI classifies the Issue Type first, then checks SOPs linked to that Issue Type before falling back to Knowledge Base."
        t={t}
      />

      <Card t={t} style={{ padding: "18px 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            SOP Model
          </div>
          <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
            Detailed workflow logic lives here. Each SOP should have a title, trigger conditions, instructions, linked issue type, and status.
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => addSop("")}
          style={{ background: "none", border: `1px dashed ${t.border}`, borderRadius: "10px", color: t.text, fontSize: "12px", fontWeight: "700", padding: "10px 16px", cursor: "pointer" }}
        >
          + Add SOP
        </button>
        <div style={{ fontSize: "12px", color: t.textSub }}>
          {sops.length} SOP{sops.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #FB718544", background: "#FB718514", color: "#FB7185", fontSize: "12px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <Card t={t} style={{ padding: "24px" }}>
          <div style={{ fontSize: "12px", color: t.textMuted }}>Loading SOPs...</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
            {grouped.groups.map((group) => (
              <div key={group.id}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {group.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSop(group.id)}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "10px", fontWeight: "700", padding: "5px 8px", cursor: "pointer" }}
                  >
                    + Add
                  </button>
                </div>
                {group.sops.length === 0 ? (
                  <div style={{ fontSize: "11px", color: t.textMuted, padding: "6px 2px 0" }}>No SOPs linked yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {group.sops.map((sop) => {
                      return (
                        <Card
                          key={sop.id}
                          t={t}
                          style={{
                            padding: "16px 18px",
                            background: t.surface,
                            borderRadius: "14px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div style={{
                              width: "10px",
                              minHeight: "78px",
                              borderRadius: "999px",
                              background: `linear-gradient(180deg, ${accent}, ${accent}55)`,
                              flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                                <span style={{ fontSize: "18px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em" }}>
                                  {sop.title.trim() || "New SOP"}
                                </span>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                                  <Pill color={accent}>{sop.status}</Pill>
                                  {sop.isDirty && (
                                    <Pill color="#F59E0B">Unsaved</Pill>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize: "13px", color: t.textSub, lineHeight: "1.7", marginBottom: "8px" }}>
                                {sop.instructions?.trim()
                                  ? `${sop.instructions.slice(0, 120)}${sop.instructions.length > 120 ? "..." : ""}`
                                  : "No instructions yet."}
                              </div>
                              <div style={{ fontSize: "12px", color: t.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "10px" }}>
                                {sop.trigger_conditions_text?.trim()
                                  ? sop.trigger_conditions_text.split(/\r?\n/).filter(Boolean).slice(0, 1)[0]
                                  : "No trigger conditions yet"}
                              </div>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => setTestingSop(sop)}
                                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                                >
                                  Test
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSopId(sop.id)}
                                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSop(sop)}
                                  style={{ background: "none", border: `1px solid #FB718540`, borderRadius: "8px", color: "#FB7185", fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Unlinked SOPs
                </div>
                <button
                  type="button"
                  onClick={() => addSop("")}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "10px", fontWeight: "700", padding: "5px 8px", cursor: "pointer" }}
                >
                  + Add
                </button>
              </div>
              {grouped.unlinked.length === 0 ? (
                <div style={{ fontSize: "11px", color: t.textMuted, padding: "6px 2px 0" }}>No unlinked SOPs.</div>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  {grouped.unlinked.map((sop) => {
                    return (
                      <Card
                        key={sop.id}
                        t={t}
                        style={{
                          padding: "16px 18px",
                          background: t.surface,
                          borderRadius: "14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <div style={{
                            width: "10px",
                            minHeight: "78px",
                            borderRadius: "999px",
                            background: "#F59E0B66",
                            opacity: 1,
                            flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                              <span style={{ fontSize: "18px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em" }}>
                                {sop.title.trim() || "New SOP"}
                              </span>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                                <Pill color="#F59E0B">unlinked</Pill>
                                {sop.isDirty && <Pill color="#F59E0B">Unsaved</Pill>}
                              </div>
                            </div>
                            <div style={{ fontSize: "13px", color: t.textSub, lineHeight: "1.7", marginBottom: "10px" }}>
                              {sop.instructions?.trim()
                                ? `${sop.instructions.slice(0, 120)}${sop.instructions.length > 120 ? "..." : ""}`
                                : "No instructions yet."}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                              <button
                                  type="button"
                                  onClick={() => setTestingSop(sop)}
                                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                                >
                                  Test
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSopId(sop.id)}
                                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                                >
                                  Edit
                                </button>
                              <button
                                type="button"
                                onClick={() => deleteSop(sop)}
                                style={{ background: "none", border: `1px solid #FB718540`, borderRadius: "8px", color: "#FB7185", fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
        </div>
      )}

      {editingSop && (
        <SopEditorModal
          sop={editingSop}
          issueTypes={issueTypes}
          t={t}
          accent={accent}
          saving={!!savingIds[editingSop.id]}
          onChange={(field, value) => updateSopField(editingSop.id, field, value)}
          onSave={() => saveSop(editingSop)}
          onDelete={() => deleteSop(editingSop)}
          onClose={() => setEditingSopId(null)}
        />
      )}

      {testingSop?.persistedId && (
        <ContentTestModal
          title="Test SOP"
          itemType="SOP"
          itemLabel={testingSop.title.trim() || "Untitled SOP"}
          endpoint={`/api/sops/${testingSop.persistedId}/test`}
          t={t}
          accent={accent}
          onClose={() => setTestingSop(null)}
        />
      )}
    </div>
  );
}



