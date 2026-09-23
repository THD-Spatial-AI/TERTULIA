# Context & Scope

## System Context

The Workshop Logic Platform sits at the center of a three-system ecosystem:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workshop Logic Platform                       │
│                                                                 │
│   ┌──────────────┐         ┌──────────────────────────────┐    │
│   │  Facilitator │         │   Participant (anonymous)    │    │
│   │  (Keycloak)  │         │   (name + role + org)        │    │
│   └──────┬───────┘         └──────────────┬───────────────┘    │
│          │ controls session                │ fills templates    │
│          └─────────────┬───────────────────┘                   │
│                        │                                        │
│               ┌────────▼────────┐                              │
│               │  FastAPI + WS   │                              │
│               │  PostgreSQL     │                              │
│               │  Keycloak auth  │                              │
│               └─────────────────┘                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
   ┌──────────▼──────────┐   ┌─────────▼────────────┐
   │  feeedback_pipeline  │   │  Storcito-Wildfire    │
   │  FastAPI backend     │   │  React + Go platform  │
   │  /api/v1/persona/   │   │  wildfire.thd-...de   │
   │  pre-register        │   │  ?workshop_tag=...    │
   │                      │   │  &session_token=...   │
   └──────────────────────┘   └──────────────────────┘
```

## External Interfaces

### PostgreSQL (self-hosted)
- **Type**: Self-hosted PostgreSQL container (schema at `backend/db/schema.sql`)
- **Used for**: Session data, participant data, template responses
- **Protocol**: asyncpg connection pool from the FastAPI backend (`backend/db.py`)

### Keycloak + Go auth-service
- **Type**: Self-hosted OpenID Connect identity provider (Keycloak) fronted by the Go auth-service
- **Used for**: Facilitator authentication and session management
- **Protocol**: OIDC via the auth-service; the FastAPI backend validates the session with `require_facilitator`

### WebSocket Hub (in the backend)
- **Type**: In-process WebSocket hub (`backend/routes/ws.py`)
- **Used for**: Real-time broadcast of phase/slide changes, presence, and reactions
- **Protocol**: WebSocket, channels keyed by session slug

### Feedback Pipeline Backend
- **Type**: FastAPI microservice (part of this repo at `pipeline/backend`)
- **Used for**: Pre-registering participant personas before the target-app redirect; later turning in-app feedback into GitHub issues
- **Protocol**: HTTP POST to `/api/v1/persona/pre-register` (and `/api/v1/feedback`)
- **Auth**: Shared token header (`PIPELINE_TOKEN` == pipeline `WORKSHOP_TOKEN`)

### Storcito-Wildfire
- **Type**: External React web application (separate project)
- **Used for**: Target platform participants are redirected to at end of workshop
- **Protocol**: URL redirect with query params `?workshop_tag=...&session_token=...`
- **No API call**: The workshop platform does not call Wildfire directly — it only constructs the redirect URL

### Browser (Participant)
- **Type**: Web browser on desktop or tablet
- **Joins via**: QR code scan (in-person) or URL (online)
- **Realtime**: WebSocket connection to the backend hub for live updates

### Browser (Facilitator)
- **Type**: Web browser on laptop/projector screen
- **Auth**: Keycloak (via the Go auth-service)
- **Controls**: Session phase, slide index, template unlock, launch

## Scope Boundaries

### In Scope
- Session lifecycle management (create, run, launch)
- Participant anonymous join flow
- Real-time slide sync (iframe embed, external URL)
- 4 structured templates: Persona Card, User Flow, Problem Board, Stakeholder Map
- Facilitator live progress view
- Persona pre-registration with feeedback_pipeline
- Push redirect to Wildfire with workshop params
- i18n: DE / EN / ES / GL

### Out of Scope (v1)
- Slide authoring inside the platform
- Video/audio conferencing (use Zoom/Teams alongside)
- Wildfire app modifications (embedding the overlay into Wildfire is done in the Wildfire project; the overlay package itself lives in `pipeline/overlay`)
- Analytics dashboard across multiple workshops
- AI-assisted synthesis of template responses
- Export (PDF / Excel) of workshop outputs
