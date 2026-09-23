# Risk Specification

## Risk Matrix

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Google Slides embedding blocked | Medium | High | Validate URL at session creation; document sharing settings; v2 native slides |
| R-02 | feeedback_pipeline unreachable at launch | Low | Medium | Non-blocking pre-registration; facilitator warning; redirect continues |
| R-03 | WebSocket broadcast latency spike | Low | Medium | Monitor on workshop day; optimistic local state for slide index |
| R-04 | Participant loses session_token | Low | Low | Re-join allowed; previous data remains in PostgreSQL |
| R-05 | Persona schema drift with pipeline | Medium | Medium | Explicit field mapping in code; smoke test in setup checklist |
| R-06 | Database/host outage on workshop day | Very Low | Critical | Self-hosted: keep a warm DB backup and a spare host; restore from `backend/db/schema.sql` + a volume snapshot |
| R-07 | Poor internet on workshop day (in-person) | Medium | High | Test network before workshop; advise organizers on minimum bandwidth |
| R-08 | Participant on unsupported browser | Low | Low | Show browser compatibility notice on join screen |

## Risk Detail

### R-07 — Poor Internet On Workshop Day
This is the highest practical risk for in-person sessions. The real-time WebSocket connection requires a stable internet connection from all participants.

**Recommended mitigations for workshop organizers**:
- Test network speed before the session: minimum 5Mbps per participant recommended
- Prefer wired connection (Ethernet) for the facilitator's machine
- Have a mobile hotspot as fallback
- Run a 5-minute "connectivity check" at the start of the session (all participants open the URL before slides begin)

---

### R-05 — Persona Schema Drift
The workshop platform's `PersonaCard` schema (`backend/models.py`) and the pipeline's `PersonaData` / `PreRegisteredPersona` models (`pipeline/backend/models.py`) are maintained as separate modules (now co-located in this repo). If the pipeline adds required fields, the pre-registration call may fail silently.

**Tracking**: Add a comment block in `backend/pipeline_integration.py` listing all mapped fields and the expected pipeline API version. Run a pre-workshop smoke test.
