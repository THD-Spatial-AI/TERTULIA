# Constraints

## Technical Constraints

| Constraint | Reason |
|---|---|
| React 19 + TypeScript frontend | Matches Storcito-Wildfire stack for consistency across THD Spatial AI projects |
| FastAPI (Python 3.11+) backend | Same language as feeedback_pipeline; reduces context switching for developers |
| Supabase for database and auth | Managed hosting requirement; Realtime subscriptions replace custom WebSocket server |
| Vercel for frontend deployment | Zero-config deployment; pairs natively with Supabase |
| No code reuse from TEMPO or OpenTech-DB | Workshop platform is fully standalone; avoids coupling to unrelated energy modelling projects |
| Persona card built fresh in this repo | Not imported from feeedback_pipeline; the workshop owns its own persona schema |
| TailwindCSS v4 | Consistent with Wildfire frontend styling approach |

## Organizational Constraints

| Constraint | Reason |
|---|---|
| Must work in-person and online | Workshops are held both on-site and remotely |
| No registration for participants | Domain experts (firefighters, mayors) should not need to create accounts |
| Facilitator accounts via magic link only | Low-overhead auth for small facilitator team |
| Languages: DE / EN / ES / GL | Matches feeedback_pipeline i18n scope; same stakeholder audience |
| Desktop + tablet target | Primary device profile for workshop participants |

## Integration Constraints

| Constraint | Reason |
|---|---|
| Must integrate with feeedback_pipeline at `POST /api/v1/persona/pre-register` | Persona data must reach pipeline before Wildfire redirect |
| workshop_tag must be consistent | Same tag used in workshop session, pipeline pre-registration, and Wildfire URL params |
| session_token must be passed to Wildfire | Wildfire's FeedbackOverlay uses it to look up the pre-registered persona |
| Wildfire URL receives query params | `?workshop_tag=...&session_token=...` — read by existing FeedbackOverlay logic |

## Conventions

| Convention | Value |
|---|---|
| Folder structure | Feature-first: `features/<name>/` with self-contained components, hooks, types |
| i18n keys | `snake_case`, namespaced by feature (e.g., `persona_card.goals_label`) |
| Supabase Realtime channels | `session:{id}:control`, `session:{id}:presence`, `session:{id}:reactions` |
| API base path | `/api/v1/` |
| Environment variables (frontend) | `VITE_` prefix |
| Environment variables (backend) | `SUPABASE_`, `PIPELINE_`, `APP_` prefixes |
