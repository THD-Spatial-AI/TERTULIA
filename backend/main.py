import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from auth import AuthServiceUnavailable, has_session_cookie, validate_request_session
from config import settings
from db import close_pool, open_pool
from routes import sessions, participants, templates, launch
from routes.ws import router as ws_router

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_pool()
    yield
    await close_pool()


_docs_enabled = settings.enable_docs

app = FastAPI(
    title="Tertulia API",
    version="0.1.0",
    lifespan=lifespan,
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
async def authenticate_request(request: Request, call_next):
    """Resolve one opaque Go session cookie; set request.state.auth_user."""
    request.state.auth_user = None
    request.state.auth_service_unavailable = False

    if has_session_cookie(request):
        try:
            request.state.auth_user = await validate_request_session(request)
        except AuthServiceUnavailable:
            request.state.auth_service_unavailable = True

    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


app.include_router(sessions.router, prefix="/api/v1")
app.include_router(participants.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(launch.router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "tertulia-api"}


@app.get("/api/v1/me")
async def me(request: Request):
    """Return current facilitator identity (cookie auth check for frontend)."""
    user = getattr(request.state, "auth_user", None)
    if user is None:
        return JSONResponse({"authenticated": False}, status_code=401)
    return {"authenticated": True, **user.as_identity()}
