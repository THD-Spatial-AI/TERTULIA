# Tertulia

A real-time collaborative workshop platform for stakeholder co-design sessions — named after the Iberian tradition of a gathering where everyone contributes their judgment. Brings together diverse domain experts — firefighters, mayors, scientists, academics — to build personas, user flows, and problem maps around THD Spatial AI tools like Wildfire.

## Quick Start

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in auth-service URL + realm
npm run dev                  # http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in database, auth, + pipeline keys
uvicorn main:app --reload --port 8001
```

## Documentation

| Document | Purpose |
|---|---|
| [docs/requirements/](./docs/requirements/) | Product requirements and user stories |
| [docs/architecture/](./docs/architecture/) | Arc42 architecture documentation |
| [pipeline/README.md](./pipeline/README.md) | Feedback pipeline — overlay, backend, and workshop reports |

## The full journey

Tertulia is one project with two halves that hand off to each other:

1. **Workshop** — a facilitator runs a co-design session (persona cards → stakeholder map → user flow → problem board → slides).
2. **Launch** — `POST /launch/{session_id}` pre-registers each participant's persona with the feedback pipeline and redirects everyone into the software under test (Wildfire by default), carrying a `tertulia_token`.
3. **Feedback** — the `pipeline/overlay` package (mounted in the target app) captures a screenshot + comment; because the persona is pre-registered, participants don't re-enter it.
4. **Issues** — `pipeline/backend` turns each submission into a structured GitHub issue via local Ollama models orchestrated by n8n (fully self-hosted; Groq is an optional accelerator).

See [`pipeline/README.md`](./pipeline/README.md) for the feedback half. The pipeline is app-agnostic — Wildfire is the reference target; set `TARGET_APP_NAME` / `GITHUB_REPO` to point it at your own software.

## Related Projects

| Project | Path | Role |
|---|---|---|
| Storcito-Wildfire | `../Storcito-Wildfire` | Reference target app participants launch into |
| Feedback pipeline | [`./pipeline`](./pipeline) | AI feedback capture (now part of this repo); receives pre-registered personas |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4
- **Backend**: FastAPI (Python 3.11+)
- **Database**: self-hosted PostgreSQL
- **Auth**: Keycloak + Go auth-service (from the Storcito platform)
- **Realtime**: WebSocket (in-process hub)
- **Deploy**: Docker Compose (fully self-hosted)
- **Languages**: DE / EN / ES / GL
