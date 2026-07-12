import logging
import uuid

from fastapi import APIRouter, Header, HTTPException, status

from models import ParticipantJoin, ParticipantOut, ParticipantPublic
from supabase_client import get_supabase

router = APIRouter(prefix="/participants", tags=["participants"])
logger = logging.getLogger(__name__)


def _require_facilitator_id(authorization: str) -> str:
    """Validate a Supabase facilitator JWT and return the user id, or raise 401.
    Wraps get_user so a malformed/expired token yields 401, not a 500."""
    token = authorization.removeprefix("Bearer ").strip()
    supabase = get_supabase()
    try:
        user = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user.user.id


@router.post("/join", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
async def join_session(body: ParticipantJoin):
    supabase = get_supabase()

    # Resolve slug → session
    session_result = (
        supabase.table("sessions").select("id, phase").eq("slug", body.session_slug).single().execute()
    )
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data

    data = {
        "id": str(uuid.uuid4()),
        "session_id": session["id"],
        "display_name": body.display_name,
        "role": body.role,
        "org": body.org,
        "session_token": str(uuid.uuid4()),
    }

    result = supabase.table("participants").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to join session")

    logger.info("Participant joined session %s: %s (%s)", session["id"], body.display_name, body.role)
    return result.data[0]


@router.get("/{session_id}", response_model=list[ParticipantPublic])
async def list_participants(
    session_id: str,
    authorization: str = Header(...),
):
    """Facilitator-only: list all participants in a session."""
    facilitator_id = _require_facilitator_id(authorization)
    supabase = get_supabase()

    # Verify session ownership
    session = supabase.table("sessions").select("facilitator_id").eq("id", session_id).single().execute()
    if not session.data or session.data["facilitator_id"] != facilitator_id:
        raise HTTPException(status_code=403, detail="Not your session")

    result = (
        supabase.table("participants")
        .select("id, display_name, role, org, joined_at")
        .eq("session_id", session_id)
        .order("joined_at")
        .execute()
    )
    return result.data or []


@router.delete("/{participant_id}", status_code=204)
async def remove_participant(
    participant_id: str,
    authorization: str = Header(...),
):
    """Facilitator-only: remove a participant from a session."""
    facilitator_id = _require_facilitator_id(authorization)
    supabase = get_supabase()

    # Verify the participant belongs to one of the facilitator's sessions
    participant = supabase.table("participants").select("id, session_id").eq("id", participant_id).single().execute()
    if not participant.data:
        raise HTTPException(status_code=404, detail="Participant not found")

    session = supabase.table("sessions").select("facilitator_id").eq("id", participant.data["session_id"]).single().execute()
    if not session.data or session.data["facilitator_id"] != facilitator_id:
        raise HTTPException(status_code=403, detail="Not your session")

    supabase.table("participants").delete().eq("id", participant_id).execute()
