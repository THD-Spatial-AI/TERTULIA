# Solution Strategy

## Core Approach

The platform is built as a **thin orchestration layer** over managed services. Rather than implementing real-time infrastructure from scratch, it delegates:

- **Real-time sync** → Supabase Realtime (broadcast channels over WebSocket)
- **Auth** → Supabase Auth (magic link for facilitators)
- **Data persistence** → Supabase PostgreSQL
- **Deployment** → Vercel (frontend) + Supabase cloud (DB + backend hosting)

This minimizes operational burden and allows the small THD Spatial AI team to focus on product logic rather than infrastructure.

## Key Architectural Decisions

### 1. Supabase Realtime over Custom WebSocket Server
Workshop sessions involve tens of participants (not thousands). Supabase Realtime provides broadcast channels sufficient for this scale, eliminates the need to run a stateful WebSocket server, and integrates natively with the PostgreSQL database already used for persistence.

**Trade-off**: Supabase Realtime has latency slightly higher than a dedicated WebSocket server (~100-300ms) but well within the < 500ms requirement for workshop interactions.

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
Participants provide name, role, and org — stored with a server-generated `session_token`. No email, no password, no Supabase user account. This removes all friction for domain experts unfamiliar with digital tools.

**Trade-off**: No persistent identity across sessions. A returning participant is treated as new. Acceptable for workshop use case where sessions are bounded events.

### 5. External Slides (Iframe) for Phase 1
Facilitators embed Google Slides or PDF URLs. The platform syncs the current slide index across all participants via Supabase Realtime. The platform does not host or author slide content.

**Trade-off**: Depends on external service (Google Slides). Mitigated by supporting any iframe-embeddable URL. Slide authoring is a planned future milestone.

## Technology Stack Summary

```
Browser (Participant / Facilitator)
        │
        ▼
Vercel CDN → React 19 SPA (TypeScript + Vite + TailwindCSS v4)
        │
        ├── Supabase JS Client ──► Supabase Cloud
        │      ├── PostgreSQL (sessions, participants, templates)
        │      ├── Realtime (phase sync, slide index, reactions)
        │      └── Auth (facilitator magic link)
        │
        └── HTTP → FastAPI Backend (Python 3.11)
                │
                ├── Supabase Python Client ──► Supabase Cloud
                └── httpx ──► feeedback_pipeline /api/v1/persona/pre-register
```
