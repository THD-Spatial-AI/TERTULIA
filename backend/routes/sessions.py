import logging
import re
import uuid

import pydantic
from fastapi import APIRouter, HTTPException, Request, status

from auth import require_facilitator
from db import get_pool
from models import (
    SessionCreate, SessionOut, SessionPublic,
    SessionPhaseUpdate, SessionUpdate, ParticipantCompletion,
)
from routes.ws import broadcast

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)


def _slug_from_title(title: str, tag: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{base}-{tag[:20]}"


def _row(record) -> dict:
    return dict(record) if record else {}


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(body: SessionCreate, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    slug = _slug_from_title(body.title, body.workshop_tag)
    session_id = str(uuid.uuid4())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO sessions
              (id, slug, facilitator_id, title, workshop_tag, slides_url,
               wildfire_url, phase, user_flow_chips, canvas_chips, stakeholder_suggestions)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'lobby',$8,$9,$10)
            RETURNING *
            """,
            session_id, slug, user.id, body.title, body.workshop_tag,
            body.slides_url, body.wildfire_url,
            body.user_flow_chips, body.canvas_chips, body.stakeholder_suggestions,
        )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create session")
    return _row(row)


@router.get("", response_model=list[SessionOut])
async def list_sessions(request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM sessions WHERE facilitator_id = $1 ORDER BY created_at DESC",
            user.id,
        )
    return [_row(r) for r in rows]


@router.get("/id/{session_id}", response_model=SessionOut)
async def get_session_by_id(session_id: str, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM sessions WHERE id = $1 AND facilitator_id = $2",
            session_id, user.id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return _row(row)


@router.get("/{slug}", response_model=SessionPublic)
async def get_session(slug: str):
    """Public (unauthenticated) — used by participants to join and view slides."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM sessions WHERE slug = $1", slug)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return _row(row)


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM sessions WHERE id = $1 AND facilitator_id = $2",
            session_id, user.id,
        )
    if result == "DELETE 0":
        raise HTTPException(status_code=403, detail="Not your session")


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(session_id: str, body: SessionUpdate, request: Request):
    user = require_facilitator(request)
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    pool = get_pool()
    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(update_data))
    values = list(update_data.values())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE sessions SET {set_clauses} WHERE id = $1 AND facilitator_id = ${len(values)+2} RETURNING *",
            session_id, *values, user.id,
        )
    if not row:
        raise HTTPException(status_code=403, detail="Not your session")
    return _row(row)


@router.get("/{session_id}/completions", response_model=list[ParticipantCompletion])
async def get_completions(session_id: str, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT facilitator_id FROM sessions WHERE id = $1", session_id,
        )
        if not session or session["facilitator_id"] != user.id:
            raise HTTPException(status_code=403, detail="Not your session")

        participants = await conn.fetch(
            "SELECT id, display_name, role FROM participants WHERE session_id = $1",
            session_id,
        )
        persona  = await conn.fetch("SELECT participant_id FROM persona_cards    WHERE session_id = $1 AND completed_at IS NOT NULL", session_id)
        flow     = await conn.fetch("SELECT participant_id FROM user_flows        WHERE session_id = $1 AND completed_at IS NOT NULL", session_id)
        board    = await conn.fetch("SELECT participant_id FROM problem_boards    WHERE session_id = $1 AND completed_at IS NOT NULL", session_id)
        maps     = await conn.fetch("SELECT participant_id FROM stakeholder_maps  WHERE session_id = $1 AND completed_at IS NOT NULL", session_id)

    persona_done = {str(r["participant_id"]) for r in persona}
    flow_done    = {str(r["participant_id"]) for r in flow}
    board_done   = {str(r["participant_id"]) for r in board}
    map_done     = {str(r["participant_id"]) for r in maps}

    return [
        {
            "participant_id": str(p["id"]),
            "display_name":   p["display_name"],
            "role":           p["role"],
            "persona":        str(p["id"]) in persona_done,
            "user_flow":      str(p["id"]) in flow_done,
            "problem_board":  str(p["id"]) in board_done,
            "stakeholder_map":str(p["id"]) in map_done,
        }
        for p in participants
    ]


@router.patch("/{session_id}/phase", response_model=SessionOut)
async def update_phase(session_id: str, body: SessionPhaseUpdate, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE sessions SET phase = $1 WHERE id = $2 AND facilitator_id = $3 RETURNING *",
            body.phase, session_id, user.id,
        )
    if not row:
        raise HTTPException(status_code=403, detail="Not your session")
    session = _row(row)
    await broadcast(session["slug"], {"type": "phase", "phase": body.phase})
    return session


class _BroadcastBody(pydantic.BaseModel):
    message: str


@router.post("/{session_id}/broadcast", status_code=204)
async def send_broadcast(session_id: str, body: _BroadcastBody, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT slug FROM sessions WHERE id = $1 AND facilitator_id = $2",
            session_id, user.id,
        )
    if not row:
        raise HTTPException(status_code=403, detail="Not your session")
    await broadcast(row["slug"], {"type": "broadcast", "message": body.message.strip()})
