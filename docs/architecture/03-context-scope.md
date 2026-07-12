# Context & Scope

## System Context

The Workshop Logic Platform sits at the center of a three-system ecosystem:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workshop Logic Platform                       │
│                                                                 │
│   ┌──────────────┐         ┌──────────────────────────────┐    │
│   │  Facilitator │         │   Participant (anonymous)    │    │
│   │  (magic link)│         │   (name + role + org)        │    │
│   └──────┬───────┘         └──────────────┬───────────────┘    │
│          │ controls session                │ fills templates    │
│          └─────────────┬───────────────────┘                   │
│                        │                                        │
│               ┌────────▼────────┐                              │
│               │  Supabase       │                              │
│               │  PostgreSQL +   │                              │
│               │  Realtime + Auth│                              │
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

### Supabase
- **Type**: Managed cloud service (PostgreSQL + Realtime + Auth)
- **Used for**: Session data, participant data, template responses, Realtime broadcast of phase/slide changes, facilitator authentication
- **Protocol**: Supabase JS client (REST + WebSocket underneath)

### feeedback_pipeline Backend
- **Type**: FastAPI microservice (separate project at `../STORCITO/feeedback_pipeline`)
- **Used for**: Pre-registering participant personas before Wildfire redirect
- **Protocol**: HTTP POST to `/api/v1/persona/pre-register`
- **Auth**: Shared `WORKSHOP_TOKEN` header

### Storcito-Wildfire
- **Type**: External React web application (separate project)
- **Used for**: Target platform participants are redirected to at end of workshop
- **Protocol**: URL redirect with query params `?workshop_tag=...&session_token=...`
- **No API call**: The workshop platform does not call Wildfire directly — it only constructs the redirect URL

### Browser (Participant)
- **Type**: Web browser on desktop or tablet
- **Joins via**: QR code scan (in-person) or URL (online)
- **Realtime**: Supabase Realtime WebSocket for live updates

### Browser (Facilitator)
- **Type**: Web browser on laptop/projector screen
- **Auth**: Supabase magic link (email)
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
- Wildfire app modifications (FeedbackOverlay changes are feeedback_pipeline's responsibility)
- Analytics dashboard across multiple workshops
- AI-assisted synthesis of template responses
- Export (PDF / Excel) of workshop outputs
