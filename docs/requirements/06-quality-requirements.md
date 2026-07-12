# Quality Requirements

## Performance

| Requirement | Metric | Acceptance Criterion |
|---|---|---|
| Realtime sync | Latency | Phase/slide change visible on participant screen within 500ms |
| Join flow | Time to lobby | Participant enters name and reaches lobby within 2 seconds |
| Template autosave | Feedback | Autosave indicator clears within 1 second of field blur |
| Load time | Time to interactive | First contentful paint < 1.5s; interactive < 3s on 10Mbps |
| Concurrent users | Participants | 50 participants in one session without UI degradation |

## Usability

| Requirement | Acceptance Criterion |
|---|---|
| Join without instructions | A first-time participant can join a session in under 60 seconds with no prior training |
| Template clarity | Each template includes an inline description; no external documentation needed to complete it |
| Facilitator control discoverability | Facilitator can start, advance, and launch a session without reading a manual |
| Language switching | Language can be changed from any screen; all strings update instantly |
| Touch targets | All interactive elements ≥ 44×44px (Apple HIG minimum for touch) |
| Tablet layout | No horizontal scrolling at 768px viewport width |

## Security

| Requirement | Acceptance Criterion |
|---|---|
| Template isolation | Participant A cannot read or write Participant B's template data (enforced by Supabase RLS) |
| Session isolation | Realtime channels are scoped by session ID; cross-session broadcast is impossible |
| Facilitator ownership | A facilitator cannot control or view another facilitator's session |
| Token confidentiality | session_token never appears in Realtime broadcasts to other participants; never logged |
| No PII beyond display name | No email, phone, or government ID stored for participants |

## Reliability

| Requirement | Acceptance Criterion |
|---|---|
| Realtime reconnection | Supabase Realtime disconnect triggers auto-reconnect; banner shown to user within 2s of disconnect |
| Pipeline failure tolerance | feeedback_pipeline unreachable at launch does not block Wildfire redirect |
| Autosave durability | If browser refresh occurs mid-template, all previously autosaved fields are restored on reload |

## Maintainability

| Requirement | Acceptance Criterion |
|---|---|
| Feature isolation | Adding a 5th template requires changes only in the new feature folder + App.tsx route + i18n.ts keys |
| i18n completeness | TypeScript will error at build time if a key is missing in any of the 4 languages (typed i18n object) |
| Dependency clarity | No imports between feature folders (enforced by ESLint import rules) |
