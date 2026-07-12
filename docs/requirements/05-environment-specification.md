# Environment Specification

## Operating Environment

### Production
- **Frontend**: Vercel Edge Network (global CDN, static React SPA)
- **Backend**: Railway or Render (Python FastAPI, containerized)
- **Database**: Supabase cloud (PostgreSQL + Realtime + Auth)
- **DNS**: `workshop.thd-spatial-ai.de` (frontend), `workshop-api.thd-spatial-ai.de` (backend)

### Development
- **Frontend**: Vite dev server on `http://localhost:5173`
- **Backend**: Uvicorn with `--reload` on `http://localhost:8001`
- **Database**: Supabase cloud (shared dev project) or Supabase CLI local on `http://localhost:54321`

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
| Supabase | Cloud (managed) | REST + WebSocket | DB, Realtime, Auth |
| feeedback_pipeline | Latest (no versioning yet) | HTTP REST | Persona pre-registration |
| Storcito-Wildfire | Latest | URL redirect | Target platform |
| Google Slides | N/A (external service) | iframe embed | Slide content hosting |
| Vercel | N/A (managed) | CI/CD + CDN | Frontend hosting |
| Railway / Render | N/A (managed) | Container | Backend hosting |

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
| `@supabase/supabase-js` | Supabase client (DB + Realtime + Auth) |
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
| `pydantic` v2 | Request/response validation |
| `supabase` | Supabase Python admin client |
| `httpx` | Async HTTP calls to feeedback_pipeline |
| `python-dotenv` | Environment variable loading |
| `python-jose[cryptography]` | JWT validation for facilitator auth |
