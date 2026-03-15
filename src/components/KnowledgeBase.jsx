import { useEffect, useState } from "react";
import { apiJson, getActiveClientId } from "../lib/api";
import { runBackgroundJobFlow } from "../lib/backgroundJobs";
import { useApi } from "../lib/useApi";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { Card, JobStatusNotice, SectionHeader, Tag } from "./ui";
import { ContentTestModal } from "./ContentTestModal";

function ArticleEditModal({ article, isPublished, t, accent, onSave, onClose }) {
  const [title,   setTitle]   = useState(article.title   || "");
  const [content, setContent] = useState(article.content || "");
  const [status,  setStatus]  = useState(article.status  || (isPublished ? "published" : "draft"));
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ ...article, title: title.trim(), content, status });
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.surface, borderRadius: "16px", border: `1px solid ${t.border}`,
        width: "100%", maxWidth: "720px", maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
              {article.id && !String(article.id).startsWith("new") ? "Edit Article" : "New Article"}
            </div>
            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px" }}>
              {status === "published" ? "Published — live in the AI's knowledge base" : "Draft — not visible to the AI until published"}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: t.textMuted,
              fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
              Title
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              placeholder="Article title…"
              style={{ width: "100%", background: t.input, border: `1.5px solid ${t.border}`,
                borderRadius: "10px", color: t.text, fontSize: "15px", fontWeight: "500",
                padding: "12px 14px", fontFamily: "inherit", outline: "none",
                boxSizing: "border-box", letterSpacing: "-0.01em" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e  => e.target.style.borderColor = t.border} />
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
              textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
              Content
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write the article content here. The AI will use this word-for-word when answering relevant customer questions."
              style={{ width: "100%", minHeight: "320px", background: t.input,
                border: `1.5px solid ${t.border}`, borderRadius: "10px", color: t.text,
                fontSize: "13.5px", lineHeight: "1.7", padding: "14px",
                fontFamily: "inherit", outline: "none", resize: "vertical",
                boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e  => e.target.style.borderColor = t.border} />
          </div>

          {/* Status */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["draft", "published"].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", border: `1.5px solid ${status === s ? accent : t.border}`,
                  background: status === s ? `${accent}14` : "transparent",
                  color: status === s ? accent : t.textSub, transition: "all 0.12s" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end",
          padding: "16px 24px", borderTop: `1px solid ${t.border}` }}>
          <button onClick={onClose}
            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
              color: t.textSub, fontSize: "13px", padding: "10px 20px", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            style={{ background: title.trim() ? accent : t.surfaceHover, border: "none",
              borderRadius: "8px", color: title.trim() ? "#fff" : t.textMuted,
              fontSize: "13px", fontWeight: "600", padding: "10px 28px",
              cursor: title.trim() ? "pointer" : "default", transition: "all 0.15s" }}>
            {saving ? "Saving…" : "Save Article"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════════════════════
export function KnowledgeBase({ t, accent }) {
  const [search, setSearch]           = useState("");
  const [editingArticle, setEditingArticle] = useState(null);
  const [articles, setArticles]       = useState([]);
  const [generating, setGenerating]   = useState(false);
  const [saveStatus, setSaveStatus]   = useState({});
  const [testingArticle, setTestingArticle] = useState(null);
  // Connect source modal
  const [showConnect, setShowConnect] = useState(false);
  const [connectUrl, setConnectUrl]   = useState("");
  const [connectMode, setConnectMode] = useState("single"); // "single" | "crawl"
  const [connectMax, setConnectMax]   = useState(15);
  const [connecting, setConnecting]   = useState(false);
  const [connectResult, setConnectResult] = useState(null); // { pages, error }
  const [syncingDomain, setSyncingDomain] = useState(null);
  const [jobNotice, setJobNotice]     = useState(null);
  // Auth
  const [showAuth, setShowAuth]           = useState(false);
  const [authType, setAuthType]           = useState("none"); // "none"|"bearer"|"cookie"|"basic"
  const [authToken, setAuthToken]         = useState("");
  const [authCookie, setAuthCookie]       = useState("");
  const [authUser, setAuthUser]           = useState("");
  const [authPass, setAuthPass]           = useState("");

  const clientId = getActiveClientId();
  const { data: rawArticles, refetch: refetchArticles } = useApi(`/api/knowledge?client_id=${clientId}`, null);
  useEffect(() => { if (rawArticles) setArticles(rawArticles); }, [rawArticles]);

  const published = articles.filter(a => a.status === "published");
  const drafts    = articles.filter(a => a.status === "draft");

  async function publishDraft(id) {
    setSaveStatus(p => ({ ...p, [id]: "saving" }));
    await apiJson(`/api/knowledge/${id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "PUT",
      body: { client_id: clientId, status: "published" },
    });
    setArticles(p => p.map(a => a.id === id ? { ...a, status: "published" } : a));
    setSaveStatus(p => ({ ...p, [id]: "done" }));
    setTimeout(() => setSaveStatus(p => ({ ...p, [id]: null })), 2000);
  }

  async function deleteArticle(id) {
    await apiJson(`/api/knowledge/${id}?client_id=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
      body: { client_id: clientId },
    });
    setArticles(p => p.filter(a => a.id !== id));
  }

  async function handleSaveArticle(updated) {
    const isNew   = !updated.id || String(updated.id).startsWith("new");
    const method  = isNew ? "POST" : "PUT";
    const path = isNew
      ? "/api/knowledge"
      : `/api/knowledge/${updated.id}?client_id=${encodeURIComponent(clientId)}`;
    const saved = await apiJson(path, {
      method, headers: { "Content-Type": "application/json" },
      body: {
        client_id: clientId, title: updated.title, content: updated.content,
        status: updated.status || (editingArticle?.isPublished ? "published" : "draft"),
      },
    });
    if (isNew) setArticles(p => [...p, saved]);
    else setArticles(p => p.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    setEditingArticle(null);
  }

  async function generateSuggestions() {
    setGenerating(true);
    try {
      await runBackgroundJob(
        "AI knowledge suggestions",
        "/api/knowledge/suggestions",
        { client_id: clientId },
        async () => {
          const refreshed = await refetchArticles();
          if (refreshed) setArticles(refreshed);
        }
      );
    } catch (e) {
      console.error(e);
      setJobNotice({ title: "AI knowledge suggestions", status: "failed", detail: e.message });
    }
    setGenerating(false);
  }

  function buildAuthPayload() {
    if (authType === "bearer" && authToken.trim())
      return { type: "bearer", token: authToken.trim() };
    if (authType === "cookie" && authCookie.trim())
      return { type: "cookie", cookie: authCookie.trim() };
    if (authType === "basic" && authUser.trim())
      return { type: "basic", username: authUser.trim(), password: authPass };
    return null;
  }

  async function runBackgroundJob(title, path, body, onComplete) {
    const finalJob = await runBackgroundJobFlow({
      title,
      path,
      body,
      setNotice: setJobNotice,
      onComplete,
    });

    return finalJob;
  }

  async function connectSource() {
    const url = connectUrl.trim();
    if (!url) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const endpoint = connectMode === "crawl" ? "/api/scrape/crawl" : "/api/scrape";
      const auth = buildAuthPayload();
      const body = {
        url, client_id: clientId,
        ...(connectMode === "crawl" ? { max_pages: connectMax } : {}),
        ...(auth ? { auth } : {}),
      };
      const finalJob = await runBackgroundJob(
        connectMode === "crawl" ? "Site crawl" : "Page import",
        endpoint,
        body,
        async () => {
          const refreshed = await refetchArticles();
          if (refreshed) setArticles(refreshed);
        }
      );
      const result = finalJob.result || {};
      setConnectResult({
        pages: result.pages_scraped ?? result.articles_created ?? result.imported ?? 1,
      });
    } catch (e) {
      setConnectResult({ error: e.message });
      setJobNotice({
        title: connectMode === "crawl" ? "Site crawl" : "Page import",
        status: "failed",
        detail: e.message,
      });
    } finally {
      setConnecting(false);
    }
  }

  async function syncDomain(domain) {
    setSyncingDomain(domain);
    try {
      await runBackgroundJob(
        `Sync ${domain}`,
        "/api/scrape/sync",
        { domain, client_id: clientId },
        async () => {
          const refreshed = await refetchArticles();
          if (refreshed) setArticles(refreshed);
        }
      );
    } catch (e) {
      console.error(e);
      setJobNotice({ title: `Sync ${domain}`, status: "failed", detail: e.message });
    }
    setSyncingDomain(null);
  }

  async function disconnectDomain(domain) {
    try {
      await apiJson("/api/scrape/source", {
        method: "DELETE",
        body: { domain, client_id: clientId },
      });
      setArticles(p => p.filter(a => !a.source_url?.includes(domain)));
    } catch (e) { console.error(e); }
  }

  // Group external articles by domain
  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  }
  const externalArticles = articles.filter(a => a.source_url);
  const sourceGroups = externalArticles.reduce((acc, a) => {
    const d = getDomain(a.source_url);
    if (!acc[d]) acc[d] = { domain: d, articles: [], lastSync: null };
    acc[d].articles.push(a);
    const dt = a.updated_at || a.created_at;
    if (dt && (!acc[d].lastSync || dt > acc[d].lastSync)) acc[d].lastSync = dt;
    return acc;
  }, {});

  const q = search.toLowerCase();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
        <SectionHeader title="Knowledge Base" sub="Articles your AI agent references when answering questions. Published articles are live immediately." t={t} />
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={generateSuggestions} disabled={generating}
            style={{ background: generating ? t.surfaceHover : `${accent}14`,
              border: `1.5px solid ${accent}40`, borderRadius: "8px", color: accent,
              fontSize: "12px", fontWeight: "600", padding: "8px 14px",
              cursor: generating ? "default" : "pointer", whiteSpace: "nowrap" }}>
            {generating ? "✦ Generating…" : "✦ AI Suggest"}
          </button>
          <button onClick={() => setEditingArticle({ article: { id: "new-" + Date.now(), title: "", content: "", status: "draft" }, isPublished: false })}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
            + New Article
          </button>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "20px" }}>
        Drafts are never visible to customers until published. AI-suggested drafts expire after 30 days if not published.
      </p>

      <JobStatusNotice job={jobNotice} t={t} accent={accent} />

      {/* Search */}
      <div style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: "8px",
        display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", marginBottom: "20px" }}>
        <span style={{ color: t.textMuted }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…"
          style={{ background: "transparent", border: "none", color: t.text, fontSize: "13px", flex: 1, outline: "none" }} />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "16px" }}>×</button>}
      </div>

      {/* Drafts */}
      {drafts.filter(a => a.title.toLowerCase().includes(q)).length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Drafts</span>
            <Tag color="#FBBF24">{drafts.length} articles</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {drafts.filter(a => a.title.toLowerCase().includes(q)).map(article => (
              <Card key={article.id} t={t} style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: t.text, letterSpacing: "-0.01em" }}>{article.title || "(Untitled)"}</span>
                      <Tag color="#FBBF24">draft</Tag>
                    </div>
                    <p style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.55",
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", margin: 0 }}>
                      {(article.content || "").slice(0, 200)}
                    </p>
                    <div style={{ display: "flex", gap: "14px", marginTop: "8px" }}>
                      <span style={{ fontSize: "11px", color: t.textMuted }}>
                        {article.created_at ? new Date(article.created_at).toLocaleDateString() : "just now"}
                      </span>
                      <span style={{ fontSize: "11px", color: t.textMuted }}>{article.lookups || 0} lookups</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => setTestingArticle(article)}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: t.textSub, fontSize: "11px", padding: "5px 10px", cursor: "pointer" }}>Test</button>
                    <button onClick={() => setEditingArticle({ article, isPublished: false })}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: t.textSub, fontSize: "11px", padding: "5px 10px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => publishDraft(article.id)}
                      style={{ background: saveStatus[article.id] === "done" ? "#059669" : accent,
                        border: "none", borderRadius: "6px", color: "#fff",
                        fontSize: "11px", padding: "5px 12px", cursor: "pointer", fontWeight: "600" }}>
                      {saveStatus[article.id] === "saving" ? "…" : saveStatus[article.id] === "done" ? "✓" : "Publish"}
                    </button>
                    <button onClick={() => deleteArticle(article.id)}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                        color: "#EF4444", fontSize: "11px", padding: "5px 8px", cursor: "pointer" }}>×</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty drafts */}
      {drafts.length === 0 && !q && (
        <Card t={t} style={{ padding: "28px", marginBottom: "24px", textAlign: "center", border: `1px dashed ${t.border}` }}>
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>✦</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "4px" }}>No draft articles yet</div>
          <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "14px" }}>
            Let AI analyze your conversations and suggest articles automatically.
          </div>
          <button onClick={generateSuggestions} disabled={generating}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "8px 18px", cursor: "pointer" }}>
            {generating ? "Generating…" : "✦ Generate Now"}
          </button>
        </Card>
      )}

      {/* Published */}
      {published.filter(a => a.title.toLowerCase().includes(q)).length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Published</span>
            <Tag color="#34D399">{published.length} articles</Tag>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {published.filter(a => a.title.toLowerCase().includes(q)).map(article => (
              <div key={article.id} style={{ display: "flex", alignItems: "center", gap: "14px",
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px",
                padding: "13px 16px", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = t.surface}>
                <span style={{ color: "#34D399", fontSize: "13px" }}>✓</span>
                <span style={{ flex: 1, fontSize: "13px", color: t.text, fontWeight: "500",
                  letterSpacing: "-0.01em" }}>{article.title}</span>
                <span style={{ fontSize: "11px", color: t.textMuted }}>
                  {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : ""}
                </span>
                <span style={{ fontSize: "11px", color: t.textMuted, fontFamily: "'DM Mono', monospace" }}>
                  {article.lookups || 0} lookups
                </span>
                <button onClick={() => setTestingArticle(article)}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                    color: t.textSub, fontSize: "11px", padding: "4px 10px", cursor: "pointer" }}>Test</button>
                <button onClick={() => setEditingArticle({ article, isPublished: true })}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "6px",
                    color: t.textSub, fontSize: "11px", padding: "4px 10px", cursor: "pointer" }}>Edit</button>
                <button onClick={() => deleteArticle(article.id)}
                  style={{ background: "none", border: "none", color: "#EF4444",
                    fontSize: "14px", cursor: "pointer", padding: "2px 6px" }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Sources */}
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>Connected Sources</span>
            <Tag color="#4F8EF7">{Object.keys(sourceGroups).length} sites · {externalArticles.length} pages</Tag>
          </div>
          <button onClick={() => { setShowConnect(true); setConnectUrl(""); setConnectMode("single"); setConnectResult(null); }}
            style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
              fontSize: "12px", fontWeight: "600", padding: "7px 14px", cursor: "pointer" }}>
            + Connect Source
          </button>
        </div>

        {Object.keys(sourceGroups).length === 0 && (
          <Card t={t} style={{ padding: "32px", textAlign: "center", border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>🌐</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: t.text, marginBottom: "6px" }}>No external sources connected</div>
            <div style={{ fontSize: "12px", color: t.textSub, marginBottom: "16px", maxWidth: "340px", margin: "0 auto 16px" }}>
              Connect a website, help center, or documentation URL and the AI will read and use its content when answering questions.
            </div>
            <button onClick={() => { setShowConnect(true); setConnectUrl(""); setConnectMode("single"); setConnectResult(null); }}
              style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
                fontSize: "13px", fontWeight: "600", padding: "9px 20px", cursor: "pointer" }}>
              + Connect First Source
            </button>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.values(sourceGroups).map(group => (
            <Card key={group.domain} t={t} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${accent}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", flexShrink: 0 }}>🌐</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: t.text,
                    letterSpacing: "-0.01em", marginBottom: "3px" }}>{group.domain}</div>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: t.textSub }}>
                      {group.articles.length} page{group.articles.length !== 1 ? "s" : ""} scraped
                    </span>
                    {group.lastSync && (
                      <span style={{ fontSize: "11px", color: t.textMuted }}>
                        Last synced {new Date(group.lastSync).toLocaleDateString()}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", color: "#34D399", fontWeight: "600" }}>
                      ● Live
                    </span>
                  </div>
                  {/* Scraped pages list */}
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {group.articles.slice(0, 4).map(a => (
                      <div key={a.id} style={{ fontSize: "11.5px", color: t.textSub,
                        display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#34D399", fontSize: "10px" }}>✓</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.title}</span>
                        <span style={{ color: t.textMuted, flexShrink: 0 }}>{a.lookups || 0} lookups</span>
                      </div>
                    ))}
                    {group.articles.length > 4 && (
                      <div style={{ fontSize: "11px", color: t.textMuted, paddingLeft: "18px" }}>
                        +{group.articles.length - 4} more pages
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "flex-start" }}>
                  <button onClick={() => syncDomain(group.domain)} disabled={syncingDomain === group.domain}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "7px",
                      color: t.textSub, fontSize: "12px", padding: "6px 12px", cursor: "pointer",
                      opacity: syncingDomain === group.domain ? 0.5 : 1 }}>
                    {syncingDomain === group.domain ? "Syncing…" : "↻ Sync"}
                  </button>
                  <button onClick={() => disconnectDomain(group.domain)}
                    style={{ background: "none", border: `1px solid #EF444440`, borderRadius: "7px",
                      color: "#EF4444", fontSize: "12px", padding: "6px 12px", cursor: "pointer" }}>
                    Disconnect
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Connect Source Modal ── */}
      {showConnect && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px" }}
          onClick={e => e.target === e.currentTarget && !connecting && setShowConnect(false)}>
          <div style={{ background: t.surface, borderRadius: "16px", border: `1px solid ${t.border}`,
            width: "100%", maxWidth: "560px", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" }}>
                  Connect External Source
                </div>
                <div style={{ fontSize: "12px", color: t.textSub, marginTop: "3px" }}>
                  The AI will scrape and read this content to answer customer questions
                </div>
              </div>
              {!connecting && (
                <button onClick={() => setShowConnect(false)}
                  style={{ background: "none", border: "none", color: t.textMuted,
                    fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* URL input */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                  URL
                </label>
                <input value={connectUrl} onChange={e => setConnectUrl(e.target.value)}
                  placeholder="https://help.yoursite.com or https://docs.yoursite.com"
                  disabled={connecting}
                  style={{ width: "100%", background: t.input, border: `1.5px solid ${t.border}`,
                    borderRadius: "10px", color: t.text, fontSize: "14px",
                    padding: "12px 14px", fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box", opacity: connecting ? 0.6 : 1 }}
                  onFocus={e => e.target.style.borderColor = accent}
                  onBlur={e  => e.target.style.borderColor = t.border}
                  onKeyDown={e => e.key === "Enter" && !connecting && connectSource()} />
              </div>

              {/* Mode selector */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "10px" }}>
                  What to scrape
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { value: "single", label: "Single page", desc: "Scrape only this exact URL — good for one specific article or FAQ" },
                    { value: "crawl",  label: "Entire site / help center", desc: "Follow links on the same domain and scrape multiple pages automatically" },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => !connecting && setConnectMode(opt.value)}
                      style={{ display: "flex", alignItems: "flex-start", gap: "12px",
                        padding: "12px 14px", borderRadius: "10px", cursor: "pointer",
                        border: `1.5px solid ${connectMode === opt.value ? accent : t.border}`,
                        background: connectMode === opt.value ? `${accent}0D` : t.surfaceHover,
                        transition: "all 0.12s" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                        border: `2px solid ${connectMode === opt.value ? accent : t.textMuted}`,
                        background: connectMode === opt.value ? accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {connectMode === opt.value && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: t.text }}>{opt.label}</div>
                        <div style={{ fontSize: "12px", color: t.textSub, marginTop: "2px" }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Max pages (crawl only) */}
              {connectMode === "crawl" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: t.textSub,
                    textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                    Max pages to scrape: {connectMax}
                  </label>
                  <input type="range" min={5} max={30} step={5} value={connectMax}
                    onChange={e => setConnectMax(parseInt(e.target.value))} disabled={connecting}
                    style={{ width: "100%", accentColor: accent }} />
                  <div style={{ display: "flex", justifyContent: "space-between",
                    fontSize: "11px", color: t.textMuted, marginTop: "4px" }}>
                    <span>5 pages</span><span>30 pages</span>
                  </div>
                </div>
              )}

              {/* Authorization */}
              <div>
                <button onClick={() => setShowAuth(v => !v)}
                  style={{ background: "none", border: `1px solid ${showAuth ? accent : t.border}`,
                    borderRadius: "8px", color: showAuth ? accent : t.textSub,
                    fontSize: "12px", fontWeight: "600", padding: "7px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{showAuth ? "▾" : "▸"}</span>
                  Authorization {authType !== "none" ? `(${authType})` : "(optional — for private / login-required pages)"}
                </button>

                {showAuth && (
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px",
                    padding: "16px", background: t.surfaceHover, borderRadius: "10px",
                    border: `1px solid ${t.border}` }}>
                    {/* Auth type selector */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[
                        { value: "none",   label: "None" },
                        { value: "bearer", label: "Bearer Token" },
                        { value: "cookie", label: "Cookie / Session" },
                        { value: "basic",  label: "Basic Auth" },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setAuthType(opt.value)}
                          style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "12px",
                            fontWeight: authType === opt.value ? "600" : "400", cursor: "pointer",
                            border: `1.5px solid ${authType === opt.value ? accent : t.border}`,
                            background: authType === opt.value ? `${accent}14` : "transparent",
                            color: authType === opt.value ? accent : t.textSub }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {authType === "bearer" && (
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                          textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                          Bearer Token
                        </label>
                        <input value={authToken} onChange={e => setAuthToken(e.target.value)}
                          placeholder="eyJhbGciOi… or your API key"
                          type="password"
                          style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                            borderRadius: "8px", color: t.text, fontSize: "13px",
                            padding: "9px 12px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = accent}
                          onBlur={e  => e.target.style.borderColor = t.border} />
                        <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "5px" }}>
                          Sent as: <code style={{ fontFamily: "monospace" }}>Authorization: Bearer &lt;token&gt;</code>
                        </div>
                      </div>
                    )}

                    {authType === "cookie" && (
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                          textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                          Cookie String
                        </label>
                        <input value={authCookie} onChange={e => setAuthCookie(e.target.value)}
                          placeholder="session=abc123; auth_token=xyz…"
                          type="password"
                          style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                            borderRadius: "8px", color: t.text, fontSize: "13px",
                            padding: "9px 12px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = accent}
                          onBlur={e  => e.target.style.borderColor = t.border} />
                        <div style={{ fontSize: "11px", color: t.textMuted, marginTop: "5px" }}>
                          Copy from browser DevTools → Application → Cookies → copy the Cookie header value
                        </div>
                      </div>
                    )}

                    {authType === "basic" && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                            textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                            Username
                          </label>
                          <input value={authUser} onChange={e => setAuthUser(e.target.value)}
                            placeholder="username"
                            style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                              borderRadius: "8px", color: t.text, fontSize: "13px",
                              padding: "9px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e  => e.target.style.borderColor = t.border} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "11px", fontWeight: "600", color: t.textMuted,
                            textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                            Password
                          </label>
                          <input value={authPass} onChange={e => setAuthPass(e.target.value)}
                            placeholder="password" type="password"
                            style={{ width: "100%", background: t.input, border: `1px solid ${t.border}`,
                              borderRadius: "8px", color: t.text, fontSize: "13px",
                              padding: "9px 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e  => e.target.style.borderColor = t.border} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Result */}
              {connectResult && (
                <div style={{ padding: "12px 14px", borderRadius: "10px",
                  background: connectResult.error ? "#EF444414" : "#34D39914",
                  border: `1px solid ${connectResult.error ? "#EF444430" : "#34D39930"}` }}>
                  {connectResult.error ? (
                    <div style={{ fontSize: "13px", color: "#EF4444" }}>
                      ✕ Failed: {connectResult.error}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "#34D399", fontWeight: "600" }}>
                      ✓ Successfully scraped {connectResult.pages} page{connectResult.pages !== 1 ? "s" : ""} — content is now live in the AI's knowledge base
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {connecting && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 14px", borderRadius: "10px", background: `${accent}10`,
                  border: `1px solid ${accent}30` }}>
                  <div style={{ width: "16px", height: "16px", border: `2px solid ${accent}`,
                    borderTopColor: "transparent", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontSize: "13px", color: accent }}>
                    {connectMode === "crawl" ? `Crawling site — this may take up to ${connectMax * 2} seconds…` : "Scraping page…"}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end",
              padding: "16px 24px", borderTop: `1px solid ${t.border}` }}>
              {connectResult?.pages ? (
                <button onClick={() => setShowConnect(false)}
                  style={{ background: accent, border: "none", borderRadius: "8px", color: "#fff",
                    fontSize: "13px", fontWeight: "600", padding: "10px 24px", cursor: "pointer" }}>
                  Done
                </button>
              ) : (
                <>
                  <button onClick={() => setShowConnect(false)} disabled={connecting}
                    style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: "8px",
                      color: t.textSub, fontSize: "13px", padding: "10px 20px",
                      cursor: connecting ? "default" : "pointer", opacity: connecting ? 0.5 : 1 }}>
                    Cancel
                  </button>
                  <button onClick={connectSource} disabled={connecting || !connectUrl.trim()}
                    style={{ background: connectUrl.trim() && !connecting ? accent : t.surfaceHover,
                      border: "none", borderRadius: "8px",
                      color: connectUrl.trim() && !connecting ? "#fff" : t.textMuted,
                      fontSize: "13px", fontWeight: "600", padding: "10px 28px",
                      cursor: connectUrl.trim() && !connecting ? "pointer" : "default",
                      transition: "all 0.15s" }}>
                    {connecting ? "Scraping…" : connectMode === "crawl" ? "Crawl Site" : "Scrape Page"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {editingArticle && (
        <ArticleEditModal key={editingArticle.article.id} article={editingArticle.article}
          isPublished={editingArticle.isPublished} t={t} accent={accent}
          onSave={handleSaveArticle} onClose={() => setEditingArticle(null)} />
      )}

      {testingArticle?.id && (
        <ContentTestModal
          title="Test Knowledge Article"
          itemType="Knowledge Base"
          itemLabel={testingArticle.title || "Untitled Article"}
          endpoint={`/api/knowledge/${testingArticle.id}/test`}
          t={t}
          accent={accent}
          onClose={() => setTestingArticle(null)}
        />
      )}

      {/* ── AI Insights from database ── */}
      <AIInsightsPanel t={t} accent={accent} />
    </div>
  );
}



