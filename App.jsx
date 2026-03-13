import { useState, useEffect, useRef } from "react";

// ─── Fake Data Layer (replace with Supabase calls) ───────────────────────────
const fakeAnalytics = {
  totalConversations: 48291,
  automationRate: 94.2,
  escalations: 2813,
  hoursSaved: 1204,
  costSavings: 96320,
  weeklyTrend: [
    { day: "Mon", automated: 1820, escalated: 92 },
    { day: "Tue", automated: 2140, escalated: 78 },
    { day: "Wed", automated: 1990, escalated: 105 },
    { day: "Thu", automated: 2380, escalated: 88 },
    { day: "Fri", automated: 2610, escalated: 71 },
    { day: "Sat", automated: 1450, escalated: 63 },
    { day: "Sun", automated: 980, escalated: 44 },
  ],
  topIntents: [
    { intent: "Order Status", count: 9241, pct: 91 },
    { intent: "Return Policy", count: 7832, pct: 88 },
    { intent: "Password Reset", count: 6104, pct: 97 },
    { intent: "Billing Inquiry", count: 5290, pct: 79 },
    { intent: "Product Info", count: 4867, pct: 93 },
  ],
  knowledgeGaps: [
    { question: "Warranty coverage for international orders", count: 312 },
    { question: "Bulk discount pricing tiers", count: 287 },
    { question: "API rate limit details", count: 201 },
    { question: "Data residency options", count: 178 },
  ],
};

const fakeConversations = Array.from({ length: 40 }, (_, i) => ({
  id: `conv_${1000 + i}`,
  customer: `Customer message about ${["order tracking", "refund request", "account access", "subscription upgrade", "technical issue", "billing question"][i % 6]} — ticket #${9000 + i}`,
  bot: `Thank you for reaching out. ${["Your order #${i+100} is currently in transit and expected to arrive within 2 business days.", "Our refund policy allows returns within 30 days. I've initiated the process for you.", "I've sent a password reset link to your registered email.", "Your plan has been upgraded successfully. New features are now active.", "I've escalated your technical issue to our engineering team.", "Your invoice for this billing cycle has been sent to your email."][i % 6]}`,
  intent: ["Order Status", "Return Policy", "Password Reset", "Plan Upgrade", "Technical Support", "Billing Inquiry"][i % 6],
  confidence: (75 + Math.floor(Math.random() * 24)) / 100,
  sentiment: ["positive", "neutral", "negative"][i % 3],
  escalated: i % 7 === 0,
  ts: new Date(Date.now() - i * 1000 * 60 * 37).toISOString(),
}));

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#6EE7B7" }) {
  const w = 80, h = 32;
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg_${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg_${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.automated + d.escalated));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", padding: "0 4px" }}>
      {data.map((d, i) => {
        const totalH = ((d.automated + d.escalated) / maxVal) * 100;
        const escH = (d.escalated / (d.automated + d.escalated)) * totalH;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100px", gap: "1px" }}>
              <div style={{ height: `${escH}%`, background: "#F87171", borderRadius: "2px 2px 0 0", minHeight: escH > 0 ? 2 : 0 }} />
              <div style={{ height: `${totalH - escH}%`, background: "linear-gradient(180deg,#34D399,#059669)", borderRadius: `${escH === 0 ? "2px 2px" : "0 0"} 0 0` }} />
            </div>
            <span style={{ fontSize: "10px", color: "#6B7280", fontFamily: "monospace" }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────────
function DonutChart({ value, size = 80 }) {
  const r = 30, cx = 40, cy = 40;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1F2937" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34D399" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#F9FAFB" fontSize="14" fontWeight="700" fontFamily="monospace">{value}%</text>
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#34D399", sparkData, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = typeof value === "number" ? value : 0;
    let start = 0;
    const step = target / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(t);
  }, [value]);

  const display = typeof value === "number"
    ? `${prefix}${count.toLocaleString()}${suffix}`
    : value;

  return (
    <div style={{
      background: "linear-gradient(135deg,#111827 0%,#0F172A 100%)",
      border: "1px solid #1F2937",
      borderRadius: "12px",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1F2937"}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px",
        background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#6B7280", fontFamily: "'DM Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: "28px", fontWeight: "700", color: "#F9FAFB",
        fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>{display}</span>
      {sub && <span style={{ fontSize: "12px", color: "#4B5563" }}>{sub}</span>}
      {sparkData && <Sparkline data={sparkData} color={color} />}
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
      background: active ? "linear-gradient(90deg,#065F4620,#065F4610)" : "transparent",
      color: active ? "#34D399" : "#6B7280",
      fontSize: "13px", fontWeight: active ? "600" : "400",
      fontFamily: "'Sora', sans-serif",
      width: "100%", textAlign: "left",
      borderLeft: active ? "2px solid #34D399" : "2px solid transparent",
      transition: "all 0.15s ease",
    }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ background: "#EF4444", color: "#fff", borderRadius: "999px",
        fontSize: "10px", padding: "1px 6px", fontWeight: "700" }}>{badge}</span>}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ChatKingDashboard() {
  const [tab, setTab] = useState("overview");
  const [searchConv, setSearchConv] = useState("");
  const [botName, setBotName] = useState("Aria");
  const [greeting, setGreeting] = useState("Hi! I'm Aria, your support assistant. How can I help you today?");
  const [fallback, setFallback] = useState("I'm sorry, I didn't quite catch that. Let me connect you with a human agent.");
  const [tone, setTone] = useState("Professional");
  const [threshold, setThreshold] = useState(0.72);
  const [saved, setSaved] = useState(false);
  const a = fakeAnalytics;

  const filteredConvs = fakeConversations.filter(c =>
    c.customer.toLowerCase().includes(searchConv.toLowerCase()) ||
    c.intent.toLowerCase().includes(searchConv.toLowerCase())
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sentColor = s => s === "positive" ? "#34D399" : s === "negative" ? "#F87171" : "#9CA3AF";

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#060B14",
      fontFamily: "'Sora', sans-serif",
      color: "#F9FAFB",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 4px; }
        input, textarea, select { outline: none; }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .tab-content { animation: fadeUp 0.3s ease; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "220px", flexShrink: 0,
        background: "#080E1A",
        borderRight: "1px solid #111827",
        display: "flex", flexDirection: "column",
        padding: "0",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid #111827" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg,#059669,#34D399)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: "800", color: "#fff",
              fontFamily: "'DM Mono', monospace",
            }}>K</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#F9FAFB", letterSpacing: "-0.02em" }}>ChatKing</div>
              <div style={{ fontSize: "10px", color: "#374151", letterSpacing: "0.05em" }}>ENTERPRISE</div>
            </div>
          </div>
        </div>

        {/* Client Selector */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #111827" }}>
          <div style={{
            background: "#0F172A", border: "1px solid #1F2937", borderRadius: "8px",
            padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34D399",
              animation: "pulse-dot 2s infinite" }} />
            <span style={{ fontSize: "12px", color: "#D1D5DB", flex: 1 }}>Acme Corp</span>
            <span style={{ fontSize: "10px", color: "#4B5563" }}>▾</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {[
            { id: "overview", icon: "⬡", label: "Overview" },
            { id: "conversations", icon: "◈", label: "Conversations", badge: "12" },
            { id: "insights", icon: "◉", label: "Insights" },
            { id: "knowledge", icon: "⬟", label: "Knowledge Base" },
            { id: "config", icon: "⊞", label: "Bot Config" },
          ].map(item => (
            <NavItem key={item.id} {...item} active={tab === item.id} onClick={() => setTab(item.id)} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #111827" }}>
          <NavItem icon="⊙" label="Settings" active={false} onClick={() => {}} />
          <NavItem icon="⊘" label="Documentation" active={false} onClick={() => {}} />
          <div style={{ padding: "12px 14px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%",
                background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: "700" }}>JD</div>
              <div>
                <div style={{ fontSize: "11px", color: "#D1D5DB", fontWeight: "600" }}>James D.</div>
                <div style={{ fontSize: "10px", color: "#4B5563" }}>Admin</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <header style={{
          height: "56px", flexShrink: 0,
          borderBottom: "1px solid #111827",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
          background: "#060B14",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#F9FAFB", letterSpacing: "-0.02em" }}>
              {tab === "overview" && "Overview"}
              {tab === "conversations" && "Conversations"}
              {tab === "insights" && "Insights & Analytics"}
              {tab === "knowledge" && "Knowledge Base"}
              {tab === "config" && "Bot Configuration"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px",
              background: "#0F172A", border: "1px solid #1F2937", borderRadius: "6px",
              padding: "5px 10px", fontSize: "11px", color: "#6B7280" }}>
              <span style={{ color: "#34D399", fontSize: "9px" }}>●</span>
              All Systems Operational
            </div>
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "6px",
              padding: "5px 12px", fontSize: "11px", color: "#9CA3AF", cursor: "pointer",
              fontFamily: "'DM Mono', monospace" }}>
              Last 7 days ▾
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="tab-content" key={tab} style={{ flex: 1, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && <>
            {/* Stat Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px" }}>
              <StatCard label="Total Conversations" value={a.totalConversations}
                sub="↑ 12.4% from last week" color="#34D399"
                sparkData={a.weeklyTrend.map(d => d.automated)} />
              <StatCard label="Automation Rate" value={a.automationRate}
                sub="↑ 2.1% improvement" color="#60A5FA" suffix="%" />
              <StatCard label="Escalations" value={a.escalations}
                sub="↓ 8.2% this week" color="#F87171"
                sparkData={a.weeklyTrend.map(d => d.escalated)} />
              <StatCard label="Hours Saved" value={a.hoursSaved}
                sub="This billing period" color="#A78BFA" suffix="h" />
              <StatCard label="Cost Savings" value={a.costSavings}
                sub="Estimated this month" color="#FCD34D" prefix="$" />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Bar chart */}
              <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Conversation Volume</span>
                  <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: "#6B7280" }}>
                    <span><span style={{ color: "#34D399" }}>■</span> Automated</span>
                    <span><span style={{ color: "#F87171" }}>■</span> Escalated</span>
                  </div>
                </div>
                <BarChart data={a.weeklyTrend} />
              </div>

              {/* Automation donut */}
              <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "20px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Automation Health</span>
                <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "18px" }}>
                  <DonutChart value={Math.round(a.automationRate)} size={100} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Fully Automated", val: "94.2%", c: "#34D399" },
                      { label: "Human Assisted", val: "4.1%", c: "#60A5FA" },
                      { label: "Escalated", val: "1.7%", c: "#F87171" },
                    ].map(r => (
                      <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: r.c }} />
                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{r.label}</span>
                        <span style={{ fontSize: "12px", color: "#F9FAFB", fontWeight: "600", marginLeft: "auto", paddingLeft: "12px", fontFamily: "'DM Mono', monospace" }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Panel */}
            <div style={{ background: "linear-gradient(135deg,#0A1A12,#0A1020)", border: "1px solid #064E3B", borderRadius: "12px", padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>ROI Impact Summary</span>
                <span style={{ background: "#064E3B", color: "#34D399", fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>ENTERPRISE</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px" }}>
                {[
                  { label: "Tickets Automated", val: "45,478", icon: "⚡" },
                  { label: "Agent Hours Freed", val: "1,204h", icon: "⏱" },
                  { label: "Estimated Savings", val: "$96,320", icon: "💰" },
                  { label: "CSAT Score", val: "4.8 / 5", icon: "★" },
                ].map(r => (
                  <div key={r.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "22px", marginBottom: "4px" }}>{r.icon}</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#34D399", fontFamily: "'DM Mono', monospace" }}>{r.val}</div>
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Gap Alert */}
            <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Knowledge Gaps Detected</span>
                  <span style={{ background: "#7C2D12", color: "#FCA5A5", fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                    {a.knowledgeGaps.length} UNRESOLVED
                  </span>
                </div>
                <button onClick={() => setTab("knowledge")} style={{
                  background: "transparent", border: "1px solid #374151", borderRadius: "6px",
                  color: "#9CA3AF", fontSize: "11px", padding: "4px 10px", cursor: "pointer",
                }}>View All →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {a.knowledgeGaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px",
                    background: "#0F172A", borderRadius: "8px", padding: "10px 14px",
                    border: "1px solid #1F2937" }}>
                    <span style={{ fontSize: "11px", color: "#F87171", fontFamily: "'DM Mono', monospace", minWidth: "40px" }}>{g.count}x</span>
                    <span style={{ fontSize: "12px", color: "#D1D5DB", flex: 1 }}>"{g.question}"</span>
                    <span style={{ fontSize: "10px", color: "#F87171", background: "#1F0A0A", padding: "2px 8px", borderRadius: "4px" }}>No Answer</span>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ── CONVERSATIONS ── */}
          {tab === "conversations" && <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, background: "#0A1020", border: "1px solid #1F2937", borderRadius: "8px",
                display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px" }}>
                <span style={{ color: "#4B5563", fontSize: "14px" }}>⌕</span>
                <input value={searchConv} onChange={e => setSearchConv(e.target.value)}
                  placeholder="Search conversations, intents..."
                  style={{ background: "transparent", border: "none", color: "#F9FAFB", fontSize: "13px", flex: 1 }} />
              </div>
              <div style={{ background: "#0A1020", border: "1px solid #1F2937", borderRadius: "8px",
                padding: "8px 14px", fontSize: "12px", color: "#6B7280", cursor: "pointer" }}>
                Filter ▾
              </div>
              <div style={{ background: "#0A1020", border: "1px solid #1F2937", borderRadius: "8px",
                padding: "8px 14px", fontSize: "12px", color: "#6B7280", cursor: "pointer" }}>
                Export ↓
              </div>
            </div>

            <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 120px 80px 70px 120px",
                padding: "10px 16px", borderBottom: "1px solid #111827",
                fontSize: "10px", fontWeight: "600", color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace" }}>
                <span>Customer Message</span>
                <span>Bot Response</span>
                <span>Intent</span>
                <span>Confidence</span>
                <span>Status</span>
                <span>Time</span>
              </div>
              {/* Rows */}
              <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                {filteredConvs.map((c, i) => (
                  <div key={c.id} style={{
                    display: "grid", gridTemplateColumns: "2fr 2fr 120px 80px 70px 120px",
                    padding: "12px 16px", borderBottom: "1px solid #0F172A",
                    fontSize: "12px", color: "#9CA3AF",
                    transition: "background 0.1s",
                    cursor: "pointer",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0F172A"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ paddingRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#D1D5DB" }}>{c.customer}</span>
                    <span style={{ paddingRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.bot}</span>
                    <span style={{ color: "#60A5FA", fontSize: "11px" }}>{c.intent}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: c.confidence > 0.9 ? "#34D399" : c.confidence > 0.75 ? "#FCD34D" : "#F87171" }}>
                      {Math.round(c.confidence * 100)}%
                    </span>
                    <span>
                      {c.escalated
                        ? <span style={{ background: "#7C2D12", color: "#FCA5A5", borderRadius: "4px", padding: "2px 6px", fontSize: "10px" }}>Escalated</span>
                        : <span style={{ background: "#064E3B", color: "#6EE7B7", borderRadius: "4px", padding: "2px 6px", fontSize: "10px" }}>Auto</span>
                      }
                    </span>
                    <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#4B5563" }}>
                      {new Date(c.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#4B5563", textAlign: "right" }}>
              Showing {filteredConvs.length} of {fakeConversations.length} conversations
            </div>
          </>}

          {/* ── INSIGHTS ── */}
          {tab === "insights" && <>
            {/* Top Intents */}
            <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "22px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB", display: "block", marginBottom: "18px" }}>
                Top Customer Intents
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {a.topIntents.map((t, i) => (
                  <div key={t.intent} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ width: "16px", textAlign: "right", fontSize: "11px", color: "#4B5563", fontFamily: "'DM Mono', monospace" }}>#{i + 1}</span>
                    <span style={{ width: "140px", fontSize: "12px", color: "#D1D5DB" }}>{t.intent}</span>
                    <div style={{ flex: 1, background: "#0F172A", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "4px",
                        width: `${(t.count / a.topIntents[0].count) * 100}%`,
                        background: `linear-gradient(90deg, ${["#34D399","#60A5FA","#A78BFA","#FCD34D","#F87171"][i]}, ${["#059669","#3B82F6","#7C3AED","#D97706","#DC2626"][i]})`,
                        transition: "width 1s ease",
                      }} />
                    </div>
                    <span style={{ width: "50px", textAlign: "right", fontSize: "12px", color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>{t.count.toLocaleString()}</span>
                    <span style={{ width: "40px", textAlign: "right", fontSize: "11px",
                      color: t.pct > 90 ? "#34D399" : t.pct > 80 ? "#FCD34D" : "#F87171",
                      fontFamily: "'DM Mono', monospace" }}>{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend + Sentiment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "22px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB", display: "block", marginBottom: "16px" }}>Escalation Trend</span>
                <BarChart data={a.weeklyTrend} />
                <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "12px" }}>
                  Escalations down <span style={{ color: "#34D399" }}>8.2%</span> this week compared to last week.
                </p>
              </div>
              <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "22px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB", display: "block", marginBottom: "16px" }}>Sentiment Distribution</span>
                {[
                  { label: "Positive", val: 62, color: "#34D399" },
                  { label: "Neutral", val: 28, color: "#9CA3AF" },
                  { label: "Negative", val: 10, color: "#F87171" },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{s.label}</span>
                      <span style={{ fontSize: "12px", color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.val}%</span>
                    </div>
                    <div style={{ background: "#0F172A", borderRadius: "4px", height: "4px" }}>
                      <div style={{ width: `${s.val}%`, height: "100%", background: s.color, borderRadius: "4px", transition: "width 1s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto Insight Engine */}
            <div style={{ background: "linear-gradient(135deg,#0A0F1A,#0A1020)", border: "1px solid #1E3A5F", borderRadius: "12px", padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Auto Insight Engine</span>
                <span style={{ background: "#1E3A5F", color: "#60A5FA", fontSize: "10px", padding: "2px 8px", borderRadius: "999px" }}>AI POWERED</span>
              </div>
              {[
                { icon: "⚠", color: "#FCD34D", bg: "#1A1400", text: 'Customers ask about "warranty coverage" 312 times but no answer exists in the knowledge base.' },
                { icon: "📈", color: "#60A5FA", bg: "#0A1020", text: '"Bulk pricing" queries increased 47% this week — consider adding a dedicated FAQ entry.' },
                { icon: "✓", color: "#34D399", bg: "#0A1A12", text: "Password Reset automation achieved 97% success rate — top performing intent this period." },
                { icon: "↗", color: "#A78BFA", bg: "#0F0A1A", text: "API rate limit questions trending up among enterprise users. Consider a dedicated help article." },
              ].map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", background: ins.bg,
                  border: `1px solid ${ins.color}20`, borderRadius: "8px",
                  padding: "12px 14px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", marginTop: "1px" }}>{ins.icon}</span>
                  <span style={{ fontSize: "12px", color: "#D1D5DB", lineHeight: "1.5" }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </>}

          {/* ── KNOWLEDGE BASE ── */}
          {tab === "knowledge" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "12px", color: "#6B7280" }}>Synced with Airtable · Last sync 2 minutes ago</p>
              <button style={{ background: "#065F46", border: "1px solid #059669", borderRadius: "8px",
                color: "#34D399", fontSize: "12px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>
                + Add Entry
              </button>
            </div>

            {/* Gaps */}
            <div style={{ background: "#0A1020", border: "1px solid #7C2D12", borderRadius: "12px", padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#FCA5A5", marginBottom: "12px" }}>
                ⚠ Knowledge Gaps — {a.knowledgeGaps.length} Unanswered Questions
              </div>
              {a.knowledgeGaps.map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px",
                  background: "#0F172A", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px",
                  border: "1px solid #1F2937" }}>
                  <span style={{ fontSize: "11px", color: "#F87171", fontFamily: "'DM Mono', monospace", minWidth: "40px" }}>{g.count}x</span>
                  <span style={{ fontSize: "13px", color: "#D1D5DB", flex: 1 }}>"{g.question}"</span>
                  <button style={{ background: "#065F46", border: "1px solid #059669", borderRadius: "6px",
                    color: "#34D399", fontSize: "11px", padding: "5px 10px", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>
                    Add Answer
                  </button>
                </div>
              ))}
            </div>

            {/* Existing FAQs */}
            <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #111827", fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>
                Active FAQs
              </div>
              {[
                { q: "How do I track my order?", a: "You can track your order by logging into your account and navigating to Orders > Track." },
                { q: "What is your return policy?", a: "We accept returns within 30 days of purchase. Items must be unused and in original packaging." },
                { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page and enter your email to receive a reset link." },
                { q: "How do I cancel my subscription?", a: "Go to Account > Subscription > Cancel. Your access continues until the billing period ends." },
                { q: "Do you offer bulk pricing?", a: "Yes! Contact our sales team at sales@acmecorp.com for volume discounts." },
              ].map((faq, i) => (
                <div key={i} style={{ padding: "14px 18px", borderBottom: "1px solid #0F172A",
                  display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB", marginBottom: "4px" }}>{faq.q}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: "1.5" }}>{faq.a}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button style={{ background: "transparent", border: "1px solid #1F2937", borderRadius: "6px",
                      color: "#9CA3AF", fontSize: "11px", padding: "4px 9px", cursor: "pointer" }}>Edit</button>
                    <button style={{ background: "transparent", border: "1px solid #1F2937", borderRadius: "6px",
                      color: "#F87171", fontSize: "11px", padding: "4px 9px", cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* ── BOT CONFIG ── */}
          {tab === "config" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Identity */}
              <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Bot Identity</span>
                {[
                  { label: "Bot Name", val: botName, setter: setBotName, type: "input" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: "11px", color: "#6B7280", display: "block", marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.setter(e.target.value)}
                      style={{ width: "100%", background: "#0F172A", border: "1px solid #1F2937", borderRadius: "8px",
                        color: "#F9FAFB", fontSize: "13px", padding: "9px 12px", fontFamily: "'Sora', sans-serif",
                        transition: "border-color 0.15s" }}
                      onFocus={e => e.target.style.borderColor = "#34D399"}
                      onBlur={e => e.target.style.borderColor = "#1F2937"}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "11px", color: "#6B7280", display: "block", marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Tone</label>
                  <select value={tone} onChange={e => setTone(e.target.value)}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #1F2937", borderRadius: "8px",
                      color: "#F9FAFB", fontSize: "13px", padding: "9px 12px", fontFamily: "'Sora', sans-serif" }}>
                    {["Professional", "Friendly", "Casual", "Formal", "Empathetic"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Escalation */}
              <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Escalation Rules</span>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <label style={{ fontSize: "11px", color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>Confidence Threshold</label>
                    <span style={{ fontSize: "13px", color: "#34D399", fontFamily: "'DM Mono', monospace" }}>{Math.round(threshold * 100)}%</span>
                  </div>
                  <input type="range" min="0.5" max="1" step="0.01" value={threshold}
                    onChange={e => setThreshold(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#34D399" }} />
                  <p style={{ fontSize: "11px", color: "#4B5563", marginTop: "6px" }}>
                    Responses below {Math.round(threshold * 100)}% confidence will be escalated to a human agent.
                  </p>
                </div>
                <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "8px", padding: "12px 14px" }}>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }}>Escalation Channels</div>
                  {["Slack #support-escalations", "Email: team@acmecorp.com"].map(ch => (
                    <div key={ch} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399" }} />
                      <span style={{ fontSize: "12px", color: "#D1D5DB" }}>{ch}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ background: "#0A1020", border: "1px solid #111827", borderRadius: "12px", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#D1D5DB" }}>Messages</span>
              {[
                { label: "Greeting Message", val: greeting, setter: setGreeting },
                { label: "Fallback Message", val: fallback, setter: setFallback },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: "11px", color: "#6B7280", display: "block", marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{f.label}</label>
                  <textarea value={f.val} onChange={e => f.setter(e.target.value)} rows={3}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #1F2937", borderRadius: "8px",
                      color: "#F9FAFB", fontSize: "13px", padding: "9px 12px", fontFamily: "'Sora', sans-serif",
                      resize: "vertical", lineHeight: "1.5", transition: "border-color 0.15s" }}
                    onFocus={e => e.target.style.borderColor = "#34D399"}
                    onBlur={e => e.target.style.borderColor = "#1F2937"}
                  />
                </div>
              ))}
            </div>

            {/* Save */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button style={{ background: "transparent", border: "1px solid #1F2937", borderRadius: "8px",
                color: "#6B7280", fontSize: "13px", padding: "10px 20px", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>
                Discard Changes
              </button>
              <button onClick={handleSave} style={{
                background: saved ? "#065F46" : "linear-gradient(135deg,#059669,#34D399)",
                border: "none", borderRadius: "8px",
                color: "#fff", fontSize: "13px", fontWeight: "600", padding: "10px 24px",
                cursor: "pointer", fontFamily: "'Sora', sans-serif",
                transition: "all 0.2s",
              }}>
                {saved ? "✓ Saved" : "Save Configuration"}
              </button>
            </div>
          </>}

        </div>
      </main>
    </div>
  );
}
