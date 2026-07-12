import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import sessions, participants, templates, launch

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

# Interactive API docs enumerate every endpoint + schema. Keep them off unless
# explicitly enabled (ENABLE_DOCS=true) so production doesn't expose them.
_docs_enabled = settings.enable_docs

app = FastAPI(
    title="Workshop Logic Platform API",
    version="0.1.0",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Baseline hardening headers. `frame-ancestors 'none'` blocks clickjacking;
    the API returns JSON only, so a strict CSP is safe here."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

app.include_router(sessions.router, prefix="/api/v1")
app.include_router(participants.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(launch.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "workshop-platform-api"}
