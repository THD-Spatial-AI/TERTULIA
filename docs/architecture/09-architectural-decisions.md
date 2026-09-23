# Architectural Decisions

## ADR-001 — In-Process WebSocket Hub for Real-Time Sync

**Status**: Accepted (supersedes an earlier managed-realtime approach)

**Context**: The platform needs real-time sync for slide index, phase changes, and reactions across all connected participants. Options considered: an in-process WebSocket hub in the FastAPI backend, a standalone WebSocket server (Go or Python), Socket.IO, and a managed realtime SaaS.

**Decision**: Use an in-process WebSocket hub inside the FastAPI backend (`backend/routes/ws.py`), with broadcast channels keyed by session slug.

**Rationale**:
- Workshop sessions involve tens of participants, not thousands — a single-process hub handles this easily
- Keeps the whole stack fully self-hosted (no third-party cloud, participant data stays on-premise)
- No extra messaging service to run or pay for
- Lives next to the data and auth already in the backend

**Consequences**:
- Single-process — no horizontal scaling across backend replicas without a shared pub/sub (e.g. Redis); acceptable at workshop scale
- The frontend handles reconnection (show "Reconnecting…", auto-retry)

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

## ADR-006 — Self-Hosted Docker Compose (No Managed Cloud)

**Status**: Accepted (supersedes an earlier managed-cloud approach)

**Context**: The platform must be reachable for online workshops without requiring participants to install anything, while keeping participant data on-premise and the stack fully open-source. Hosting options: a THD/university server running Docker, or cloud PaaS + managed backend services.

**Decision**: Self-host the entire stack via Docker Compose (frontend, FastAPI backend, PostgreSQL, Keycloak, Go auth-service, and the feedback pipeline) on a single host.

**Rationale**:
- All participant data stays on THD infrastructure — no third-party data processor
- Fully open-source; no per-seat or usage-based SaaS cost
- One `docker compose up` brings up the whole system, reproducibly, anywhere
- Aligns with the feedback pipeline, which already runs local Ollama + n8n

**Consequences**:
- The team operates its own host (updates, backups, TLS) instead of offloading to a PaaS
- No built-in global CDN; fine for regional/EU workshops. A reverse proxy (nginx) fronts the services for TLS
