# Tertulia

A real-time collaborative workshop platform for stakeholder co-design sessions — named after the Iberian tradition of a gathering where everyone contributes their judgment. Brings together diverse domain experts — firefighters, mayors, scientists, academics — to build personas, user flows, and problem maps around THD Spatial AI tools like Wildfire.

## Quick Start

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev                  # http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in Supabase + pipeline keys
uvicorn main:app --reload --port 8001
```

## Documentation

| Document | Purpose |
|---|---|
| [IDEA.md](./IDEA.md) | Product vision and 3-phase journey |
| [CLAUDE.md](./CLAUDE.md) | Developer reference (stack, setup, conventions) |
| [ROADMAP.md](./ROADMAP.md) | Development phases and milestones |
| [docs/requirements/](./docs/requirements/) | Product requirements and user stories |
| [docs/architecture/](./docs/architecture/) | Arc42 architecture documentation |

## Related Projects

| Project | Path | Role |
|---|---|---|
| Storcito-Wildfire | `../../../STORCITO/Storcito-Wildfire` | Target platform participants launch into |
| feeedback_pipeline | `../../../STORCITO/feeedback_pipeline` | AI feedback capture; receives pre-registered personas |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **Deploy**: Vercel (frontend) + Supabase cloud
- **Languages**: DE / EN / ES / GL
