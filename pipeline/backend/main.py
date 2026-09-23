import asyncio
import os
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from models import (
    FeedbackPayload,
    PersonaData,
    PreRegisteredPersona,
    PreviewRequest,
    PreviewResponse,
)
import ai_agent
import github_integration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Feedback Pipeline", version="0.2.0")

# Issue creation is serialized through this queue and drained one at a time by a single worker.
# Suggestions (the /preview endpoint) stay instant; issues take as long as the free-tier rate limit
# requires — submissions never fire concurrent Groq calls that would trip the 8000 tokens/min cap.
_ISSUE_QUEUE: "asyncio.Queue[FeedbackPayload]" = asyncio.Queue()

# Personas pushed by Tertulia's launch flow, keyed by the participant's
# session_token. Ephemeral (lost on restart) — fine for a workshop's lifetime.
# Lets a participant who arrived from a workshop submit feedback WITHOUT
# re-entering their persona in the target app.
_PERSONA_STORE: "dict[str, PersonaData]" = {}


def _persona_from_prereg(p: PreRegisteredPersona) -> PersonaData:
    """Map Tertulia's persona payload into the PersonaData shape used to render
    the issue's Reporter section. Bucket the 1-5 tech_comfort into the coarse
    digital_comfort labels; derive app_familiarity from years of experience."""
    comfort = None
    if p.tech_comfort is not None:
        comfort = "basic" if p.tech_comfort <= 2 else "comfortable" if p.tech_comfort == 3 else "advanced"
    familiarity = "first_time" if p.experience <= 0 else "used_before" if p.experience < 3 else "regular"
    return PersonaData(
        name=p.name,
        role=p.role,
        organization=p.org or "Not specified",
        app_familiarity=familiarity,
        years_experience=str(p.experience) if p.experience else None,
        digital_comfort=comfort,
    )


_DEFAULT_ORIGINS = "https://wildfire-app.th-deg.de"
_allow_origins = [
    origin.strip().rstrip("/")
    for origin in os.environ.get("ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

_DEFAULT_ORIGIN_REGEX = (
    r"https?://("
    r"localhost"
    r"|127\.\d+\.\d+\.\d+"
    r"|10\.\d+\.\d+\.\d+"
    r"|192\.168\.\d+\.\d+"
    r"|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+"
    r")(:\d+)?"
)
_allow_origin_regex = os.environ.get("ALLOWED_ORIGIN_REGEX", _DEFAULT_ORIGIN_REGEX)

logger.info("CORS allow_origins=%s", _allow_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_origin_regex=_allow_origin_regex,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Workshop-Token"],
)


def verify_workshop_token(x_workshop_token: str = Header(...)):
    expected = os.environ.get("WORKSHOP_TOKEN", "")
    if not expected or x_workshop_token != expected:
        raise HTTPException(status_code=401, detail="Invalid workshop token")


_FAMILIARITY_LABELS = {
    "first_time": "First time",
    "used_before": "Used it before",
    "regular": "Regular user",
}
_COMFORT_LABELS = {
    "basic": "Basic",
    "comfortable": "Comfortable",
    "advanced": "Advanced",
}


def _build_reporter_section(persona: PersonaData) -> str:
    rows = [
        f"| Name | {persona.name} |",
        f"| Role | {persona.role} |",
        f"| Organization | {persona.organization} |",
        f"| App familiarity | {_FAMILIARITY_LABELS.get(persona.app_familiarity, persona.app_familiarity)} |",
    ]
    if persona.years_experience:
        rows.append(f"| Years of experience | {persona.years_experience} |")
    if persona.digital_comfort:
        rows.append(f"| Digital comfort | {_COMFORT_LABELS.get(persona.digital_comfort, persona.digital_comfort)} |")
    return "## Reporter\n| Field | Value |\n|-------|-------|\n" + "\n".join(rows) + "\n"


def process_feedback(payload: FeedbackPayload) -> None:
    try:
        # 1. Upload cropped screenshot to GitHub (non-blocking on failure)
        screenshot_url: str | None = None
        if payload.implicit.screenshot_b64:
            import time as _time
            slug = f"{int(_time.time())}_{payload.workshop_tag.replace(' ', '-')}"
            screenshot_url = github_integration.upload_screenshot(
                payload.implicit.screenshot_b64, slug
            )
            logger.info("Screenshot upload: %s", screenshot_url or "skipped")

        # 2. Fetch relevant source files from the Wildfire repo
        code_context = github_integration.fetch_relevant_files(
            payload.implicit.route,
            payload.implicit.x,
            payload.implicit.y,
        )
        logger.info("Code context fetched: %d chars", len(code_context))

        # 3. Generate structured issue with AI
        issue = ai_agent.process(payload, code_context=code_context)
        logger.info("AI output — title: %s", issue.title)
        logger.info("AI output — labels: %s", issue.labels)

        # 4. Build the final issue body in order:
        #    [screenshot] → [reporter] → [AI-generated body]
        body = issue.markdown_body

        if payload.persona:
            reporter_section = _build_reporter_section(payload.persona)
            body = reporter_section + "\n\n" + body

        if screenshot_url:
            screenshot_section = (
                f"## Selected Area\n"
                f"![User-selected area]({screenshot_url})\n\n"
            )
            body = screenshot_section + body

        issue.markdown_body = body
        logger.info("AI output — body:\n%s", issue.markdown_body)

        # 5. Create GitHub issue
        url = github_integration.create_issue(
            title=issue.title,
            markdown_body=issue.markdown_body,
            labels=issue.labels,
        )
        logger.info("GitHub issue created: %s", url)
    except Exception:
        logger.exception("Failed to process feedback")


async def _issue_worker() -> None:
    """Drain the issue queue one submission at a time. Runs the blocking pipeline off the event
    loop so /preview stays responsive; serialization keeps Groq calls under the rate limit."""
    while True:
        payload = await _ISSUE_QUEUE.get()
        try:
            await asyncio.to_thread(process_feedback, payload)
        except Exception:
            logger.exception("Issue worker failed on an item")
        finally:
            _ISSUE_QUEUE.task_done()
            logger.info("Issue queue drained one item — %d remaining", _ISSUE_QUEUE.qsize())


@app.on_event("startup")
async def _start_issue_worker() -> None:
    asyncio.create_task(_issue_worker())
    logger.info("Issue-creation worker started (serialized, rate-limit aware)")
    # Report which secrets are present (booleans only — never log the values). Lets you confirm from
    # the deploy logs whether the host actually has GROQ_API_KEY / GITHUB_TOKEN, which the gitignored
    # pipeline/backend/.env does NOT carry into production.
    logger.info(
        "Config presence — GROQ_API_KEY=%s GITHUB_TOKEN=%s GITHUB_REPO=%s WORKSHOP_TOKEN=%s (model=%s)",
        bool(os.environ.get("GROQ_API_KEY")),
        bool(os.environ.get("GITHUB_TOKEN")),
        os.environ.get("GITHUB_REPO") or "(unset)",
        bool(os.environ.get("WORKSHOP_TOKEN")),
        os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b"),
    )


@app.post("/api/v1/feedback/preview", dependencies=[Depends(verify_workshop_token)])
async def preview_feedback(payload: PreviewRequest) -> PreviewResponse:
    return await asyncio.to_thread(ai_agent.preview, payload)


@app.post("/api/v1/persona/pre-register", dependencies=[Depends(verify_workshop_token)])
async def pre_register_persona(payload: PreRegisteredPersona):
    """Called by Tertulia's launch flow, once per participant. Stores the persona
    keyed by session_token so later feedback from that participant is attributed
    automatically (see receive_feedback)."""
    _PERSONA_STORE[payload.session_token] = _persona_from_prereg(payload)
    logger.info(
        "Pre-registered persona for workshop=%s session_token=%s… (%d stored)",
        payload.workshop_tag, payload.session_token[:8], len(_PERSONA_STORE),
    )
    return {"status": "registered"}


@app.post("/api/v1/feedback", dependencies=[Depends(verify_workshop_token)])
async def receive_feedback(payload: FeedbackPayload):
    # Attribute the feedback to the workshop persona when the participant arrived
    # from Tertulia (session_token present) and didn't fill the overlay's form.
    if payload.persona is None and payload.session_token:
        prereg = _PERSONA_STORE.get(payload.session_token)
        if prereg:
            payload.persona = prereg
            logger.info("Attached pre-registered persona for session_token=%s…", payload.session_token[:8])
    # Enqueue and return immediately; the worker creates the issue when the rate limit allows.
    await _ISSUE_QUEUE.put(payload)
    return {"status": "queued", "queued": _ISSUE_QUEUE.qsize()}


@app.get("/api/v1/workshop/report", dependencies=[Depends(verify_workshop_token)])
async def workshop_report(tag: str):
    """Generate and return a ZIP with .md, .pdf, .xlsx report for a workshop tag."""
    import report_generator
    try:
        zip_bytes = await asyncio.to_thread(report_generator.generate_report_zip, tag)
    except Exception:
        logger.exception("Report generation failed for tag=%s", tag)
        raise HTTPException(status_code=500, detail="Report generation failed")
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{tag}-report.zip"'},
    )


@app.get("/health")
def health():
    return {"status": "ok"}
