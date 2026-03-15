import { useState } from "react";
import { apiJson, getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader } from "./ui";
export function Evaluations({ t, accent, evaluatedIds, setEvaluatedIds }) {
  const clientId = getActiveClientId();
  const [period, setPeriod] = useState("week");
  const [evalTicket, setEvalTicket] = useState(null);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [filterTask, setFilterTask] = useState("all");
  const [filterIssue, setFilterIssue] = useState("all");
  const [filterSop, setFilterSop] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");

  const days = period === "today" ? 1 : period === "week" ? 7 : 30;
  const { data: rawConvs, loading: convsLoading } = useApi(`/api/conversations?client_id=${clientId}&limit=500`, null, [clientId]);
  const { data: analytics7  } = useApi(`/api/analytics?client_id=${clientId}&days=7`, null, [clientId]);
  const { data: analytics30 } = useApi(`/api/analytics?client_id=${clientId}&days=30`, null, [clientId]);
  const { data: analytics1  } = useApi(`/api/analytics?client_id=${clientId}&days=1`, null, [clientId]);
  const { data: rawIntentsEval } = useApi(`/api/analytics/intents?client_id=${clientId}&limit=30`, null, [clientId]);
  const { data: rawSopsEval    } = useApi(`/api/sops?client_id=${clientId}`, null, [clientId]);
  const { data: rawReviewsEval } = useApi(`/api/reviews?client_id=${clientId}`, null, [clientId]);

  const intentOptions  = (rawIntentsEval || []).map(i => i.intent).filter(Boolean);
  const sopOptions     = (rawSopsEval || []).map((s) => s.title || s.name).filter(Boolean);
  const channelOptions = ["email","chat","whatsapp","sms"];

  // Build ticket list from real conversations (non-escalated = AI managed)
  const allEvalTickets = (rawConvs || [])
    .filter(c => !c.escalated)
    .filter(c => filterIssue   === "all" || c.intent   === filterIssue)
    .filter(c => filterSop     === "all" || c.sop_used === filterSop)
    .filter(c => filterChannel === "all" || c.channel  === filterChannel)
    .map(c => ({
      id:          c.id,
      customer:    c.customer_name || c.customer_email || "Customer",
      email:       c.customer_email,
      channel:     c.channel,
      status:      c.status,
      sopTag:      c.sop_used || "Agent",
      champStatus: "AI Managed",
      preview:     (c.user_message || "").slice(0, 60),
      messages: [
        { from: "customer", name: c.customer_name || "Customer",
          time: c.created_at ? new Date(c.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
          text: c.user_message || "" },
        ...(c.intent ? [{ from: "system", text:
          `Issue Type: ${c.intent}${c.sop_used ? ` · SOP: ${c.sop_used}` : ""}${c.confidence ? ` · Confidence: ${(c.confidence*100).toFixed(0)}%` : ""}` }] : []),
        { from: "agent", name: "Aria AI",
          time: c.created_at ? new Date(new Date(c.created_at).getTime()+12000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
          text: c.bot_response || "" },
      ],
    }));

  const pendingTickets = allEvalTickets.filter(tk => !evaluatedIds.has(tk.id));
  const doneCount      = allEvalTickets.length - pendingTickets.length;

  // Real analytics for stats table
  const s1  = analytics1?.summary  || {};
  const s7  = analytics7?.summary  || {};
  const s30 = analytics30?.summary || {};
  const reviews = rawReviewsEval || [];
  const positiveReviews = reviews.filter(r => r.rating === "positive").length;
  const totalReviews    = reviews.length;

  function accStr(reviewed, total) {
    if (!total) return "N/A";
    if (!reviewed) return "0 reviewed";
    const pct = Math.round((reviewed / total) * 100);
    return `${pct}% positive (${reviewed} reviewed)`;
  }

  const rows = [
    { label: "Conversations",
      cols: [
        `${(s1.total_messages||0).toLocaleString()} total`,
        `${(s7.total_messages||0).toLocaleString()} total`,
        `${(s30.total_messages||0).toLocaleString()} total`,
      ],
      accuracy: [
        `${s1.containment_rate||"0.0"}% contained`,
        `${s7.containment_rate||"0.0"}% contained`,
        `${s30.containment_rate||"0.0"}% contained`,
      ]
    },
    { label: "AI Handled",
      cols: [
        `${(s1.automated_responses||0).toLocaleString()} automated`,
        `${(s7.automated_responses||0).toLocaleString()} automated`,
        `${(s30.automated_responses||0).toLocaleString()} automated`,
      ],
      accuracy: [
        `${(s1.escalations||0)} escalated`,
        `${(s7.escalations||0)} escalated`,
        `${(s30.escalations||0)} escalated`,
      ]
    },
    { label: "AI Response Quality",
      cols: [
        `${totalReviews} total reviews`,
        `${totalReviews} total reviews`,
        `${totalReviews} total reviews`,
      ],
      accuracy: [
        accStr(positiveReviews, totalReviews),
        accStr(positiveReviews, totalReviews),
        accStr(positiveReviews, totalReviews),
      ]
    },
  ];

  function openTicket(tk) {
    setEvalTicket(tk);
    setRating(null);
    setFeedback("");
    setJustSubmitted(false);
  }

  async function handleSubmit() {
    if (!rating || !evalTicket) return;
    setSubmitting(true);

    // Extract issue type from system message
    const sysMsg = evalTicket.messages.find(m => m.from === "system");
    const issueType = sysMsg ? (sysMsg.text.split("Issue Type: ")[1]?.split(" · ")[0] || "General Support") : "General Support";

    // Last AI response text
    const aiMsgs = evalTicket.messages.filter(m => m.from === "agent");
    const aiResponse = aiMsgs[aiMsgs.length - 1]?.text || "";

    // Save to API
    try {
      await apiJson("/api/reviews", {
        method: "POST",
        body: {
          client_id:   clientId,
          ticket_id:   evalTicket.id,
          customer:    evalTicket.customer,
          issue_type:  issueType,
          sop_used:    evalTicket.sopTag || null,
          ai_response: aiResponse,
          rating,
          feedback: feedback.trim() || (rating === "positive" ? "No issues — AI handled this correctly." : "No specific feedback provided."),
          reviewer: "Team",
        },
      });
    } catch(e) { console.error("Review save failed:", e); }

    setEvaluatedIds(prev => new Set([...prev, evalTicket.id]));

    // Find the next pending ticket (excluding the one just submitted)
    const nextPending = pendingTickets.filter(tk => tk.id !== evalTicket.id);

    setTimeout(() => {
      setSubmitting(false);
      setJustSubmitted(true);
      setTimeout(() => {
        if (nextPending.length > 0) {
          openTicket(nextPending[0]);
        } else {
          setEvalTicket(null);
          setJustSubmitted(false);
        }
      }, 1200);
    }, 400);
  }

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* Left — filters + stats */}
      <div style={{ flex: 1 }}>
        <SectionHeader title="Evaluations" sub="Review AI agent performance across triage, SOP execution, and response quality." t={t} />

        {/* Filter row */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          <select value={filterIssue} onChange={e => setFilterIssue(e.target.value)}
            style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 12px",
              outline: "none", cursor: "pointer", width: "340px" }}>
            <option value="all">Issue Types (All)</option>
            {intentOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterSop} onChange={e => setFilterSop(e.target.value)}
            style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 12px",
              outline: "none", cursor: "pointer", width: "340px" }}>
            <option value="all">SOPs (All)</option>
            {sopOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
            style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
              borderRadius: "8px", color: t.textSub, fontSize: "13px", padding: "9px 12px",
              outline: "none", cursor: "pointer", width: "340px" }}>
            <option value="all">Channels (All)</option>
            {channelOptions.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
          </select>
          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="date" style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "8px 12px", outline: "none", cursor: "pointer" }} />
            <span style={{ color: t.textMuted, fontSize: "13px" }}>to</span>
            <input type="date" style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "8px 12px", outline: "none", cursor: "pointer" }} />
            <button style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "13px", fontWeight: "600", padding: "8px 18px", cursor: "pointer" }}>Apply</button>
          </div>
        </div>

        {/* Period toggle */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {[["today","Today"],["week","Last 7 Days"],["month","Last 30 Days"]].map(([val,label]) => (
            <Pill key={val} active={period === val} accent={accent} onClick={() => setPeriod(val)} t={t}>{label}</Pill>
          ))}
        </div>

        {/* Stats table */}
        <Card t={t} style={{ overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            padding: "10px 16px", borderBottom: `1px solid ${t.border}`,
            fontSize: "10px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span></span><span>Today</span><span>Last 7 days</span><span>Last 30 days</span>
          </div>
          {rows.map((row, ri) => (
            <div key={row.label} style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${t.borderLight}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                padding: "12px 16px", alignItems: "start" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{row.label}</span>
                {row.cols.map((col, ci) => (
                  <div key={ci}>
                    <div style={{ fontSize: "12px", color: t.textSub }}>{col}</div>
                    <div style={{ fontSize: "11px", color: row.accuracy[ci] === "N/A" ? t.textMuted : "#10B981", marginTop: "2px" }}>
                      {row.accuracy[ci]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {convsLoading && (
          <div style={{ padding: "20px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>Loading conversations…</div>
        )}

        {/* Progress + ticket list */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>
            Tickets Pending Evaluation
            <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: "400", color: t.textMuted }}>
              ({pendingTickets.length} remaining · {doneCount} evaluated)
            </span>
          </div>
          {pendingTickets.length > 0 && (
            <button onClick={() => openTicket(pendingTickets[0])} style={{
              background: accent, border: "none", borderRadius: "7px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "6px 14px", cursor: "pointer",
            }}>Start Queue →</button>
          )}
        </div>

        {/* Progress bar */}
        {allEvalTickets.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
                width: `${(doneCount / allEvalTickets.length) * 100}%`, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>
              {doneCount} of {allEvalTickets.length} evaluated
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {allEvalTickets.map((tk, i) => {
            const isDone   = evaluatedIds.has(tk.id);
            const isActive = evalTicket?.id === tk.id;
            return (
              <div key={tk.id} onClick={() => !isDone && openTicket(tk)}
                style={{ display: "flex", alignItems: "center", gap: "14px",
                  background: isActive ? `${accent}12` : isDone ? t.surfaceHover : t.surface,
                  border: `1px solid ${isActive ? accent : isDone ? t.borderLight : t.border}`,
                  borderRadius: "10px", padding: "11px 16px",
                  cursor: isDone ? "default" : "pointer",
                  opacity: isDone ? 0.6 : 1, transition: "all 0.15s" }}
                onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = `${accent}08`; }}
                onMouseLeave={e => { if (!isDone) e.currentTarget.style.background = isActive ? `${accent}12` : t.surface; }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                  background: isDone ? "#10B98120" : `${accent}20`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                  {isDone ? "✓" : "⚡"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{tk.customer}</div>
                  <div style={{ fontSize: "11px", color: t.textSub }}>{tk.sopTag} · #{tk.id}</div>
                </div>
                {isDone
                  ? <span style={{ fontSize: "11px", color: "#10B981", fontWeight: "600" }}>Evaluated ✓</span>
                  : <span style={{ fontSize: "11px", color: accent }}>
                      {isActive ? "Evaluating…" : `#${pendingTickets.indexOf(tk) + 1} in queue`}
                    </span>
                }
              </div>
            );
          })}
          {pendingTickets.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#10B981", fontSize: "13px", fontWeight: "600",
              background: "#10B98110", borderRadius: "10px", border: "1px solid #10B98130" }}>
              ✓ All tickets evaluated — check Reviews to see your submitted feedback.
            </div>
          )}
        </div>
      </div>

      {/* Right — evaluation panel */}
      {evalTicket && (
        <div style={{ width: "380px", flexShrink: 0 }}>
          <Card t={t} style={{ padding: "20px", position: "sticky", top: "20px" }}>

            {/* Header with progress */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>Evaluate Ticket</div>
                <div style={{ fontSize: "11px", color: t.textSub, marginTop: "2px" }}>#{evalTicket.id} · {evalTicket.customer}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: t.textMuted }}>
                  {pendingTickets.findIndex(tk => tk.id === evalTicket.id) + 1} of {pendingTickets.length} pending
                </div>
                {pendingTickets.length > 1 && (
                  <button onClick={() => {
                    const idx = pendingTickets.findIndex(tk => tk.id === evalTicket.id);
                    const next = pendingTickets[(idx + 1) % pendingTickets.length];
                    openTicket(next);
                  }} style={{ background: "none", border: "none", color: accent, fontSize: "11px",
                    cursor: "pointer", padding: 0, marginTop: "2px" }}>Skip →</button>
                )}
              </div>
            </div>

            {/* Conversation preview */}
            <div style={{ background: t.surfaceHover, borderRadius: "8px", padding: "12px", marginBottom: "16px",
              maxHeight: "220px", overflowY: "auto" }}>
              {evalTicket.messages.filter(m => m.from !== "system").map((msg, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: msg.from === "agent" ? accent : t.textSub }}>
                    {msg.from === "agent" ? "Aria AI" : evalTicket.customer}:
                  </span>
                  <p style={{ fontSize: "12px", color: t.text, marginTop: "2px", lineHeight: "1.5", margin: "2px 0 0" }}>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div style={{ fontSize: "12px", fontWeight: "600", color: t.text, marginBottom: "10px" }}>Rate AI Performance</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              {[["positive","👍","#10B981"],["needs_work","👎","#EF4444"]].map(([val, icon, color]) => (
                <button key={val} onClick={() => setRating(val)} style={{
                  flex: 1, padding: "12px", borderRadius: "10px", cursor: "pointer", fontSize: "20px",
                  background: rating === val ? `${color}20` : t.surfaceHover,
                  border: `2px solid ${rating === val ? color : t.border}`,
                  transition: "all 0.15s",
                }}>{icon}</button>
              ))}
            </div>

            {/* Feedback */}
            <div style={{ fontSize: "12px", fontWeight: "600", color: t.text, marginBottom: "8px" }}>
              Feedback {rating === "needs_work" ? "(required)" : "(optional)"}
            </div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
              placeholder={rating === "needs_work"
                ? "What should the AI have done differently?"
                : "Any notes about this response? (optional)"}
              style={{ width: "100%", background: t.surfaceHover,
                border: `1px solid ${rating === "needs_work" && !feedback.trim() ? "#F59E0B" : t.border}`,
                borderRadius: "8px", color: t.text, fontSize: "12px", padding: "10px 12px",
                fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: "1.5",
                transition: "border-color 0.15s", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = (rating === "needs_work" && !feedback.trim()) ? "#F59E0B" : t.border}
            />

            <button
              onClick={handleSubmit}
              disabled={!rating || submitting || (rating === "needs_work" && !feedback.trim())}
              style={{
                width: "100%", marginTop: "12px", padding: "11px",
                background: justSubmitted ? "#059669" : (!rating || (rating === "needs_work" && !feedback.trim())) ? t.border : accent,
                border: "none", borderRadius: "8px", color: "#fff",
                fontSize: "13px", fontWeight: "600",
                cursor: (!rating || submitting || (rating === "needs_work" && !feedback.trim())) ? "default" : "pointer",
                transition: "all 0.2s",
              }}>
              {justSubmitted ? "✓ Submitted — loading next…"
                : submitting ? "Submitting…"
                : pendingTickets.length > 1 ? "Submit & Next →"
                : "Submit Evaluation"}
            </button>

            {rating === "needs_work" && !feedback.trim() && (
              <p style={{ fontSize: "11px", color: "#F59E0B", marginTop: "6px", textAlign: "center" }}>
                Please add feedback when marking as needs improvement.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );

}

