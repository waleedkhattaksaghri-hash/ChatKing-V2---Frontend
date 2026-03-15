import { useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson, getActiveClientId } from "../lib/api";
import {
  buildIssueTypeAiConfig,
  buildIssueTypePayload,
  createIssueTypeDraft,
  mergeSavedIssueType,
  normalizeIssueTypeRecord,
  removeIssueTypeRow,
  updateIssueTypeField,
  validateIssueType,
} from "../lib/issueTypes";
import { Card, Pill, SectionHeader } from "./ui";
import { ContentTestModal } from "./ContentTestModal";

const ISSUE_TYPE_PAGE_FIELDS = [
  "Name",
  "Description",
  "Linked SOP count",
  "Escalation rules",
];

export function IssueTypeEditorCard({ row, t, accent, errors, saving, linkedSopCount, onChange, onDelete, onSave }) {
  const inputStyle = {
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
    <Card t={t} style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.03em" }}>
            {row.name.trim() || "New Issue Type"}
          </div>
          <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>
            Broad classifier only. Detailed workflow logic belongs in SOPs.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Pill color={accent}>{linkedSopCount} linked SOP{linkedSopCount === 1 ? "" : "s"}</Pill>
          {row.isDirty && <Pill color={accent}>Unsaved</Pill>}
          <button
            type="button"
            onClick={onDelete}
            style={{ background: "none", border: "none", color: "#FB7185", cursor: "pointer", fontSize: "12px", fontWeight: "600", padding: 0 }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Name
          </label>
          <input
            value={row.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Examples: Late Delivery, Refund Request, Missing Item"
            style={{ ...inputStyle, minHeight: "46px" }}
          />
          {errors?.name && <div style={{ marginTop: "6px", fontSize: "11px", color: "#FB7185" }}>{errors.name}</div>}
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Description
          </label>
          <textarea
            value={row.description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={4}
            placeholder="Describe the issue type in plain language so the model and your team can understand when it applies."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Escalation Rules
          </label>
          <textarea
            value={row.escalationRulesText}
            onChange={(event) => onChange("escalationRulesText", event.target.value)}
            rows={5}
            placeholder="One escalation trigger per line, or paste JSON if you already have a structured rule set."
            style={inputStyle}
          />
          <div style={{ marginTop: "6px", fontSize: "11px", color: t.textSub }}>
            These rules still feed escalation logic. Plain text is converted into a structured rules list automatically.
          </div>
        </div>

        <details style={{ border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px 14px", background: t.surface }}>
          <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: "700", color: t.text }}>
            Advanced classification guidance
          </summary>
          <div style={{ marginTop: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
              AI Instructions
            </label>
            <textarea
              value={row.aiInstructions}
              onChange={(event) => onChange("aiInstructions", event.target.value)}
              rows={5}
              placeholder="Tell the classifier how to recognize this issue type and distinguish it from similar categories."
              style={inputStyle}
            />
          </div>
        </details>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            background: saving ? `${accent}88` : accent,
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "700",
            padding: "10px 18px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Issue Type"}
        </button>
      </div>
    </Card>
  );
}

function IssueTypeEditorModal({ row, t, accent, errors, saving, linkedSopCount, onChange, onDelete, onSave, onClose }) {
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
        <IssueTypeEditorCard
          row={row}
          t={t}
          accent={accent}
          errors={errors}
          saving={saving}
          linkedSopCount={linkedSopCount}
          onChange={onChange}
          onDelete={onDelete}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

export function IssueTypes({ t, accent }) {
  const [rows, setRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState({});
  const [errorsById, setErrorsById] = useState({});
  const [requestError, setRequestError] = useState("");
  const [linkedSopCounts, setLinkedSopCounts] = useState({});
  const [testingRow, setTestingRow] = useState(null);

  async function loadRows() {
    setLoading(true);
    setRequestError("");
    const clientId = getActiveClientId();
    const [data, sopData] = await Promise.all([
      apiFetch(`/api/issue-types?client_id=${clientId}`),
      apiFetch(`/api/sops?client_id=${clientId}`),
    ]);
    setRows((data || []).map(normalizeIssueTypeRecord));
    const counts = {};
    for (const sop of Array.isArray(sopData) ? sopData : []) {
      if (sop.issue_type_id) {
        counts[sop.issue_type_id] = (counts[sop.issue_type_id] || 0) + 1;
      }
    }
    setLinkedSopCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, []);

  const aiPreview = useMemo(() => rows.map((row) => buildIssueTypeAiConfig(row)), [rows]);
  const editingRow = rows.find((row) => row.id === editingRowId) || null;

  function handleChange(rowId, field, value) {
    setRows((current) => updateIssueTypeField(current, rowId, field, value));
    setErrorsById((current) => ({ ...current, [rowId]: {} }));
  }

  async function handleSave(row) {
    const validation = validateIssueType(row);
    if (!validation.valid) {
      setErrorsById((current) => ({ ...current, [row.id]: validation.errors }));
      return;
    }

    const clientId = getActiveClientId();
    const payload = buildIssueTypePayload(row, clientId);
    const path = row.persistedId
      ? `/api/issue-types/${row.persistedId}?client_id=${encodeURIComponent(clientId)}`
      : "/api/issue-types";
    const method = row.persistedId ? "PUT" : "POST";

    setSavingIds((current) => ({ ...current, [row.id]: true }));
    setRequestError("");

    try {
      const saved = await apiJson(path, {
        method,
        body: payload,
      });
      setRows((current) => mergeSavedIssueType(current, saved));
      setErrorsById((current) => ({ ...current, [row.id]: {} }));
      setEditingRowId(null);
    } catch (error) {
      setRequestError(error.message || "Failed to save issue type.");
    } finally {
      setSavingIds((current) => ({ ...current, [row.id]: false }));
    }
  }

  async function handleDelete(row) {
    setRequestError("");
    const confirmed = window.confirm(`Delete "${row.name.trim() || "this issue type"}"?`);
    if (!confirmed) return;

    if (!row.persistedId) {
      setRows((current) => removeIssueTypeRow(current, row.id));
      if (editingRowId === row.id) setEditingRowId(null);
      return;
    }

    const clientId = getActiveClientId();

    try {
      await apiJson(`/api/issue-types/${row.persistedId}?client_id=${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      });

      setRows((current) => removeIssueTypeRow(current, row.id));
      if (editingRowId === row.id) setEditingRowId(null);
    } catch (error) {
      setRequestError(error.message || "Failed to delete issue type.");
    }
  }

  function handleAddRow() {
    const draft = createIssueTypeDraft();
    setRows((current) => [draft, ...current]);
    setEditingRowId(draft.id);
  }

  return (
    <div>
      <SectionHeader
        title="Issue Types"
        sub="Define the minimal issue-type signals the classifier needs. Keep them compact so routing stays accurate and cheap."
        t={t}
      />

      <Card t={t} style={{ padding: "18px 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            What This Controls
          </div>
          <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
            Issue Types are now only used for classification, routing, escalation logic, and clarifying-question behavior. They are not a factual source.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
            {ISSUE_TYPE_PAGE_FIELDS.map((label) => (
              <Pill key={label} color={accent}>{label}</Pill>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleAddRow}
          style={{
            background: "none",
            border: `1px dashed ${t.border}`,
            borderRadius: "10px",
            color: t.text,
            fontSize: "12px",
            fontWeight: "700",
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          + Add Issue Type
        </button>
        <div style={{ fontSize: "12px", color: t.textSub }}>
          {rows.length} issue type{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      {requestError && (
        <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #FB718544", background: "#FB718514", color: "#FB7185", fontSize: "12px" }}>
          {requestError}
        </div>
      )}

      {loading ? (
        <Card t={t} style={{ padding: "40px", textAlign: "center", color: t.textSub }}>
          Loading issue types...
        </Card>
      ) : rows.length === 0 ? (
        <Card t={t} style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "8px" }}>
            No issue types yet
          </div>
          <div style={{ fontSize: "12.5px", color: t.textSub }}>
            Add your first issue type to define how the classifier should route support requests.
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
            {rows.map((row) => {
              const linkedCount = row.persistedId ? (linkedSopCounts[row.persistedId] || 0) : 0;
              return (
                <Card
                  key={row.id}
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
                          {row.name.trim() || "New Issue Type"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: accent,
                            background: `${accent}14`,
                            border: `1px solid ${accent}26`,
                            borderRadius: "999px",
                            padding: "3px 8px",
                          }}>
                            {linkedCount} SOP{linkedCount === 1 ? "" : "s"}
                          </span>
                          {row.isDirty && (
                            <span style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              color: "#F59E0B",
                              background: "#F59E0B14",
                              border: "1px solid #F59E0B2A",
                              borderRadius: "999px",
                              padding: "3px 8px",
                            }}>
                              Unsaved
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", color: t.textSub, lineHeight: "1.7", marginBottom: "8px" }}>
                        {row.description?.trim() || "Classification, routing, and escalation logic only."}
                      </div>
                      <div style={{ fontSize: "12px", color: t.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "10px" }}>
                        {row.escalationRulesText?.trim()
                          ? row.escalationRulesText.split(/\r?\n/).filter(Boolean).slice(0, 1)[0]
                          : "No escalation rules yet"}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setTestingRow(row)}
                          style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                        >
                          Test
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRowId(row.id)}
                          style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "600", padding: "7px 12px", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
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

      {editingRow && (
        <IssueTypeEditorModal
          row={editingRow}
          t={t}
          accent={accent}
          errors={errorsById[editingRow.id]}
          saving={!!savingIds[editingRow.id]}
          linkedSopCount={editingRow.persistedId ? (linkedSopCounts[editingRow.persistedId] || 0) : 0}
          onChange={(field, value) => handleChange(editingRow.id, field, value)}
          onDelete={() => handleDelete(editingRow)}
          onSave={() => handleSave(editingRow)}
          onClose={() => setEditingRowId(null)}
        />
      )}

      {testingRow?.persistedId && (
        <ContentTestModal
          title="Test Issue Type"
          itemType="Issue Type"
          itemLabel={testingRow.name.trim() || "Untitled Issue Type"}
          endpoint={`/api/issue-types/${testingRow.persistedId}/test`}
          t={t}
          accent={accent}
          onClose={() => setTestingRow(null)}
        />
      )}

      <Card t={t} style={{ padding: "18px 20px", marginTop: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
          AI Config Preview
        </div>
        <pre style={{ margin: 0, fontSize: "11px", lineHeight: "1.6", color: t.textSub, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(aiPreview, null, 2)}
        </pre>
      </Card>
    </div>
  );
}



