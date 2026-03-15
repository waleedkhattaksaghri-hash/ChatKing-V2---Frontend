import { useEffect, useState } from "react";
import { apiFetch, apiJson, getActiveClientId } from "../lib/api";
import { runBackgroundJobFlow } from "../lib/backgroundJobs";
import { Card, JobStatusNotice, SectionHeader } from "./ui";

const TOOL_TYPE_META = {
  api:             { label: "API",             color: "#60A5FA" },
  n8n_workflow:    { label: "n8n Workflow",     color: "#A78BFA" },
  webhook:         { label: "Webhook",          color: "#34D399" },
  internal_action: { label: "Internal Action",  color: "#FBBF24" },
};
const METHOD_OPTIONS  = ["GET","POST","PUT","PATCH","DELETE"];
const AUTH_OPTIONS    = ["none","bearer","api_key","basic"];
const PARAM_TYPES     = ["string","number","boolean","array","object"];

// ── Parameters Builder ────────────────────────────────────────────────────────
function ParametersBuilder({ params, onChange, t, accent }) {
  function update(idx, field, val) {
    const next = params.map((p, i) => i === idx ? { ...p, [field]: val } : p);
    onChange(next);
  }
  function addParam() {
    onChange([...params, { name: "", type: "string", required: false, description: "" }]);
  }
  function removeParam(idx) {
    onChange(params.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {params.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 1fr 28px",
          gap: "8px", marginBottom: "6px", paddingBottom: "6px", borderBottom: `1px solid ${t.border}` }}>
          {["Name","Type","Req.","Description",""].map((h, i) => (
            <div key={i} style={{ fontSize: "10px", fontWeight: "700", color: t.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>
      )}
      {params.map((p, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 100px 60px 1fr 28px",
          gap: "8px", marginBottom: "8px", alignItems: "center" }}>
          <input value={p.name} onChange={e => update(idx, "name", e.target.value)}
            placeholder="param_name"
            style={{ fontSize: "12px", padding: "7px 10px", borderRadius: "7px",
              border: `1px solid ${t.border}`, background: t.surface, color: t.text,
              outline: "none", fontFamily: "'DM Mono', monospace" }} />
          <select value={p.type} onChange={e => update(idx, "type", e.target.value)}
            style={{ fontSize: "12px", padding: "7px 8px", borderRadius: "7px",
              border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none" }}>
            {PARAM_TYPES.map(t2 => <option key={t2} value={t2}>{t2}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "4px",
            fontSize: "11px", color: t.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={p.required} onChange={e => update(idx, "required", e.target.checked)}
              style={{ accentColor: accent }} />
            Req
          </label>
          <input value={p.description || ""} onChange={e => update(idx, "description", e.target.value)}
            placeholder="Description"
            style={{ fontSize: "12px", padding: "7px 10px", borderRadius: "7px",
              border: `1px solid ${t.border}`, background: t.surface, color: t.text, outline: "none" }} />
          <button onClick={() => removeParam(idx)} style={{ background: "none", border: "none",
            color: "#FB7185", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px" }}>×</button>
        </div>
      ))}
      <button onClick={addParam} style={{ fontSize: "12px", padding: "6px 14px", background: "none",
        border: `1px dashed ${t.border}`, borderRadius: "7px", color: t.textMuted, cursor: "pointer",
        marginTop: "4px", transition: "border-color 0.15s, color 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}>
        + Add Parameter
      </button>
    </div>
  );
}

// ── Tool Form Modal ───────────────────────────────────────────────────────────
function ToolFormModal({ tool, t, accent, onSave, onClose }) {
  const isEdit = !!tool?.id;
  const [form, setForm] = useState(() => {
  const baseTool = {
    name: "", slug: "", description: "", tool_type: "api",
    endpoint: "", method: "GET", auth_type: "none",
    auth_token: "", auth_key_name: "", auth_key_value: "",
    auth_username: "", auth_password: "",
    headers: "{}", parameters: [], response_schema: "{}", status: "draft",
    ...(tool || {}),
  };

  return {
    ...baseTool,
    headers: JSON.stringify(tool?.headers || {}, null, 2),
    response_schema: JSON.stringify(tool?.response_schema || {}, null, 2),
    parameters: tool?.parameters || [],
  };
});
  const [saving, setSaving] = useState(false);
  const [jsonErrors, setJsonErrors] = useState({});

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-generate slug from name if creating
      if (k === "name" && !isEdit) {
        next.slug = v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      }
      return next;
    });
  }

  async function save() {
    // Validate JSON fields
    const errs = {};
    try { JSON.parse(form.headers); }         catch { errs.headers = true; }
    try { JSON.parse(form.response_schema); } catch { errs.response_schema = true; }
    if (Object.keys(errs).length) { setJsonErrors(errs); return; }
    setJsonErrors({});

    setSaving(true);
    await onSave({
      ...form,
      headers:         JSON.parse(form.headers),
      response_schema: JSON.parse(form.response_schema),
    });
    setSaving(false);
  }

  function fieldLabel(label, required = false) {
    return (
      <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: t.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "#FB7185" }}> *</span>}
      </label>
    );
  }
  function inp(k, placeholder = "", type = "text") {
    return (
      <input type={type} value={form[k] || ""} onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
          border: `1px solid ${t.border}`, background: t.surface, color: t.text,
          outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
        onFocus={e => e.target.style.borderColor = accent}
        onBlur={e => e.target.style.borderColor = t.border} />
    );
  }
  function jsonField(k, placeholder = "{}") {
    return (
      <textarea value={form[k]} onChange={e => set(k, e.target.value)} rows={4}
        placeholder={placeholder}
        style={{ width: "100%", fontSize: "11px", padding: "9px 12px", borderRadius: "8px",
          border: `1.5px solid ${jsonErrors[k] ? "#FB7185" : t.border}`,
          background: t.surface, color: jsonErrors[k] ? "#FB7185" : "#A78BFA",
          outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace",
          resize: "vertical" }} />
    );
  }
  function sel(k, options) {
    return (
      <select value={form[k]} onChange={e => set(k, e.target.value)}
        style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
          border: `1px solid ${t.border}`, background: t.surface, color: t.text,
          outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>)}
      </select>
    );
  }

  const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", padding: "32px 16px" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px",
        width: "660px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
            {isEdit ? "Edit Tool" : "Create Tool"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
            cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Name + Slug */}
          <div style={row2}>
            <div>{fieldLabel("Tool Name", true)}{inp("name", "e.g. Check Order Status")}</div>
            <div>{fieldLabel("Slug", true)}
              <input value={form.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="check_order_status"
                style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
                  border: `1px solid ${t.border}`, background: t.surface, color: accent,
                  outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace" }} />
            </div>
          </div>

          {/* Description */}
          <div>
            {fieldLabel("Description")}
            <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="What does this tool do?"
              style={{ width: "100%", fontSize: "13px", padding: "9px 12px", borderRadius: "8px",
                border: `1px solid ${t.border}`, background: t.surface, color: t.text,
                outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
          </div>

          {/* Type + Status */}
          <div style={row2}>
            <div>{fieldLabel("Tool Type")}{sel("tool_type", Object.keys(TOOL_TYPE_META).map(k => ({ value: k, label: TOOL_TYPE_META[k].label })))}</div>
            <div>{fieldLabel("Status")}{sel("status", ["draft","active","disabled"])}</div>
          </div>

          {/* Endpoint + Method */}
          {form.tool_type !== "internal_action" && (
            <div style={row2}>
              <div>{fieldLabel("Endpoint / URL", true)}
                {inp("endpoint", "https://api.example.com/orders/{order_id}")}
              </div>
              <div>{fieldLabel("HTTP Method")}{sel("method", METHOD_OPTIONS)}</div>
            </div>
          )}

          {/* Authentication */}
          <div>
            {fieldLabel("Authentication")}
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              {AUTH_OPTIONS.map(opt => (
                <button key={opt} onClick={() => set("auth_type", opt)} style={{
                  padding: "6px 14px", borderRadius: "7px", fontSize: "12px",
                  background: form.auth_type === opt ? `${accent}18` : t.surfaceHover || t.surface,
                  border: `1.5px solid ${form.auth_type === opt ? accent : t.border}`,
                  color: form.auth_type === opt ? accent : t.textMuted,
                  cursor: "pointer", fontWeight: form.auth_type === opt ? "600" : "400",
                }}>{opt === "none" ? "None" : opt === "bearer" ? "Bearer Token" : opt === "api_key" ? "API Key" : "Basic Auth"}</button>
              ))}
            </div>
            {form.auth_type === "bearer" && (
              <div>{fieldLabel("Bearer Token")}{inp("auth_token", "eyJ...")}</div>
            )}
            {form.auth_type === "api_key" && (
              <div style={row2}>
                <div>{fieldLabel("Header Name")}{inp("auth_key_name", "X-API-Key")}</div>
                <div>{fieldLabel("Header Value")}{inp("auth_key_value", "sk-...")}</div>
              </div>
            )}
            {form.auth_type === "basic" && (
              <div style={row2}>
                <div>{fieldLabel("Username")}{inp("auth_username", "admin")}</div>
                <div>{fieldLabel("Password")}{inp("auth_password", "••••••", "password")}</div>
              </div>
            )}
          </div>

          {/* Custom Headers */}
          <div>
            {fieldLabel("Custom Headers (JSON)")}
            {jsonErrors.headers && <div style={{ fontSize: "11px", color: "#FB7185", marginBottom: "4px" }}>Invalid JSON</div>}
            {jsonField("headers", '{"Content-Type": "application/json"}')}
          </div>

          {/* Parameters */}
          <div>
            {fieldLabel("Parameters")}
            <ParametersBuilder params={form.parameters} onChange={v => set("parameters", v)} t={t} accent={accent} />
          </div>

          {/* Response Schema */}
          <div>
            {fieldLabel("Response Schema (JSON)")}
            {jsonErrors.response_schema && <div style={{ fontSize: "11px", color: "#FB7185", marginBottom: "4px" }}>Invalid JSON</div>}
            {jsonField("response_schema", '{"order_id": "string", "status": "string"}')}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", background: "none",
            border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text,
            fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: "9px 24px", background: accent,
            border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tool Test Modal ───────────────────────────────────────────────────────────
function ToolTestModal({ tool, t, accent, onClose }) {
  const clientId = getActiveClientId();
  const [paramValues, setParamValues] = useState({});
  const [running, setRunning]         = useState(false);
  const [result, setResult]           = useState(null);

  async function runTest() {
    setRunning(true);
    setResult(null);
    try {
      const data = await apiJson(`/api/tools/${tool.id}/test`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: { client_id: clientId, parameters: paramValues },
      });
      setResult(data);
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setRunning(false);
  }

  const typeColor = TOOL_TYPE_META[tool.tool_type]?.color || t.textMuted;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px",
        width: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              Test: {tool.name}
            </div>
            <div style={{ fontSize: "11px", color: typeColor, fontFamily: "'DM Mono', monospace", marginTop: "2px" }}>
              {tool.slug} · {TOOL_TYPE_META[tool.tool_type]?.label}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted,
            cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Parameter inputs */}
          {(tool.parameters || []).length > 0 ? (
            <>
              <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
                Parameters
              </div>
              {(tool.parameters || []).map(p => (
                <div key={p.name} style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600",
                    color: t.text, marginBottom: "4px" }}>
                    {p.name}
                    {p.required && <span style={{ color: "#FB7185", marginLeft: "4px" }}>*</span>}
                    <span style={{ color: t.textMuted, fontWeight: "400", marginLeft: "8px", fontSize: "11px" }}>
                      ({p.type}){p.description ? ` — ${p.description}` : ""}
                    </span>
                  </label>
                  <input value={paramValues[p.name] || ""}
                    onChange={e => setParamValues(v => ({ ...v, [p.name]: e.target.value }))}
                    placeholder={`Enter ${p.name}…`}
                    style={{ width: "100%", fontSize: "12px", padding: "8px 12px", borderRadius: "7px",
                      border: `1px solid ${t.border}`, background: t.bg || "#070911", color: t.text,
                      outline: "none", boxSizing: "border-box", fontFamily: "'DM Mono', monospace" }} />
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontSize: "12px", color: t.textMuted, marginBottom: "16px" }}>
              This tool has no parameters. Click Run to test it.
            </div>
          )}

          {/* Result */}
          {result !== null && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.07em" }}>Response</div>
                <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: "600",
                  background: result.success ? "#34D39920" : "#FB718520",
                  color: result.success ? "#34D399" : "#FB7185" }}>
                  {result.success ? `✓ Success` : "✗ Failed"}
                  {result.status ? ` · HTTP ${result.status}` : ""}
                  {result.duration_ms ? ` · ${result.duration_ms}ms` : ""}
                </span>
              </div>
              <pre style={{ background: t.bg || "#070911", border: `1px solid ${t.border}`,
                borderRadius: "8px", padding: "14px", fontSize: "11px", color: "#A78BFA",
                overflow: "auto", maxHeight: "260px", margin: 0,
                fontFamily: "'DM Mono', monospace", lineHeight: "1.5" }}>
                {JSON.stringify(result.data ?? result.error ?? result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${t.border}`,
          display: "flex", gap: "10px", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "none",
            border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text,
            fontSize: "13px", cursor: "pointer" }}>Close</button>
          <button onClick={runTest} disabled={running} style={{ padding: "8px 24px",
            background: running ? t.surfaceHover : accent, border: "none", borderRadius: "8px",
            color: running ? t.textMuted : "#fff", fontSize: "13px", fontWeight: "600",
            cursor: running ? "not-allowed" : "pointer" }}>
            {running ? "Running…" : "▶ Run Tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Tools component ──────────────────────────────────────────────────────
export function Tools({ t, accent }) {
  const clientId = getActiveClientId();
  const [tools, setTools]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("tools");   // "tools" | "registry" | "suggested"
  const [showForm, setShowForm]         = useState(false);
  const [editTool, setEditTool]         = useState(null);
  const [testTool, setTestTool]         = useState(null);
  const [registry, setRegistry]         = useState([]);
  const [regLoading, setRegLoading]     = useState(false);
  const [suggestions, setSuggestions]   = useState([]);
  const [sugLoading, setSugLoading]     = useState(false);
  const [sugGenerating, setSugGenerating] = useState(false);
  const [suggestionJob, setSuggestionJob] = useState(null);

  async function loadTools() {
    setLoading(true);
    const data = await apiFetch(`/api/tools?client_id=${clientId}`);
    setTools(data || []);
    setLoading(false);
  }

  async function loadRegistry() {
    setRegLoading(true);
    const data = await apiFetch(`/api/tools/registry/stats?client_id=${clientId}`);
    setRegistry(data || []);
    setRegLoading(false);
  }

  async function loadSuggestions() {
    setSugLoading(true);
    const data = await apiFetch(`/api/insights/tool-suggestions?client_id=${clientId}`);
    setSuggestions(data || []);
    setSugLoading(false);
  }

  async function generateSuggestions() {
    setSugGenerating(true);
    try {
      await runBackgroundJobFlow({
        title: "Tool suggestion analysis",
        path: "/api/insights/suggest-tools",
        body: { client_id: clientId },
        setNotice: setSuggestionJob,
        onComplete: loadSuggestions,
      });
    } catch (error) {
      console.error(error);
      setSuggestionJob({
        title: "Tool suggestion analysis",
        status: "failed",
        detail: error.message,
      });
    }
    setSugGenerating(false);
  }

  async function dismissSuggestion(id) {
    setSuggestions(prev => prev.filter(s => s.id !== id));
    await apiJson(`/api/insights/tool-suggestions/${id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      body: { client_id: clientId, status: "dismissed" },
    });
  }

  useEffect(() => { loadTools(); }, []);
  useEffect(() => { if (tab === "registry") loadRegistry(); }, [tab]);
  useEffect(() => { if (tab === "suggested") loadSuggestions(); }, [tab]);

  async function handleSave(form) {
    if (editTool) {
      const data = await apiJson(`/api/tools/${editTool.id}?client_id=${encodeURIComponent(clientId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: { client_id: clientId, ...form },
      });
      if (data?.id) setTools(prev => prev.map(x => x.id === data.id ? data : x));
    } else {
      const data = await apiJson("/api/tools", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: { client_id: clientId, ...form },
      });
      if (data?.id) setTools(prev => [data, ...prev]);
    }
    setShowForm(false);
    setEditTool(null);
  }

  async function deleteTool(id) {
    if (!window.confirm("Delete this tool?")) return;
    setTools(prev => prev.filter(x => x.id !== id));
    await apiJson(`/api/tools/${id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });
  }

  const activeCount = tools.filter(x => x.status === "active").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <SectionHeader
          title="Tools"
          sub="Configure actions the AI can execute — API calls, webhooks, and workflows."
          t={t}
        />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: "8px", overflow: "hidden" }}>
            {[{ key: "tools", label: "Tools" }, { key: "registry", label: "Registry" }, { key: "suggested", label: "✦ Suggested" }].map(v => (
              <button key={v.key} onClick={() => setTab(v.key)} style={{
                padding: "7px 16px", background: tab === v.key ? accent : "transparent",
                border: "none", color: tab === v.key ? "#fff" : t.textMuted,
                fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}>
                {v.label}
              </button>
            ))}
          </div>
          {tab === "tools" && (
            <button onClick={() => { setEditTool(null); setShowForm(true); }}
              style={{ padding: "8px 16px", background: accent, border: "none", borderRadius: "8px",
                color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
              + Create Tool
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total Tools",   val: tools.length,                 color: accent     },
          { label: "Active",        val: activeCount,                  color: "#34D399"  },
          { label: "Draft",         val: tools.filter(x=>x.status==="draft").length,    color: "#FBBF24"  },
          { label: "API Tools",     val: tools.filter(x=>x.tool_type==="api").length,   color: "#60A5FA"  },
        ].map(s => (
          <Card key={s.label} t={t} style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: "10px", color: t.textMuted, textTransform: "uppercase",
              letterSpacing: "0.07em", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: s.color,
              fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* ── Tools list ── */}
      {tab === "tools" && (
        <Card t={t} style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 100px 120px 140px",
            padding: "10px 18px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>Tool</span><span>Endpoint</span><span>Type</span>
            <span>Status</span><span>Updated</span><span></span>
          </div>

          {loading && (
            <div style={{ padding: "48px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading tools…
            </div>
          )}
          {!loading && tools.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>⚙</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>
                No tools yet
              </div>
              <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>
                Create your first tool to let the AI take actions.
              </div>
              <button onClick={() => setShowForm(true)} style={{ padding: "8px 20px", background: accent,
                border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px",
                fontWeight: "600", cursor: "pointer" }}>+ Create Tool</button>
            </div>
          )}

          {tools.map((tool, i) => {
            const meta     = TOOL_TYPE_META[tool.tool_type] || TOOL_TYPE_META.api;
            const updatedAt = tool.updated_at ? new Date(tool.updated_at).toLocaleDateString() : "—";
            return (
              <div key={tool.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 100px 120px 140px",
                  alignItems: "center", padding: "13px 18px",
                  borderBottom: i < tools.length - 1 ? `1px solid ${t.borderLight}` : "none",
                  transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${accent}06`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Name + description */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text,
                    letterSpacing: "-0.01em", marginBottom: "2px" }}>{tool.name}</div>
                  <div style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>
                    {tool.slug}
                  </div>
                  {tool.description && (
                    <div style={{ fontSize: "11px", color: t.textSub, marginTop: "2px" }}>
                      {tool.description.slice(0, 60)}{tool.description.length > 60 ? "…" : ""}
                    </div>
                  )}
                </div>
                {/* Endpoint */}
                <div style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tool.method && <span style={{ color: accent, marginRight: "4px" }}>{tool.method}</span>}
                  {tool.endpoint || "—"}
                </div>
                {/* Type badge */}
                <span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "999px",
                  background: `${meta.color}18`, color: meta.color, fontWeight: "600",
                  display: "inline-block" }}>{meta.label}</span>
                {/* Status */}
                <span style={{ fontSize: "10px", padding: "3px 9px", borderRadius: "999px", fontWeight: "600",
                  display: "inline-block",
                  background: tool.status === "active" ? "#34D39920" : tool.status === "draft" ? "#FBBF2418" : "#FB718520",
                  color: tool.status === "active" ? "#34D399" : tool.status === "draft" ? "#FBBF24" : "#FB7185" }}>
                  {tool.status}
                </span>
                {/* Updated */}
                <div style={{ fontSize: "11px", color: t.textMuted }}>{updatedAt}</div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button onClick={() => setTestTool(tool)}
                    style={{ padding: "5px 10px", background: `${accent}14`,
                      border: `1px solid ${accent}40`, borderRadius: "6px",
                      color: accent, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    ▶ Test
                  </button>
                  <button onClick={() => { setEditTool(tool); setShowForm(true); }}
                    style={{ padding: "5px 10px", background: "none", border: `1px solid ${t.border}`,
                      borderRadius: "6px", color: t.textSub, fontSize: "11px", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteTool(tool.id)}
                    style={{ padding: "5px 8px", background: "none", border: "none",
                      color: "#FB7185", fontSize: "14px", cursor: "pointer" }}>×</button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Registry ── */}
      {tab === "registry" && (
        <Card t={t} style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px 120px",
            padding: "10px 18px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>Tool</span><span>Type</span><span>Calls</span>
            <span>Success %</span><span>Errors</span><span>Last Used</span>
          </div>

          {regLoading && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading registry…
            </div>
          )}
          {!regLoading && registry.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              No usage data yet. Run tools to see stats here.
            </div>
          )}
          {registry.map((r, i) => {
            const meta    = TOOL_TYPE_META[r.tool_type] || TOOL_TYPE_META.api;
            const lastUsed = r.last_used_at ? new Date(r.last_used_at).toLocaleDateString() : "Never";
            const srColor  = r.success_rate === null ? t.textMuted
              : r.success_rate >= 90 ? "#34D399"
              : r.success_rate >= 70 ? "#FBBF24" : "#FB7185";
            return (
              <div key={r.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px 120px",
                  alignItems: "center", padding: "13px 18px",
                  borderBottom: i < registry.length - 1 ? `1px solid ${t.borderLight}` : "none",
                  transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${accent}06`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "2px" }}>{r.name}</div>
                  <div style={{ fontSize: "10px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>{r.slug}</div>
                </div>
                <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "999px",
                  background: `${meta.color}18`, color: meta.color, fontWeight: "600" }}>{meta.label}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                  fontFamily: "'DM Mono', monospace" }}>{r.total_calls.toLocaleString()}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: srColor,
                  fontFamily: "'DM Mono', monospace" }}>
                  {r.success_rate !== null ? `${r.success_rate}%` : "—"}
                </span>
                <span style={{ fontSize: "13px", color: r.error_count > 0 ? "#FB7185" : t.textMuted,
                  fontWeight: r.error_count > 0 ? "700" : "400",
                  fontFamily: "'DM Mono', monospace" }}>{r.error_count}</span>
                <span style={{ fontSize: "11px", color: t.textMuted }}>{lastUsed}</span>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── AI-Suggested Tools ── */}
      {tab === "suggested" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>AI-Suggested Tools</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "2px" }}>
                Tools your AI needs to resolve customer queries without escalation.
              </div>
            </div>
            <button onClick={generateSuggestions} disabled={sugGenerating}
              style={{ padding: "8px 16px", background: accent, border: "none", borderRadius: "8px",
                color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                opacity: sugGenerating ? 0.7 : 1 }}>
              {sugGenerating ? "Analyzing…" : "✦ Analyze Conversations"}
            </button>
          </div>

          <JobStatusNotice job={suggestionJob} t={t} accent={accent} />

          {sugLoading && (
            <div style={{ padding: "48px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading suggestions…
            </div>
          )}

          {!sugLoading && suggestions.length === 0 && (
            <Card t={t} style={{ padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔮</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>
                No suggestions yet
              </div>
              <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>
                Click "Analyze Conversations" to let AI identify tools that would reduce escalations.
              </div>
              <button onClick={generateSuggestions} disabled={sugGenerating}
                style={{ padding: "8px 20px", background: accent, border: "none", borderRadius: "8px",
                  color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                {sugGenerating ? "Analyzing…" : "Analyze Now"}
              </button>
            </Card>
          )}

          {suggestions.filter(s => s.status !== "dismissed").length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {suggestions.filter(s => s.status !== "dismissed").map((s, i) => {
                const impactColor = s.impact?.toLowerCase().startsWith("high") ? "#EF4444"
                  : s.impact?.toLowerCase().startsWith("medium") ? "#F59E0B" : "#34D399";
                return (
                  <Card key={s.id || i} t={t} style={{ padding: "18px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px",
                          background: `${accent}18`, border: `1px solid ${accent}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "15px" }}>🔧</div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text,
                            letterSpacing: "-0.01em" }}>{s.name}</div>
                          {s.frequency > 0 && (
                            <div style={{ fontSize: "10px", color: t.textMuted }}>
                              ~{s.frequency} queries/week
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 7px",
                          borderRadius: "999px", background: `${impactColor}18`, color: impactColor }}>
                          {s.impact?.split("—")[0]?.trim() || "Medium"} Impact
                        </span>
                        {s.id && (
                          <button onClick={() => dismissSuggestion(s.id)}
                            style={{ background: "none", border: "none", color: t.textMuted,
                              cursor: "pointer", fontSize: "14px", padding: "2px" }}>×</button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "8px",
                      lineHeight: "1.5" }}>{s.description}</div>
                    {s.use_case && (
                      <div style={{ fontSize: "11px", color: t.textMuted, background: t.surfaceHover,
                        borderRadius: "6px", padding: "7px 10px", lineHeight: "1.4",
                        borderLeft: `3px solid ${accent}` }}>
                        <span style={{ color: accent, fontWeight: "600" }}>Why: </span>{s.use_case}
                      </div>
                    )}
                    <button
                      onClick={() => { setEditTool(null); setShowForm(true); setTab("tools"); }}
                      style={{ marginTop: "12px", width: "100%", padding: "7px", background: `${accent}14`,
                        border: `1px solid ${accent}30`, borderRadius: "7px", color: accent,
                        fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      + Create This Tool
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ToolFormModal
          tool={editTool}
          t={t} accent={accent}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTool(null); }}
        />
      )}
      {testTool && (
        <ToolTestModal
          tool={testTool}
          t={t} accent={accent}
          onClose={() => setTestTool(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: SOPs
// ══════════════════════════════════════════════════════════════════════════════


