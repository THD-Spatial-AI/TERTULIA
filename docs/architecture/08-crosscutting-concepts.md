# Crosscutting Concepts

## Authentication & Authorization

### Participants (Anonymous)
- No user account created (no Keycloak identity)
- Backend generates a `session_token` (UUID v4) on join
- Token stored in browser `localStorage`
- All subsequent template saves include `session_token` in request header
- Backend validates token against `participants` table before any write operation

### Facilitators
- Authenticate via Keycloak (OpenID Connect), brokered by the Go auth-service
- The auth-service issues a session; facilitator API calls are authorised against it
- Backend validates the caller with `require_facilitator` (`backend/auth.py`)
- Session ownership enforced: a facilitator can only control sessions they created

### Access Control (application-level)

Access is enforced in the FastAPI backend, not in the database (there is no
Postgres RLS). Every query is scoped by the authenticated identity:

- **Participant writes** — the `session_token` in the request is validated against
  the `participants` table; a participant can only read/write their own template rows.
- **Facilitator actions** — session rows are filtered by `facilitator_id`, so a
  facilitator can only read/update sessions they own (e.g.
  `SELECT * FROM sessions WHERE id = $1 AND facilitator_id = $2`).
- **Public session read** — anonymous participants may read the non-sensitive
  session config by slug (see `SessionPublic` in `backend/models.py`).

## Internationalization (i18n)

- All visible strings live in `frontend/src/lib/i18n.ts` as a typed object
- 4 languages: DE (default), EN, ES, GL
- Language preference stored in `localStorage` as `workshop_lang`
- Custom `useTranslation()` hook — returns `t(key)` function
- Key naming: `snake_case`, namespaced by feature (e.g., `persona_card.goals_label`)
- Rule: All 4 languages must be complete before merging a feature

### i18n Object Structure

```typescript
const translations = {
  de: {
    common: { loading: "Laden...", error: "Fehler", save: "Speichern" },
    session_lobby: { title: "Workshop beitreten", name_label: "Ihr Name", ... },
    persona_card: { goals_label: "Ihre Ziele", pain_points_label: "Schmerzpunkte", ... },
    // ...
  },
  en: { /* same keys */ },
  es: { /* same keys */ },
  gl: { /* same keys */ },
}
```

## Error Handling

### Frontend
- Network errors on template autosave: show persistent "unsaved" indicator, retry on reconnect
- WebSocket disconnect: show "Reconnecting..." banner, auto-reconnect via the workshop channel client
- Session not found (invalid slug): 404 page with "Check the URL or QR code" message
- Phase mismatch (participant tries to access template not yet unlocked): show "Waiting for facilitator" screen

### Backend
- feeedback_pipeline unreachable at launch: log warning, continue with redirect (persona pre-registration is best-effort, not blocking)
- Database timeout: return 503, frontend retries with exponential backoff (max 3 retries)
- Invalid session_token on template write: return 401

## Realtime Channel Management

- Frontend subscribes to channels on mount, unsubscribes on unmount (React `useEffect` cleanup)
- Facilitator creates channels; participants subscribe only (no publish rights on `control`)
- Reactions channel: participants publish, facilitator subscribes (facilitator-only view)
- Channel names include session ID to prevent cross-session contamination

## Privacy & Data Minimization

- No email addresses stored for participants
- No persistent user accounts for participants
- Participant `display_name` is the only PII stored (optionally pseudonymous)
- Session data can be deleted by facilitator after workshop
- No analytics tracking, no third-party scripts

## Logging

- Backend: structured JSON logs via Python `logging` module
  - Log level: INFO in production, DEBUG in development
  - Include: request ID, session_id, route, status code, duration_ms
  - Never log `session_token` values (treat as secrets)
- Frontend: no production logging; development-only `console.debug` behind `import.meta.env.DEV` guard

## Performance Targets

| Metric | Target |
|---|---|
| Realtime phase/slide sync | < 500ms end-to-end |
| Join flow (name → lobby) | < 2s |
| Template autosave | < 1s (background, non-blocking UI) |
| Simultaneous participants | 50+ without degradation |
| Wildfire launch broadcast | All participants redirected within 1s of facilitator click |
