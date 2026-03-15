import { useEffect, useState } from "react";
import { apiFetch, getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
export function Tickets({ t, accent }) {
  const clientId = getActiveClientId();
  const [search,         setSearch]         = useState("");
  const [statusF,        setStatusF]        = useState("all");
  const [channelF,       setChannelF]       = useState("all");
  const [selected,       setSelected]       = useState(null);
  const [page,           setPage]           = useState(1);
  const [threadMessages, setThreadMessages] = useState([]);
  const [msgsLoading,    setMsgsLoading]    = useState(false);
  const PER_PAGE = 30;

  const { data: raw, loading } = useApi(
    `/api/conversations?client_id=${clientId}&limit=200`, null, [clientId]
  );

  // Load real messages when a conversation is selected
  useEffect(() => {
    if (!selected?.id) { setThreadMessages([]); return; }
    setMsgsLoading(true);
    apiFetch(`/api/messages?conversation_id=${selected.id}&client_id=${clientId}`).then(msgs => {
      setThreadMessages(msgs || []);
      setMsgsLoading(false);
    });
  }, [clientId, selected?.id]);

  const conversations = (raw || []);

  const q = search.toLowerCase();
  const filtered = conversations.filter(c => {
    const matchStatus  = statusF  === "all" || c.status   === statusF;
    const matchChannel = channelF === "all" || c.channel  === channelF;
    const matchSearch  = !q || (c.customer_name||"").toLowerCase().includes(q)
      || (c.customer_email||"").toLowerCase().includes(q)
      || (c.subject||"").toLowerCase().includes(q)
      || (c.intent||"").toLowerCase().includes(q);
    return matchStatus && matchChannel && matchSearch;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore   = filtered.length > paginated.length;

  const sentColors = { positive: "#34D399", neutral: "#7A8DB3", negative: "#FBBF24", angry: "#FB7185" };
  const statColors = { open: "#4F8EF7", escalated: "#FB7185", resolved: "#34D399", pending: "#FBBF24" };

  const col = { border: `1px solid ${t.border}`, borderRadius: "0" };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 50px)", overflow: "hidden", background: t.bg }}>

      {/* ── Left panel ── */}
      <div style={{ width: "340px", flexShrink: 0, borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column", background: t.sidebar }}>

        {/* Header + filters */}
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              Conversations
            </span>
            <span style={{ fontSize: "11px", color: t.textMuted,
              background: t.surfaceHover, padding: "2px 8px", borderRadius: "999px",
              border: `1px solid ${t.border}` }}>{filtered.length}</span>
          </div>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px",
            background: t.surfaceHover, border: `1px solid ${t.border}`,
            borderRadius: "8px", padding: "7px 11px", marginBottom: "8px" }}>
            <span style={{ color: t.textMuted, fontSize: "12px" }}>⌕</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search conversations…"
              style={{ background: "transparent", border: "none", color: t.text,
                fontSize: "12px", flex: 1, outline: "none" }} />
          </div>
          {/* Filter row */}
          <div style={{ display: "flex", gap: "5px" }}>
            {["all","open","escalated","resolved"].map(s => (
              <button key={s} onClick={() => { setStatusF(s); setPage(1); }} style={{
                padding: "4px 9px", borderRadius: "6px", border: "none", cursor: "pointer",
                fontSize: "10.5px", fontWeight: statusF === s ? "700" : "400",
                background: statusF === s ? `${statColors[s] || accent}18` : t.surfaceHover,
                color: statusF === s ? (statColors[s] || accent) : t.textMuted,
              }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
            ))}
            <select value={channelF} onChange={e => { setChannelF(e.target.value); setPage(1); }}
              style={{ marginLeft: "auto", background: t.surfaceHover, border: `1px solid ${t.border}`,
                borderRadius: "6px", color: t.textSub, fontSize: "10.5px", padding: "3px 6px",
                cursor: "pointer", outline: "none" }}>
              {["all","email","chat","whatsapp","sms"].map(ch => (
                <option key={ch} value={ch}>{ch === "all" ? "All channels" : ch.charAt(0).toUpperCase()+ch.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              Loading…
            </div>
          )}
          {!loading && paginated.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
              No conversations match your filters.
            </div>
          )}
          {paginated.map(conv => {
            const isActive = selected?.id === conv.id;
            const ts = conv.created_at
              ? new Date(conv.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
              : "";
            return (
              <div key={conv.id} onClick={() => setSelected(conv)}
                style={{ padding: "12px 14px", borderBottom: `1px solid ${t.borderLight}`,
                  cursor: "pointer", transition: "background 0.1s",
                  background: isActive ? `${accent}10` : "transparent",
                  borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.surfaceHover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: isActive ? accent : t.text,
                    letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", maxWidth: "180px" }}>
                    {conv.customer_name || conv.customer_email || "Unknown"}
                  </span>
                  <span style={{ fontSize: "10px", color: t.textMuted, flexShrink: 0, marginLeft: "6px" }}>{ts}</span>
                </div>
                <div style={{ fontSize: "11.5px", color: t.textSub, marginBottom: "5px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conv.subject || conv.user_message?.slice(0,60) || "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  {/* Status */}
                  <span style={{ fontSize: "9.5px", fontWeight: "700", padding: "1px 6px",
                    borderRadius: "999px",
                    background: `${statColors[conv.status] || t.textMuted}18`,
                    color: statColors[conv.status] || t.textMuted }}>
                    {conv.status || "open"}
                  </span>
                  {/* Channel */}
                  {conv.channel && (
                    <span style={{ fontSize: "9.5px", color: t.textMuted,
                      background: t.surfaceHover, padding: "1px 5px", borderRadius: "4px" }}>
                      {conv.channel}
                    </span>
                  )}
                  {/* Intent */}
                  {conv.intent && (
                    <span style={{ fontSize: "9.5px", color: accent,
                      background: `${accent}12`, padding: "1px 6px", borderRadius: "4px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: "120px" }}>
                      {conv.intent}
                    </span>
                  )}
                  {/* Escalated flag */}
                  {conv.escalated && (
                    <span style={{ fontSize: "9px", color: "#FB7185" }}>⚠</span>
                  )}
                </div>
              </div>
            );
          })}
          {hasMore && (
            <div style={{ padding: "12px", textAlign: "center" }}>
              <button onClick={() => setPage(p => p+1)}
                style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
                  borderRadius: "7px", color: t.textSub, fontSize: "11px",
                  padding: "6px 16px", cursor: "pointer" }}>
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      {selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Conversation header */}
          <div style={{ padding: "13px 20px", borderBottom: `1px solid ${t.border}`,
            background: t.sidebar, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: t.text,
                  letterSpacing: "-0.02em", marginBottom: "3px" }}>
                  {selected.customer_name || selected.customer_email || "Unknown"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {selected.customer_email && (
                    <span style={{ fontSize: "11px", color: t.textMuted }}>{selected.customer_email}</span>
                  )}
                  {selected.channel && (
                    <span style={{ fontSize: "10px", background: t.surfaceHover,
                      border: `1px solid ${t.border}`, padding: "1px 7px",
                      borderRadius: "5px", color: t.textSub }}>via {selected.channel}</span>
                  )}
                  <span style={{ fontSize: "10px", color: t.textMuted }}>
                    {selected.created_at ? new Date(selected.created_at).toLocaleString() : ""}
                  </span>
                </div>
              </div>
              {/* AI Intelligence Summary */}
              <div style={{ display: "flex", gap: "7px", flexShrink: 0 }}>
                {selected.intent && (
                  <div style={{ background: `${accent}12`, border: `1px solid ${accent}30`,
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Intent</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: accent }}>{selected.intent}</div>
                  </div>
                )}
                {selected.confidence && (
                  <div style={{ background: `#34D39912`, border: "1px solid #34D39930",
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Confidence</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#34D399" }}>
                      {(selected.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                {selected.escalated !== undefined && (
                  <div style={{ background: selected.escalated ? "#FB718512" : "#34D39912",
                    border: `1px solid ${selected.escalated ? "#FB718530" : "#34D39930"}`,
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700",
                      color: selected.escalated ? "#FB7185" : "#34D399" }}>
                      {selected.escalated ? "Escalated" : "Resolved"}
                    </div>
                  </div>
                )}
                {selected.sop_used && (
                  <div style={{ background: "#A78BFA12", border: "1px solid #A78BFA30",
                    borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>SOP Used</div>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#A78BFA",
                      maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selected.sop_used}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject bar */}
          {selected.subject && (
            <div style={{ padding: "8px 20px", background: `${accent}08`,
              borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              <span style={{ fontSize: "11.5px", color: t.textSub }}>
                <span style={{ color: t.textMuted }}>Subject: </span>{selected.subject}
              </span>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Messages {selected.message_count > 1 ? `(${selected.message_count} exchanges)` : ""}
              </div>
              {selected.escalation_reason && (
                <div style={{ fontSize: "11px", background: "#FB718514",
                  border: "1px solid #FB718530", borderRadius: "6px",
                  padding: "4px 10px", color: "#FB7185", maxWidth: "260px" }}>
                  ⚠ Escalated: {selected.escalation_reason}
                </div>
              )}
            </div>

            {msgsLoading && (
              <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
                Loading messages…
              </div>
            )}

            {/* Render from messages table if available, otherwise fallback to single exchange */}
            {!msgsLoading && (() => {
              const displayMsgs = threadMessages.length > 0
                ? threadMessages.map(m => ({
                    from: m.sender_type === "bot" ? "agent" : m.sender_type === "customer" ? "customer" : "system",
                    name: m.sender_type === "bot" ? "Aria AI" : (selected.customer_name || "Customer"),
                    time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
                    text: m.content,
                    intent: m.intent,
                    confidence: m.confidence,
                  }))
                : [
                    { from: "customer", name: selected.customer_name || selected.customer_email || "Customer",
                      time: selected.created_at ? new Date(selected.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
                      text: selected.user_message || "" },
                    ...(selected.intent ? [{ from: "system", text:
                      `Intent: ${selected.intent}${selected.sop_used ? ` · SOP: ${selected.sop_used}` : ""}${selected.confidence ? ` · Confidence: ${(selected.confidence*100).toFixed(0)}%` : ""}${selected.escalated ? " · Escalated" : ""}` }] : []),
                    { from: "agent", name: "Aria AI",
                      time: selected.created_at ? new Date(new Date(selected.created_at).getTime()+12000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "",
                      text: selected.bot_response || "" },
                  ];

              return displayMsgs.map((msg, i) => {
                if (msg.from === "system") return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px",
                    justifyContent: "center", margin: "10px 0" }}>
                    <div style={{ flex: 1, height: "1px", background: t.border }} />
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
                      {msg.text.split(" · ").map((tag, j) => {
                        const isIntent    = tag.startsWith("Intent:");
                        const isSOP       = tag.startsWith("SOP:");
                        const isConf      = tag.startsWith("Confidence:");
                        const isEscalated = tag === "Escalated";
                        const color = isIntent ? accent : isSOP ? "#A78BFA" : isConf ? "#34D399"
                          : isEscalated ? "#FB7185" : t.textMuted;
                        return (
                          <span key={j} style={{ fontSize: "10px", color, background: `${color}14`,
                            padding: "2px 8px", borderRadius: "5px", fontWeight: "600",
                            border: `1px solid ${color}25` }}>
                            {isIntent ? "⚡ " : isSOP ? "📋 " : isConf ? "◎ " : isEscalated ? "⚠ " : "✓ "}{tag}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ flex: 1, height: "1px", background: t.border }} />
                  </div>
                );

                const isCustomer = msg.from === "customer";
                const isAgent    = msg.from === "agent";
                return (
                  <div key={i} style={{
                    display: "flex", flexDirection: "column",
                    alignItems: isCustomer ? "flex-start" : "flex-end",
                    marginBottom: "14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px",
                      flexDirection: isCustomer ? "row" : "row-reverse" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%",
                        background: isCustomer ? t.surfaceHover : `linear-gradient(135deg, ${accent}, ${accent}99)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: "700",
                        color: isCustomer ? t.textSub : "#fff",
                        border: `1px solid ${t.border}` }}>
                        {(msg.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: t.textSub }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize: "10px", color: t.textMuted }}>{msg.time}</span>
                      {isAgent && (
                        <span style={{ fontSize: "9px", background: `${accent}14`,
                          color: accent, padding: "1px 5px", borderRadius: "4px",
                          fontWeight: "700" }}>AI</span>
                      )}
                    </div>
                    <div style={{
                      maxWidth: "74%", padding: "11px 14px", borderRadius: "12px",
                      borderBottomLeftRadius: isCustomer ? "3px" : "12px",
                      borderBottomRightRadius: isAgent ? "3px" : "12px",
                      background: isCustomer ? t.surfaceHover : `${accent}18`,
                      border: `1px solid ${isCustomer ? t.border : accent + "30"}`,
                      fontSize: "13px", color: t.text, lineHeight: "1.6",
                      boxShadow: isAgent ? `0 2px 12px ${accent}12` : "none",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Actions bar */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${t.border}`,
            background: t.sidebar, display: "flex", alignItems: "center",
            justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ background: t.surfaceHover, border: `1px solid ${t.border}`,
                borderRadius: "7px", color: t.textSub, fontSize: "12px",
                padding: "6px 14px", cursor: "pointer" }}>
                Assign to Agent
              </button>
              <button style={{ background: "#FB718514", border: "1px solid #FB718530",
                borderRadius: "7px", color: "#FB7185", fontSize: "12px",
                padding: "6px 14px", cursor: "pointer" }}>
                Escalate
              </button>
            </div>
            <button style={{ background: "#34D39914", border: "1px solid #34D39930",
              borderRadius: "7px", color: "#34D399", fontSize: "12px",
              fontWeight: "600", padding: "6px 14px", cursor: "pointer" }}>
              Mark Resolved
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "10px", color: t.textMuted }}>
          <div style={{ fontSize: "28px" }}>◧</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.textSub }}>Select a conversation</div>
          <div style={{ fontSize: "12px" }}>Click any item on the left to view the thread</div>
        </div>
      )}
    </div>
  );
}


