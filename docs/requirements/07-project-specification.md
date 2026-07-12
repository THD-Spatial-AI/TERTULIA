# Project Specification

## Team

| Role | Responsibility |
|---|---|
| THD Spatial AI Developer | Full-stack implementation (frontend + backend) |
| Workshop Facilitator | Product owner; defines template content and workflow; acceptance testing |

## Development Phases & Timeline

| Phase | Description | Target |
|---|---|---|
| Phase 0 — Foundation | Documentation, architecture, package specs | 2026-07 ✅ |
| Phase 1 — Core Infrastructure | Backend scaffold, Supabase setup, frontend scaffold, auth | 2026-07 → 2026-08 |
| Phase 2 — Session Lobby | Participant join, QR code, facilitator panel, Realtime presence | 2026-08 |
| Phase 3 — Presentation Phase | Slides iframe, sync, reactions | 2026-08 → 2026-09 |
| Phase 4 — Collaborative Templates | All 4 templates with facilitator monitoring | 2026-09 → 2026-10 |
| Phase 5 — Wildfire Launch | Pipeline integration, push redirect | 2026-10 |
| Phase 6 — Polish & Deploy | Tablet layout, i18n audit, E2E tests, production deploy | 2026-10 → 2026-11 |

## Constraints

- No external design agency or contractor — built entirely by THD Spatial AI team
- No paid UI component library (Radix UI is free/open source; TailwindCSS is free)
- Supabase free tier initially — upgrade to Pro (~$25/mo) if participant volume exceeds free tier limits
- Railway/Render free tier initially for FastAPI backend

## Repository

- Location: `C:\Users\user\Desktop\THD-SPATIAL-AI\Workshops\`
- Version control: Git (initialize on project start)
- Branch strategy: `main` (production), `develop` (integration), `feature/*` (feature branches)
- CI/CD: Vercel auto-deploys on push to `main`

## Definition of Done

A feature is done when:
1. All functional requirements for that feature are implemented
2. All 4 languages (DE/EN/ES/GL) are complete for new strings
3. Layout tested at 768px and 1280px viewport widths
4. Supabase RLS policy covers new tables
5. Feature is manually smoke-tested end-to-end (facilitator + participant flow)
