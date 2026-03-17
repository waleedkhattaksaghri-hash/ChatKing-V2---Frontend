import { useEffect, useState } from "react";
import { apiFetch, apiJson, getActiveClientId } from "../lib/api";
import { Card, Pill, SectionHeader } from "./ui";
import { PageGuideCard } from "./SetupGuidance";

function formatSessionTitle(session) {
  if (!session) return "New session";
  if (session.channel === "email" && session.subject) return session.subject;
  return session.customer_name || session.customer_email || "Untitled session";
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function DiagnosticsPill({ label, value, tone = "default", t, accent }) {
  const colors = {
    default: { border: tone === "default" ? `${accent}2f` : t.border, background: `${accent}12`, color: accent },
    warn: { border: "#F59E0B44", background: "#F59E0B14", color: "#F59E0B" },
    danger: { border: "#FB718544", background: "#FB718514", color: "#FB7185" },
    ok: { border: "#10B98144", background: "#10B98114", color: "#10B981" },
  }[tone] || { border: t.border, background: t.surfaceHover, color: t.textSub };

  return (
    <span style={{ borderRadius: "999px", border: `1px solid ${colors.border}`, background: colors.background, color: colors.color, fontSize: "11px", fontWeight: "700", padding: "4px 9px" }}>
      {label}: {value}
    </span>
  );
}

function GuardrailSummary({ diagnostics, t, accent }) {
  if (!diagnostics?.guardrails && !diagnostics?.aiMeta && !diagnostics?.sourceSelection) return null;

  const guardrails = diagnostics.guardrails || {};
  const reasons = Array.isArray(guardrails.reasons) ? guardrails.reasons : Array.isArray(diagnostics.aiMeta?.policy_reasons) ? diagnostics.aiMeta.policy_reasons : [];
  const requiredFields = guardrails.required_fields_missing || [];
  const blockedActions = guardrails.blocked_actions || [];
  const allowedTools = guardrails.allowed_tools || [];
  const policyMode = diagnostics.sourceSelection?.mode || diagnostics.aiMeta?.policy_mode || null;

  return (
    <Card t={t} style={{ padding: "16px" }}>
      <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
        Guardrails
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        {policyMode && <DiagnosticsPill label="Mode" value={policyMode} tone={policyMode === "escalate" ? "danger" : policyMode === "clarify" ? "warn" : "ok"} t={t} accent={accent} />}
        <DiagnosticsPill label="Escalate" value={guardrails.must_escalate ? "Yes" : "No"} tone={guardrails.must_escalate ? "danger" : "ok"} t={t} accent={accent} />
        <DiagnosticsPill label="Clarify" value={guardrails.must_clarify ? "Yes" : "No"} tone={guardrails.must_clarify ? "warn" : "ok"} t={t} accent={accent} />
      </div>
      <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: t.textSub, lineHeight: "1.7" }}>
        <div><strong style={{ color: t.text }}>Reasons:</strong> {reasons.length ? reasons.join(", ") : "None"}</div>
        <div><strong style={{ color: t.text }}>Missing fields:</strong> {requiredFields.length ? requiredFields.join(", ") : "None"}</div>
        <div><strong style={{ color: t.text }}>Blocked actions:</strong> {blockedActions.length ? blockedActions.join(", ") : "None"}</div>
        <div><strong style={{ color: t.text }}>Allowed tools:</strong> {allowedTools.length ? allowedTools.join(", ") : "No tools exposed"}</div>
        {guardrails.clarification_question && <div><strong style={{ color: t.text }}>Guardrail clarification:</strong> {guardrails.clarification_question}</div>}
      </div>
    </Card>
  );
}

function MessageBubble({ message, t, accent }) {
  const fromCustomer = message.sender_type === "customer";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: fromCustomer ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: fromCustomer ? "56%" : "72%",
          background: fromCustomer ? `${accent}18` : t.surfaceHover,
          border: `1px solid ${message.isPending ? `${accent}33` : fromCustomer ? `${accent}40` : t.border}`,
          borderRadius: "18px",
          padding: "12px 14px",
          color: t.text,
          fontSize: "13px",
          lineHeight: "1.7",
          boxShadow: fromCustomer ? "none" : message.isPending ? "none" : t.shadow,
          width: "fit-content",
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: "700", color: fromCustomer ? accent : t.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {fromCustomer ? "Customer" : message.isPending ? "Agent thinking" : "Agent"}
        </div>
        <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
      </div>
    </div>
  );
}

export function AITestPanel({ t, accent }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [error, setError] = useState("");

  const [channel, setChannel] = useState("chat");
  const [customerName, setCustomerName] = useState("Test Customer");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [subject, setSubject] = useState("Question about a recent order");
  const [draftMessage, setDraftMessage] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [lastDiagnostics, setLastDiagnostics] = useState(null);
  const [pendingAgentMessageId, setPendingAgentMessageId] = useState("");

  const activeSession = sessions.find((session) => session.id === activeSessionId) || null;

  async function loadSessions(preferredId = "") {
    setLoadingSessions(true);
    setError("");

    try {
      const clientId = getActiveClientId();
      const data = await apiFetch(`/api/webhook/test/sessions?client_id=${encodeURIComponent(clientId)}`);
      if (!data) {
        throw new Error("Failed to load test sessions.");
      }

      setSessions(data);

      const nextId = preferredId || activeSessionId;
      const nextSession = data.find((session) => session.id === nextId) || data[0] || null;
      setActiveSessionId(nextSession?.id || "");
    } catch (nextError) {
      setError(nextError.message || "Failed to load test sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadMessages(sessionId) {
    if (!sessionId) {
      setMessages([]);
      setLastReply("");
      setLastDiagnostics(null);
      setPendingAgentMessageId("");
      return;
    }

    setLoadingMessages(true);
    setError("");

    try {
      const clientId = getActiveClientId();
      const data = await apiFetch(`/api/webhook/test/sessions/${sessionId}/messages?client_id=${encodeURIComponent(clientId)}`);
      if (!data) {
        throw new Error("Failed to load session messages.");
      }
      setMessages(data);
      setPendingAgentMessageId("");
      setLastDiagnostics(null);
      const latestBot = [...data].reverse().find((item) => item.sender_type === "bot");
      setLastReply(latestBot?.content || "");
    } catch (nextError) {
      setError(nextError.message || "Failed to load session messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  const clientId = getActiveClientId();

  useEffect(() => {
    if (!clientId) return;
    setActiveSessionId("");
    setMessages([]);
    setLastReply("");
    setLastDiagnostics(null);
    loadSessions();
  }, [clientId]);

  useEffect(() => {
    loadMessages(activeSessionId);
  }, [activeSessionId, clientId]);

  async function handleCreateSession() {
    setCreatingSession(true);
    setError("");

    try {
      const created = await apiJson("/api/webhook/test/sessions", {
        method: "POST",
        body: {
          client_id: getActiveClientId(),
          channel,
          customer_name: customerName.trim() || "Test Customer",
          customer_email: customerEmail.trim() || "test@example.com",
          subject: channel === "email" ? subject.trim() : "",
        },
      });

      setDraftMessage("");
      await loadSessions(created?.id || "");
    } catch (nextError) {
      setError(nextError.message || "Failed to start test session.");
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleSendMessage() {
    if (!activeSession || !draftMessage.trim()) return;

    const outgoingMessage = draftMessage.trim();
    const optimisticCustomerId = `optimistic-customer-${Date.now()}`;
    const optimisticAgentId = `optimistic-agent-${Date.now()}`;

    setSendingMessage(true);
    setError("");
    setDraftMessage("");
    setPendingAgentMessageId(optimisticAgentId);
    setMessages((current) => ([
      ...current,
      { id: optimisticCustomerId, sender_type: "customer", content: outgoingMessage, created_at: new Date().toISOString() },
      { id: optimisticAgentId, sender_type: "bot", content: "Thinking...", created_at: new Date().toISOString(), isPending: true },
    ]));

    try {
      const payload = await apiJson(`/api/webhook/test/sessions/${activeSession.id}/messages`, {
        method: "POST",
        body: {
          client_id: getActiveClientId(),
          message: outgoingMessage,
        },
      });

      setMessages(payload.messages || []);
      setPendingAgentMessageId("");
      setLastReply(payload.reply || "");
      setLastDiagnostics({
        guardrails: payload.guardrails || null,
        sourceSelection: payload.source_selection || null,
        aiMeta: payload.ai_meta || null,
      });
      loadSessions(activeSession.id);
    } catch (nextError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticCustomerId && message.id !== optimisticAgentId));
      setPendingAgentMessageId("");
      setLastDiagnostics(null);
      setDraftMessage(outgoingMessage);
      setError(nextError.message || "Failed to send test message.");
    } finally {
      setSendingMessage(false);
    }
  }

  function handleComposerKeyDown(event) {
    if (activeSession?.channel !== "chat") return;
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!sendingMessage && draftMessage.trim()) {
      handleSendMessage();
    }
  }

  async function handleCloseSession() {
    if (!activeSession) return;
    if (!window.confirm("End this test session? You can start a new one anytime.")) return;

    setClosingSession(true);
    setError("");

    try {
      await apiJson(`/api/webhook/test/sessions/${activeSession.id}/end`, {
        method: "POST",
        body: {
          client_id: getActiveClientId(),
        },
      });

      await loadSessions(activeSession.id);
    } catch (nextError) {
      setError(nextError.message || "Failed to close test session.");
    } finally {
      setClosingSession(false);
    }
  }

  const inputStyle = {
    width: "100%",
    background: t.surfaceHover,
    border: `1px solid ${t.border}`,
    borderRadius: "12px",
    color: t.text,
    fontSize: "13px",
    padding: "11px 13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div>
      <SectionHeader
        title="AI Test"
        sub="Start real test sessions for chat or email, then send multiple customer messages through the same backend logic your live agent uses. This is for end-to-end behavior testing, not one-off prompt previews."
        t={t}
      />

      <PageGuideCard
        t={t}
        accent={accent}
        title="AI Test guidance"
        belongs={[
          "Realistic multi-turn conversations that prove the whole setup works together.",
          "Tests for answer, clarify, escalate, guardrails, and continuity behavior.",
          "Final checks before pilot or production rollout.",
        ]}
        doesntBelong={[
          "Authoring source-of-truth content. Use Playbook, SOPs, KB, and Memory for that.",
          "One-line prompt experiments that ignore the actual retrieval pipeline.",
          "Regression coverage across many saved cases. Use Evaluations for that.",
        ]}
        exampleTitle="Good example"
        exampleText={"Customer: I need to cancel my order.\nFollow-up: Here is my order number 22194.\nWhat to check: Did the agent ask for the right identifier first, stay conversational, and then follow the cancellation SOP once the identifier was provided?"}
      />

      <Card t={t} style={{ padding: "18px 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Live Behavior Test
          </div>
          <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
            Each session stores a running conversation and sends every new message through the same backend pipeline used by live tickets: Agent Playbook, Issue Type classification, linked SOP retrieval, Knowledge Base fallback, and final reply generation.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            <Pill color={accent}>Multi-turn sessions</Pill>
            <Pill color={accent}>Email supported</Pill>
            <Pill color={accent}>Chat supported</Pill>
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "#FB718514", border: "1px solid #FB718540", color: "#FB7185", fontSize: "12px", marginBottom: "18px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)", gap: "18px", alignItems: "start" }}>
        <Card t={t} style={{ padding: "20px", display: "grid", gap: "18px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "12px" }}>Start New Session</div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Channel
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["chat", "email"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setChannel(value)}
                      style={{
                        background: channel === value ? `${accent}14` : t.surfaceHover,
                        border: `1px solid ${channel === value ? accent : t.border}`,
                        borderRadius: "10px",
                        color: channel === value ? accent : t.textSub,
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "9px 14px",
                        cursor: "pointer",
                      }}
                    >
                      {value === "chat" ? "Chat" : "Email"}
                    </button>
                  ))}
                </div>
              </div>

              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name" style={inputStyle} />
              <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Customer email" style={inputStyle} />

              {channel === "email" && (
                <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Email subject" style={inputStyle} />
              )}

              <button
                type="button"
                onClick={handleCreateSession}
                disabled={creatingSession}
                style={{
                  background: accent,
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "12px 14px",
                  cursor: creatingSession ? "default" : "pointer",
                  opacity: creatingSession ? 0.7 : 1,
                }}
              >
                {creatingSession ? "Starting..." : "Start Session"}
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Sessions</div>
              <button
                type="button"
                onClick={() => loadSessions(activeSessionId)}
                disabled={loadingSessions}
                style={{
                  background: "none",
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  color: t.textSub,
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "8px 12px",
                  cursor: loadingSessions ? "default" : "pointer",
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ display: "grid", gap: "10px", maxHeight: "580px", overflow: "auto", paddingRight: "2px" }}>
              {!sessions.length && !loadingSessions && (
                <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
                  No test sessions yet. Start one above to simulate a customer conversation.
                </div>
              )}

              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setActiveSessionId(session.id)}
                    style={{
                      textAlign: "left",
                      background: isActive ? `${accent}12` : t.surfaceHover,
                      border: `1px solid ${isActive ? accent : t.border}`,
                      borderRadius: "16px",
                      padding: "14px 15px",
                      cursor: "pointer",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: isActive ? accent : t.text }}>
                        {formatSessionTitle(session)}
                      </div>
                      <Pill color={session.status === "closed" ? t.textMuted : accent}>
                        {session.status || "open"}
                      </Pill>
                    </div>
                    <div style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.6" }}>
                      {session.channel === "email" ? "Email session" : "Chat session"} · {session.customer_email || "No email"}
                    </div>
                    <div style={{ fontSize: "11px", color: t.textMuted }}>
                      Updated {formatDate(session.updated_at)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card t={t} style={{ padding: "20px", minHeight: "760px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: "16px" }}>
          {!activeSession ? (
            <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
              Start a test session or select an existing one to begin chatting with the agent.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "start" }}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Pill color={accent}>{activeSession.channel === "email" ? "Email Session" : "Chat Session"}</Pill>
                    <Pill color={activeSession.status === "closed" ? t.textMuted : "#34D399"}>
                      {activeSession.status === "closed" ? "Closed" : "Open"}
                    </Pill>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: t.text }}>
                    {formatSessionTitle(activeSession)}
                  </div>
                  <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
                    {activeSession.customer_name || "Customer"} · {activeSession.customer_email || "No email"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={closingSession || activeSession.status === "closed"}
                  style={{
                    background: "none",
                    border: `1px solid ${t.border}`,
                    borderRadius: "12px",
                    color: t.textSub,
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "10px 14px",
                    cursor: closingSession || activeSession.status === "closed" ? "default" : "pointer",
                    opacity: closingSession || activeSession.status === "closed" ? 0.6 : 1,
                  }}
                >
                  {closingSession ? "Closing..." : "End Session"}
                </button>
              </div>

              <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "18px", overflow: "auto", display: "grid", gap: "12px" }}>
                {!messages.length && !loadingMessages && (
                  <div style={{ fontSize: "12.5px", color: t.textSub, lineHeight: "1.7" }}>
                    No messages yet. Send the first customer message below and the agent will answer using the live support pipeline.
                  </div>
                )}

                {messages.map((message) => (
                  <MessageBubble key={message.id || `${message.sender_type}-${message.created_at}`} message={message} t={t} accent={accent} />
                ))}

                {!loadingMessages && lastReply && !messages.some((message) => message.sender_type === "bot" && message.content === lastReply) && (
                  <MessageBubble
                    message={{ sender_type: "bot", content: lastReply }}
                    t={t}
                    accent={accent}
                  />
                )}
              </div>

              <GuardrailSummary diagnostics={lastDiagnostics} t={t} accent={accent} />

              <GuardrailSummary diagnostics={lastDiagnostics} t={t} accent={accent} />

              <div style={{ display: "grid", gap: "10px" }}>
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={3}
                  placeholder={activeSession.status === "closed" ? "This session is closed." : "Type the next customer message..."}
                  disabled={activeSession.status === "closed" || sendingMessage}
                  style={{ ...inputStyle, resize: "none", lineHeight: "1.7", minHeight: "72px", maxHeight: "72px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", color: t.textMuted }}>
                    This conversation reuses the same ticket history on every turn, so the agent response should match live behavior closely.
                  </div>
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={activeSession.status === "closed" || sendingMessage || !draftMessage.trim()}
                    style={{
                      background: accent,
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "11px 16px",
                      cursor: activeSession.status === "closed" || sendingMessage || !draftMessage.trim() ? "default" : "pointer",
                      opacity: activeSession.status === "closed" || sendingMessage ? 0.7 : 1,
                    }}
                  >
                    {sendingMessage ? "Sending..." : "Send Customer Message"}
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
