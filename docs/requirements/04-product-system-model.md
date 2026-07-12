# Product System Model

## Data Model

### sessions
```
id              uuid, primary key
slug            text, unique — URL-safe identifier (e.g., "wildfire-munich-2026")
facilitator_id  uuid — references auth.users(id)
title           text — display name for the session
workshop_tag    text — shared with feeedback_pipeline (e.g., "workshop-2026-munich")
slides_url      text — Google Slides or PDF iframe URL
wildfire_url    text — target Wildfire deployment URL
phase           enum: lobby | slides | template_1 | template_2 | template_3 | template_4 | launched
created_at      timestamptz
```

### participants
```
id              uuid, primary key
session_id      uuid — references sessions(id) ON DELETE CASCADE
display_name    text — entered on join
role            text — entered on join
org             text — entered on join (optional)
session_token   text, unique — server-generated UUID v4; bearer token for writes
joined_at       timestamptz
```

### persona_cards
```
id              uuid, primary key
participant_id  uuid — references participants(id) ON DELETE CASCADE
session_id      uuid — references sessions(id) ON DELETE CASCADE
goals           text
pain_points     text
tech_comfort    integer, 1-5
completed_at    timestamptz (null = in progress)
```

### user_flows
```
id              uuid, primary key
participant_id  uuid — references participants(id) ON DELETE CASCADE
session_id      uuid — references sessions(id) ON DELETE CASCADE
steps           jsonb — array of {id: string, label: string, description: string, order: number}
completed_at    timestamptz
```

### problem_boards
```
id              uuid, primary key
participant_id  uuid — references participants(id) ON DELETE CASCADE
session_id      uuid — references sessions(id) ON DELETE CASCADE
notes           jsonb — array of {id: string, text: string, type: "problem"|"opportunity", order: number}
completed_at    timestamptz
```

### stakeholder_maps
```
id              uuid, primary key
participant_id  uuid — references participants(id) ON DELETE CASCADE
session_id      uuid — references sessions(id) ON DELETE CASCADE
nodes           jsonb — array of {id: string, name: string, role: string, position: {x, y}}
edges           jsonb — array of {id: string, source: string, target: string, label: string}
completed_at    timestamptz
```

### reactions
```
id              uuid, primary key
participant_id  uuid — references participants(id) ON DELETE CASCADE
session_id      uuid — references sessions(id) ON DELETE CASCADE
type            enum: emoji_fire | emoji_heart | emoji_question | raise_hand
created_at      timestamptz
```

---

## State Machine — Session Phase

```
                    ┌─────────┐
              START │  lobby  │ participants join
                    └────┬────┘
                         │ facilitator clicks "Start Presentation"
                    ┌────▼────┐
                    │  slides │ real-time slide sync, reactions
                    └────┬────┘
                         │ facilitator clicks "Start Workshop"
                   ┌─────▼──────┐
                   │ template_1 │ Persona Card unlocked
                   └─────┬──────┘
                         │ facilitator clicks "Unlock User Flow"
                   ┌─────▼──────┐
                   │ template_2 │ User Flow unlocked
                   └─────┬──────┘
                         │ facilitator clicks "Unlock Problem Board"
                   ┌─────▼──────┐
                   │ template_3 │ Problem/Opportunity Board unlocked
                   └─────┬──────┘
                         │ facilitator clicks "Unlock Stakeholder Map"
                   ┌─────▼──────┐
                   │ template_4 │ Stakeholder Map unlocked
                   └─────┬──────┘
                         │ facilitator clicks "Launch Wildfire"
                   ┌─────▼──────┐
                   │  launched  │ all participants redirected to Wildfire
                   └────────────┘
```

Note: Facilitator may skip templates (go directly from any template phase to launch). Phase is always forward-only (no going back).

---

## Integration Data Flow

```
Workshop Platform                  feeedback_pipeline
        │                                  │
        │  POST /api/v1/persona/            │
        │  pre-register                     │
        │  {                                │
        │    workshop_tag: "wk-2026-mu",    │
        │    session_token: "uuid",         │
        │    name: "Maria García",          │
        │    role: "Forest Engineer",       │
        │    org: "University of Vigo",     │
        │    tech_comfort: 3,              │
        │    familiarity: "first_time",     │
        │    experience: 2                  │
        │  }                                │
        │──────────────────────────────────►│
        │                                   │── stores in PersonaData table
        │◄── 200 {"status": "registered"} ──│   keyed by (workshop_tag, session_token)
        │                                   │
        │  Wildfire URL constructed:        │
        │  https://wildfire.thd-...de/      │
        │  app/map?workshop_tag=wk-2026-mu  │
        │  &session_token=uuid              │
        │                                   │
        │  Realtime broadcast:              │
        │  session:{id}:control             │
        │  { type: "launch",                │
        │    url: "https://wildfire..." }   │
        │                                   │
Participant Browser                         │
        │◄─ navigates to Wildfire URL ──────│
        │                                   │
        │  Wildfire FeedbackOverlay:        │
        │  reads ?session_token=uuid ────────────────────────────────►│
        │                                    GET /api/v1/persona/      │
        │                                    lookup?session_token=uuid │
        │◄─ persona found → skip PersonaForm ──────────────────────── │
```
