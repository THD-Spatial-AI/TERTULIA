# Environment Specification

## Operating Environment

### Production
- **Everything**: self-hosted via Docker Compose on a single host (see `docker-compose.yml`)
- **Frontend**: nginx-served static React build (`frontend` service)
- **Backend**: FastAPI / Uvicorn (`backend` service)
- **Database**: self-hosted PostgreSQL (`postgres` service)
- **Auth**: Keycloak + Go auth-service (`keycloak`, `auth-service` services)
- **DNS**: `workshop.thd-spatial-ai.de`, fronted by a reverse proxy (nginx) for TLS

### Development
- **Frontend**: Vite dev server on `http://localhost:5173`
- **Backend**: Uvicorn with `--reload` on `http://localhost:8001`
- **Database**: PostgreSQL container via `docker compose up postgres` (or `make up` for the full stack)
- **Auth**: Keycloak + auth-service containers (`make up`)

### Workshop Day (In-Person)
- Facilitator: laptop connected to projector, browser with facilitator control panel
- Participants: personal laptops or tablets on the same network (or via internet)
- QR code displayed on projector screen
- Video conferencing (Zoom/Teams) run alongside the platform for audio/video — out of scope for this platform

### Workshop Day (Online)
- Facilitator: shares screen for slides phase; participants follow along via the platform
- Participants: personal laptop/tablet, anywhere with internet
- Session URL shared via email or chat before the workshop

---

## External Dependencies

| System | Version | Interface | Purpose |
|---|---|---|---|
| PostgreSQL 16 | self-hosted (Docker) | asyncpg | Session / participant / template storage |
| Keycloak + auth-service | self-hosted (Docker) | OIDC / HTTP | Facilitator authentication |
| feedback pipeline | part of this repo (`pipeline/`) | HTTP REST | Persona pre-registration + feedback issues |
| Storcito-Wildfire | Latest | URL redirect | Target platform |
| Google Slides | N/A (external service) | iframe embed | Slide content hosting |

---

## Browser Support

| Browser | Minimum Version |
|---|---|
| Chrome | 115+ |
| Firefox | 115+ |
| Safari | 16+ |
| Edge | 115+ |

Mobile browsers: supported for viewing but not primary target. All templates must be usable at 768px minimum width.

---

## Runtime Dependencies (Frontend)

See `frontend/package.json` for complete list with versions. Key runtime dependencies:

| Package | Purpose |
|---|---|
| `react` 19 | UI framework |
| `react-router-dom` v7 | Client-side routing |
| `zustand` v5 | Client state (session phase, participant info) |
| `@tanstack/react-query` v5 | Server state (template data, participant list) |
| `@xyflow/react` | User flow and stakeholder map node editors |
| `@dnd-kit/core` | Drag and drop for problem board |
| `qrcode.react` | QR code generation |
| `react-i18next` | Internationalization |
| `@radix-ui/*` | Accessible UI primitives |
| `lucide-react` | Icon set |
| `sonner` | Toast notifications |

---

## Runtime Dependencies (Backend)

See `backend/requirements.txt` for complete list with versions.

| Package | Purpose |
|---|---|
| `fastapi` | HTTP framework |
| `uvicorn[standard]` | ASGI server |
| `pydantic` v2 / `pydantic-settings` | Request/response validation + config |
| `asyncpg` | PostgreSQL async driver |
| `httpx` | Async HTTP calls to the auth-service + feedback pipeline |
| `python-dotenv` | Environment variable loading |
| `qrcode` / `pillow` | Server-side QR code generation for session URLs |
