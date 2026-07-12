# Quality Requirements

## Quality Tree

### Performance
| Scenario | Metric | Target |
|---|---|---|
| Realtime sync (slide index, phase change) | End-to-end latency | < 500ms |
| Participant join flow | Time to lobby screen | < 2s |
| Template autosave | Background save, non-blocking | < 1s |
| Simultaneous participants | Max without degradation | 50 |
| Wildfire launch broadcast | Time from facilitator click to all participants redirected | < 1s |
| Frontend initial load | Time to interactive (cold) | < 3s on 10Mbps |

### Availability
| Scenario | Target |
|---|---|
| Workshop day availability | 99.9% (Supabase SLA) |
| Recovery from Realtime disconnect | Auto-reconnect within 5s |
| Graceful degradation if feeedback_pipeline unreachable | Workshop continues; pre-registration skipped with warning |

### Usability
| Scenario | Target |
|---|---|
| Participant join (no prior instructions) | Complete within 60 seconds |
| Template completion (first time) | Intuitive without tutorial — each template has an inline guide |
| Language switch | Instant, no page reload |
| Tablet usability | All interactive elements ≥ 44px touch target; no horizontal scroll at 768px |

### Security & Privacy
| Scenario | Target |
|---|---|
| Participant data exposure | No email addresses stored; display name only |
| Cross-session data leakage | Realtime channels scoped by session ID; RLS enforces data isolation |
| Facilitator access control | Only session owner can control their session |
| session_token exposure | Never logged; never in Realtime broadcast to other participants |

### Maintainability
| Scenario | Target |
|---|---|
| New template added | Addable by one developer in < 1 day without touching other features |
| New language added | Addable by adding keys to `i18n.ts` — no component changes |
| Dependency update | No circular deps between feature folders; updates to one feature don't break others |

### Internationalization
| Scenario | Target |
|---|---|
| Language coverage | 100% string coverage in DE, EN, ES, GL before any feature ships |
| Right-to-left support | Not required (all 4 languages are LTR) |
| Date/time formatting | Use `Intl.DateTimeFormat` with locale from active language |
