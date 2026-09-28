# Tertulia — Aesthetic Overhaul Plan

Date: 2026-09-28
Scope: `frontend/` only. No backend or API changes except where a step says so explicitly.

## 1. Diagnosis: why it reads as "AI-generated"

The current UI is a default shadcn/tweakcn theme (see `css.md`) wrapped around generic SaaS patterns. None of it says *tertulia*.

| Tell | Where |
|---|---|
| Stock theme tokens: Outfit + `#d87943` orange + `#527575` teal, straight from a tweakcn preset | `src/index.css`, `css.md` |
| Purple blur blob + 48px grid-line overlay on a dark hero | `session-lobby/SessionLobby.tsx:59-77` |
| "Live session" pill with pulsing dot | `SessionLobby.tsx:82-85` |
| Feature list with unicode glyph bullets (`◈ ⟶ ◉`) | `SessionLobby.tsx:95-107` |
| 3-up stat cards above a list (total / active / launched) | `facilitator/FacilitatorDashboard.tsx:114-128` |
| `text-xs uppercase tracking-widest` micro-labels (28 occurrences) | across features |
| Every surface is `rounded-xl border shadow-sm` on `surface-faint` | `components/ui/Card.tsx` and inline copies |
| Waiting screens = centered circle + check icon (+ `animate-ping` in the lobby) | `ParticipantLobby.tsx`, `CompletedScreen.tsx` |
| Emoji as iconography (tools, reactions, template picker, launch) | `PersonaCard.tsx:88-95`, `CreateSession.tsx:85`, `LaunchScreen.tsx:17` |
| Generic hexagon logo mark in an orange square | `layout/NavBar.tsx:42-58` |
| Merriweather loaded, never used; Google Fonts CDN in a "no third-party" product | `index.css:1` |

Measured problems (not taste):

- **Primary button contrast fails AA.** White on `brand-600` (≈ `#d87943`) ≈ 3.1:1; needs 4.5:1 at 14px.
- **`ink-subtle` (oklch 0.65) on white ≈ 3.3:1** and is used for small text that people need to read (dates, field hints, the privacy note).
- Hard-coded English in an i18n app: `FacilitatorLogin.tsx` (subtitle, labels, error fallback, submit; the title is translated), `CompletedScreen.tsx`, `WorkshopProgress.tsx` (`STEP_LABELS`), `NotFound.tsx:13`.

## 2. Design direction: "Paper, ink and clay"

A tertulia is a table of people talking, not a dashboard. Visual language borrows from print and the café table, not SaaS.

- **Surfaces:** warm paper (oklch ~0.975 0.008 80), not pure white. One raised surface level only. Borders, not shadows, separate things; shadow is reserved for things that float (popovers, dragged nodes, toasts).
- **Ink:** a warm near-black (oklch ~0.20 0.01 60) for text; muted ink must pass 4.5:1 on paper.
- **Accent:** keep the terracotta family for brand continuity but move the *fill* color to a deeper clay (oklch ~0.52 0.13 40) so white text passes AA. Use accent sparingly: primary action, current step, focus. Drop the separate "fire" ramp; use accent + a semantic danger.
- **Secondary:** the teal becomes a quiet olive-slate for data (stakeholder rings, chart series), never for chrome.
- **Type:**
  - Display: **Instrument Serif** (headings, session titles, big numbers). Gives the editorial, conversational voice.
  - UI/body: **Geist** (replaces Outfit).
  - Mono: **Geist Mono** (session slugs, tags) — replaces JetBrains Mono.
  - Self-host all three via `@fontsource-variable/*` (matches the self-hosted promise, removes the CDN).
- **Shape:** radius drops to 6px for controls, 10px for panels. No `rounded-2xl` everywhere.
- **Signature element: the dossier.** The workshop exists to produce one thing: a participant's persona and artifacts, handed off to the feedback pipeline at launch (see README, "persona handoff"). Make that tangible. Each finished activity (persona card, stakeholder map, user flow, problem board) becomes a paper card that stacks, slightly offset, into the participant's dossier, visible in the participant shell. At launch the stack is visibly handed over. This comes from how Tertulia actually works, so it can't be mistaken for a template. Everything else stays quiet.
- **The ring stays literal, and stays in one place:** only in the stakeholder map, where it means something (closeness to the problem). We do not add an avatar ring to the lobby, because it would suggest live presence the backend cannot report yet (see Phase 4.2).
- **Iconography:** `lucide-react` (already installed) at 1.5 stroke. No emoji in chrome. Reactions keep emoji *content* only in the floating reaction bubbles, where they are the message.
- **Motion:** CSS only, no GSAP. 150–250 ms, `transform`/`opacity` only, `ease-out` custom curve. Motion marks *state change* (someone joined, step advanced, reaction arrived), never decoration. All loops stop under `prefers-reduced-motion`.

### What we deliberately do not take from the gpt-taste skill

That skill targets marketing landing pages. Tertulia is a working tool used live in a room. Not applicable: AIDA page structure, GSAP scroll pinning/scrubbing, picsum stock imagery, `py-32` section spacing, bento grids. Applicable and adopted: no Inter/Outfit defaults, banned meta-labels, wide headings that do not wrap into walls, strict button contrast, hover feedback on everything clickable.

## 3. Step-by-step plan

Each phase ends in a working app, reviewed before the next begins. Phases 1 → 2 → 3 are strictly sequential. Phases 4, 5 and 6 each depend on 1–3 (`Field`, `Panel`, `Status`, `ConfirmButton`, shells). Once 3 lands they can run in parallel only where they touch different files; `ui/*` changes found during 4–6 go back through a Phase-2-style review.

### Phase 0 — Baseline (0.5 day)

1. Run the stack (`docker compose -f docker-compose.dev.yml up`) and capture these 16 screens at 1440×900 and 390×844. Facilitator (6): login, dashboard empty, dashboard populated, create session, panel, settings. Participant (9): join, lobby, slides, persona, user-flow, problem-board, stakeholder-map, launching, an activity's completed state. Plus the 404 page.
2. Store in `docs/assets/redesign/before/`. These are the comparison set for every later review.

**Done when:** all 16 screens captured at both widths.

### Phase 1 — Tokens and fonts (1 day)

Files: `src/index.css`, `package.json`, `index.html`, delete `css.md` (or move to `docs/` as history).

1. Add `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `@fontsource/instrument-serif` (all SIL OFL; confirm the exact package names and weights on npm, and note the licences in `ATTRIBUTIONS.md`). Remove the Google Fonts `@import`. Add `--font-display`. Use `font-display: swap`, preload the Geist woff2 files, and set fallback metrics (`size-adjust`) so text doesn't shift when the fonts load.
2. Rewrite `@theme`: `paper`, `paper-raised`, `ink`, `ink-muted`, `ink-faint` (decorative only, never text), `line`, `line-strong`, `clay-50…900`, `slate-*` (data), `danger`, `success`, `warning`. Keep old names as aliases for one phase so nothing breaks, then remove in Phase 7.
3. Type scale as tokens: `text-display` (clamp 2.25–3.5rem, serif), `text-title` (1.5rem serif), `text-heading` (1.0625rem Geist 600), `text-body` (0.9375rem), `text-meta` (0.8125rem). Set `text-wrap: balance` on h1–h3 in base layer.
4. Radii and shadows reduced to: `radius-control` 6px, `radius-panel` 10px, `shadow-float` only.
5. Add `<meta name="theme-color">`. Set `<html lang>` from i18n on first load and on every language change. Today the language state lives locally in `NavBar`, so move it into a subscribable hook in `lib/i18n.ts`.
6. Contrast-check every pair: text on every surface, text on translucent overlays, semantic colours, hover and disabled states (disabled text is exempt from AA but must still be legible), and the focus ring against every surface (≥ 3:1). Record the table in this doc.

**Done when:** app builds, fonts load offline, every text token pair ≥ 4.5:1 (≥ 3:1 for ≥ 18px), no request to fonts.googleapis.com.

### Phase 2 — Primitives (1–1.5 days)

Files: `src/components/ui/*`.

1. **Button:** variants reduced to `primary` (clay fill), `secondary` (ink outline), `ghost`, `danger`. Replace `transition-all` with `transition-[background-color,border-color,color,transform]`. Press state `active:translate-y-px`. Use lucide `Loader2` for the spinner.
2. **Input / Textarea:** single shared field style exported as a class constant; replace `focus:outline-none` with `focus-visible:` ring; 40px height; `hover:border-line-strong`. Remove the inline copies in `PersonaCard`, `StakeholderMap`, `ChipPalette`, `CanvasChipPalette`, `SectionCard`, `ChipNode`, `LabelEdge`.
3. **New `Field`** (label + control + hint + inline error, wires `aria-describedby`, `aria-invalid`).
4. **Card → `Panel`:** border only, no shadow, `radius-panel`. Header uses `text-heading`, not uppercase micro-labels.
5. **Badge → `Status`:** dot + text, no pill fill, for session phase.
6. **New `EmptyState`, `Spinner`, `ConfirmButton`** (two-step inline confirm, replaces hand-rolled delete logic in Dashboard and Panel, uses danger tokens instead of raw `red-*`).
7. **New `Avatar`** (initials on a neutral fill, no per-name colours) and **`DossierCard`** (the offset paper card used for the dossier stack).

**Done when:** a `/dev/kitchen-sink` route (dev-only) renders every primitive in every state; web-design-guidelines review of `components/ui` passes clean; you can reach every primitive by keyboard; a screen reader announces `Field` errors.

### Phase 3 — App shell and wayfinding (1 day)

Files: `layout/NavBar.tsx`, `layout/PageWrapper.tsx`, `ui/WorkshopProgress.tsx`, `ui/BroadcastBanner.tsx`, new `public/favicon.svg`.

1. New wordmark: "tertulia" set in Instrument Serif italic, lowercase, no box/hexagon. Matching favicon: two offset paper cards (the dossier).
2. Split shells: `FacilitatorShell` (wordmark, Dashboard/Settings nav, primary action, account menu with sign-out) and `ParticipantShell` (wordmark, session title, participant name, language, and the dossier stack from section 2: a small offset pile of finished-activity cards, empty at the start). Language switcher becomes a compact Radix dropdown (`@radix-ui/react-dropdown-menu` already installed) instead of four segmented buttons.
3. `WorkshopProgress` becomes a named stepper: step names visible on desktop, "Step 3 of 7 · Persona" on mobile; labels via i18n; current step in clay, done steps in ink, future steps in `ink-faint`.
4. `BroadcastBanner`: facilitator messages styled as a note pinned to the table (paper-raised, clay left rule, serif quote); keep existing `aria-live`, drop `role="alert"` (too assertive for broadcasts).
5. Add skip link to main content.

**Done when:** every route uses one of the two shells; no hard-coded English in shell components.

### Phase 4 — Participant journey (1.5–2 days)

Order follows what a participant sees.

1. **Join (`SessionLobby.tsx`):** remove grid overlay, purple blob, pulse pill, glyph list. Layout: session title in large serif across the top, one line of what will happen, then the three-field form. On desktop, form sits right of a quiet column listing the workshop's steps as a plain numbered sentence list. Slug shown once, small mono. Form uses `Field`, correct `autocomplete`, `spellcheck={false}` where relevant, placeholders end with `…`.
2. **Lobby (`ParticipantLobby.tsx`):** replace the ping/check circle. The participant sees their own name card, the first (still empty) card of their dossier, and one sentence about what happens next. **Presence is out of scope for now:** `useWorkshopChannel` only handles phase, launch, broadcast and reaction messages, and has no roster or join/leave event. A "who's here" list needs a backend design first: initial roster fetch, join/leave broadcasts, reconnect and staleness rules, and privacy (participants join anonymously). File that as a separate issue. When it ships, show it as an accessible list with explicit joined/connected state, not as a decorative ring.
3. **Slides (`SlidesView.tsx`):** reaction bar becomes a floating dock at the bottom centre over the slide, lucide icons (Flame, Heart, HelpCircle, Hand) with labels on hover/focus; emoji remain only inside the floating bubbles. iframe gets a paper frame so it doesn't look pasted in.
4. **Completed / Launch:** when an activity finishes, its card animates onto the dossier stack, followed by one serif sentence ("Your persona is on the table."). No check-circle. On launch, the dossier is handed over (the stack slides out, followed by the target app name), replacing the 🔥. Under reduced motion this becomes a crossfade.

**Done when:** the join-to-launch flow reviewed at both widths against Phase 0 screenshots; reduced-motion verified.

### Phase 5 — Workshop canvases (2–3 days)

Files: `persona-card/*`, `user-flow/*`, `problem-board/*`, `stakeholder-map/*`.

1. **Shared canvas chrome:** one `CanvasLayout` — header (activity name in serif, one-sentence instruction, submit action), left palette, canvas. Replaces four divergent layouts.
2. **Palette chips** (`ChipPalette`, `CanvasChipPalette`): one `Chip` component — paper card, 1px line, drag handle affordance, lift with `shadow-float` only while dragging.
3. **React Flow nodes/edges:** `StartNode`/`EndNode` drop `emerald-*` for ink/clay; edge labels use the shared field style; consistent 6px radius. Handles stay **always visible** (touch has no hover), just quieter at rest and emphasised on hover/focus/selection. Style through React Flow's CSS variables (`--xy-*`) and `className`s, not by overriding internals. Keep selection, drag, zoom/pan and z-layering working. Check node and edge contrast against the new paper background. Verify drag on touch and keyboard node selection.
4. **PersonaCard:** turn the form into something that reads like an index card being filled in — serif name/role at top, sections separated by rules not boxes; replace emoji tool glyphs with lucide icons or plain text labels; the custom slider keeps its mechanics but uses tokens.
5. **StakeholderMap:** rings use the slate data ramp with hairline strokes and serif ring labels. This is the only place in the app that uses a ring.
6. **ProblemBoard `SectionCard`:** drop `border-2`; section identity via a small coloured index rule, not full coloured borders.

**Done when:** all four activities share chrome and primitives; no raw Tailwind palette colours (`red-*`, `emerald-*`, `violet-*`, `amber-*`, `slate-*`) remain in `features/`.

### Phase 6 — Facilitator surfaces (2 days)

1. **Login:** paper background (not dark), wordmark, serif "Welcome back to the table", i18n all strings, inline error via `Field`.
2. **Dashboard:** remove the 3 stat cards and organise by what the facilitator needs to do next: **Live now** first (big, one per row, with a "Resume" primary action and the current phase), then **Not started** (lobby phase), then **Finished** (launched, collapsed by default). Dates via `Intl.DateTimeFormat` with the app locale, and shown only where they help pick a session. Search gets an accessible name. `ConfirmButton` for delete. Empty state uses `EmptyState` with a single CTA.
3. **CreateSession:** template picker replaces 🌲 and `amber/violet/slate` tiles with token-based option cards; remove unjustified `autoFocus` or justify it (first field of a dedicated create page is acceptable — keep and note).
4. **FacilitatorPanel (837 lines):** split into `PanelHeader`, `PhaseControl`, `Roster` (the existing participant list, restyled; no ring), `ReactionFeed`, `QrShare`. The phase control is the hero: a large horizontal stepper with a single "Advance to …" primary button. Replace `✓` glyph and `red-*`/`green-*` classes with tokens and lucide.
5. **Settings:** plain form on `Panel`s with `Field`.

**Done when:** facilitator can run a full session with no visual regressions; `FacilitatorPanel.tsx` under ~300 lines.

### Phase 7 — Motion, polish, cleanup (1 day)

1. Define `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` and 3 durations as tokens; audit every `transition-*` and `animate-*`.
2. Dossier card landing, step advance, reaction bubble — the only three orchestrated motions.
3. Remove legacy token aliases from Phase 1; delete unused `fire-*`, `teal-*`, Merriweather.
4. Final i18n sweep (DE/ES/GL copy for every new string).
5. After screenshots into `docs/assets/redesign/after/`.

## 4. Review gates (every phase)

1. `npm run type-check && npm run lint && npm run test` in `frontend/`.
2. `/web-design-guidelines` on the files touched in the phase; zero new findings. Plus a manual keyboard-only pass, a touch pass at 390px, and a screen-reader spot check (NVDA) on the changed screens.
3. Contrast check on any new colour pair.
4. `codex` review of the phase diff (the user commits; review runs on the working tree).
5. Before/after screenshots at 1440 and 390 attached to the phase summary.

## 5. Review log

- 2026-09-28 — Codex review of this plan. Accepted: corrected line references and phase dependencies; lobby presence removed from scope (no roster event exists); React Flow handles kept always visible; contrast and a11y checks broadened; font licensing and `lang` sync steps added. Design pushback accepted: the generic avatar ring is replaced by the dossier motif, which comes from Tertulia's persona handoff, and the dashboard is organised around the facilitator's next task instead of being a ledger.

## 6. Appendix — web-design-guidelines findings on current code

```
## src/components/ui/Button.tsx
Button.tsx:41 - transition-all → list properties
Button.tsx:21 - brand variant: white on brand-600 ≈ 3.1:1, fails AA

## src/components/ui/Input.tsx, Textarea.tsx
Input.tsx:18 - focus:outline-none + focus:ring → use focus-visible
Textarea.tsx:18 - same

## src/components/ui/WorkshopProgress.tsx
WorkshopProgress.tsx:14 - STEP_LABELS hard-coded English
WorkshopProgress.tsx:28 - transition-all → transition-colors
WorkshopProgress.tsx:24 - progress lacks role="progressbar"/aria-valuenow

## src/components/ui/CompletedScreen.tsx
CompletedScreen.tsx:35,40 - hard-coded English strings

## src/components/layout/NavBar.tsx
NavBar.tsx:120 - avatar div uses title only; not accessible to AT
NavBar.tsx:104 - aria-label "Switch to EN" not localised

## src/components/layout/NotFound.tsx
NotFound.tsx:13 - "Page not found" hard-coded

## index.html / index.css
index.html:2 - lang="de" static; should follow selected language
index.html - missing <meta name="theme-color">
index.css:1 - fonts from Google CDN; self-host (privacy + preload)
index.css:66 - ink-subtle ≈ 3.3:1 on white, used for body text

## src/features/facilitator/FacilitatorLogin.tsx
FacilitatorLogin.tsx:32,49,54,66,86 - hard-coded English
FacilitatorLogin.tsx:32 - "Login failed." lacks next step
FacilitatorLogin.tsx:57 - email input: add spellCheck={false}

## src/features/facilitator/FacilitatorDashboard.tsx
FacilitatorDashboard.tsx:37 - toLocaleDateString(undefined) → Intl.DateTimeFormat with app locale
FacilitatorDashboard.tsx:125 - stat values need tabular-nums
FacilitatorDashboard.tsx:192 - raw red-* palette → danger tokens
FacilitatorDashboard.tsx:155 - search input has placeholder only; add aria-label

## src/features/facilitator/FacilitatorPanel.tsx
FacilitatorPanel.tsx:517 - transition-all → transition-[width]
FacilitatorPanel.tsx:618 - toLocaleDateString() hard-coded locale
FacilitatorPanel.tsx:709 - "✓" glyph with title only → icon + sr-only text
FacilitatorPanel.tsx:722 - raw red-* palette

## src/features/facilitator/CreateSession.tsx
CreateSession.tsx:85 - emoji as icon
CreateSession.tsx:346 - autoFocus (acceptable on dedicated create page; document)
CreateSession.tsx:469-471 - raw amber/violet/slate palette

## src/features/session-lobby/SessionLobby.tsx
SessionLobby.tsx:84 - "Live session" hard-coded; animate-pulse decorative
SessionLobby.tsx:97-99 - unicode glyphs as icons

## src/features/slides/SlidesView.tsx
SlidesView.tsx:17 - REACTIONS built at module load with t(); labels won't update on language change
SlidesView.tsx:46 - fetch error swallowed; no error state

## src/features/persona-card/PersonaCard.tsx
PersonaCard.tsx:88-95 - emoji as tool icons
PersonaCard.tsx:123,196,428 - focus:outline-none → focus-visible
PersonaCard.tsx:157,168,480,527 - transition-all

## src/features/problem-board/SectionCard.tsx
SectionCard.tsx:60 - transition-all
SectionCard.tsx:118 - focus:outline-none → focus-visible

## src/features/stakeholder-map/*
StakeholderNode.tsx:89,96 - inputs without label; placeholders "Name"/"Role" not localised, missing …
StakeholderMap.tsx:298,319,439 - focus:outline-none → focus-visible
RelationshipEdge.tsx:109 - transition-all

## src/features/user-flow/*
StartNode.tsx:8,13 - raw emerald-* palette
ChipNode.tsx:62, LabelEdge.tsx:56, ChipPalette.tsx:200 - focus:outline-none → focus-visible
LabelEdge.tsx:55 - placeholder "label…" not localised
```

## 7. Estimate

About 10–12 working days for one engineer. Phases 1–3 (≈3.5 days) alone remove most of the "AI look", because tokens, type and shell touch every screen.

## 8. Implementation status (2026-09-28)

All phases (1–7) implemented in the working tree; not committed. `tsc` and `vite build` pass. After-screenshots: `docs/assets/redesign/after/` (captured headless against the Vite dev server; facilitator screens use a mocked API).

### Contrast (measured, on paper #faf6f1 unless noted)

| Pair | Ratio | Need |
|---|---|---|
| ink / paper | 16.1 | 4.5 |
| ink-muted / paper · paper-sunk | 6.7 · 6.2 | 4.5 |
| ink-subtle / paper · raised · sunk | 4.9 · 5.2 · 4.6 | 4.5 |
| white / clay-600 (primary button) | 5.6 (was 3.1) | 4.5 |
| clay-700 text / paper | 7.0 | 4.5 |
| danger / danger-bg · white / danger | 5.7 · 6.6 | 4.5 |
| sage-600 ring label / public ring | 6.8 | 4.5 |
| paper 70% / ink (reaction notes) | 7.9 | 4.5 |
| clay-600 focus ring / paper · raised · sunk | 5.2 · 5.5 · 4.9 | 3 |
| ink-faint icon / raised (non-text) | 3.05 | 3 |

### Deviations from the plan

- **Phase 0 "before" screenshots not captured**: the backend wasn't running, so no before set exists. The after set is the new baseline.
- **Font preload / `size-adjust` fallbacks skipped**: Fontsource files are hashed by Vite, so preloading needs a plugin. `font-display: swap` is in place.
- **`FacilitatorPanel.tsx` is 411 lines**, not ~300. The UI moved to `panel/*`; what remains is data fetching, polling and mutations.
- **Lint gate not run**: ESLint 9 finds no `eslint.config.js` (the repo only has legacy config). No frontend tests exist.
- **Additions not in the plan**: tap/keyboard alternative to drag on all canvases (HTML5 drag doesn't work on touch); real connection state from `useWorkshopChannel` (the "Connected" label used to be hard-coded); the socket reconnect leak on unmount fixed; the persona autosave race fixed (stale data and saves dropped while one was in flight).

### Known issues found, not fixed (out of scope)

- Canvas activities (user flow, problem board, stakeholder map) don't reload a participant's saved work on return, so a revisit starts blank and can overwrite earlier work. Needs a GET path per template.
- Vite dev proxy for `/api` lacks `ws: true`; with the backend down, a closing WebSocket crashes the dev server (`ECONNRESET`).
- Presence ("who's here") needs a backend roster event before the lobby can show other participants.

### Review log (implementation)

- Codex review of the implementation: persona autosave race **fixed**; `role="toolbar"` without arrow-key support changed to `role="group"`; canvas restore **reported** (above); "stakeholder delete unreachable by keyboard" **rejected** (opacity-0 controls stay focusable and are revealed by `group-focus-within`); dossier-on-storage-failure **accepted as designed** (visual only, backend is the source of truth); ad-hoc text sizes in canvas nodes noted, not changed.
- web-design-guidelines re-check: no `transition-all`, no `focus:outline-none`, no clickable `div`/`span`, no emoji in chrome, no hard-coded locale dates, every icon-only button has an accessible name.
