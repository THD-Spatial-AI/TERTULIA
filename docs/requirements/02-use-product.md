# Use Product

## User Roles

### Facilitator
- Has a Supabase account (authenticated via magic link)
- Creates workshop sessions (title, workshop_tag, slides URL, Wildfire URL)
- Controls session flow from a dedicated control panel
- Sees all participants in real-time; monitors template completion
- Unlocks templates one at a time
- Triggers the Wildfire launch when all participants are ready

### Participant (Anonymous)
- Joins via URL or QR code
- Enters name, role, and organization — no account required
- Waits in lobby until facilitator starts the session
- Watches the slide presentation (with emoji/raise-hand reactions)
- Fills in templates as the facilitator unlocks them
- Is pushed to the Wildfire application when the facilitator triggers launch

---

## Use Cases

### UC-01 — Create Workshop Session
**Actor**: Facilitator
**Precondition**: Facilitator is authenticated
**Flow**:
1. Facilitator navigates to "New Session"
2. Enters: title, workshop_tag (e.g., `workshop-2026-munich`), Google Slides URL, Wildfire launch URL
3. Submits form
4. System generates session slug and QR code
5. Facilitator copies URL or displays QR code to participants
**Outcome**: Session created in `lobby` phase; shareable URL and QR available

---

### UC-02 — Join Workshop Session (Participant)
**Actor**: Participant
**Precondition**: Participant has session URL or QR code
**Flow**:
1. Participant opens session URL or scans QR code
2. Join screen: enter display name, role, organization
3. Submits → system creates participant record, stores session_token in localStorage
4. Participant lands in lobby screen ("Waiting for facilitator to start…")
**Outcome**: Participant visible in facilitator's participant list

---

### UC-03 — Run Presentation Phase
**Actor**: Facilitator (controls), Participants (watch)
**Precondition**: At least 1 participant in lobby
**Flow**:
1. Facilitator clicks "Start Presentation"
2. Session phase changes to `slides` — all participants see the slide iframe
3. Facilitator advances/retreats slides — index syncs to all participants in real-time
4. Participants react with emoji or raise hand — visible to facilitator in reaction feed
5. Facilitator clicks "Start Workshop" — phase transitions to `template_1`
**Outcome**: All participants briefed on context; phase moves to collaborative templates

---

### UC-04 — Fill Persona Card (Template 1)
**Actor**: Participant
**Precondition**: Session phase is `template_1`
**Flow**:
1. Participant sees Persona Card form (goals, pain points, tech comfort slider)
2. Fills fields; each field autosaves on blur
3. Clicks "Done" — `completed_at` set; completion counter in facilitator panel increments
**Outcome**: Persona card stored in Supabase; facilitator sees progress

---

### UC-05 — Fill User Flow (Template 2)
**Actor**: Participant
**Precondition**: Session phase is `template_2` (facilitator unlocked)
**Flow**:
1. Participant sees step editor with one default step
2. Adds steps (label + description), reorders via drag, deletes unwanted steps
3. Clicks "Done" — flow saved
**Outcome**: User flow steps stored as JSONB in Supabase

---

### UC-06 — Fill Problem/Opportunity Board (Template 3)
**Actor**: Participant
**Precondition**: Session phase is `template_3`
**Flow**:
1. Participant sees empty sticky-note grid
2. Adds notes, toggles each as "problem" (red) or "opportunity" (green)
3. Reorders notes within their own board
4. Clicks "Done"
**Outcome**: Notes stored as JSONB; facilitator sees merged view of all participants' boards

---

### UC-07 — Fill Stakeholder Map (Template 4)
**Actor**: Participant
**Precondition**: Session phase is `template_4`
**Flow**:
1. Participant sees an empty canvas with a node editor
2. Adds nodes (name + role of each stakeholder they coordinate with)
3. Draws edges between nodes (labels the relationship type)
4. Clicks "Done"
**Outcome**: Nodes and edges stored as JSONB

---

### UC-08 — Launch Wildfire
**Actor**: Facilitator
**Precondition**: Session phase is `template_4` (or facilitator chooses to skip remaining templates)
**Flow**:
1. Facilitator clicks "Launch Wildfire"
2. Backend fetches all participants + their persona cards
3. Backend POSTs each persona to feeedback_pipeline `/api/v1/persona/pre-register`
4. Backend broadcasts redirect URL (with per-participant session_token) to each participant via Realtime
5. All participant browsers navigate to Wildfire simultaneously
6. Session phase set to `launched`
**Outcome**: All participants in Wildfire with persona pre-registered; FeedbackOverlay skips PersonaForm
