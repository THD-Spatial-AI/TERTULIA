import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request

from auth import require_facilitator
from db import get_pool
from models import LaunchResult, PipelinePersonaPayload
from pipeline_integration import pre_register_persona
from routes.ws import broadcast

router = APIRouter(prefix="/launch", tags=["launch"])
logger = logging.getLogger(__name__)


@router.post("/{session_id}", response_model=LaunchResult)
async def launch_wildfire(session_id: str, request: Request):
    user = require_facilitator(request)
    pool = get_pool()

    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT * FROM sessions WHERE id = $1 AND facilitator_id = $2",
            session_id, user.id,
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        participants = await conn.fetch(
            "SELECT id, display_name, role, org, session_token FROM participants WHERE session_id = $1",
            session_id,
        )
        persona_cards = await conn.fetch(
            "SELECT participant_id, tech_comfort FROM persona_cards WHERE session_id = $1",
            session_id,
        )

    persona_by_participant = {str(p["participant_id"]): p for p in persona_cards}
    sess = dict(session)
    workshop_tag = sess["workshop_tag"]

    pre_reg_tasks = []
    for p in participants:
        persona = persona_by_participant.get(str(p["id"]), {})
        payload = PipelinePersonaPayload(
            workshop_tag=workshop_tag,
            session_token=str(p["session_token"]),
            name=p["display_name"],
            role=p["role"],
            org=p.get("org"),
            tech_comfort=persona.get("tech_comfort"),
        )
        pre_reg_tasks.append(pre_register_persona(payload))

    results = await asyncio.gather(*pre_reg_tasks)
    pre_registered = sum(1 for r in results if r)
    failed = len(results) - pre_registered

    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE sessions SET phase = 'launched' WHERE id = $1", session_id,
        )

    await broadcast(sess["slug"], {"type": "launch"})

    warning = None
    if failed > 0:
        warning = f"{failed} participant(s) could not be pre-registered with the feedback pipeline."
        logger.warning(warning)

    logger.info(
        "Launch completed for session %s: %d participants, %d pre-registered, %d failed",
        session_id, len(participants), pre_registered, failed,
    )

    return LaunchResult(
        launched=len(participants),
        pre_registered=pre_registered,
        pre_registration_failed=failed,
        warning=warning,
    )
