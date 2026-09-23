# Solution Strategy

## Core Approach

The platform is a **self-hosted, fully open-source stack**. It runs its own real-time, auth, and persistence rather than depending on a managed cloud:

- **Real-time sync** → in-process WebSocket hub in the FastAPI backend (`backend/routes/ws.py`)
- **Auth** → Keycloak (OpenID Connect), brokered by the Go auth-service
- **Data persistence** → self-hosted PostgreSQL (`backend/db.py`, schema `backend/db/schema.sql`)
- **Deployment** → Docker Compose (frontend, backend, PostgreSQL, Keycloak, auth-service)

This keeps all participant data on-premise and lets the small THD Spatial AI team run everything with a single `docker compose up`.

## Key Architectural Decisions

### 1. In-Process WebSocket Hub
Workshop sessions involve tens of participants (not thousands), so real-time sync is handled by a lightweight in-process WebSocket hub inside the FastAPI backend — no separate messaging service to operate. Broadcast channels are keyed by session slug.

**Trade-off**: A single-process hub does not scale horizontally across backend replicas without a shared pub/sub (e.g. Redis). Acceptable at workshop scale, where one backend instance comfortably serves a session.

### 2. FastAPI (Python) Backend
The backend handles session management, participant registration, and the critical pre-registration call to feeedback_pipeline. Python is chosen because:
- feeedback_pipeline is already Python/FastAPI
- The same developer can maintain both backends
- Future AI features (Ollama-powered persona synthesis) are Python-native

**Trade-off**: Go (used in Wildfire's backend) would be more performant, but adding a third language creates unnecessary overhead for a small team.

### 3. Feature-First Frontend Structure
Each workshop feature (persona-card, user-flow, problem-board, etc.) is a self-contained folder with its own component, hook, types, and translations. This mirrors the Storcito-Wildfire `features/` structure.

**Trade-off**: Some duplication of utility logic. Resolved by placing shared primitives in `components/` and `lib/`.

### 4. Anonymous Participants
Participants provide name, role, and org — stored with a server-generated `session_token`. No email, no password, no user account. This removes all friction for domain experts unfamiliar with digital tools.

**Trade-off**: No persistent identity across sessions. A returning participant is treated as new. Acceptable for workshop use case where sessions are bounded events.

### 5. External Slides (Iframe) for Phase 1
Facilitators embed Google Slides or PDF URLs. The platform syncs the current slide index across all participants via the WebSocket hub. The platform does not host or author slide content.

**Trade-off**: Depends on external service (Google Slides). Mitigated by supporting any iframe-embeddable URL. Slide authoring is a planned future milestone.

## Technology Stack Summary

```
Browser (Participant / Facilitator)
        │
        ▼
React 19 SPA (TypeScript + Vite + TailwindCSS v4)
        │
        ├── WebSocket ──► FastAPI hub (phase sync, slide index, reactions)
        │
        └── HTTP → FastAPI Backend (Python 3.11)
                │
                ├── asyncpg ──► PostgreSQL (sessions, participants, templates)
                ├── auth-service ──► Keycloak (facilitator auth)
                └── httpx ──► feedback pipeline /api/v1/persona/pre-register

All services run together via Docker Compose (fully self-hosted).
```
