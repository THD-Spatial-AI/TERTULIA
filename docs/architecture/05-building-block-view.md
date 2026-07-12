# Building Block View

## Level 1 — System Decomposition

```
Workshop Logic Platform
├── frontend/          React 19 SPA — participant and facilitator UI
└── backend/           FastAPI — session management, pipeline integration
```

External systems: Supabase, feeedback_pipeline, Storcito-Wildfire

---

## Level 2 — Frontend Features

```
frontend/src/
├── features/
│   ├── session-lobby/        Participant join screen + waiting room
│   ├── facilitator/          Session creation + control panel
│   ├── slides/               Iframe embed + Realtime slide sync
│   ├── persona-card/         Template 1 — who are you
│   ├── user-flow/            Template 2 — step editor
│   ├── problem-board/        Template 3 — sticky notes
│   ├── stakeholder-map/      Template 4 — node map
│   └── launch/               Push redirect + pre-registration trigger
├── components/               Shared UI primitives (Button, Card, Modal, Badge)
└── lib/
    ├── supabase.ts            Supabase browser client + typed channel helpers
    └── i18n.ts               Translation strings (DE/EN/ES/GL)
```

### session-lobby
- **Purpose**: Entry point for anonymous participants
- **Inputs**: Session slug from URL
- **Outputs**: Display name, role, org → POST to backend `/api/v1/participants/join`
- **Realtime**: Subscribes to `session:{id}:control` for phase change

### facilitator
- **Purpose**: Session creation, live participant list, phase/template control
- **Auth**: Supabase magic link (email)
- **Realtime**: Publishes to `session:{id}:control`; subscribes to `session:{id}:presence` and `session:{id}:reactions`
- **Key actions**: Create session, advance phase, unlock template, view completion counts, trigger launch

### slides
- **Purpose**: Embed external presentation + sync slide index
- **Inputs**: `slides_url` from session record
- **Facilitator**: Controls slide index → published to Realtime
- **Participant**: Receives slide index → renders iframe with slide param

### persona-card
- **Purpose**: Structured form — goals, pain points, tech comfort
- **Autosave**: On field blur → PATCH `/api/v1/templates/persona/{participant_id}`
- **Facilitator view**: Grid of all participant cards + completion counter

### user-flow
- **Purpose**: Linear step editor — participant maps their journey through Wildfire
- **UI**: Add step, edit label/description, reorder (drag), max 10 steps
- **Facilitator view**: All flows stacked vertically

### problem-board
- **Purpose**: Sticky-note grid — problems (red) and opportunities (green)
- **UI**: Add note, toggle type, drag to reorder within own board
- **Facilitator view**: All notes merged, grouped by type

### stakeholder-map
- **Purpose**: Freeform node map — stakeholders and their relationships
- **UI**: @xyflow/react node editor, add node (name + role), draw edge (relationship label)
- **Facilitator view**: All maps overlaid, node frequency highlighted

### launch
- **Purpose**: Trigger simultaneous Wildfire redirect for all participants
- **Flow**: POST to backend `/api/v1/launch/{session_id}` → backend pre-registers all personas → Realtime broadcasts redirect URL to all participants
- **Participant**: Receives redirect event → navigates to Wildfire URL with params

---

## Level 2 — Backend Routes

```
backend/
├── routes/
│   ├── sessions.py        POST /api/v1/sessions (create), GET /api/v1/sessions/{slug}
│   ├── participants.py    POST /api/v1/participants/join, GET /api/v1/participants/{session_id}
│   ├── templates.py       PUT /api/v1/templates/persona/{id}, user-flow, problem-board, stakeholder-map
│   └── launch.py          POST /api/v1/launch/{session_id}
├── supabase_client.py     Supabase Python admin client (service role key)
└── pipeline_integration.py   httpx calls to feeedback_pipeline
```

### launch.py — Critical Integration Path

```
POST /api/v1/launch/{session_id}
    ├── Fetch all participants for session from Supabase
    ├── Fetch persona_card for each participant
    ├── For each participant:
    │   └── POST feeedback_pipeline/api/v1/persona/pre-register
    │         { workshop_tag, session_token, name, role, org, tech_comfort, ... }
    ├── Construct Wildfire URL: {WILDFIRE_URL}?workshop_tag={tag}&session_token={token}
    ├── Publish to Supabase Realtime: session:{id}:control
    │     { type: "launch", wildfire_url: "..." }  (per participant, with their token)
    └── Update session.phase = "launched" in Supabase
```
