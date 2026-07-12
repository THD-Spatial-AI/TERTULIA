-- Workshop Logic Platform — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor
-- Project: workshop-platform

-- ── Sessions ───────────────────────────────────────────────────────────────

CREATE TYPE session_phase AS ENUM (
  'lobby', 'slides', 'template_1', 'template_2', 'template_3', 'template_4', 'launched'
);

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  facilitator_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  workshop_tag    TEXT NOT NULL,
  slides_url      TEXT,
  wildfire_url    TEXT NOT NULL,
  phase           session_phase NOT NULL DEFAULT 'lobby',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Participants (anonymous) ────────────────────────────────────────────────

CREATE TABLE participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL,
  org             TEXT,
  session_token   TEXT UNIQUE NOT NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_session_token ON participants(session_token);

-- ── Persona Cards (Template 1) ──────────────────────────────────────────────

CREATE TABLE persona_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  goals           TEXT,
  pain_points     TEXT,
  tech_comfort    INTEGER CHECK (tech_comfort BETWEEN 1 AND 5),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_persona_cards_session_id ON persona_cards(session_id);

-- ── User Flows (Template 2) ─────────────────────────────────────────────────

CREATE TABLE user_flows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  steps           JSONB NOT NULL DEFAULT '[]',
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_user_flows_session_id ON user_flows(session_id);

-- ── Problem Boards (Template 3) ─────────────────────────────────────────────

CREATE TABLE problem_boards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  notes           JSONB NOT NULL DEFAULT '[]',
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_problem_boards_session_id ON problem_boards(session_id);

-- ── Stakeholder Maps (Template 4) ───────────────────────────────────────────

CREATE TABLE stakeholder_maps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID UNIQUE NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  nodes           JSONB NOT NULL DEFAULT '[]',
  edges           JSONB NOT NULL DEFAULT '[]',
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_stakeholder_maps_session_id ON stakeholder_maps(session_id);

-- ── Reactions ────────────────────────────────────────────────────────────────

CREATE TYPE reaction_type AS ENUM ('emoji_fire', 'emoji_heart', 'emoji_question', 'raise_hand');

CREATE TABLE reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type            reaction_type NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reactions_session_id ON reactions(session_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flows     ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions      ENABLE ROW LEVEL SECURITY;

-- SECURITY MODEL: the frontend NEVER queries these tables directly with the
-- public anon key. Every read/write goes through the FastAPI backend, which
-- uses the service-role key and bypasses RLS. Therefore NO table needs a
-- public (`USING (true)`) policy. RLS stays enabled with zero permissive
-- policies so the anon key is denied by default (deny-all).
--
-- ⚠️  DO NOT re-add `USING (true)` SELECT policies. In particular, a public
-- read policy on `participants` leaks `session_token` — the bearer credential
-- for the templates API — to anyone holding the public anon key, allowing full
-- impersonation of every participant. This was the original vulnerability.

-- Sessions: only the owning facilitator may touch rows directly (defense in
-- depth; the app itself goes through the backend). No public read.
CREATE POLICY "sessions_owner_insert" ON sessions FOR INSERT WITH CHECK (facilitator_id = auth.uid());
CREATE POLICY "sessions_owner_select" ON sessions FOR SELECT USING (facilitator_id = auth.uid());
CREATE POLICY "sessions_owner_update" ON sessions FOR UPDATE USING (facilitator_id = auth.uid());
CREATE POLICY "sessions_owner_delete" ON sessions FOR DELETE USING (facilitator_id = auth.uid());

-- Participants: NO anon policies. Anonymous join and facilitator listing both
-- run through the backend (service role). session_token must never be exposed
-- to the anon key.

-- Persona cards / user flows / problem boards / stakeholder maps: NO anon
-- policies. Backend-only (service role) — participants reach them via the
-- X-Session-Token header, validated server-side.

-- Reactions: NO anon policies. Reactions are ephemeral Realtime broadcasts and
-- are never written to this table by the app.

-- ── Realtime ──────────────────────────────────────────────────────────────────

-- Realtime postgres_changes are gated by the SELECT RLS policies above. With no
-- public SELECT policy, anon subscribers receive nothing — so adding these
-- tables is safe but currently unused (the app uses `broadcast` channels only).
--
-- ⚠️  `participants` is intentionally NOT published: its rows contain
-- session_token, and publishing it would stream that credential to every
-- Realtime subscriber the moment a public SELECT policy were ever (re)added.
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- ── SECURITY REMEDIATION MIGRATION ───────────────────────────────────────────
-- Run this on any database that was provisioned with the OLD schema (which had
-- public `USING (true)` policies that leaked participant session_tokens). Safe
-- to run repeatedly.

DROP POLICY IF EXISTS "sessions_public_read"       ON sessions;
DROP POLICY IF EXISTS "participants_public_insert"  ON participants;
DROP POLICY IF EXISTS "participants_public_read"    ON participants;
DROP POLICY IF EXISTS "reactions_public_insert"     ON reactions;
DROP POLICY IF EXISTS "reactions_public_read"       ON reactions;

DROP POLICY IF EXISTS "sessions_owner_select" ON sessions;
CREATE POLICY "sessions_owner_select" ON sessions FOR SELECT USING (facilitator_id = auth.uid());

-- Stop streaming participant rows (which contain session_token) over Realtime.
ALTER PUBLICATION supabase_realtime DROP TABLE participants;

-- ── Supabase Auth Config (manual steps in dashboard) ─────────────────────────
-- 1. Authentication → Providers → Email → Enable "Magic Link"
-- 2. Authentication → Email Templates → customize if needed
-- 3. Authentication → URL Configuration → add your domain to allowed redirect URLs
