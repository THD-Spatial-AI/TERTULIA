from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator


def _require_http_url(value: str | None) -> str | None:
    """Reject any non-http(s) URL. These values are later rendered into
    `window.location.href` and iframe `src` on the client, so a `javascript:`
    or `data:` scheme would be a stored-XSS / open-redirect vector."""
    if value is None:
        return None
    v = value.strip()
    if not v:
        return None
    if not (v.startswith("https://") or v.startswith("http://")):
        raise ValueError("URL must start with http:// or https://")
    return v


# ── Sessions ──────────────────────────────────────────────────────────────────

SessionPhase = Literal[
    "lobby", "slides", "template_1", "template_2", "template_3", "template_4", "launched"
]


class SessionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    workshop_tag: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    slides_url: str | None = None
    wildfire_url: str
    user_flow_chips: list[str] = Field(default_factory=list)
    canvas_chips: list[str] = Field(default_factory=list)
    stakeholder_suggestions: list[str] = Field(default_factory=list)

    _v_slides = field_validator("slides_url")(_require_http_url)
    _v_wildfire = field_validator("wildfire_url")(_require_http_url)


class SessionOut(BaseModel):
    id: str
    slug: str
    facilitator_id: str
    title: str
    workshop_tag: str
    slides_url: str | None
    wildfire_url: str
    phase: SessionPhase
    created_at: datetime
    user_flow_chips: list[str] = Field(default_factory=list)
    canvas_chips: list[str] = Field(default_factory=list)
    stakeholder_suggestions: list[str] = Field(default_factory=list)


class SessionPublic(BaseModel):
    """Session shape safe to return to anonymous participants (join / slides /
    launch). Deliberately omits facilitator_id and workshop_tag — those are
    internal identifiers that anonymous callers have no need to see."""
    id: str
    slug: str
    title: str
    slides_url: str | None
    wildfire_url: str
    phase: SessionPhase
    user_flow_chips: list[str] = Field(default_factory=list)
    canvas_chips: list[str] = Field(default_factory=list)
    stakeholder_suggestions: list[str] = Field(default_factory=list)


class SessionPhaseUpdate(BaseModel):
    phase: SessionPhase


class SessionUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    slides_url: str | None = None
    wildfire_url: str | None = Field(None, min_length=1)

    _v_slides = field_validator("slides_url")(_require_http_url)
    _v_wildfire = field_validator("wildfire_url")(_require_http_url)


class ParticipantCompletion(BaseModel):
    participant_id: str
    display_name: str
    role: str
    persona: bool
    user_flow: bool
    problem_board: bool
    stakeholder_map: bool


# ── Participants ───────────────────────────────────────────────────────────────

class ParticipantJoin(BaseModel):
    session_slug: str = Field(..., min_length=1, max_length=200)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    org: str | None = Field(None, max_length=200)


class ParticipantOut(BaseModel):
    id: str
    session_id: str
    display_name: str
    role: str
    org: str | None
    session_token: str
    joined_at: datetime


class ParticipantPublic(BaseModel):
    """Participant info safe to share with facilitator (no session_token)."""
    id: str
    display_name: str
    role: str
    org: str | None
    joined_at: datetime


# ── Templates ─────────────────────────────────────────────────────────────────
#
# Every field below is filled by an authenticated-by-session_token participant
# and stored as JSONB. Bounds (string max_length + list max_length) are enforced
# so a participant cannot PUT unbounded blobs that bloat the DB or exhaust
# memory. Keep these caps generous enough for real workshop use but finite.

# A short identifier / free-form label item within a list.
ShortStr = Annotated[str, Field(max_length=300)]

MAX_LIST = 200          # cap on the number of items in any template collection
MAX_TEXT = 5_000        # cap on a single free-text field


class PersonaCardExtendedData(BaseModel):
    age: int | None = Field(None, ge=0, le=150)
    org_type: str | None = Field(None, max_length=300)
    education_level: str | None = Field(None, max_length=300)
    job_position: str | None = Field(None, max_length=300)
    wildfire_role: str | None = Field(None, max_length=300)
    main_work_place: str | None = Field(None, max_length=300)
    locality_type: str | None = Field(None, max_length=300)
    description: str | None = Field(None, max_length=MAX_TEXT)
    digital_competence: int | None = Field(None, ge=1, le=5)
    technical_competence: int | None = Field(None, ge=1, le=5)
    legal_knowledge: int | None = Field(None, ge=1, le=5)
    prevention_knowledge: int | None = Field(None, ge=1, le=5)
    app_predisposition: int | None = Field(None, ge=1, le=5)
    info_online: int | None = Field(None, ge=1, le=5)
    info_traditional: int | None = Field(None, ge=1, le=5)
    info_broadcasting: int | None = Field(None, ge=1, le=5)
    info_colleagues: int | None = Field(None, ge=1, le=5)
    info_official: int | None = Field(None, ge=1, le=5)
    info_workshops: int | None = Field(None, ge=1, le=5)
    tools: list[ShortStr] = Field(default_factory=list, max_length=MAX_LIST)
    devices_private: list[ShortStr] = Field(default_factory=list, max_length=MAX_LIST)
    devices_work: list[ShortStr] = Field(default_factory=list, max_length=MAX_LIST)
    objectives: list[ShortStr] = Field(default_factory=list, max_length=MAX_LIST)
    obstacles: list[ShortStr] = Field(default_factory=list, max_length=MAX_LIST)


class PersonaCardUpsert(BaseModel):
    extended_data: PersonaCardExtendedData | None = None
    completed: bool = False


class FlowNode(BaseModel):
    model_config = {"extra": "ignore"}
    id: str = Field(..., max_length=300)
    type: str = Field(..., max_length=100)
    position: dict[str, float]
    data: dict = Field(default_factory=dict)


class FlowEdge(BaseModel):
    model_config = {"extra": "ignore"}
    id: str = Field(..., max_length=300)
    source: str = Field(..., max_length=300)
    target: str = Field(..., max_length=300)
    type: str = Field("labelEdge", max_length=100)
    data: dict = Field(default_factory=dict)


class UserFlowUpsert(BaseModel):
    nodes: list[FlowNode] = Field(default_factory=list, max_length=MAX_LIST)
    edges: list[FlowEdge] = Field(default_factory=list, max_length=MAX_LIST)
    completed: bool = False


class CanvasNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), max_length=300)
    text: str = Field(..., max_length=MAX_TEXT)


class CanvasSection(BaseModel):
    id: str = Field(..., max_length=300)
    chips: list[ShortStr] = Field(default_factory=list, max_length=MAX_LIST)
    notes: list[CanvasNote] = Field(default_factory=list, max_length=MAX_LIST)


class ProblemBoardUpsert(BaseModel):
    sections: list[CanvasSection] = Field(default_factory=list, max_length=50)
    completed: bool = False


class StakeholderNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), max_length=300)
    name: str = Field(..., max_length=300)
    role: str = Field(..., max_length=300)
    position: dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})


class StakeholderEdge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), max_length=300)
    source: str = Field(..., max_length=300)
    target: str = Field(..., max_length=300)
    label: str = Field("", max_length=300)


class StakeholderMapUpsert(BaseModel):
    nodes: list[StakeholderNode] = Field(default_factory=list, max_length=MAX_LIST)
    edges: list[StakeholderEdge] = Field(default_factory=list, max_length=MAX_LIST)
    use_case: str = Field("", max_length=MAX_TEXT)
    findings: str = Field("", max_length=MAX_TEXT)
    completed: bool = False


# ── Reactions ─────────────────────────────────────────────────────────────────

ReactionType = Literal["emoji_fire", "emoji_heart", "emoji_question", "raise_hand"]


class ReactionCreate(BaseModel):
    type: ReactionType
    session_token: str


# ── Launch ────────────────────────────────────────────────────────────────────

class LaunchResult(BaseModel):
    launched: int
    pre_registered: int
    pre_registration_failed: int
    warning: str | None = None


# ── Pipeline integration ──────────────────────────────────────────────────────

class PipelinePersonaPayload(BaseModel):
    workshop_tag: str
    session_token: str
    name: str
    role: str
    org: str | None = None
    tech_comfort: int | None = None
    familiarity: str = "workshop"
    experience: int = 0
