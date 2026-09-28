"""Session validation via the standalone Go authentication service.

FastAPI never receives a Keycloak token directly. It forwards the opaque
session_id cookie to the Go service's /internal/validate-session endpoint and
authorises using the returned realm identity.
"""
from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

import httpx
from fastapi import HTTPException, Request

from config import settings

logger = logging.getLogger(__name__)

SESSION_COOKIE_NAME = "session_id"
_ALLOWED_ROLES = frozenset({"facilitator", "admin"})


class AuthServiceUnavailable(RuntimeError):
    """The API could not securely validate a session with the Go service."""


@dataclass(frozen=True, slots=True)
class RealmUser:
    id: str
    username: str
    email: str
    realm: str
    roles: frozenset[str]

    @property
    def is_facilitator(self) -> bool:
        return bool({"facilitator", "admin"} & self.roles)

    def as_identity(self) -> dict[str, Any]:
        return {
            "sub": self.id,
            "preferred_username": self.username,
            "email": self.email,
            "realm": self.realm,
            "roles": sorted(self.roles),
        }


def _session_cookie_values(request: Request) -> list[str]:
    values: list[str] = []
    for part in request.headers.get("cookie", "").split(";"):
        name, sep, value = part.strip().partition("=")
        if sep and name == SESSION_COOKIE_NAME and value:
            values.append(value)
    return values


def has_session_cookie(request: Request) -> bool:
    return bool(_session_cookie_values(request))


def _parse_realm_user(payload: Any) -> RealmUser:
    """Map the Go auth-service's internal identity into a RealmUser.

    The auth-service returns {id, email, name, access_level, group_id} and does
    NOT echo the Keycloak realm or role list. Sessions are only ever issued for
    the configured realm, and only workshop staff have Keycloak accounts
    (participants are anonymous, authenticated by session_token) — so any
    validated session is treated as a facilitator.
    """
    if not isinstance(payload, dict):
        raise ValueError("invalid user response")
    user_id  = str(payload.get("id") or "").strip()
    email    = str(payload.get("email") or "").strip().lower()
    username = str(payload.get("username") or payload.get("name") or email).strip()
    if not user_id or not email:
        raise ValueError("invalid realm identity")
    return RealmUser(
        id=user_id,
        username=username or email,
        email=email,
        realm=settings.auth_realm,
        roles=frozenset({"facilitator"}),
    )


async def validate_request_session(request: Request) -> RealmUser | None:
    """Validate exactly one opaque browser session cookie with the Go service."""
    values = _session_cookie_values(request)
    if not values:
        return None
    if len(values) != 1:
        logger.warning("Rejected request with duplicate session cookies")
        return None
    if len(settings.auth_internal_secret) < 32:
        raise AuthServiceUnavailable("AUTH_INTERNAL_SECRET is not securely configured")

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            response = await client.get(
                f"{settings.auth_service_url.rstrip('/')}/internal/validate-session",
                headers={"X-Internal-Auth": settings.auth_internal_secret, "Accept": "application/json"},
                cookies={SESSION_COOKIE_NAME: values[0]},
            )
    except httpx.HTTPError as exc:
        logger.error("Go authentication service is unavailable: %s", exc)
        raise AuthServiceUnavailable("authentication service unavailable") from exc

    if response.status_code == 401:
        return None
    if response.status_code != 200:
        logger.error("Go authentication service returned HTTP %s", response.status_code)
        raise AuthServiceUnavailable("authentication service unavailable")
    try:
        body = response.json()
        return _parse_realm_user(body.get("user"))
    except (ValueError, TypeError) as exc:
        logger.error("Go authentication service returned an invalid identity: %s", exc)
        raise AuthServiceUnavailable("invalid authentication response") from exc


def require_facilitator(request: Request) -> RealmUser:
    """Raise 401/503 if the request does not carry a valid facilitator session."""
    if getattr(request.state, "auth_service_unavailable", False):
        raise HTTPException(status_code=503, detail="Authentication service unavailable.")
    user: RealmUser | None = getattr(request.state, "auth_user", None)
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    if not user.is_facilitator:
        raise HTTPException(status_code=403, detail="Facilitator role required.")
    return user
