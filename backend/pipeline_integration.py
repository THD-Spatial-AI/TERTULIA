"""
HTTP integration with feeedback_pipeline backend.

Field mapping (workshop PersonaCard → pipeline PersonaData):
  display_name    → name
  role            → role
  org             → org
  tech_comfort    → tech_comfort   (1-5 scale, same)
  familiarity     → "workshop"     (hardcoded: participant came from workshop)
  experience      → 0              (unknown at workshop level)

Pipeline API version: no versioning header yet — add X-API-Version if pipeline adds it.
Run a smoke test before each workshop: call /api/v1/persona/pre-register with test data.
"""

import logging

import httpx

from config import settings
from models import PipelinePersonaPayload

logger = logging.getLogger(__name__)


async def pre_register_persona(payload: PipelinePersonaPayload) -> bool:
    """
    POST persona to feeedback_pipeline. Returns True on success, False on failure.
    Never raises — failure is non-blocking (workshop continues).
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.pipeline_api_url}/api/v1/persona/pre-register",
                json=payload.model_dump(),
                headers={
                    "X-Workshop-Token": settings.pipeline_token,
                    "Content-Type": "application/json",
                },
            )
            if response.status_code == 200:
                return True
            logger.warning(
                "Pipeline pre-registration failed: %s %s",
                response.status_code,
                response.text,
            )
            return False
    except Exception as exc:
        logger.warning("Pipeline pre-registration error (non-blocking): %s", exc)
        return False
