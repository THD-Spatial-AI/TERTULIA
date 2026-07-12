import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException

from models import (
    PersonaCardUpsert,
    ProblemBoardUpsert,
    StakeholderMapUpsert,
    UserFlowUpsert,
)
from supabase_client import get_supabase

router = APIRouter(prefix="/templates", tags=["templates"])


def _resolve_participant(session_token: str) -> dict:
    """Resolve session_token to participant record. Raises 401 if invalid."""
    supabase = get_supabase()
    result = (
        supabase.table("participants")
        .select("id, session_id")
        .eq("session_token", session_token)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return result.data


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.put("/persona")
async def upsert_persona(body: PersonaCardUpsert, x_session_token: str = Header(...)):
    participant = _resolve_participant(x_session_token)
    supabase = get_supabase()

    data: dict = {
        "participant_id": participant["id"],
        "session_id": participant["session_id"],
        "extended_data": body.extended_data.model_dump() if body.extended_data else None,
        # Keep tech_comfort populated for pipeline compatibility
        "tech_comfort": body.extended_data.digital_competence if body.extended_data else None,
    }
    if body.completed:
        data["completed_at"] = _now_iso()

    supabase.table("persona_cards").upsert(data, on_conflict="participant_id").execute()
    return {"status": "saved"}


@router.put("/user-flow")
async def upsert_user_flow(body: UserFlowUpsert, x_session_token: str = Header(...)):
    participant = _resolve_participant(x_session_token)
    supabase = get_supabase()

    data: dict = {
        "participant_id": participant["id"],
        "session_id": participant["session_id"],
        "steps": {
            "nodes": [n.model_dump() for n in body.nodes],
            "edges": [e.model_dump() for e in body.edges],
        },
    }
    if body.completed:
        data["completed_at"] = _now_iso()

    supabase.table("user_flows").upsert(data, on_conflict="participant_id").execute()
    return {"status": "saved"}


@router.put("/problem-board")
async def upsert_problem_board(body: ProblemBoardUpsert, x_session_token: str = Header(...)):
    participant = _resolve_participant(x_session_token)
    supabase = get_supabase()

    data: dict = {
        "participant_id": participant["id"],
        "session_id": participant["session_id"],
        "notes": [s.model_dump() for s in body.sections],
    }
    if body.completed:
        data["completed_at"] = _now_iso()

    supabase.table("problem_boards").upsert(data, on_conflict="participant_id").execute()
    return {"status": "saved"}


@router.put("/stakeholder-map")
async def upsert_stakeholder_map(body: StakeholderMapUpsert, x_session_token: str = Header(...)):
    participant = _resolve_participant(x_session_token)
    supabase = get_supabase()

    data: dict = {
        "participant_id": participant["id"],
        "session_id": participant["session_id"],
        "nodes": {
            "items": [n.model_dump() for n in body.nodes],
            "use_case": body.use_case,
            "findings": body.findings,
        },
        "edges": [e.model_dump() for e in body.edges],
    }
    if body.completed:
        data["completed_at"] = _now_iso()

    supabase.table("stakeholder_maps").upsert(data, on_conflict="participant_id").execute()
    return {"status": "saved"}
