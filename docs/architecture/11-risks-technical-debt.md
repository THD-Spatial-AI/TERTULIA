# Risks & Technical Debt

## Risks

### R-01 — Google Slides Embedding Restriction
**Probability**: Medium | **Impact**: High

Google Slides embeds require the presentation to be set to "Anyone with the link can view." A facilitator who forgets this setting will see a blank iframe on all participant screens.

**Mitigation**: 
- Validate the slides URL during session creation — attempt to fetch headers and warn if embedding is likely blocked
- Document the required sharing setting clearly in the facilitator onboarding
- Long-term: build native slide hosting (v2 milestone)

---

### R-02 — feeedback_pipeline Unreachable at Launch
**Probability**: Low | **Impact**: Medium

If the feeedback_pipeline backend is down when the facilitator triggers "Launch Wildfire," persona pre-registration fails and participants arrive at Wildfire without their persona pre-filled — they will be shown the `PersonaForm` again.

**Mitigation**:
- Launch is non-blocking: backend logs the error, continues with redirect
- Facilitator sees a warning banner: "Persona pre-registration failed — participants will fill in their profile in Wildfire"
- Document the feeedback_pipeline health check command for workshop day setup

---

### R-03 — Supabase Realtime Latency Spike
**Probability**: Low | **Impact**: Medium

Under high participant load or poor network conditions, Supabase Realtime broadcast latency may exceed the 500ms target, causing slide sync to feel sluggish.

**Mitigation**:
- Supabase Realtime is designed for thousands of concurrent connections — 50 participants is well within limits
- Monitor with Supabase dashboard during workshop
- If persistent issue: implement optimistic local state (facilitator's slide advances instantly on their screen; broadcast is eventual)

---

### R-04 — Anonymous Session Token Loss
**Probability**: Low | **Impact**: Low

If a participant clears their browser storage or switches devices mid-workshop, their `session_token` is lost. They cannot reconnect to their in-progress template.

**Mitigation**:
- Display a "You're starting fresh" message if token not found — participant re-joins with same name
- All previously submitted template data remains in Supabase (linked to old participant record)
- Facilitator can see both records in the completion view

---

### R-05 — Persona Schema Drift Between Workshop and Pipeline
**Probability**: Medium | **Impact**: Medium

The workshop's `PersonaCard` schema and feeedback_pipeline's `PersonaData` Pydantic model may evolve independently, causing the pre-registration call to fail or lose fields.

**Mitigation**:
- Document the field mapping in `backend/pipeline_integration.py` with explicit comments
- Add a smoke test: pre-registration endpoint called with sample data as part of workshop setup checklist
- Pin feeedback_pipeline API version in the integration (include API version header)

---

## Technical Debt

### TD-01 — No End-to-End Tests at Launch
The v1 launch will have unit tests for individual components and manual smoke testing. A full Playwright end-to-end test suite (facilitator creates session → participant joins → completes templates → launch fires) is deferred.

**Plan**: Add E2E tests in Phase 6.

### TD-02 — Slide Sync via Index Only
The current slide sync broadcasts only an integer index. If the facilitator's iframe and participant's iframe render the same URL differently (e.g., due to Google account state), slide numbers may be off by one.

**Plan**: Investigate per-slide URL params (Google Slides supports `#slide=id.xxx`) as a more robust alternative.

### TD-03 — No Facilitator Session Recovery
If the facilitator's browser crashes mid-session, they can reload and see the session state in Supabase — but their Realtime channel subscription is lost and participants are stuck on the last phase. There is no "reclaim control" flow.

**Plan**: Add facilitator reconnect flow in v1.1 — detect facilitator absence and show "Waiting for facilitator to reconnect" to participants.

### TD-04 — Problem Board Has No Conflict Resolution
If two participants edit the same sticky note simultaneously (unlikely since each participant has their own board, but possible in future shared-board scenario), the last write wins.

**Plan**: Not relevant for v1 (each participant owns their own board). Revisit if shared editing is introduced.
