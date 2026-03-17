import { useEffect, useMemo, useState } from "react";

import { apiJson, getActiveClientId } from "../lib/api";

import { useApi } from "../lib/useApi";

import { Card, Pill, SectionHeader, Tag } from "./ui";

import { ContentTestModal } from "./ContentTestModal";
import { PageGuideCard, isSimpleClientMode } from "./SetupGuidance";



const MEMORY_TYPE_OPTIONS = [

  "resolved_case",

  "policy_clarification",

  "response_pattern",

  "phrase_map",

  "retrieval_feedback",

];



const STATUS_OPTIONS = ["draft", "approved", "archived"];

const CHANNEL_OPTIONS = ["", "chat", "email", "whatsapp"];



function createDraft() {

  return {

    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

    persistedId: null,

    memory_type: "resolved_case",

    title: "",

    summary: "",

    source_text: "",

    issue_type_id: "",

    sop_id: "",

    knowledge_base_id: "",

    channel: "",

    confidence: "0.50",

    priority: "0",

    status: "draft",

    metadata: "{}",

    isDirty: true,

  };

}



function normalizeEntry(entry = {}) {

  return {

    id: entry.id || `memory-${Math.random().toString(36).slice(2, 7)}`,

    persistedId: entry.id || null,

    memory_type: entry.memory_type || "resolved_case",

    title: entry.title || "",

    summary: entry.summary || "",

    source_text: entry.source_text || "",

    issue_type_id: entry.issue_type_id || "",

    sop_id: entry.sop_id || "",

    knowledge_base_id: entry.knowledge_base_id || "",

    channel: entry.channel || "",

    confidence: String(entry.confidence ?? 0.5),

    priority: String(entry.priority ?? 0),

    status: entry.status || "draft",

    metadata: typeof entry.metadata === "string" ? entry.metadata : JSON.stringify(entry.metadata || {}, null, 2),

    created_at: entry.created_at || null,

    updated_at: entry.updated_at || null,

    isDirty: false,

  };

}



function buildPayload(entry, clientId) {

  let metadata = {};

  if (String(entry.metadata || "").trim()) {

    try {

      metadata = JSON.parse(entry.metadata);

    } catch {

      metadata = { raw: entry.metadata };

    }

  }



  return {

    client_id: clientId,

    memory_type: entry.memory_type,

    title: String(entry.title || "").trim(),

    summary: String(entry.summary || "").trim(),

    source_text: String(entry.source_text || "").trim(),

    issue_type_id: entry.issue_type_id || null,

    sop_id: entry.sop_id || null,

    knowledge_base_id: entry.knowledge_base_id || null,

    channel: entry.channel || null,

    confidence: Number(entry.confidence || 0.5),

    priority: Number(entry.priority || 0),

    status: entry.status || "draft",

    metadata,

  };

}



function MemoryEditorModal({ entry, issueTypes, sops, articles, t, accent, saving, onChange, onSave, onDelete, onClose }) {
  const isDirty = !!entry.isDirty;

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

    <div

      style={{

        position: "fixed",

        inset: 0,

        background: "rgba(3, 8, 20, 0.72)",

        backdropFilter: "blur(8px)",

        zIndex: 2200,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "24px",

      }}

      onClick={(event) => event.target === event.currentTarget && onClose()}

    >

      <Card t={t} style={{ width: "100%", maxWidth: "920px", maxHeight: "92vh", overflowY: "auto", padding: "20px" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "18px" }}>

          <div>

            <div style={{ fontSize: "20px", fontWeight: "800", color: t.text, letterSpacing: "-0.03em" }}>

              {entry.persistedId ? "Edit Memory" : "New Memory"}

            </div>

            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "5px" }}>

              Approved memories influence the client brain. Draft or archived memories stay out of the live answer path.

            </div>

          </div>

          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted, fontSize: "22px", cursor: "pointer" }}>?</button>

        </div>



        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", marginBottom: "14px" }}>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Memory Type</label>

            <select value={entry.memory_type} onChange={(e) => onChange("memory_type", e.target.value)} style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}>

              {MEMORY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}

            </select>

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Status</label>

            <select value={entry.status} onChange={(e) => onChange("status", e.target.value)} style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}>

              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}

            </select>

          </div>

        </div>



        <div style={{ display: "grid", gap: "14px" }}>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Title</label>

            <input value={entry.title} onChange={(e) => onChange("title", e.target.value)} placeholder="Short label for this memory" style={{ ...fieldStyle, minHeight: "46px" }} />

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Summary</label>

            <textarea value={entry.summary} onChange={(e) => onChange("summary", e.target.value)} rows={3} placeholder="Short explanation of what this memory teaches the agent" style={fieldStyle} />

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Source Text</label>

            <textarea value={entry.source_text} onChange={(e) => onChange("source_text", e.target.value)} rows={8} placeholder="Resolved guidance, approved clarification, or a known support pattern for this client" style={fieldStyle} />

          </div>

        </div>



        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px", marginTop: "14px" }}>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Issue Type</label>

            <select value={entry.issue_type_id} onChange={(e) => onChange("issue_type_id", e.target.value)} style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}>

              <option value="">Unlinked</option>

              {issueTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}

            </select>

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>SOP</label>

            <select value={entry.sop_id} onChange={(e) => onChange("sop_id", e.target.value)} style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}>

              <option value="">Unlinked</option>

              {sops.map((item) => <option key={item.id} value={item.id}>{item.title || item.name}</option>)}

            </select>

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Knowledge Article</label>

            <select value={entry.knowledge_base_id} onChange={(e) => onChange("knowledge_base_id", e.target.value)} style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}>

              <option value="">Unlinked</option>

              {articles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}

            </select>

          </div>

        </div>



        <div style={{ display: "grid", gridTemplateColumns: "180px 160px 160px", gap: "14px", marginTop: "14px" }}>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Channel</label>

            <select value={entry.channel} onChange={(e) => onChange("channel", e.target.value)} style={{ ...fieldStyle, minHeight: "46px", resize: "none" }}>

              <option value="">All</option>

              {CHANNEL_OPTIONS.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}

            </select>

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Confidence</label>

            <input value={entry.confidence} onChange={(e) => onChange("confidence", e.target.value)} placeholder="0.50" style={{ ...fieldStyle, minHeight: "46px" }} />

          </div>

          <div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Priority</label>

            <input value={entry.priority} onChange={(e) => onChange("priority", e.target.value)} placeholder="0" style={{ ...fieldStyle, minHeight: "46px" }} />

          </div>

        </div>



        <div style={{ marginTop: "14px" }}>

          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Metadata (JSON)</label>

          <textarea value={entry.metadata} onChange={(e) => onChange("metadata", e.target.value)} rows={5} placeholder='{"source": "manual"}' style={fieldStyle} />

        </div>



        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "18px" }}>

          <div style={{ fontSize: "12px", color: t.textSub }}>

            To remove an item from the live brain without deleting it permanently, set status to <strong style={{ color: t.text }}>archived</strong>.

          </div>

          <div style={{ display: "flex", gap: "10px" }}>

            {entry.persistedId && (

              <button type="button" onClick={onDelete} style={{ background: "none", border: `1px solid #FB718544`, borderRadius: "10px", color: "#FB7185", fontSize: "12px", fontWeight: "700", padding: "10px 14px", cursor: "pointer" }}>

                Delete Permanently

              </button>

            )}

            <button type="button" onClick={onSave} disabled={saving} style={{ background: saving ? `${accent}88` : accent, border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", padding: "10px 18px", cursor: saving ? "not-allowed" : "pointer", boxShadow: !saving && isDirty ? `0 0 0 1px ${accent}55, 0 0 22px ${accent}55` : "none", transform: !saving && isDirty ? "translateY(-1px)" : "none", transition: "box-shadow 0.18s ease, transform 0.18s ease" }}>

              {saving ? "Saving..." : isDirty ? "Save Memory*" : "Save Memory"}

            </button>

          </div>

        </div>

      </Card>

    </div>

  );

}



export function ClientMemory({ t, accent, activeClient }) {

  const clientId = getActiveClientId();

  const { data: rawEntries, loading, error, refetch } = useApi(clientId ? `/api/client-memory?client_id=${clientId}` : null, [], [clientId]);

  const { data: rawIssueTypes } = useApi(clientId ? `/api/issue-types?client_id=${clientId}` : null, [], [clientId]);

  const { data: rawSops } = useApi(clientId ? `/api/sops?client_id=${clientId}` : null, [], [clientId]);

  const { data: rawArticles } = useApi(clientId ? `/api/knowledge?client_id=${clientId}` : null, [], [clientId]);



  const [entries, setEntries] = useState([]);

  const [editingEntry, setEditingEntry] = useState(null);

  const [testingEntry, setTestingEntry] = useState(null);

  const [saving, setSaving] = useState(false);

  const [requestError, setRequestError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const simpleMode = isSimpleClientMode(activeClient);



  useEffect(() => {

    setEntries((Array.isArray(rawEntries) ? rawEntries : []).map(normalizeEntry));

  }, [rawEntries]);



  const issueTypes = useMemo(() => Array.isArray(rawIssueTypes) ? rawIssueTypes : [], [rawIssueTypes]);

  const sops = useMemo(() => (Array.isArray(rawSops) ? rawSops : []).map((item) => ({ ...item, title: item.title || item.name || "Untitled SOP" })), [rawSops]);

  const articles = useMemo(() => (Array.isArray(rawArticles) ? rawArticles : []).filter((item) => item.status === "published"), [rawArticles]);



  const filteredEntries = useMemo(() => {

    if (statusFilter === "all") return entries;

    return entries.filter((entry) => entry.status === statusFilter);

  }, [entries, statusFilter]);



  const stats = useMemo(() => ({

    total: entries.length,

    approved: entries.filter((entry) => entry.status === "approved").length,

    draft: entries.filter((entry) => entry.status === "draft").length,

    archived: entries.filter((entry) => entry.status === "archived").length,

  }), [entries]);



  function openNew() {

    setEditingEntry(createDraft());

    setRequestError("");

  }



  function updateEditingField(field, value) {

    setEditingEntry((current) => current ? { ...current, [field]: value, isDirty: true } : current);

  }



  async function handleSave() {

    if (!editingEntry || !clientId) return;

    const payload = buildPayload(editingEntry, clientId);

    if (!payload.source_text) {

      setRequestError("Source text is required.");

      return;

    }



    setSaving(true);

    setRequestError("");

    try {

      const path = editingEntry.persistedId

        ? `/api/client-memory/${editingEntry.persistedId}?client_id=${encodeURIComponent(clientId)}`

        : "/api/client-memory";

      const method = editingEntry.persistedId ? "PUT" : "POST";

      const saved = await apiJson(path, { method, body: payload });

      const normalized = normalizeEntry(saved);

      setEntries((current) => editingEntry.persistedId

        ? current.map((item) => item.persistedId === editingEntry.persistedId ? normalized : item)

        : [normalized, ...current]

      );

      setEditingEntry(null);

      await refetch();

    } catch (saveError) {

      setRequestError(saveError.message || "Failed to save client memory.");

    } finally {

      setSaving(false);

    }

  }



  async function handleDelete(entry = editingEntry) {

    if (!entry?.persistedId || !clientId) return;

    if (!window.confirm(`Delete "${entry.title || "this memory"}" permanently?`)) return;



    setSaving(true);

    setRequestError("");

    try {

      await apiJson(`/api/client-memory/${entry.persistedId}?client_id=${encodeURIComponent(clientId)}`, {

        method: "DELETE",

        body: { client_id: clientId },

      });

      setEntries((current) => current.filter((item) => item.persistedId !== entry.persistedId));

      if (editingEntry?.persistedId === entry.persistedId) {

        setEditingEntry(null);

      }

      await refetch();

    } catch (deleteError) {

      setRequestError(deleteError.message || "Failed to delete client memory.");

    } finally {

      setSaving(false);

    }

  }



  async function quickStatusChange(entry, status) {

    if (!entry?.persistedId || !clientId) return;

    try {

      const saved = await apiJson(`/api/client-memory/${entry.persistedId}?client_id=${encodeURIComponent(clientId)}`, {

        method: "PUT",

        body: { ...buildPayload(entry, clientId), status },

      });

      const normalized = normalizeEntry(saved);

      setEntries((current) => current.map((item) => item.persistedId === entry.persistedId ? normalized : item));

      await refetch();

    } catch (statusError) {

      setRequestError(statusError.message || "Failed to update memory status.");

    }

  }



  return (

    <div>

      <SectionHeader

        title="Client Memory"

        sub="Per-client brain entries that improve retrieval and answer quality. Only approved memories influence the live agent. Archive an entry to remove it from the live brain without deleting it."

        t={t}

        action={(

          <button

            type="button"

            onClick={openNew}

            style={{ padding: "10px 16px", borderRadius: "12px", border: "none", background: accent, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}

          >

            New Memory

          </button>

        )}

      />

      <PageGuideCard
        t={t}
        accent={accent}
        title="Client Memory guidance"
        belongs={[
          "Repeated client-specific support patterns that reinforce stable SOP or Knowledge Base behavior.",
          "Known exceptions, phrasing habits, or resolved-case patterns that show up again and again.",
          "Approved guidance that helps retrieval stay tenant-specific without changing official policy.",
        ]}
        doesntBelong={[
          "The main source of truth for policy or facts. Keep that in SOPs or the Knowledge Base.",
          "One-off ticket notes that will never be reused.",
          "General brand behavior or escalation rules. Keep those in the Playbook or Issue Types.",
        ]}
        exampleTitle="Good example"
        exampleText={"Type: resolved_case\nTitle: Delivered but not received flow\nSummary: If tracking says delivered, confirm the address and ask whether a household member, front desk, or mailroom accepted it before escalating for carrier review."}
        simpleModeNote={simpleMode ? "Leave this for later unless the client already has clean SOPs and a published Knowledge Base. Memory helps most after the core setup is stable." : ""}
      />



      {requestError && (

        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "#FB718514", border: "1px solid #FB718540", color: "#FB7185", fontSize: "12px", marginBottom: "18px" }}>

          {requestError}

        </div>

      )}



      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "18px" }}>

        <Card t={t} style={{ padding: "16px 18px" }}><div style={{ fontSize: "11px", color: t.textSub, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Total</div><div style={{ fontSize: "26px", fontWeight: "700", color: t.text }}>{stats.total}</div></Card>

        <Card t={t} style={{ padding: "16px 18px" }}><div style={{ fontSize: "11px", color: t.textSub, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Approved</div><div style={{ fontSize: "26px", fontWeight: "700", color: "#10B981" }}>{stats.approved}</div></Card>

        <Card t={t} style={{ padding: "16px 18px" }}><div style={{ fontSize: "11px", color: t.textSub, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Draft</div><div style={{ fontSize: "26px", fontWeight: "700", color: "#F59E0B" }}>{stats.draft}</div></Card>

        <Card t={t} style={{ padding: "16px 18px" }}><div style={{ fontSize: "11px", color: t.textSub, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Archived</div><div style={{ fontSize: "26px", fontWeight: "700", color: t.textMuted }}>{stats.archived}</div></Card>

      </div>



      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>

        {["all", ...STATUS_OPTIONS].map((option) => (

          <Pill key={option} t={t} accent={accent} active={statusFilter === option} onClick={() => setStatusFilter(option)}>

            {option === "all" ? "All" : option}

          </Pill>

        ))}

      </div>



      <Card t={t} style={{ overflow: "hidden" }}>

        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, fontSize: "13px", fontWeight: "700", color: t.text }}>

          Memory Entries {loading ? "? Loading..." : error ? "? Error" : `? ${filteredEntries.length}`}

        </div>

        {!filteredEntries.length ? (

          <div style={{ padding: "20px 16px", fontSize: "12px", color: t.textMuted }}>

            {loading ? "Loading client memory..." : "No client memory entries yet."}

          </div>

        ) : (

          filteredEntries.map((entry, index) => (

            <div key={entry.id} style={{ padding: "16px", borderBottom: index < filteredEntries.length - 1 ? `1px solid ${t.borderLight}` : "none" }}>

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>

                    <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>{entry.title || "Untitled memory"}</div>

                    <Tag color={entry.status === "approved" ? "#10B981" : entry.status === "draft" ? "#F59E0B" : t.textMuted}>{entry.status}</Tag>

                    <Pill color={accent}>{entry.memory_type}</Pill>

                    {entry.channel ? <Pill color={accent}>{entry.channel}</Pill> : null}

                  </div>

                  {entry.summary && <div style={{ fontSize: "12px", color: t.textSub, lineHeight: 1.7, marginBottom: "8px" }}>{entry.summary}</div>}

                  <div style={{ fontSize: "12px", color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{entry.source_text.slice(0, 280)}{entry.source_text.length > 280 ? "..." : ""}</div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px", fontSize: "11px", color: t.textMuted }}>

                    <span>Confidence: {entry.confidence}</span>

                    <span>Priority: {entry.priority}</span>

                    {entry.issue_type_id ? <span>Linked Issue Type</span> : null}

                    {entry.sop_id ? <span>Linked SOP</span> : null}

                    {entry.knowledge_base_id ? <span>Linked KB</span> : null}

                  </div>

                </div>

                <div style={{ display: "grid", gap: "8px", justifyItems: "end" }}>

                  <button type="button" onClick={() => setEditingEntry(entry)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "700", padding: "7px 12px", cursor: "pointer" }}>Edit</button>

                  {entry.persistedId && <button type="button" onClick={() => setTestingEntry(entry)} style={{ background: "none", border: `1px solid ${accent}33`, borderRadius: "8px", color: accent, fontSize: "12px", fontWeight: "700", padding: "7px 12px", cursor: "pointer" }}>Test</button>}

                  {entry.status !== "approved" && <button type="button" onClick={() => quickStatusChange(entry, "approved")} style={{ background: "none", border: `1px solid #10B98144`, borderRadius: "8px", color: "#10B981", fontSize: "12px", fontWeight: "700", padding: "7px 12px", cursor: "pointer" }}>Approve</button>}

                  {entry.status !== "archived" && <button type="button" onClick={() => quickStatusChange(entry, "archived")} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", fontWeight: "700", padding: "7px 12px", cursor: "pointer" }}>Archive</button>}

                  <button type="button" onClick={() => handleDelete(entry)} style={{ background: "none", border: `1px solid #FB718544`, borderRadius: "8px", color: "#FB7185", fontSize: "12px", fontWeight: "700", padding: "7px 12px", cursor: "pointer" }}>Delete</button>

                </div>

              </div>

            </div>

          ))

        )}

      </Card>



      {editingEntry && (

        <MemoryEditorModal

          entry={editingEntry}

          issueTypes={issueTypes}

          sops={sops}

          articles={articles}

          t={t}

          accent={accent}

          saving={saving}

          onChange={updateEditingField}

          onSave={handleSave}

          onDelete={() => handleDelete(editingEntry)}

          onClose={() => setEditingEntry(null)}

        />

      )}



      {testingEntry?.persistedId && (

        <ContentTestModal

          title="Test Client Memory"

          endpoint={`/api/client-memory/${testingEntry.persistedId}/test`}

          itemType="Client Memory"

          itemLabel={testingEntry.title || testingEntry.summary || testingEntry.memory_type}

          t={t}

          accent={accent}

          onClose={() => setTestingEntry(null)}

        />

      )}

    </div>

  );

}

