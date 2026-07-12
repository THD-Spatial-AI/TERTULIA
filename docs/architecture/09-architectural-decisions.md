# Architectural Decisions

## ADR-001 — Supabase Realtime over Custom WebSocket Server

**Status**: Accepted

**Context**: The platform needs real-time sync for slide index, phase changes, and reactions across all connected participants. Options considered: custom WebSocket server (Go or Python), Socket.IO, Supabase Realtime.

**Decision**: Use Supabase Realtime broadcast channels.

**Rationale**:
- Workshop sessions involve tens of participants, not thousands — Supabase handles this scale easily
- Eliminates the need to run a stateful WebSocket server (reduces ops burden)
- Integrates natively with Supabase PostgreSQL already used for persistence
- Supabase JS client handles reconnection logic automatically

**Consequences**:
- Slight latency overhead (~100-300ms) vs. dedicated WebSocket — acceptable for workshop interactions
- Dependency on Supabase availability (mitigated by Supabase SLA and auto-reconnect)

---

## ADR-002 — FastAPI (Python) over Go for Backend

**Status**: Accepted

**Context**: The backend handles session management and the critical persona pre-registration call to feeedback_pipeline (Python/FastAPI). Options: Go/Gin (used in Wildfire), FastAPI (Python).

**Decision**: FastAPI (Python 3.11+).

**Rationale**:
- feeedback_pipeline is Python/FastAPI — same developer can maintain both
- Future AI features (Ollama-powered synthesis) are Python-native
- Pydantic v2 provides strong request/response validation matching feeedback_pipeline's patterns

**Consequences**:
- Go's performance characteristics are foregone — acceptable at workshop scale
- Third language (Go) avoided in the Workshop ecosystem

---

## ADR-003 — Anonymous Participants (No Account)

**Status**: Accepted

**Context**: Participants are domain experts (firefighters, mayors) — not developers. Creating accounts adds friction that may exclude less tech-savvy stakeholders.

**Decision**: Participants provide only name, role, and org. Backend assigns a server-generated `session_token` (UUID v4) stored in `localStorage`.

**Rationale**:
- Zero friction: join by URL or QR scan, type name and role, done
- Data privacy: no email addresses stored for participants
- Workshop sessions are bounded events — persistent identity across sessions is not needed

**Consequences**:
- No returning participant recognition (treated as new on each session join)
- `session_token` is effectively a bearer token — if lost (cleared localStorage), participant cannot recover their submissions. Acceptable for bounded workshop use.

---

## ADR-004 — Persona Card Built Fresh (Not Imported from feeedback_pipeline)

**Status**: Accepted

**Context**: feeedback_pipeline has a `PersonaForm` component with name, role, org, familiarity, experience, comfort. Re-using it would create a cross-repo dependency.

**Decision**: Workshop platform builds its own Persona Card component and schema.

**Rationale**:
- Workshop persona is richer (goals, pain points, stakeholder context) than the feeedback_pipeline persona (which is UI-feedback focused)
- Coupling to feeedback_pipeline's frontend package creates maintenance risk
- The workshop platform owns the canonical persona — it pre-registers to the pipeline, not the other way around

**Consequences**:
- Some field duplication between `PersonaCard` (workshop) and `PersonaData` (pipeline)
- Workshop backend maps persona fields to pipeline's expected schema at pre-registration time

---

## ADR-005 — External Slides (Iframe) for Phase 1

**Status**: Accepted (v1); Planned for revision in v2

**Context**: Facilitators need to present context before the workshop. Options: build slide authoring in-platform, embed external presentation tool, host uploaded PDFs.

**Decision**: Embed Google Slides or any iframe-compatible URL. Platform syncs only the current slide index via Realtime.

**Rationale**:
- Facilitators already have their decks in Google Slides or PowerPoint
- Forces no re-authoring in a new tool
- Slide sync (index broadcast) is a trivial Realtime message

**Consequences**:
- Depends on external service (Google Slides must be embeddable — "Anyone with the link can view")
- No offline slide fallback
- Slide authoring is deferred to v2 milestone

---

## ADR-006 — Vercel + Supabase Cloud (No Self-Hosting)

**Status**: Accepted

**Context**: The platform must be reachable for online workshops without requiring participants to install anything. Hosting options: THD/university server (Docker), cloud PaaS (Vercel + Railway), Supabase cloud.

**Decision**: Vercel for frontend, Supabase cloud for DB/Realtime/Auth, Railway or Render for FastAPI backend.

**Rationale**:
- Zero infrastructure maintenance
- Vercel + Supabase pair natively (Vercel has first-class Supabase integration)
- Immediate global CDN for frontend assets — fast load for remote participants worldwide

**Consequences**:
- Data stored in Supabase cloud (not on THD servers) — mitigated by anonymous-only participant data and the ability to self-host Supabase in future
- Monthly cost (Supabase Pro ~$25/mo if free tier exceeded)
