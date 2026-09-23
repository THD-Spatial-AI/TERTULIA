from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class ExplicitUserData(BaseModel):
    feedback_type: Literal["bug", "feature", "question", "praise"]
    rating: int = Field(..., ge=1, le=5)
    context_topic: str | None = None
    what_happened: str | None = None
    expected: str | None = None
    desired: str | None = None
    comment: str | None = None


class ImplicitContextData(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    route: str
    model_id: str | None = None
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    screenshot_b64: str | None = None


class PersonaData(BaseModel):
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    organization: str = Field(..., min_length=1)
    app_familiarity: Literal["first_time", "used_before", "regular"]
    years_experience: str | None = None
    digital_comfort: Literal["basic", "comfortable", "advanced"] | None = None


class FeedbackPayload(BaseModel):
    explicit: ExplicitUserData
    implicit: ImplicitContextData
    workshop_tag: str = Field(..., min_length=1)
    persona: PersonaData | None = None
    # Set by the overlay from the `tertulia_token` URL param when the participant
    # arrived from a Tertulia workshop. Used to attach a pre-registered persona
    # (see PreRegisteredPersona) so they never re-enter it in the target app.
    session_token: str | None = None


class PreRegisteredPersona(BaseModel):
    """Persona pushed by Tertulia's launch flow (POST /api/v1/persona/pre-register).
    Mirrors tertulia's PipelinePersonaPayload one-to-one. Mapped into PersonaData
    for issue rendering — see main.py `_persona_from_prereg`."""
    workshop_tag: str = Field(..., min_length=1)
    session_token: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    org: str | None = None
    tech_comfort: int | None = Field(None, ge=1, le=5)
    familiarity: str = "workshop"
    experience: int = 0


class PreviewRequest(BaseModel):
    implicit: ImplicitContextData
    workshop_tag: str = Field(..., min_length=1)
    language: str = "en"


class PreviewResponse(BaseModel):
    topic_options: list[str]


class ProcessedIssue(BaseModel):
    title: str
    markdown_body: str
    labels: list[str] = Field(default_factory=list)
