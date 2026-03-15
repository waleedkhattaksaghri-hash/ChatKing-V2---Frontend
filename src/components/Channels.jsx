import { useEffect, useState } from "react";
import { apiJson, getActiveClientId } from "../lib/api";
import { useApi } from "../lib/useApi";
import { Card, SectionHeader } from "./ui";

export function Channels({ t, accent }) {
  const clientId = getActiveClientId();
  const { data: rawConfig } = useApi(`/api/channels?client_id=${clientId}`, null);
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (rawConfig) setConfig(rawConfig);
  }, [rawConfig]);

  const channelDefs = [
    { key: "email", name: "Email", icon: "EM", desc: "Gmail, Outlook, custom SMTP" },
    { key: "zendesk", name: "Zendesk", icon: "ZD", desc: "Sync tickets bidirectionally" },
    { key: "webhook", name: "API Webhook", icon: "WH", desc: "Any custom source via webhook" },
    { key: "whatsapp", name: "WhatsApp", icon: "WA", desc: "WhatsApp Business API via Twilio" },
    { key: "slack", name: "Slack", icon: "SL", desc: "Internal escalation and alerts" },
    { key: "instagram", name: "Instagram", icon: "IG", desc: "DMs and post comments" },
    { key: "sms", name: "SMS / Twilio", icon: "SM", desc: "SMS conversations via Twilio" },
    { key: "messenger", name: "Facebook Messenger", icon: "MS", desc: "Facebook Page DMs" },
    { key: "twitter", name: "X / Twitter", icon: "X", desc: "DMs and mentions" },
    { key: "intercom", name: "Intercom", icon: "IC", desc: "Sync Intercom conversations" },
    { key: "freshdesk", name: "Freshdesk", icon: "FD", desc: "Sync Freshdesk tickets" },
  ];

  const accentMap = {
    email: "#4F8EF7",
    zendesk: "#2DD4BF",
    webhook: "#FBBF24",
    whatsapp: "#34D399",
    slack: "#A78BFA",
    instagram: "#FB7185",
    sms: "#F97316",
    messenger: "#60A5FA",
    twitter: "#1DA1F2",
    intercom: "#6366F1",
    freshdesk: "#22D3EE",
  };

  async function toggleChannel(key) {
    const newVal = { connected: !config[key]?.connected };
    const updated = { ...config, [key]: newVal };
    setConfig(updated);
    await apiJson("/api/channels", {
      method: "PUT",
      body: { client_id: clientId, [key]: newVal },
    });
  }

  return (
    <div>
      <SectionHeader title="Channels" sub="Connect the sources where your customers reach you. Aria handles all channels with one operating layer." t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: "14px" }}>
        {channelDefs.map((channel) => {
          const connected = !!config[channel.key]?.connected;
          const color = accentMap[channel.key] || accent;
          return (
            <Card key={channel.name} t={t} style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color, letterSpacing: "0.06em", border: `1px solid ${color}30` }}>
                  {channel.icon}
                </div>
                <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px", background: connected ? "#34D39918" : t.surfaceHover, color: connected ? "#34D399" : t.textMuted, border: `1px solid ${connected ? "#34D39940" : t.border}` }}>
                  {connected ? "Connected" : "Not connected"}
                </span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "6px", letterSpacing: "-0.01em" }}>{channel.name}</div>
              <div style={{ fontSize: "11.5px", color: t.textSub, marginBottom: "16px", lineHeight: "1.6" }}>{channel.desc}</div>
              <button
                type="button"
                onClick={() => toggleChannel(channel.key)}
                style={{ background: connected ? t.surfaceHover : accent, border: connected ? `1px solid ${t.border}` : "none", borderRadius: "10px", color: connected ? t.textSub : "#fff", fontSize: "12px", fontWeight: "700", padding: "9px 14px", cursor: "pointer", width: "100%" }}
              >
                {connected ? "Disconnect" : "Connect"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
