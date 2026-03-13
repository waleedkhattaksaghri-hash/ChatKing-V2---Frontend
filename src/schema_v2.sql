-- ============================================================
-- ChatKing v2 — Multi-Tenant Schema
-- Run in Supabase SQL Editor
-- Safe to run on existing DB (IF NOT EXISTS everywhere)
-- ============================================================

-- ── ORGANIZATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  domain     text,
  plan       text DEFAULT 'starter' CHECK (plan IN ('starter','growth','enterprise')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orgs_domain ON organizations(domain);

-- ── USERS ──────────────────────────────────────────────────
-- (extends existing users table if present)
CREATE TABLE IF NOT EXISTS users (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  name       text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ── MEMBERSHIPS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role            text DEFAULT 'agent' CHECK (role IN ('owner','admin','agent','viewer')),
  created_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_org  ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- ── MESSAGES (new normalized table) ────────────────────────
-- Supplements the existing conversations table with per-message rows
CREATE TABLE IF NOT EXISTS messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type     text CHECK (sender_type IN ('customer','bot','agent','system')),
  content         text NOT NULL DEFAULT '',
  intent          text,
  confidence      float,
  sentiment       text CHECK (sentiment IN ('positive','neutral','negative','angry')),
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created      ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_intent       ON messages(intent) WHERE intent IS NOT NULL;

-- ── EVENTS (append-only audit/analytics log) ────────────────
CREATE TABLE IF NOT EXISTS events (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  payload         jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_org       ON events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_client    ON events(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type      ON events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_payload   ON events USING gin(payload);

-- Common event_type values:
-- message_received | bot_response_generated | conversation_escalated
-- agent_joined | conversation_resolved | kb_article_lookup | sop_triggered

-- ── AI_INSIGHTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insights (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  insight_type    text NOT NULL CHECK (insight_type IN
    ('knowledge_gap','rising_issue','automation_opportunity')),
  title           text NOT NULL,
  description     text NOT NULL,
  severity        text DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
  metadata        jsonb DEFAULT '{}'::jsonb,
  resolved        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insights_client   ON ai_insights(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_type     ON ai_insights(client_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON ai_insights(client_id, severity);

-- ── DAILY_METRICS (precomputed, fast dashboard reads) ──────
CREATE TABLE IF NOT EXISTS daily_metrics (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id        uuid REFERENCES clients(id) ON DELETE CASCADE,
  date             date NOT NULL,
  total_messages   integer DEFAULT 0,
  bot_responses    integer DEFAULT 0,
  escalations      integer DEFAULT 0,
  automation_rate  numeric(5,2) DEFAULT 0,
  avg_confidence   numeric(5,2),
  top_intent       text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(client_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_client ON daily_metrics(client_id, date DESC);

-- ── ADD MISSING COLUMNS TO EXISTING TABLES ─────────────────

-- conversations: add organization_id linkage + sentiment
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS sentiment        text,
  ADD COLUMN IF NOT EXISTS resolved_at      timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id) WHERE organization_id IS NOT NULL;

-- knowledge_base: lookups counter + source
ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS source_url  text,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lookups     integer DEFAULT 0;

-- client_settings
ALTER TABLE client_settings
  ADD COLUMN IF NOT EXISTS capabilities_allowed text,
  ADD COLUMN IF NOT EXISTS capabilities_blocked text,
  ADD COLUMN IF NOT EXISTS bot_name             text DEFAULT 'Aria';

-- ── ANALYTICS VIEWS ────────────────────────────────────────

CREATE OR REPLACE VIEW v_automation_rate AS
SELECT
  client_id,
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE NOT escalated) AS automated,
  ROUND(
    COUNT(*) FILTER (WHERE NOT escalated)::numeric / NULLIF(COUNT(*),0) * 100, 2
  ) AS automation_rate
FROM conversations
GROUP BY client_id, date_trunc('day', created_at)::date;

CREATE OR REPLACE VIEW v_top_intents AS
SELECT
  client_id,
  intent,
  COUNT(*)                                    AS total,
  COUNT(*) FILTER (WHERE escalated = true)    AS escalated_count,
  ROUND(
    COUNT(*) FILTER (WHERE NOT escalated)::numeric / NULLIF(COUNT(*),0) * 100, 1
  ) AS containment_rate
FROM conversations
WHERE intent IS NOT NULL
  AND created_at > now() - interval '7 days'
GROUP BY client_id, intent
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_conversation_volume AS
SELECT
  client_id,
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS conversations,
  COUNT(*) FILTER (WHERE channel = 'email') AS email_count,
  COUNT(*) FILTER (WHERE channel = 'chat')  AS chat_count
FROM conversations
GROUP BY client_id, date_trunc('day', created_at)::date
ORDER BY day DESC;

-- ── PERFORMANCE INDEXES ─────────────────────────────────────
-- These cover the most common dashboard query patterns
CREATE INDEX IF NOT EXISTS idx_conv_client_created   ON conversations(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_client_intent    ON conversations(client_id, intent) WHERE intent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conv_client_escalated ON conversations(client_id, escalated) WHERE escalated = true;
CREATE INDEX IF NOT EXISTS idx_conv_status           ON conversations(client_id, status);

-- ── AUTO-UPDATE TRIGGERS ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kb_updated_at ON knowledge_base;
CREATE TRIGGER kb_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS sops_updated_at ON sops;
CREATE TRIGGER sops_updated_at
  BEFORE UPDATE ON sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
