import { useState } from "react";
import { apiJson, getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, SectionHeader, Toggle } from "./ui";

export function Team({ t, accent }) {
  const clientId = getActiveClientId();
  const { data: rawMembers, loading: membersLoading, refetch: refetchMembers } = useApi(`/api/team?client_id=${clientId}`, null);
  const members = rawMembers || [];
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Agent");
  const [inviting, setInviting] = useState(false);
  const [rules, setRules] = useState([
    { label: "Escalate if no SOP matches", on: true },
    { label: "Escalate on sentiment: angry / threatening", on: true },
    { label: "Auto-assign when escalated", on: false },
    { label: "Notify team on Slack for escalations", on: false },
  ]);

  const roleColors = { Admin: "#4F8EF7", Agent: "#34D399", "AI Agent": accent, Viewer: t.textMuted };

  function getInitials(name) {
    return (name || "?").split(" ").map((word) => word[0] || "").join("").toUpperCase().slice(0, 2);
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviting(true);
    await apiJson("/api/team", {
      method: "POST",
      body: { client_id: clientId, name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole },
    });
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Agent");
    setShowInvite(false);
    setInviting(false);
    refetchMembers();
  }

  async function toggleMemberActive(member) {
    await apiJson(`/api/team/${member.id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "PUT",
      body: { client_id: clientId, active: !member.active },
    });
    refetchMembers();
  }

  return (
    <div>
      <SectionHeader title="Team" sub="Manage workspace access, operators, and AI handoff rules." t={t} />
      <Card t={t} style={{ overflow: "hidden", marginBottom: "16px" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Members ({members.length})</span>
          <button type="button" onClick={() => setShowInvite((value) => !value)} style={{ background: accent, border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", padding: "8px 14px", cursor: "pointer" }}>+ Invite</button>
        </div>

        {showInvite && (
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, background: t.surfaceHover }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Full name" style={{ flex: 1, minWidth: "140px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "9px", color: t.text, fontSize: "12px", padding: "9px 11px", outline: "none" }} />
              <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Email" style={{ flex: 1, minWidth: "160px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "9px", color: t.text, fontSize: "12px", padding: "9px 11px", outline: "none" }} />
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "9px", color: t.text, fontSize: "12px", padding: "9px 11px", outline: "none" }}>
                {['Admin', 'Agent', 'Viewer'].map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
              <button type="button" onClick={handleInvite} disabled={inviting} style={{ background: accent, border: "none", borderRadius: "9px", color: "#fff", fontSize: "12px", fontWeight: "700", padding: "9px 14px", cursor: "pointer" }}>
                {inviting ? "Saving..." : "Add"}
              </button>
              <button type="button" onClick={() => setShowInvite(false)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "9px", color: t.textSub, fontSize: "12px", padding: "9px 12px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {membersLoading && <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>Loading team...</div>}

        {!membersLoading && members.length === 0 && (
          <div style={{ padding: "24px", textAlign: "center", color: t.textMuted, fontSize: "12px" }}>
            No team members yet. Add your first member above.
          </div>
        )}

        {members.map((member, index) => (
          <div
            key={member.id || index}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: index < members.length - 1 ? `1px solid ${t.borderLight}` : "none" }}
            onMouseEnter={(event) => { event.currentTarget.style.background = t.surfaceHover; }}
            onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: member.is_ai ? `linear-gradient(135deg,${accent},${accent}88)` : t.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10.5px", fontWeight: "700", color: member.is_ai ? "#fff" : t.textSub, border: `2px solid ${member.active ? "#34D39940" : t.border}` }}>
              {getInitials(member.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, letterSpacing: "-0.01em" }}>{member.name}</div>
              <div style={{ fontSize: "11px", color: t.textMuted }}>{member.email}</div>
            </div>
            <span style={{ fontSize: "10.5px", fontWeight: "700", padding: "2px 9px", borderRadius: "999px", background: `${roleColors[member.role] || t.textMuted}18`, color: roleColors[member.role] || t.textMuted }}>
              {member.role}
            </span>
            <div onClick={() => toggleMemberActive(member)} style={{ width: "7px", height: "7px", borderRadius: "50%", cursor: "pointer", background: member.active ? "#34D399" : t.textMuted }} title={member.active ? "Active - click to deactivate" : "Inactive - click to activate"} />
          </div>
        ))}
      </Card>

      <Card t={t} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "14px", letterSpacing: "-0.01em" }}>AI Handoff Rules</div>
        {rules.map((rule, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: index < rules.length - 1 ? `1px solid ${t.borderLight}` : "none" }}>
            <span style={{ fontSize: "12.5px", color: t.textSub }}>{rule.label}</span>
            <Toggle value={rule.on} onChange={(value) => setRules((items) => items.map((item, ruleIndex) => (ruleIndex === index ? { ...item, on: value } : item)))} accent={accent} />
          </div>
        ))}
      </Card>
    </div>
  );
}
