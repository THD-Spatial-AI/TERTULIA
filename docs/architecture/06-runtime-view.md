# Runtime View

## Scenario 1 — Participant Joins Session

```
Participant Browser          Workshop Frontend           FastAPI Backend         Supabase
       │                           │                           │                    │
       │── opens /session/{slug} ──►                           │                    │
       │                           │── GET /api/v1/sessions/  ►│                    │
       │                           │   {slug}                  │── SELECT sessions ►│
       │                           │                           │◄── session record ──│
       │                           │◄── session metadata ──────│                    │
       │◄── renders join form ─────│                           │                    │
       │                           │                           │                    │
       │── submits name/role/org ──►                           │                    │
       │                           │── POST /api/v1/          ►│                    │
       │                           │   participants/join       │── INSERT           ►│
       │                           │   {name,role,org,         │   participants      │
       │                           │    session_id}            │◄── participant+     │
       │                           │                           │    session_token ───│
       │                           │◄── {session_token} ───────│                    │
       │◄── stores token in        │                           │                    │
       │    localStorage, enters   │                           │                    │
       │    lobby screen ──────────│                           │                    │
       │                           │                           │                    │
       │── subscribes to ──────────────────────────────────────────────────────────►│
       │   session:{id}:control                                                      │
```

---

## Scenario 2 — Facilitator Advances Slide

```
Facilitator Browser         Workshop Frontend           Supabase Realtime
       │                           │                           │
       │── clicks Next Slide ──────►                           │
       │                           │── broadcast to ──────────►│
       │                           │   session:{id}:control    │
       │                           │   { type:"slide", index:3 }│
       │                           │                           │── pushes to all    │
       │                           │                           │   subscribers      │
Participant 1 Browser              │                           │
       │◄── receives { index:3 } ──────────────────────────────│
       │── updates iframe src ─────►                           │
       │   (slide param = 3)       │                           │
```

---

## Scenario 3 — Template Unlock & Autosave

```
Facilitator Browser         Workshop Frontend           FastAPI Backend         Supabase
       │                           │                           │                    │
       │── clicks "Unlock          │                           │                    │
       │   Persona Card" ──────────►                           │                    │
       │                           │── broadcast ─────────────────────────────────►│
       │                           │   {type:"phase",           │                   │
       │                           │    phase:"template_1"}     │                   │
       │                           │                            │                   │
Participant Browser                │                            │                   │
       │◄── receives phase change ──────────────────────────────────────────────────│
       │◄── renders PersonaCard ───│                            │                   │
       │    form                   │                            │                   │
       │                           │                            │                   │
       │── fills "Goals" field,    │                            │                   │
       │   blurs ──────────────────►                            │                   │
       │                           │── PUT /api/v1/templates/ ►│                   │
       │                           │   persona/{participant_id} │── UPSERT          │
       │                           │   {goals:"..."}            │   persona_cards ──►│
       │                           │                            │◄── ok ────────────│
       │                           │◄── 200 ok ────────────────│                   │
       │◄── autosave indicator     │                            │                   │
       │    clears ────────────────│                            │                   │
       │                           │                            │                   │
       │── completes form ─────────►                            │                   │
       │                           │── PUT (completed_at set) ─►│                   │
       │                           │                            │── UPDATE ─────────►│
       │                           │                            │── triggers        │
       │                           │                            │   presence update │
Facilitator Browser                │                            │                   │
       │◄── completion count       │                            │                   │
       │    increments (9/14) ─────────────────────────────────────────────────────│
```

---

## Scenario 4 — Wildfire Launch

```
Facilitator Browser         FastAPI Backend         feeedback_pipeline      Supabase Realtime
       │                           │                       │                      │
       │── clicks "Launch          │                       │                      │
       │   Wildfire" ──────────────►                       │                      │
       │                           │── SELECT all          │                      │
       │                           │   participants +      │                      │
       │                           │   persona_cards       │                      │
       │                           │                       │                      │
       │                           │── for each participant:                      │
       │                           │   POST /api/v1/       │                      │
       │                           │   persona/pre-register►                      │
       │                           │   {workshop_tag,      │                      │
       │                           │    session_token,...} │                      │
       │                           │                       │── stores persona     │
       │                           │◄── 200 ok ────────────│                      │
       │                           │                       │                      │
       │                           │── for each participant:                      │
       │                           │   broadcast to ───────────────────────────►  │
       │                           │   session:{id}:control│                      │
       │                           │   {type:"launch",     │                      │
       │                           │    url:"https://      │                      │
       │                           │    wildfire...?       │                      │
       │                           │    workshop_tag=...   │                      │
       │                           │    &session_token=..."│                      │
       │                           │                       │                      │
Participant Browser                │                       │                      │
       │◄── receives launch event ─────────────────────────────────────────────── │
       │── navigates to Wildfire   │                       │                      │
       │   URL with params ────────►                       │                      │
```
