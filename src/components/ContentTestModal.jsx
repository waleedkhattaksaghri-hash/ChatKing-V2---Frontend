import { useMemo, useState } from "react";
import { apiJson, getActiveClientId } from "../lib/api";
import { Card } from "./ui";

function channelButtonStyle(active, accent, t) {
  return {
    padding: "7px 12px",
    borderRadius: "999px",
    border: `1px solid ${active ? accent : t.border}`,
    background: active ? `${accent}14` : t.surface,
    color: active ? accent : t.textSub,
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  };
}

function summarizePreview(preview) {
  if (!preview) return null;
  const selectedSop = preview?.evidence_bundle?.source_selection?.selected_sop || preview?.source_selection?.selected_sop || null;
  const selectedArticle = preview?.evidence_bundle?.source_selection?.selected_article || preview?.source_selection?.selected_article || null;
  const selectedMemory = preview?.evidence_bundle?.memory_candidates?.[0] || preview?.memory_candidates?.[0] || null;
  return {
    mode: preview?.source_selection?.mode || preview?.evidence_bundle?.source_selection?.mode || null,
    reply: preview?.ai_data?.response || "",
    issueTypeName: preview?.classification?.matched_issue_type_name || null,
    selectedSopTitle: selectedSop?.title || null,
    selectedArticleTitle: selectedArticle?.title || null,
    selectedMemoryTitle: selectedMemory?.title || null,
    telemetry: preview?.telemetry || null,
    sourceSelection: preview?.source_selection || null,
  };
}

function buildFailureReasons({ itemType, diagnostics, primarySummary, forcedSummary, compareForced }) {
  const reasons = [];
  if (!diagnostics || !primarySummary) return reasons;

  if (itemType === "Issue Type") {
    if (diagnostics.matched === false) {
      reasons.push(`The real pipeline classified this message into ${diagnostics.selected_issue_type_name || "a different issue type"} instead of this issue type.`);
    }
    if (compareForced && forcedSummary?.selectedSopTitle && !primarySummary.selectedSopTitle) {
      reasons.push("When this issue type was forced, linked SOP evidence became available. That usually means the issue type wording or routing signal is too weak in the normal classifier path.");
    }
  }

  if (itemType === "SOP") {
    if (diagnostics.included_as_candidate === false) {
      reasons.push("This SOP was not retrieved into the candidate set. That usually means its trigger conditions or title do not line up strongly enough with the customer message.");
    }
    if (diagnostics.included_as_candidate && diagnostics.selected === false) {
      reasons.push(`This SOP was retrieved but lost to ${diagnostics.selected_sop_title || primarySummary.selectedSopTitle || "another source"}. That usually means another SOP or KB chunk scored as more relevant.`);
    }
    if (compareForced && forcedSummary?.reply && forcedSummary.reply !== primarySummary.reply) {
      reasons.push("Forcing this SOP changed the final answer. That usually means the SOP content is useful, but retrieval or ranking did not prioritize it strongly enough.");
    }
  }

  if (itemType === "Knowledge Base") {
    if (diagnostics.included_as_candidate === false) {
      reasons.push("This article was not retrieved. That usually means the article title or chunk content does not match the customer phrasing strongly enough.");
    }
    if (diagnostics.included_as_candidate && diagnostics.selected === false) {
      reasons.push(`This article was retrieved but not selected because ${diagnostics.selected_article_title || primarySummary.selectedArticleTitle || "another source"} ranked higher.`);
    }
    if (compareForced && forcedSummary?.reply && forcedSummary.reply !== primarySummary.reply) {
      reasons.push("Forcing this article changed the final answer. That usually means the article contains useful evidence, but the retrieval ranking did not elevate it high enough.");
    }
  }

  if (itemType === "Client Memory") {
    if (diagnostics.included_as_candidate === false) {
      reasons.push("This memory entry was not retrieved into the candidate set. That usually means the stored phrasing does not line up strongly enough with the customer message yet.");
    }
    if (diagnostics.included_as_candidate && diagnostics.selected === false) {
      reasons.push(`This memory entry was retrieved but another memory or stronger SOP/KB evidence led the final answer instead of ${diagnostics.selected_memory_title || primarySummary.selectedMemoryTitle || "this memory"}.`);
    }
    if (compareForced && forcedSummary?.reply && forcedSummary.reply !== primarySummary.reply) {
      reasons.push("Forcing this memory changed the final answer. That usually means the memory is useful, but the live retrieval or evidence ranking is not elevating it strongly enough.");
    }
  }

  if (compareForced && forcedSummary) {
    if (forcedSummary.mode === "answer" && primarySummary.mode !== "answer") {
      reasons.push("The forced run answered directly while the real pipeline did not. That is a strong sign the content is usable but the live selection path is not confident enough yet.");
    }
    if (forcedSummary.selectedSopTitle && !primarySummary.selectedSopTitle && itemType !== "Knowledge Base") {
      reasons.push("The forced run introduced SOP-backed evidence that the real pipeline did not pick up. Improve trigger wording, issue type linkage, or retrieval cues.");
    }
    if (forcedSummary.selectedArticleTitle && !primarySummary.selectedArticleTitle && itemType !== "SOP") {
      reasons.push("The forced run introduced KB evidence that the real pipeline did not select. Improve article headings, chunk clarity, or retrieval phrasing coverage.");
    }
  }

  if (!reasons.length && diagnostics.selected === true) {
    reasons.push("The real pipeline already selected this item. There is no failure here; use the compare view to judge whether the content itself should still be improved.");
  }

  return reasons;
}

function ResultPanel({ heading, summary, diagnostics, testedItem, t, accent }) {
  return (
    <>
      <Card t={t} style={{ padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
          {heading}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: accent, background: `${accent}14`, border: `1px solid ${accent}26`, borderRadius: "999px", padding: "4px 9px" }}>
            {summary?.mode || "preview"}
          </span>
          {diagnostics?.matched !== undefined && (
            <span style={{ fontSize: "11px", fontWeight: "700", color: diagnostics.matched ? "#10B981" : "#F59E0B", background: diagnostics.matched ? "#10B98114" : "#F59E0B14", border: `1px solid ${diagnostics.matched ? "#10B98133" : "#F59E0B33"}`, borderRadius: "999px", padding: "4px 9px" }}>
              {diagnostics.matched ? "Matched" : "Did Not Match"}
            </span>
          )}
          {diagnostics?.selected !== undefined && (
            <span style={{ fontSize: "11px", fontWeight: "700", color: diagnostics.selected ? "#10B981" : "#F59E0B", background: diagnostics.selected ? "#10B98114" : "#F59E0B14", border: `1px solid ${diagnostics.selected ? "#10B98133" : "#F59E0B33"}`, borderRadius: "999px", padding: "4px 9px" }}>
              {diagnostics.selected ? "Selected" : "Not Selected"}
            </span>
          )}
          {diagnostics?.included_as_candidate !== undefined && (
            <span style={{ fontSize: "11px", fontWeight: "700", color: diagnostics.included_as_candidate ? accent : t.textMuted, background: diagnostics.included_as_candidate ? `${accent}14` : t.surfaceHover, border: `1px solid ${diagnostics.included_as_candidate ? `${accent}26` : t.border}`, borderRadius: "999px", padding: "4px 9px" }}>
              {diagnostics.included_as_candidate ? "In Candidate Set" : "Not Retrieved"}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: t.textSub }}>
          {summary?.issueTypeName && <div><strong style={{ color: t.text }}>Matched Issue Type:</strong> {summary.issueTypeName}</div>}
          {summary?.selectedSopTitle && <div><strong style={{ color: t.text }}>Selected SOP:</strong> {summary.selectedSopTitle}</div>}
          {summary?.selectedArticleTitle && <div><strong style={{ color: t.text }}>Selected KB:</strong> {summary.selectedArticleTitle}</div>}
          {summary?.selectedMemoryTitle && <div><strong style={{ color: t.text }}>Selected Memory:</strong> {summary.selectedMemoryTitle}</div>}
        </div>
      </Card>

      <Card t={t} style={{ padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
          Agent Reply
        </div>
        <div style={{ fontSize: "14px", color: t.text, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
          {summary?.reply || "No reply returned."}
        </div>
      </Card>

      <Card t={t} style={{ padding: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
          Diagnostics
        </div>
        <pre style={{ margin: 0, fontSize: "11px", lineHeight: "1.6", color: t.textSub, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify({ tested_item: testedItem, diagnostics, source_selection: summary?.sourceSelection, telemetry: summary?.telemetry }, null, 2)}
        </pre>
      </Card>
    </>
  );
}

export function ContentTestModal({ title, endpoint, itemType, itemLabel, t, accent, onClose }) {
  const [channel, setChannel] = useState("chat");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("Test Customer");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [compareForced, setCompareForced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const primarySummary = useMemo(() => summarizePreview(result?.preview), [result]);
  const forcedSummary = useMemo(() => summarizePreview(result?.preview?.forced_preview), [result]);
  const failureReasons = useMemo(() => buildFailureReasons({ itemType, diagnostics: result?.diagnostics, primarySummary, forcedSummary, compareForced }), [itemType, result, primarySummary, forcedSummary, compareForced]);

  async function runTest() {
    if (!message.trim()) {
      setError("Message is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiJson(`${endpoint}?client_id=${encodeURIComponent(getActiveClientId())}`, {
        method: "POST",
        body: {
          client_id: getActiveClientId(),
          channel,
          subject: channel === "email" ? subject : undefined,
          message,
          customer_name: customerName,
          customer_email: customerEmail,
          generate_reply: true,
          force_item: compareForced,
        },
      });
      setResult(response);
    } catch (runError) {
      setError(runError.message || "Failed to run test.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 8, 20, 0.72)",
        backdropFilter: "blur(8px)",
        zIndex: 2100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <Card t={t} style={{ width: "100%", maxWidth: compareForced ? "1180px" : "960px", maxHeight: "92vh", overflowY: "auto", padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "18px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: t.text, letterSpacing: "-0.03em" }}>{title}</div>
            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "5px" }}>
              Testing {itemType}: {itemLabel}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted, fontSize: "22px", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)", gap: "18px" }}>
          <div style={{ display: "grid", gap: "14px" }}>
            <Card t={t} style={{ padding: "16px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button type="button" onClick={() => setChannel("chat")} style={channelButtonStyle(channel === "chat", accent, t)}>Chat</button>
                <button type="button" onClick={() => setChannel("email")} style={channelButtonStyle(channel === "email", accent, t)}>Email</button>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" style={{ width: "100%", minHeight: "42px", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "10px", color: t.text, padding: "10px 12px", boxSizing: "border-box" }} />
                <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Customer email" style={{ width: "100%", minHeight: "42px", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "10px", color: t.text, padding: "10px 12px", boxSizing: "border-box" }} />
                {channel === "email" && (
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" style={{ width: "100%", minHeight: "42px", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "10px", color: t.text, padding: "10px 12px", boxSizing: "border-box" }} />
                )}
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Type the customer message to test against this content..." style={{ width: "100%", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "12px", color: t.text, lineHeight: "1.7", padding: "12px 14px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: t.textSub }}>
                  <input type="checkbox" checked={compareForced} onChange={(e) => setCompareForced(e.target.checked)} />
                  Compare against a forced {itemType.toLowerCase()} run
                </label>
                <button type="button" onClick={runTest} disabled={loading} style={{ background: loading ? `${accent}88` : accent, border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", padding: "11px 16px", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Running..." : compareForced ? `Compare ${itemType}` : `Test ${itemType}`}
                </button>
              </div>
            </Card>

            {error && (
              <div style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #FB718544", background: "#FB718514", color: "#FB7185", fontSize: "12px" }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {!result ? (
              <Card t={t} style={{ padding: "24px", color: t.textSub, fontSize: "13px" }}>
                Run a scoped test to see whether this {itemType.toLowerCase()} is selected and how the agent responds.
              </Card>
            ) : (
              <>
                {compareForced && forcedSummary && (
                  <Card t={t} style={{ padding: "16px", border: `1px solid ${accent}26`, background: `${accent}08` }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
                      Why This Failed
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {failureReasons.map((reason, index) => (
                        <div key={index} style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.7" }}>
                          {index + 1}. {reason}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {compareForced && forcedSummary ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
                    <div style={{ display: "grid", gap: "14px" }}>
                      <ResultPanel heading="Real Pipeline" summary={primarySummary} diagnostics={result.diagnostics} testedItem={result.tested_item} t={t} accent={accent} />
                    </div>
                    <div style={{ display: "grid", gap: "14px" }}>
                      <ResultPanel heading={`Forced ${itemType}`} summary={forcedSummary} diagnostics={{ ...result.diagnostics, selected: true, included_as_candidate: true }} testedItem={result.tested_item} t={t} accent={accent} />
                    </div>
                  </div>
                ) : (
                  <ResultPanel heading="Real Pipeline" summary={primarySummary} diagnostics={result.diagnostics} testedItem={result.tested_item} t={t} accent={accent} />
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
