import { useEffect, useMemo, useState } from "react";
import { apiJson, getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader, Tag, Toggle } from "./ui";

const EMPTY_CASE = {
  name: "",
  input_message: "",
  input_subject: "",
  input_channel: "chat",
  customer_name: "Test Customer",
  customer_email: "test@example.com",
  expected_issue_type_id: "",
  expected_issue_type_name: "",
  expected_decision: "",
  expected_sop_id: "",
  expected_sop_title: "",
  expected_kb_id: "",
  expected_kb_title: "",
  notes: "",
  active: true,
};

function metricLabel(value) {
  if (value === null || value === undefined) return "N/A";
  return `${Math.round(Number(value) * 100)}%`;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function expectedSummary(evalCase) {
  const parts = [];
  if (evalCase.expected_decision) parts.push(`Decision: ${evalCase.expected_decision}`);
  if (evalCase.expected_issue_type_name) parts.push(`Issue Type: ${evalCase.expected_issue_type_name}`);
  if (evalCase.expected_sop_title) parts.push(`SOP: ${evalCase.expected_sop_title}`);
  if (evalCase.expected_kb_title) parts.push(`KB: ${evalCase.expected_kb_title}`);
  return parts.length ? parts.join(" ? ") : "No expectations configured yet.";
}

function formatBehaviorSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return "No behavior snapshot";
  const versions = snapshot.versions || {};
  return [
    versions.response_pipeline ? `pipeline ${versions.response_pipeline}` : null,
    versions.policy_engine ? `policy ${versions.policy_engine}` : null,
    snapshot.response_config_fingerprint ? `cfg ${snapshot.response_config_fingerprint}` : null,
  ].filter(Boolean).join(" · ") || "No behavior snapshot";
}

function actualSummary(result) {
  const parts = [];
  if (result.actual_decision) parts.push(`Decision: ${result.actual_decision}`);
  if (result.actual_issue_type_name) parts.push(`Issue Type: ${result.actual_issue_type_name}`);
  if (result.actual_sop_title) parts.push(`SOP: ${result.actual_sop_title}`);
  if (result.actual_kb_title) parts.push(`KB: ${result.actual_kb_title}`);
  return parts.length ? parts.join(" ? ") : "No actual output recorded.";
}

function textInputStyle(t) {
  return {
    width: "100%",
    background: t.surfaceHover,
    border: `1px solid ${t.border}`,
    borderRadius: "12px",
    color: t.text,
    fontSize: "12.5px",
    padding: "11px 12px",
    outline: "none",
    boxSizing: "border-box",
  };
}

function selectStyle(t) {
  return {
    ...textInputStyle(t),
    cursor: "pointer",
  };
}

function metricCard({ label, value, hint, t, accent }) {
  return (
    <Card t={t} accent={accent} style={{ padding: "16px", minWidth: 0 }}>
      <div style={{ fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: "700", color: t.text, letterSpacing: "-0.05em" }}>{value}</div>
      {hint && <div style={{ marginTop: "8px", fontSize: "12px", color: t.textSub }}>{hint}</div>}
    </Card>
  );
}

export function Evaluations({ t, accent }) {
  const clientId = getActiveClientId();
  const [form, setForm] = useState(EMPTY_CASE);
  const [submitting, setSubmitting] = useState(false);
  const [runPending, setRunPending] = useState(false);
  const [generateReply, setGenerateReply] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [latestReport, setLatestReport] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const casesPath = clientId ? `/api/eval/cases?client_id=${clientId}&active_only=false` : null;
  const runsPath = clientId ? `/api/eval/runs?client_id=${clientId}&limit=12` : null;
  const issueTypesPath = clientId ? `/api/issue-types?client_id=${clientId}` : null;
  const sopsPath = clientId ? `/api/sops?client_id=${clientId}` : null;
  const kbPath = clientId ? `/api/knowledge?client_id=${clientId}` : null;

  const { data: evalCases = [], loading: casesLoading, refetch: refetchCases } = useApi(casesPath, [], [clientId]);
  const { data: evalRuns = [], loading: runsLoading, refetch: refetchRuns } = useApi(runsPath, [], [clientId]);
  const { data: issueTypes = [] } = useApi(issueTypesPath, [], [clientId]);
  const { data: sops = [] } = useApi(sopsPath, [], [clientId]);
  const { data: knowledgeArticles = [] } = useApi(kbPath, [], [clientId]);

  const selectedRunPath = clientId && selectedRunId ? `/api/eval/runs/${selectedRunId}?client_id=${clientId}` : null;
  const { data: selectedRunReport, loading: selectedRunLoading } = useApi(selectedRunPath, null, [clientId, selectedRunId]);

  useEffect(() => {
    if (!selectedRunId && evalRuns?.[0]?.id) {
      setSelectedRunId(evalRuns[0].id);
    }
  }, [evalRuns, selectedRunId]);

  useEffect(() => {
    if (selectedRunReport?.run?.id) {
      setLatestReport(selectedRunReport);
    }
  }, [selectedRunReport]);

  const activeCases = useMemo(() => (evalCases || []).filter((item) => item.active), [evalCases]);
  const selectedCaseSet = useMemo(() => new Set(selectedCaseIds), [selectedCaseIds]);
  const currentReport = latestReport?.run?.id === selectedRunId && latestReport?.results ? latestReport : selectedRunReport;
  const metrics = currentReport?.run?.metrics || currentReport?.metrics || null;

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function toggleCase(caseId) {
    setSelectedCaseIds((current) => current.includes(caseId)
      ? current.filter((id) => id !== caseId)
      : [...current, caseId]);
  }

  function toggleAllVisible() {
    const targetIds = (activeOnly ? activeCases : evalCases).map((item) => item.id);
    const allSelected = targetIds.length > 0 && targetIds.every((id) => selectedCaseSet.has(id));
    setSelectedCaseIds(allSelected ? [] : targetIds);
  }

  async function handleCreateCase(event) {
    event.preventDefault();
    if (!clientId) return;
    resetMessages();
    setSubmitting(true);
    try {
      const payload = {
        client_id: clientId,
        ...form,
        expected_issue_type_id: form.expected_issue_type_id || null,
        expected_issue_type_name: form.expected_issue_type_name || null,
        expected_decision: form.expected_decision || null,
        expected_sop_id: form.expected_sop_id || null,
        expected_sop_title: form.expected_sop_title || null,
        expected_kb_id: form.expected_kb_id || null,
        expected_kb_title: form.expected_kb_title || null,
      };
      await apiJson("/api/eval/cases", { method: "POST", body: payload });
      setForm(EMPTY_CASE);
      setSuccess("Evaluation case added.");
      await refetchCases();
    } catch (nextError) {
      setError(nextError.message || "Failed to create evaluation case.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRun() {
    if (!clientId) return;
    resetMessages();
    setRunPending(true);
    try {
      const report = await apiJson("/api/eval/run", {
        method: "POST",
        body: {
          client_id: clientId,
          generate_reply: generateReply,
          active_only: activeOnly,
          case_ids: selectedCaseIds.length ? selectedCaseIds : undefined,
        },
      });
      setLatestReport(report);
      if (report?.run?.id) {
        setSelectedRunId(report.run.id);
      }
      await refetchRuns();
      setSuccess(`Evaluation run completed for ${report?.metrics?.total_cases || 0} case(s).`);
    } catch (nextError) {
      setError(nextError.message || "Failed to run evaluation.");
    } finally {
      setRunPending(false);
    }
  }

  const visibleCases = activeOnly ? activeCases : evalCases;

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      <SectionHeader
        title="Evaluations"
        sub="Run your stored regression cases against the full preview pipeline, track accuracy, and inspect case-by-case misses without touching the live message flow."
        t={t}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", background: t.surfaceHover, border: `1px solid ${t.border}` }}>
              <span style={{ fontSize: "11px", color: t.textSub }}>Generate replies</span>
              <Toggle value={generateReply} onChange={setGenerateReply} accent={accent} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", background: t.surfaceHover, border: `1px solid ${t.border}` }}>
              <span style={{ fontSize: "11px", color: t.textSub }}>Active cases only</span>
              <Toggle value={activeOnly} onChange={setActiveOnly} accent={accent} />
            </div>
            <button type="button" onClick={handleRun} disabled={runPending || casesLoading || visibleCases.length === 0} style={{ background: accent, color: "#fff", border: "none", borderRadius: "12px", padding: "11px 16px", fontSize: "12.5px", fontWeight: "700", cursor: runPending ? "default" : "pointer", boxShadow: `0 18px 32px ${accent}22` }}>
              {runPending ? "Running?" : "Run Evaluation"}
            </button>
          </div>
        }
      />

      {(error || success) && (
        <Card t={t} accent={accent} style={{ padding: "14px 16px", borderColor: error ? "#FB7185" : `${accent}28`, background: error ? "linear-gradient(180deg, rgba(251,113,133,0.12) 0%, rgba(251,113,133,0.06) 100%)" : undefined }}>
          <div style={{ fontSize: "12.5px", color: error ? "#FCA5A5" : t.text }}>{error || success}</div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px" }}>
        {metricCard({ label: "Cases in scope", value: String(visibleCases.length), hint: activeOnly ? "Active cases selected for the next run." : "All stored cases are visible.", t, accent })}
        {metricCard({ label: "Pass rate", value: metrics ? metricLabel(metrics.pass_rate) : "?", hint: metrics ? `${metrics.passed_cases}/${metrics.total_cases} cases passed.` : "Run an evaluation to score the current pipeline.", t, accent })}
        {metricCard({ label: "Classification", value: metrics ? metricLabel(metrics.classification_accuracy) : "?", hint: "Expected issue type versus actual matched issue type.", t, accent })}
        {metricCard({ label: "Decision", value: metrics ? metricLabel(metrics.decision_accuracy) : "?", hint: "Answer versus clarify versus escalate accuracy.", t, accent })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "22px", alignItems: "start" }}>
        <Card t={t} accent={accent} style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text }}>Create Evaluation Case</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Store a deterministic regression case you can rerun after prompt, retrieval, or policy changes.</div>
            </div>
            <Tag color={accent}>Dataset</Tag>
          </div>
          <form onSubmit={handleCreateCase} style={{ display: "grid", gap: "12px" }}>
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Case name" style={textInputStyle(t)} />
            <textarea value={form.input_message} onChange={(event) => updateForm("input_message", event.target.value)} rows={4} placeholder="Input message" style={{ ...textInputStyle(t), resize: "vertical" }} />
            <input value={form.input_subject} onChange={(event) => updateForm("input_subject", event.target.value)} placeholder="Email subject (optional)" style={textInputStyle(t)} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
              <select value={form.input_channel} onChange={(event) => updateForm("input_channel", event.target.value)} style={selectStyle(t)}>
                <option value="chat">Chat</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <input value={form.customer_name} onChange={(event) => updateForm("customer_name", event.target.value)} placeholder="Customer name" style={textInputStyle(t)} />
              <input value={form.customer_email} onChange={(event) => updateForm("customer_email", event.target.value)} placeholder="Customer email" style={textInputStyle(t)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
              <select value={form.expected_decision} onChange={(event) => updateForm("expected_decision", event.target.value)} style={selectStyle(t)}>
                <option value="">Expected decision</option>
                <option value="answer">Answer</option>
                <option value="clarify">Clarify</option>
                <option value="escalate">Escalate</option>
              </select>
              <select value={form.expected_issue_type_id} onChange={(event) => {
                const selected = issueTypes.find((item) => item.id === event.target.value);
                updateForm("expected_issue_type_id", event.target.value);
                updateForm("expected_issue_type_name", selected?.name || "");
              }} style={selectStyle(t)}>
                <option value="">Expected issue type</option>
                {issueTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={form.expected_sop_id} onChange={(event) => {
                const selected = sops.find((item) => item.id === event.target.value);
                updateForm("expected_sop_id", event.target.value);
                updateForm("expected_sop_title", selected?.title || selected?.name || "");
              }} style={selectStyle(t)}>
                <option value="">Expected SOP</option>
                {sops.map((item) => <option key={item.id} value={item.id}>{item.title || item.name}</option>)}
              </select>
              <select value={form.expected_kb_id} onChange={(event) => {
                const selected = knowledgeArticles.find((item) => item.id === event.target.value);
                updateForm("expected_kb_id", event.target.value);
                updateForm("expected_kb_title", selected?.title || "");
              }} style={selectStyle(t)}>
                <option value="">Expected KB article</option>
                {knowledgeArticles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </div>
            <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} rows={3} placeholder="Notes for this regression case" style={{ ...textInputStyle(t), resize: "vertical" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: t.textSub }}>Active</span>
                <Toggle value={form.active} onChange={(value) => updateForm("active", value)} accent={accent} />
              </div>
              <button type="submit" disabled={submitting || !form.input_message.trim()} style={{ background: accent, border: "none", borderRadius: "12px", color: "#fff", padding: "11px 16px", fontSize: "12.5px", fontWeight: "700", cursor: submitting ? "default" : "pointer" }}>
                {submitting ? "Saving?" : "Add Case"}
              </button>
            </div>
          </form>
        </Card>

        <Card t={t} accent={accent} style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text }}>Recent Runs</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Stored reports you can reopen after prompt, retrieval, or policy changes.</div>
            </div>
            <button type="button" onClick={() => refetchRuns()} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "10px", color: t.textSub, padding: "8px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Refresh</button>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {runsLoading && <div style={{ fontSize: "12px", color: t.textMuted }}>Loading runs?</div>}
            {!runsLoading && evalRuns.length === 0 && <div style={{ fontSize: "12px", color: t.textMuted }}>No evaluation runs yet.</div>}
            {evalRuns.map((run) => {
              const selected = selectedRunId === run.id;
              return (
                <button key={run.id} type="button" onClick={() => setSelectedRunId(run.id)} style={{ textAlign: "left", background: selected ? `${accent}14` : t.surfaceHover, border: `1px solid ${selected ? accent : t.border}`, borderRadius: "14px", padding: "12px 14px", cursor: "pointer", color: t.text }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700" }}>{formatDate(run.created_at)}</div>
                    <Tag color={run.status === "failed" ? "#FB7185" : run.status === "running" ? "#F59E0B" : "#34D399"}>{run.status}</Tag>
                  </div>
                  <div style={{ fontSize: "12px", color: t.textSub, marginTop: "6px" }}>
                    {run.passed_cases || 0}/{run.total_cases || 0} passed ? {metricLabel(run.metrics?.pass_rate)} pass rate
                  </div>
                  <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "6px" }}>
                    {formatBehaviorSnapshot(run.options?.behavior_version_snapshot)}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: "22px", alignItems: "start" }}>
        <Card t={t} accent={accent} style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text }}>Evaluation Cases</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Select specific cases or run the full active dataset.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button type="button" onClick={toggleAllVisible} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "10px", color: t.textSub, padding: "8px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                {visibleCases.length > 0 && visibleCases.every((item) => selectedCaseSet.has(item.id)) ? "Clear selection" : "Select visible"}
              </button>
              <button type="button" onClick={() => refetchCases()} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "10px", color: t.textSub, padding: "8px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Refresh</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: "10px", maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
            {casesLoading && <div style={{ fontSize: "12px", color: t.textMuted }}>Loading cases?</div>}
            {!casesLoading && visibleCases.length === 0 && <div style={{ fontSize: "12px", color: t.textMuted }}>No evaluation cases yet.</div>}
            {visibleCases.map((evalCase) => {
              const selected = selectedCaseSet.has(evalCase.id);
              return (
                <div key={evalCase.id} style={{ background: selected ? `${accent}12` : t.surfaceHover, border: `1px solid ${selected ? accent : t.border}`, borderRadius: "14px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleCase(evalCase.id)} style={{ marginTop: "3px" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{evalCase.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <Pill t={t} accent={accent} active>{evalCase.input_channel}</Pill>
                          {evalCase.active ? <Tag color="#34D399">active</Tag> : <Tag color="#94A3B8">inactive</Tag>}
                        </div>
                      </div>
                      <div style={{ marginTop: "8px", fontSize: "12px", color: t.textSub, lineHeight: "1.6" }}>{evalCase.input_message}</div>
                      <div style={{ marginTop: "10px", fontSize: "11px", color: t.textMuted }}>{expectedSummary(evalCase)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card t={t} accent={accent} style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text }}>Run Report</div>
              <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>
                {selectedRunId ? "Inspect the latest selected run case-by-case." : "Run the dataset to generate a report."}
              </div>
            </div>
            {selectedRunLoading && <Tag color="#F59E0B">loading</Tag>}
          </div>

          {!currentReport && <div style={{ fontSize: "12px", color: t.textMuted }}>No run selected yet.</div>}

          {currentReport && (
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: t.surfaceHover, border: `1px solid ${t.border}`, fontSize: "11px", color: t.textMuted, lineHeight: "1.6" }}>
                <strong style={{ color: t.text }}>Behavior Snapshot:</strong> {formatBehaviorSnapshot(currentReport.run?.options?.behavior_version_snapshot)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                {metricCard({ label: "Pass rate", value: metricLabel(metrics?.pass_rate), hint: metrics ? `${metrics.passed_cases}/${metrics.total_cases} passed` : "", t, accent })}
                {metricCard({ label: "SOP usage", value: metricLabel(metrics?.sop_usage_accuracy), hint: "Expected SOP selected when configured.", t, accent })}
                {metricCard({ label: "KB usage", value: metricLabel(metrics?.kb_usage_accuracy), hint: "Expected KB article selected when configured.", t, accent })}
              </div>

              <div style={{ display: "grid", gap: "10px", maxHeight: "520px", overflowY: "auto", paddingRight: "4px" }}>
                {(currentReport.results || []).map((result) => {
                  const evalCase = result.eval_case || result.preview?.eval_case || null;
                  return (
                    <div key={result.id || result.eval_case_id} style={{ background: t.surfaceHover, border: `1px solid ${result.passed ? "#34D39955" : t.border}`, borderRadius: "14px", padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{evalCase?.name || `Case ${result.eval_case_id}`}</div>
                        <Tag color={result.passed ? "#34D399" : "#FB7185"}>{result.passed ? "pass" : "miss"}</Tag>
                      </div>
                      {evalCase?.input_message && <div style={{ marginTop: "8px", fontSize: "12px", color: t.textSub, lineHeight: "1.6" }}>{evalCase.input_message}</div>}
                      <div style={{ marginTop: "10px", fontSize: "11px", color: t.textMuted }}>Expected: {expectedSummary(evalCase || {})}</div>
                      <div style={{ marginTop: "6px", fontSize: "11px", color: t.textMuted }}>Actual: {actualSummary(result)}</div>
                      {result.actual_clarification_question && <div style={{ marginTop: "8px", fontSize: "11.5px", color: t.textSub }}>Clarification: {result.actual_clarification_question}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
