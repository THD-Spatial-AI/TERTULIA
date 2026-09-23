from models import FeedbackPayload

_ROUTE_SCOPES: list[tuple[str, str]] = [
    ("/app/map",             "map"),
    ("/app/comparison",      "data"),
    ("/app/model-results",   "data"),
    ("/app/model-dashboard", "data"),
    ("/app/admin-dashboard", "ui"),
    ("/app/notifications",   "ui"),
    ("/app/settings",        "ui"),
    ("/app/profile",         "ui"),
    ("/app/feedback",        "ui"),
    ("/login",               "ui"),
    ("/register",            "ui"),
    ("/forgot-password",     "ui"),
]

# Title prefix
_SCOPE_TITLE_WORD = {
    "ui": "Frontend",
    "map": "Map",
    "data": "Data",
    "performance": "Performance",
}

_MAX_TITLE = 240  # GitHub cap


def _normalize_route(route: str) -> str:
    """Normalize path."""
    path = route.split("?", 1)[0].split("#", 1)[0].strip().lower()
    if not path.startswith("/"):
        path = "/" + path
    return path


def derive_scope(payload: FeedbackPayload) -> str:
    # Explicit signal
    if payload.explicit.what_happened == "slow":
        return "performance"

    path = _normalize_route(payload.implicit.route)
    for prefix, scope in _ROUTE_SCOPES:
        if prefix in path:
            return scope

    # Unknown route
    x, y = payload.implicit.x, payload.implicit.y
    if 0.2 <= x <= 0.8 and 0.2 <= y <= 0.8:
        return "map"
    return "ui"


def derive_priority(payload: FeedbackPayload) -> str:
    wh = payload.explicit.what_happened
    rating = payload.explicit.rating

    # Nothing to fix
    if payload.explicit.feedback_type == "praise":
        return "low"
    if wh in ("error", "access"):
        return "critical" if rating <= 2 else "high"
    if rating <= 2:
        return "high"
    if rating == 3:
        return "medium"
    return "low"


def derive_labels(payload: FeedbackPayload) -> list[str]:
    """One per axis."""
    labels = [
        f"type::{payload.explicit.feedback_type}",
        f"scope::{derive_scope(payload)}",
        f"priority::{derive_priority(payload)}",
    ]
    if payload.workshop_tag:
        labels.append(payload.workshop_tag)
    return labels


def _strip_prefixes(title: str) -> str:
    """Drop existing prefixes."""
    text = title.strip()
    while text.startswith("["):
        close = text.find("]")
        if close == -1:
            break
        text = text[close + 1:].lstrip()
    return text


def normalize_title(raw_title: str, payload: FeedbackPayload) -> str:
    """Apply title prefix."""
    type_word = payload.explicit.feedback_type.upper()
    scope_word = _SCOPE_TITLE_WORD[derive_scope(payload)]

    description = _strip_prefixes(raw_title or "")
    if not description:
        comment = (payload.explicit.comment or "").strip()
        description = comment.splitlines()[0] if comment else "Workshop feedback"

    prefix = f"[{type_word}][{scope_word}] "
    return (prefix + description)[:_MAX_TITLE]
