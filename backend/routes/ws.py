"""WebSocket hub — replaces Supabase Realtime channels."""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["realtime"])
logger = logging.getLogger(__name__)

_connections: dict[str, set[WebSocket]] = defaultdict(set)
_lock = asyncio.Lock()


async def broadcast(session_slug: str, message: dict) -> None:
    """Send a JSON message to every WebSocket connected to *session_slug*."""
    payload = json.dumps(message)
    async with _lock:
        dead: set[WebSocket] = set()
        for ws in list(_connections.get(session_slug, [])):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        _connections[session_slug] -= dead


@router.websocket("/sessions/{slug}")
async def session_ws(websocket: WebSocket, slug: str) -> None:
    await websocket.accept()
    async with _lock:
        _connections[slug].add(websocket)
    logger.info("WS connected: session=%s total=%d", slug, len(_connections[slug]))
    try:
        while True:
            text = await websocket.receive_text()
            try:
                payload = json.loads(text)
                if isinstance(payload, dict) and payload.get("type") == "reaction":
                    await broadcast(slug, payload)
            except Exception:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        async with _lock:
            _connections[slug].discard(websocket)
        logger.info("WS disconnected: session=%s", slug)
