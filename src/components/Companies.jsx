import { useEffect, useMemo, useState } from "react";
import { apiJson, setActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, Pill, SectionHeader } from "./ui";

export function Companies({ t, accent, activeClient, onActivateClient, onClientsChanged }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    domain: "",
    plan: "starter",
    client_name: "",
    admin_name: "",
    admin_email: "",
    admin_role: "admin",
  });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", role: "admin" });

  const { data: organizationsRaw, loading: organizationsLoading, refetch: refetchOrganizations } = useApi(
    "/api/organizations",
    [],
    [refreshTick]
  );

  const organizations = organizationsRaw || [];
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  );

  const { data: membersRaw, loading: membersLoading, refetch: refetchMembers } = useApi(
    selectedOrganization ? `/api/organizations/${selectedOrganization.id}/members` : null,
    [],
    [selectedOrganization?.id, refreshTick]
  );

  const members = membersRaw || [];

  useEffect(() => {
    if (!organizations.length) {
      setSelectedOrgId(null);
      return;
    }

    const preferred = organizations.find((organization) => organization.client_id === activeClient?.id);
    if (preferred) {
      setSelectedOrgId(preferred.id);
      return;
    }

    if (!selectedOrgId || !organizations.some((organization) => organization.id === selectedOrgId)) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, activeClient?.id, selectedOrgId]);

  async function createCompany() {
    if (!companyForm.name.trim()) {
      setCompanyError("Company name is required.");
      return;
    }

    setSavingCompany(true);
    setCompanyError("");

    try {
      const payload = await apiJson("/api/organizations", {
        method: "POST",
        body: {
          ...companyForm,
          name: companyForm.name.trim(),
          domain: companyForm.domain.trim(),
          client_name: companyForm.client_name.trim() || companyForm.name.trim(),
          admin_name: companyForm.admin_name.trim(),
          admin_email: companyForm.admin_email.trim(),
        },
      });

      await Promise.all([refetchOrganizations(), onClientsChanged?.()]);
      setRefreshTick((current) => current + 1);
      setShowCreate(false);
      setCompanyForm({
        name: "",
        domain: "",
        plan: "starter",
        client_name: "",
        admin_name: "",
        admin_email: "",
        admin_role: "admin",
      });
      setSelectedOrgId(payload.id);
    } catch (error) {
      setCompanyError(error.message);
    } finally {
      setSavingCompany(false);
    }
  }

  async function addAdmin() {
    if (!selectedOrganization) return;
    if (!adminForm.email.trim()) {
      setAdminError("Admin email is required.");
      return;
    }

    setSavingAdmin(true);
    setAdminError("");

    try {
      await apiJson(`/api/organizations/${selectedOrganization.id}/members`, {
        method: "POST",
        body: {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          role: adminForm.role,
        },
      });

      await refetchMembers();
      await refetchOrganizations();
      setRefreshTick((current) => current + 1);
      setAdminForm({ name: "", email: "", role: "admin" });
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setSavingAdmin(false);
    }
  }

  async function removeAdmin(member) {
    if (!selectedOrganization) return;
    setAdminError("");
    try {
      await apiJson(`/api/organizations/${selectedOrganization.id}/members/${member.user_id}`, {
        method: "DELETE",
      });
      await Promise.all([refetchMembers(), refetchOrganizations()]);
      setRefreshTick((current) => current + 1);
    } catch (error) {
      setAdminError(error.message || "Failed to remove admin");
    }
  }

  function activateCompany(organization) {
    if (!organization?.client?.id) return;
    setActiveClientId(organization.client.id);
    onActivateClient?.(organization.client);
  }

  return (
    <div>
      <SectionHeader
        title="Companies"
        sub="Manage customer companies, linked workspaces, and organization admins."
        t={t}
        action={
          <button
            onClick={() => setShowCreate((current) => !current)}
            style={{
              background: accent,
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "600",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            {showCreate ? "Close" : "+ New Company"}
          </button>
        }
      />

      {showCreate && (
        <Card t={t} style={{ padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "12px" }}>
            {[
              ["Company Name", "name"],
              ["Domain", "domain"],
              ["Workspace Name", "client_name"],
              ["Admin Name", "admin_name"],
              ["Admin Email", "admin_email"],
            ].map(([label, key]) => (
              <div key={key}>
                <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <input
                  value={companyForm[key]}
                  onChange={(event) => setCompanyForm((current) => ({ ...current, [key]: event.target.value }))}
                  style={{ width: "100%", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "9px 12px", outline: "none" }}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Plan</div>
              <select
                value={companyForm.plan}
                onChange={(event) => setCompanyForm((current) => ({ ...current, plan: event.target.value }))}
                style={{ width: "100%", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "9px 12px", outline: "none" }}
              >
                {['starter', 'growth', 'enterprise'].map((plan) => <option key={plan} value={plan}>{plan}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Admin Role</div>
              <select
                value={companyForm.admin_role}
                onChange={(event) => setCompanyForm((current) => ({ ...current, admin_role: event.target.value }))}
                style={{ width: "100%", background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "9px 12px", outline: "none" }}
              >
                {['owner', 'admin', 'agent', 'viewer'].map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
          {companyError && <div style={{ color: '#FCA5A5', fontSize: '12px', marginBottom: '10px' }}>{companyError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button onClick={() => setShowCreate(false)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textSub, fontSize: "12px", padding: "8px 14px", cursor: "pointer" }}>Cancel</button>
            <button onClick={createCompany} disabled={savingCompany} style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "600", padding: "8px 16px", cursor: "pointer", opacity: savingCompany ? 0.7 : 1 }}>{savingCompany ? "Creating..." : "Create Company"}</button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
        <Card t={t} style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "12px", letterSpacing: "-0.02em" }}>Companies</div>
          {organizationsLoading && <div style={{ color: t.textMuted, fontSize: "12px" }}>Loading companies...</div>}
          {!organizationsLoading && organizations.length === 0 && <div style={{ color: t.textMuted, fontSize: "12px" }}>No companies configured yet.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {organizations.map((organization) => {
              const isActive = selectedOrgId === organization.id;
              const isWorkspaceActive = activeClient?.id === organization.client_id;
              return (
                <div
                  key={organization.id}
                  onClick={() => setSelectedOrgId(organization.id)}
                  style={{
                    border: `1px solid ${isActive ? accent : t.border}`,
                    borderRadius: "12px",
                    padding: "14px",
                    background: isActive ? `${accent}10` : t.surfaceHover,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{organization.name}</div>
                      <div style={{ fontSize: "11px", color: t.textMuted }}>{organization.client?.name || "No workspace linked"}</div>
                    </div>
                    <Pill color={isWorkspaceActive ? "#34D399" : accent}>{isWorkspaceActive ? "Active" : organization.plan || "starter"}</Pill>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <Pill color="#60A5FA">Client {organization.client_id || "pending"}</Pill>
                    <Pill color="#A78BFA">Admins {organization.admin_count || 0}</Pill>
                    <Pill color="#FBBF24">Members {organization.member_count || 0}</Pill>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: t.textSub }}>{organization.domain || "No domain"}</span>
                    {organization.client?.id && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          activateCompany(organization);
                        }}
                        style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "7px", color: isWorkspaceActive ? accent : t.textSub, padding: "6px 10px", fontSize: "11px", cursor: "pointer" }}
                      >
                        Use Workspace
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card t={t} style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{selectedOrganization?.name || "Select a company"}</div>
              <div style={{ fontSize: "11px", color: t.textMuted }}>{selectedOrganization?.client?.name || "Organization admins"}</div>
            </div>
            {selectedOrganization && <Pill color="#34D399">{selectedOrganization.admin_count || 0} admins</Pill>}
          </div>

          {selectedOrganization ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", marginBottom: "12px" }}>
                <input value={adminForm.name} onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))} placeholder="Admin name" style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "8px 10px", outline: "none" }} />
                <input value={adminForm.email} onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))} placeholder="Admin email" style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "8px 10px", outline: "none" }} />
                <select value={adminForm.role} onChange={(event) => setAdminForm((current) => ({ ...current, role: event.target.value }))} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "8px 10px", outline: "none" }}>
                  {['owner', 'admin', 'agent', 'viewer'].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              {adminError && <div style={{ color: '#FCA5A5', fontSize: '12px', marginBottom: '10px' }}>{adminError}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
                <button onClick={addAdmin} disabled={savingAdmin} style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "600", padding: "8px 14px", cursor: "pointer", opacity: savingAdmin ? 0.7 : 1 }}>{savingAdmin ? "Saving..." : "Add Admin"}</button>
              </div>
              {membersLoading && <div style={{ color: t.textMuted, fontSize: "12px" }}>Loading admins...</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {members.map((member) => (
                  <div key={member.user_id} style={{ border: `1px solid ${t.border}`, borderRadius: "10px", padding: "12px", background: t.surfaceHover }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontSize: "12.5px", fontWeight: "600", color: t.text }}>{member.name || member.email}</div>
                        <div style={{ fontSize: "11px", color: t.textMuted }}>{member.email}</div>
                      </div>
                      <Pill color={["owner", "admin"].includes(member.role) ? accent : "#94A3B8"}>{member.role}</Pill>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: t.textMuted }}>Added {new Date(member.created_at).toLocaleDateString()}</span>
                      <button onClick={() => removeAdmin(member)} style={{ background: "none", border: "none", color: "#FB7185", fontSize: "11px", cursor: "pointer" }}>Remove</button>
                    </div>
                  </div>
                ))}
                {!membersLoading && members.length === 0 && <div style={{ color: t.textMuted, fontSize: "12px" }}>No admins added yet for this company.</div>}
              </div>
            </>
          ) : (
            <div style={{ color: t.textMuted, fontSize: "12px" }}>Select a company to manage its admins.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
