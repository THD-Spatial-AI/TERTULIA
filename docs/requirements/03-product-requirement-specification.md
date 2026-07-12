# Product Requirement Specification

## Functional Requirements

### Session Management

| ID | Requirement |
|---|---|
| F-01 | System shall allow an authenticated facilitator to create a session with: title, workshop_tag, slides_url, wildfire_url |
| F-02 | System shall generate a unique URL slug and QR code for each session |
| F-03 | System shall allow a participant to join a session by entering name, role, and organization (no account required) |
| F-04 | System shall assign each participant a unique session_token (UUID v4) stored in browser localStorage |
| F-05 | System shall display a lobby screen to participants until the facilitator starts the session |
| F-06 | System shall show the facilitator a live list of all joined participants |
| F-07 | Facilitator shall be able to advance the session through phases: lobby → slides → template_1 → template_2 → template_3 → template_4 → launched |
| F-08 | Phase changes shall propagate to all participants in real-time (< 500ms) |

### Slides Phase

| ID | Requirement |
|---|---|
| F-09 | System shall embed an external slides URL in an iframe visible to all participants |
| F-10 | Facilitator shall control slide navigation (previous / next); current slide index shall sync to all participants in real-time |
| F-11 | Participants shall be able to react with: 🔥 ❤️ ❓ emoji and raise hand |
| F-12 | Facilitator shall see a live feed of participant reactions |

### Collaborative Templates

| ID | Requirement |
|---|---|
| F-13 | Facilitator shall unlock templates one at a time; participants cannot access a template before it is unlocked |
| F-14 | Facilitator shall see a completion counter for each template ("N of M completed") |
| F-15 | Facilitator shall be able to view any individual participant's template submission |
| F-16 | Template data shall autosave on field blur (no manual save required) |

### Persona Card (Template 1)

| ID | Requirement |
|---|---|
| F-17 | Persona Card shall collect: goals (textarea), pain_points (textarea), tech_comfort (1-5 scale) |
| F-18 | Display name, role, and org shall be pre-filled from the join form (read-only) |
| F-19 | Participant shall mark the card as "Done" to signal completion |

### User Flow (Template 2)

| ID | Requirement |
|---|---|
| F-20 | User Flow editor shall allow adding, editing (label + description), reordering, and deleting steps |
| F-21 | Steps shall be displayed with visual arrow connectors in sequence |
| F-22 | Maximum 10 steps per flow |

### Problem/Opportunity Board (Template 3)

| ID | Requirement |
|---|---|
| F-23 | Board shall allow creating sticky notes with free-text content |
| F-24 | Each note shall be togglable between "problem" (red) and "opportunity" (green) |
| F-25 | Notes shall be draggable to reorder within the participant's own board |
| F-26 | Facilitator view shall merge all participants' boards, grouped by type |

### Stakeholder Map (Template 4)

| ID | Requirement |
|---|---|
| F-27 | Map shall allow adding stakeholder nodes (name + role) |
| F-28 | Map shall allow drawing edges between nodes with a relationship label |
| F-29 | Facilitator view shall overlay all participants' maps |

### Wildfire Launch

| ID | Requirement |
|---|---|
| F-30 | Facilitator shall trigger a "Launch Wildfire" action from the control panel |
| F-31 | Before redirect, system shall POST each participant's persona to feeedback_pipeline `/api/v1/persona/pre-register` |
| F-32 | If feeedback_pipeline is unreachable, system shall log a warning and continue with redirect (non-blocking) |
| F-33 | Facilitator shall see a warning if pre-registration fails for any participant |
| F-34 | Each participant shall be redirected to the Wildfire URL with `?workshop_tag=...&session_token=...` query params |
| F-35 | All participants shall be redirected simultaneously (within 1s of facilitator action) |

### Internationalization

| ID | Requirement |
|---|---|
| F-36 | All UI strings shall be available in DE, EN, ES, GL |
| F-37 | Language selection shall be available from any screen; default is DE |
| F-38 | Language preference shall persist in localStorage across sessions |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NF-01 | Performance | Realtime sync latency < 500ms for all broadcast events |
| NF-02 | Performance | Frontend initial load < 3s on 10Mbps connection |
| NF-03 | Scalability | Support 50 simultaneous participants without degradation |
| NF-04 | Privacy | No participant email addresses stored |
| NF-05 | Privacy | No third-party analytics scripts |
| NF-06 | Accessibility | All interactive elements have keyboard navigation and ARIA labels |
| NF-07 | Responsiveness | All screens usable on tablet (768px viewport width minimum) |
| NF-08 | Reliability | Supabase Realtime disconnect triggers auto-reconnect within 5s |
| NF-09 | Security | Participants can only write to their own template records (Supabase RLS) |
| NF-10 | Security | Facilitators can only control sessions they created |
| NF-11 | Maintainability | Each feature folder is independently modifiable without touching others |
