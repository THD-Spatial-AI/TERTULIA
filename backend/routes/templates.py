from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException

from db import get_pool
from models import PersonaCardUpsert, ProblemBoardUpsert, StakeholderMapUpsert, UserFlowUpsert

router = APIRouter(prefix="/templates", tags=["templates"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _resolve_participant(session_token: str) -> dict:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, session_id FROM participants WHERE session_token = $1", session_token,
        )
    if not row:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return dict(row)


@router.put("/persona")
async def upsert_persona(body: PersonaCardUpsert, x_session_token: str = Header(...)):
    participant = await _resolve_participant(x_session_token)
    pool = get_pool()
    extended = body.extended_data.model_dump() if body.extended_data else None
    tech_comfort = body.extended_data.digital_competence if body.extended_data else None
    completed_at = _now_iso() if body.completed else None

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO persona_cards (participant_id, session_id, extended_data, tech_comfort, completed_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (participant_id) DO UPDATE
              SET extended_data = EXCLUDED.extended_data,
                  tech_comfort  = EXCLUDED.tech_comfort,
                  completed_at  = COALESCE(EXCLUDED.completed_at, persona_cards.completed_at)
            """,
            str(participant["id"]), str(participant["session_id"]),
            extended, tech_comfort, completed_at,
        )
    return {"status": "saved"}


@router.put("/user-flow")
async def upsert_user_flow(body: UserFlowUpsert, x_session_token: str = Header(...)):
    participant = await _resolve_participant(x_session_token)
    steps = {"nodes": [n.model_dump() for n in body.nodes], "edges": [e.model_dump() for e in body.edges]}
    completed_at = _now_iso() if body.completed else None

    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO user_flows (participant_id, session_id, steps, completed_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (participant_id) DO UPDATE
              SET steps        = EXCLUDED.steps,
                  completed_at = COALESCE(EXCLUDED.completed_at, user_flows.completed_at)
            """,
            str(participant["id"]), str(participant["session_id"]), steps, completed_at,
        )
    return {"status": "saved"}


@router.put("/problem-board")
async def upsert_problem_board(body: ProblemBoardUpsert, x_session_token: str = Header(...)):
    participant = await _resolve_participant(x_session_token)
    notes = [s.model_dump() for s in body.sections]
    completed_at = _now_iso() if body.completed else None

    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO problem_boards (participant_id, session_id, notes, completed_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (participant_id) DO UPDATE
              SET notes        = EXCLUDED.notes,
                  completed_at = COALESCE(EXCLUDED.completed_at, problem_boards.completed_at)
            """,
            str(participant["id"]), str(participant["session_id"]), notes, completed_at,
        )
    return {"status": "saved"}


@router.put("/stakeholder-map")
async def upsert_stakeholder_map(body: StakeholderMapUpsert, x_session_token: str = Header(...)):
    participant = await _resolve_participant(x_session_token)
    nodes = {"items": [n.model_dump() for n in body.nodes], "use_case": body.use_case, "findings": body.findings}
    edges = [e.model_dump() for e in body.edges]
    completed_at = _now_iso() if body.completed else None

    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO stakeholder_maps (participant_id, session_id, nodes, edges, completed_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (participant_id) DO UPDATE
              SET nodes        = EXCLUDED.nodes,
                  edges        = EXCLUDED.edges,
                  completed_at = COALESCE(EXCLUDED.completed_at, stakeholder_maps.completed_at)
            """,
            str(participant["id"]), str(participant["session_id"]), nodes, edges, completed_at,
        )
    return {"status": "saved"}
