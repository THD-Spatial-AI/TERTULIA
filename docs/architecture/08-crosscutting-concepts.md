# Crosscutting Concepts

## Authentication & Authorization

### Participants (Anonymous)
- No Supabase user account created
- Backend generates a `session_token` (UUID v4) on join
- Token stored in browser `localStorage`
- All subsequent template saves include `session_token` in request header
- Backend validates token against `participants` table before any write operation

### Facilitators
- Supabase Auth magic link (email-based, no password)
- JWT stored in Supabase session (browser localStorage via Supabase JS client)
- All facilitator API calls include `Authorization: Bearer {jwt}` header
- Backend validates JWT via Supabase service role client
- Session ownership enforced: facilitator can only control sessions they created

### Row Level Security (Supabase)

```sql
-- Participants can only read/write their own template rows
CREATE POLICY "participants_own_persona" ON persona_cards
  FOR ALL USING (
    participant_id IN (
      SELECT id FROM participants WHERE session_token = current_setting('app.session_token')
    )
  );

-- Sessions are readable by anyone with the slug (participants need to read session config)
CREATE POLICY "sessions_public_read" ON sessions
  FOR SELECT USING (true);

-- Sessions writable only by their facilitator
CREATE POLICY "sessions_facilitator_write" ON sessions
  FOR UPDATE USING (facilitator_id = auth.uid());
```

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
- Supabase Realtime disconnect: show "Reconnecting..." banner, auto-reconnect via Supabase client
- Session not found (invalid slug): 404 page with "Check the URL or QR code" message
- Phase mismatch (participant tries to access template not yet unlocked): show "Waiting for facilitator" screen

### Backend
- feeedback_pipeline unreachable at launch: log warning, continue with redirect (persona pre-registration is best-effort, not blocking)
- Supabase timeout: return 503, frontend retries with exponential backoff (max 3 retries)
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
