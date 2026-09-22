import logging
import uuid

from fastapi import APIRouter, HTTPException, Request, status

from auth import require_facilitator
from db import get_pool
from models import ParticipantJoin, ParticipantOut, ParticipantPublic

router = APIRouter(prefix="/participants", tags=["participants"])
logger = logging.getLogger(__name__)


def _row(record) -> dict:
    return dict(record) if record else {}


@router.post("/join", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
async def join_session(body: ParticipantJoin):
    pool = get_pool()
    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT id, phase FROM sessions WHERE slug = $1", body.session_slug,
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        row = await conn.fetchrow(
            """
            INSERT INTO participants (id, session_id, display_name, role, org, session_token)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            """,
            str(uuid.uuid4()), str(session["id"]),
            body.display_name, body.role, body.org,
            str(uuid.uuid4()),
        )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to join session")
    logger.info("Participant joined session %s: %s (%s)", session["id"], body.display_name, body.role)
    return _row(row)


@router.get("/{session_id}", response_model=list[ParticipantPublic])
async def list_participants(session_id: str, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT facilitator_id FROM sessions WHERE id = $1", session_id,
        )
        if not session or session["facilitator_id"] != user.id:
            raise HTTPException(status_code=403, detail="Not your session")

        rows = await conn.fetch(
            "SELECT id, display_name, role, org, joined_at FROM participants WHERE session_id = $1 ORDER BY joined_at",
            session_id,
        )
    return [_row(r) for r in rows]


@router.delete("/{participant_id}", status_code=204)
async def remove_participant(participant_id: str, request: Request):
    user = require_facilitator(request)
    pool = get_pool()
    async with pool.acquire() as conn:
        participant = await conn.fetchrow(
            "SELECT session_id FROM participants WHERE id = $1", participant_id,
        )
        if not participant:
            raise HTTPException(status_code=404, detail="Participant not found")
        session = await conn.fetchrow(
            "SELECT facilitator_id FROM sessions WHERE id = $1", str(participant["session_id"]),
        )
        if not session or session["facilitator_id"] != user.id:
            raise HTTPException(status_code=403, detail="Not your session")
        await conn.execute("DELETE FROM participants WHERE id = $1", participant_id)
