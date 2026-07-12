# Deployment View

## Production Deployment

```
Internet
    │
    ├── https://workshop.thd-spatial-ai.de  (or Vercel subdomain)
    │       └── Vercel Edge Network
    │               └── React 19 SPA (static build, CDN-cached)
    │                       │
    │                       ├── wss://xyz.supabase.co/realtime
    │                       │       └── Supabase Realtime (WebSocket)
    │                       │           ├── session:{id}:control
    │                       │           ├── session:{id}:presence
    │                       │           └── session:{id}:reactions
    │                       │
    │                       └── https://xyz.supabase.co/rest/v1
    │                               └── Supabase PostgreSQL (REST API)
    │
    ├── https://workshop-api.thd-spatial-ai.de  (Railway / Render)
    │       └── FastAPI backend (Python 3.11, Uvicorn)
    │               │
    │               ├── Supabase Admin Client (service role key)
    │               │       └── https://xyz.supabase.co
    │               │
    │               └── httpx → feeedback_pipeline backend
    │                       └── http://feedback-api.thd-spatial-ai.de:9000
    │
    └── https://wildfire.thd-spatial-ai.de  (separate project, Storcito-Wildfire)
```

## Local Development

```
Developer Machine
    │
    ├── http://localhost:5173  (Vite dev server — React SPA)
    │       └── hot module replacement enabled
    │
    ├── http://localhost:8001  (Uvicorn — FastAPI backend)
    │       └── --reload flag for auto-restart
    │
    └── https://xyz.supabase.co  (Supabase cloud, shared dev project)
            or
        http://localhost:54321  (Supabase local via supabase CLI)
            └── http://localhost:54323 (Supabase Studio)
```

## Environment Configuration

### Frontend (Vercel)
```
VITE_SUPABASE_URL          = https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJ...
VITE_BACKEND_URL           = https://workshop-api.thd-spatial-ai.de
```

### Backend (Railway / Render)
```
SUPABASE_URL               = https://xyz.supabase.co
SUPABASE_SERVICE_KEY       = eyJ...  (service role — never expose to frontend)
PIPELINE_API_URL           = http://feedback-api.thd-spatial-ai.de:9000
PIPELINE_TOKEN             = shared-secret (matches WORKSHOP_TOKEN in feeedback_pipeline)
WILDFIRE_BASE_URL          = https://wildfire.thd-spatial-ai.de
APP_SECRET_KEY             = random-32-char-secret
```

## Deployment Steps

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist/`
5. Set environment variables in Vercel dashboard
6. Vercel auto-deploys on push to `main`

### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `backend/`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables in Railway dashboard
5. Railway auto-deploys on push to `main`

### Supabase
1. Apply schema via SQL editor (see `CLAUDE.md`)
2. Enable Realtime on: `sessions`, `participants`, `reactions`
3. Configure RLS policies (see `docs/architecture/08-crosscutting-concepts.md`)
4. Enable magic link auth in Supabase Auth settings
