import asyncio
import logging

from fastapi import APIRouter, Header, HTTPException

from models import LaunchResult, PipelinePersonaPayload
from pipeline_integration import pre_register_persona
from supabase_client import get_supabase
from config import settings

router = APIRouter(prefix="/launch", tags=["launch"])
logger = logging.getLogger(__name__)


@router.post("/{session_id}", response_model=LaunchResult)
async def launch_wildfire(
    session_id: str,
    authorization: str = Header(...),
):
    supabase = get_supabase()

    # Auth + ownership check
    token = authorization.removeprefix("Bearer ").strip()
    try:
        user = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    session = (
        supabase.table("sessions")
        .select("*")
        .eq("id", session_id)
        .single()
        .execute()
    )
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.data["facilitator_id"] != user.user.id:
        raise HTTPException(status_code=403, detail="Not your session")

    sess = session.data
    workshop_tag = sess["workshop_tag"]
    wildfire_url = sess.get("wildfire_url", settings.wildfire_base_url)

    # Fetch all participants + their persona cards
    participants = (
        supabase.table("participants")
        .select("id, display_name, role, org, session_token")
        .eq("session_id", session_id)
        .execute()
    ).data or []

    persona_cards = (
        supabase.table("persona_cards")
        .select("participant_id, tech_comfort")
        .eq("session_id", session_id)
        .execute()
    ).data or []

    persona_by_participant = {p["participant_id"]: p for p in persona_cards}

    # Pre-register all personas concurrently
    pre_reg_tasks = []
    for participant in participants:
        persona = persona_by_participant.get(participant["id"], {})
        payload = PipelinePersonaPayload(
            workshop_tag=workshop_tag,
            session_token=participant["session_token"],
            name=participant["display_name"],
            role=participant["role"],
            org=participant.get("org"),
            tech_comfort=persona.get("tech_comfort"),
        )
        pre_reg_tasks.append(pre_register_persona(payload))

    results = await asyncio.gather(*pre_reg_tasks)
    pre_registered = sum(1 for r in results if r)
    failed = len(results) - pre_registered

    # Update session phase to "launched"
    supabase.table("sessions").update({"phase": "launched"}).eq("id", session_id).execute()

    warning = None
    if failed > 0:
        warning = f"{failed} participant(s) could not be pre-registered with the feedback pipeline. They will see the PersonaForm in Wildfire."
        logger.warning(warning)

    # Broadcast redirect via Supabase Realtime is handled by the frontend
    # (facilitator control panel publishes after this response returns)

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
