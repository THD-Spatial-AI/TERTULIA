import logging
import re
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status

from models import SessionCreate, SessionOut, SessionPublic, SessionPhaseUpdate, SessionUpdate, ParticipantCompletion
from supabase_client import get_supabase

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)


def _slug_from_title(title: str, tag: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{base}-{tag[:20]}"


async def get_facilitator_id(authorization: str = Header(...)) -> str:
    """Extract facilitator user ID from Supabase JWT."""
    token = authorization.removeprefix("Bearer ").strip()
    supabase = get_supabase()
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user.user.id
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    facilitator_id: str = Depends(get_facilitator_id),
):
    supabase = get_supabase()
    slug = _slug_from_title(body.title, body.workshop_tag)

    data = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "facilitator_id": facilitator_id,
        "title": body.title,
        "workshop_tag": body.workshop_tag,
        "slides_url": body.slides_url,
        "wildfire_url": body.wildfire_url,
        "phase": "lobby",
        "user_flow_chips": body.user_flow_chips,
        "canvas_chips": body.canvas_chips,
        "stakeholder_suggestions": body.stakeholder_suggestions,
    }

    try:
        result = supabase.table("sessions").insert(data).execute()
    except Exception as exc:
        logger.exception("Supabase insert failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create session")
    if not result.data:
        logger.error("Insert returned no data: %s", result)
        raise HTTPException(status_code=500, detail="Failed to create session")
    return result.data[0]


@router.get("", response_model=list[SessionOut])
async def list_sessions(facilitator_id: str = Depends(get_facilitator_id)):
    supabase = get_supabase()
    result = (
        supabase.table("sessions")
        .select("*")
        .eq("facilitator_id", facilitator_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/id/{session_id}", response_model=SessionOut)
async def get_session_by_id(
    session_id: str,
    facilitator_id: str = Depends(get_facilitator_id),
):
    supabase = get_supabase()
    result = supabase.table("sessions").select("*").eq("id", session_id).eq("facilitator_id", facilitator_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return result.data


@router.get("/{slug}", response_model=SessionPublic)
async def get_session(slug: str):
    """Public (unauthenticated) — used by participants to join, view slides, and
    resolve the launch redirect. Returns SessionPublic, which omits internal
    fields (facilitator_id, workshop_tag)."""
    supabase = get_supabase()
    result = supabase.table("sessions").select("*").eq("slug", slug).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return result.data


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    facilitator_id: str = Depends(get_facilitator_id),
):
    supabase = get_supabase()
    existing = supabase.table("sessions").select("facilitator_id").eq("id", session_id).single().execute()
    if not existing.data or existing.data["facilitator_id"] != facilitator_id:
        raise HTTPException(status_code=403, detail="Not your session")
    supabase.table("sessions").delete().eq("id", session_id).execute()


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: str,
    body: SessionUpdate,
    facilitator_id: str = Depends(get_facilitator_id),
):
    supabase = get_supabase()
    existing = supabase.table("sessions").select("facilitator_id").eq("id", session_id).single().execute()
    if not existing.data or existing.data["facilitator_id"] != facilitator_id:
        raise HTTPException(status_code=403, detail="Not your session")

    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    result = supabase.table("sessions").update(update_data).eq("id", session_id).execute()
    return result.data[0]


@router.get("/{session_id}/completions", response_model=list[ParticipantCompletion])
async def get_completions(
    session_id: str,
    facilitator_id: str = Depends(get_facilitator_id),
):
    supabase = get_supabase()
    existing = supabase.table("sessions").select("facilitator_id").eq("id", session_id).single().execute()
    if not existing.data or existing.data["facilitator_id"] != facilitator_id:
        raise HTTPException(status_code=403, detail="Not your session")

    participants_r = supabase.table("participants").select("id, display_name, role").eq("session_id", session_id).execute()
    participants = {p["id"]: p for p in (participants_r.data or [])}

    persona_r = supabase.table("persona_cards").select("participant_id, completed_at").eq("session_id", session_id).execute()
    flow_r = supabase.table("user_flows").select("participant_id, completed_at").eq("session_id", session_id).execute()
    board_r = supabase.table("problem_boards").select("participant_id, completed_at").eq("session_id", session_id).execute()
    map_r = supabase.table("stakeholder_maps").select("participant_id, completed_at").eq("session_id", session_id).execute()

    persona_done = {r["participant_id"] for r in (persona_r.data or []) if r.get("completed_at")}
    flow_done = {r["participant_id"] for r in (flow_r.data or []) if r.get("completed_at")}
    board_done = {r["participant_id"] for r in (board_r.data or []) if r.get("completed_at")}
    map_done = {r["participant_id"] for r in (map_r.data or []) if r.get("completed_at")}

    return [
        {
            "participant_id": pid,
            "display_name": p["display_name"],
            "role": p["role"],
            "persona": pid in persona_done,
            "user_flow": pid in flow_done,
            "problem_board": pid in board_done,
            "stakeholder_map": pid in map_done,
        }
        for pid, p in participants.items()
    ]


@router.patch("/{session_id}/phase", response_model=SessionOut)
async def update_phase(
    session_id: str,
    body: SessionPhaseUpdate,
    facilitator_id: str = Depends(get_facilitator_id),
):
    supabase = get_supabase()

    # Verify ownership
    existing = supabase.table("sessions").select("facilitator_id").eq("id", session_id).single().execute()
    if not existing.data or existing.data["facilitator_id"] != facilitator_id:
        raise HTTPException(status_code=403, detail="Not your session")

    result = (
        supabase.table("sessions")
        .update({"phase": body.phase})
        .eq("id", session_id)
        .execute()
    )
    return result.data[0]
