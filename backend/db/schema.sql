-- Tertulia workshop platform — PostgreSQL schema
-- Run once against a fresh database: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sessions (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                    TEXT        NOT NULL UNIQUE,
    facilitator_id          TEXT        NOT NULL,
    title                   TEXT        NOT NULL,
    workshop_tag            TEXT        NOT NULL,
    slides_url              TEXT,
    wildfire_url            TEXT        NOT NULL,
    phase                   TEXT        NOT NULL DEFAULT 'lobby',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_flow_chips         JSONB       NOT NULL DEFAULT '[]',
    canvas_chips            JSONB       NOT NULL DEFAULT '[]',
    stakeholder_suggestions JSONB       NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS participants (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    display_name  TEXT        NOT NULL,
    role          TEXT        NOT NULL,
    org           TEXT,
    session_token UUID        NOT NULL DEFAULT gen_random_uuid(),
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participants_session_id_idx ON participants(session_id);
CREATE INDEX IF NOT EXISTS participants_session_token_idx ON participants(session_token);

CREATE TABLE IF NOT EXISTS persona_cards (
    participant_id UUID        PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    extended_data  JSONB,
    tech_comfort   INTEGER,
    completed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_flows (
    participant_id UUID        PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    steps          JSONB       NOT NULL DEFAULT '{}',
    completed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS problem_boards (
    participant_id UUID        PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    notes          JSONB       NOT NULL DEFAULT '[]',
    completed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stakeholder_maps (
    participant_id UUID        PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    nodes          JSONB       NOT NULL DEFAULT '{}',
    edges          JSONB       NOT NULL DEFAULT '[]',
    completed_at   TIMESTAMPTZ
);
