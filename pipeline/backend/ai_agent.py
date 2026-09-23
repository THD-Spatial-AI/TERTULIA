import json
import logging
import os
import time
import httpx

import labeling
from models import FeedbackPayload, PreviewRequest, PreviewResponse, ProcessedIssue

logger = logging.getLogger(__name__)

_VISION_WEBHOOK_URL = os.environ.get("N8N_VISION_WEBHOOK_URL", "http://localhost:5678/webhook/vision")
_PROCESS_WEBHOOK_URL = os.environ.get("N8N_PROCESS_WEBHOOK_URL", "http://localhost:5678/webhook/process")

# Generous timeout for local GPU inference (qwen2.5:14b long outputs can take 30–60s)
_TIMEOUT = httpx.Timeout(120.0)

# OPTIONAL cloud accelerator for the TEXT issue-generation step. The canonical,
# fully self-hosted path is the local qwen2.5:14b via the n8n process webhook
# above; leave GROQ_API_KEY empty to use it. When a key IS set, Groq is preferred
# for its stronger model. Either way the screenshot is understood only by the
# LOCAL vision model (qwen2.5vl via n8n) — Groq never sees the image. (httpx only.)
_GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
_GROQ_BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
# gpt-oss-20b (not 120b): these are reasoning models, and 120b's thinking phase blows the free
# tier's 8000 tokens/min budget (→ 400 json_validate_failed or 429). Low reasoning effort leaves
# room for the JSON body while staying under budget.
_GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
_GROQ_REASONING_EFFORT = os.environ.get("GROQ_REASONING_EFFORT", "low")

# The software under test. Defaults keep the Wildfire example, but set these to
# reuse the pipeline against any app — the prompts below are templated on them.
_TARGET_APP_NAME = os.environ.get("TARGET_APP_NAME", "Wildfire App")
_TARGET_APP_DESCRIPTION = os.environ.get(
    "TARGET_APP_DESCRIPTION",
    "a geospatial wildfire risk simulation platform used by municipalities, "
    "firefighters, mayors, and emergency management professionals",
)
# Repo whose source the AI references in the "Relevant Code" section.
_TARGET_REPO = os.environ.get("GITHUB_REPO", "your-org/your-app")


def _apply_app_tokens(prompt: str) -> str:
    """Fill the {app_name} / {app_description} / {repo} placeholders shared by the
    prompt templates. Kept separate so both preview() and process() stay in sync."""
    return (
        prompt.replace("{app_name}", _TARGET_APP_NAME)
        .replace("{app_description}", _TARGET_APP_DESCRIPTION)
        .replace("{repo}", _TARGET_REPO)
    )


_LANGUAGE_NAMES = {
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "gl": "Galician",
}

_PREVIEW_SYSTEM_PROMPT = """You are analyzing a screenshot from the {app_name} — {app_description}.

A workshop participant selected a UI area to report feedback. Your task: look at the screenshot and generate \
exactly 4 short phrases describing what the user was most likely TRYING TO DO in that part of the UI.

Rules:
- Base suggestions PRIMARILY on what is VISIBLE in the screenshot (buttons, panels, labels, forms, data)
- Examples by context:
    Login form → "Log in to the platform", "Reset my password", "Access my account"
    Map view → "View fire risk zones", "Explore the map", "Zoom into an area"
    Statistics / charts → "Check fire statistics", "Compare risk scenarios", "Read the data"
    Settings / profile → "Update my profile", "Change my password", "Manage permissions"
    Report / export → "Export a report", "Download the data", "Share results"
    Navigation / sidebar → "Find a menu option", "Switch to another section"
- Also consider the route URL and tap coordinates (x, y, normalized 0–1 from top-left)
- Each phrase: 3–8 words, action-oriented, specific to what is visible
- Generate ALL phrases in {language_name}

Respond with ONLY valid JSON — no markdown, no explanation:
{"topic_options": ["phrase 1", "phrase 2", "phrase 3", "phrase 4"]}
"""

_SYSTEM_PROMPT = """You are a Virtual Product Manager for the {app_name} — {app_description}.

A workshop participant submitted in-app feedback by selecting a screen area. \
Your job is to process it into a structured GitHub issue.

## Your Tasks

1. **Linguistic Normalization**
   If a comment is provided, treat it as the primary source of truth for the Summary. \
   Translate to English if needed; preserve the original verbatim as the User Quote. \
   If no comment exists, infer from feedback_type, rating, context_topic, and the screenshot.

2. **Title Generation**
   Generate a short, technical one-line description — 5–12 words, specific enough to tell this issue
   apart from every other issue in the tracker. For praise, state what the user liked.
   Do NOT add a `[TYPE][Scope]` prefix or any bracketed tag — the pipeline prepends that itself.
   Never answer with a generic placeholder such as "Workshop feedback", "test", or "Feedback".

3. **Markdown Body** — produce ALL sections listed below in this exact order.

   ## Summary
   2–3 sentences. Use comment if provided; translate to English if needed. If no comment, infer from
   feedback_type, rating, context_topic, what_happened, and route. (A screenshot is attached to the issue
   separately for developers — you do not see it, so do not claim to describe its pixels.)

   ## User Quote
   > [comment verbatim — ONLY include this block if comment is non-null. If comment is null, omit the
   entire section including the heading.]

   ## Technical Environment
   | Field | Value |
   |-------|-------|
   | Route | [route] |
   | Selected Area | x=[x], y=[y] (normalized center) |
   | Model ID | [model_id or "N/A"] |
   | Rating | [rating]/5 |
   | What user was doing | [context_topic or "not specified"] |
   | What happened | [what_happened or "not specified"] |
   | Expected | [expected or "not specified"] |
   | Desired improvement | [desired or "not specified"] |
   | Workshop | [workshop_tag] |

   ## Inferred Steps to Reproduce
   ALWAYS include for type::bug. Infer steps even if no comment was provided — use route, context_topic,
   and what_happened to reconstruct a plausible reproduction path.
   Be concrete and specific: at least 3 numbered steps that name the likely UI elements for that route
   (button/tab/field labels, panel names, the map layer or value implied by context_topic), the route the
   user was on, and the observed result. Avoid vague steps like "use the feature" — a developer must be able
   to follow them verbatim. End with an "Observed:" line stating what actually happened and an "Expected:" line.
   Omit this whole section for type::feature, type::question, and type::praise.
   1. Navigate to `[route]` and …
   2. Click the "[exact label]" …
   3. …
   - Observed: …
   - Expected: …

4. **Code Analysis** — ALWAYS include both sections below when a <CODEBASE CONTEXT> block is present,
   even if certainty is low. If the provided files don't directly match, say so explicitly and suggest
   where to look — never silently omit the sections.

   ## Relevant Code
   | File | Component / Function | Why |
   |------|---------------------|-----|
   | `{repo}/…/src/...` | `ComponentName` (line ~N) | [reason this file is likely involved] |

   If no file clearly matches, write one row:
   | `{repo}/…/src/features/[route]/` | *(investigate this directory)* | Route suggests this area |

   ## Suggested Fix
   1. [Concrete suggestion referencing a specific file and function]
   2. [Second suggestion if applicable — omit if only one is warranted]

## Output Format
Respond with ONLY valid JSON — no markdown fences, no extra keys.
`markdown_body` MUST be a flat STRING containing Markdown with literal `\n` newlines — NOT a JSON object or nested dict.

{"title": "...", "markdown_body": "## Summary\n...\n\n## Technical Environment\n..."}
"""


def _webhook_content(resp: httpx.Response, name: str) -> str:
    """Pull `content` out of an n8n reply, reporting the body when it is not JSON."""
    try:
        return resp.json()["content"]
    except Exception as exc:
        # Say what came back
        raise RuntimeError(
            f"{name} webhook returned HTTP {resp.status_code} with an unusable body: "
            f"{resp.text[:300]!r}"
        ) from exc


def _call_vision_webhook(system_prompt: str, user_text: str, image_b64: str | None = None) -> str:
    """POST to the n8n vision webhook (qwen2.5vl:7b). Returns raw model output string."""
    payload: dict = {"system_prompt": system_prompt, "user_text": user_text}
    if image_b64:
        payload["image_b64"] = image_b64  # raw base64 — n8n places it in Ollama's images[] field
    resp = httpx.post(_VISION_WEBHOOK_URL, json=payload, timeout=_TIMEOUT)
    resp.raise_for_status()
    return _webhook_content(resp, "vision")


def _call_process_webhook(system_prompt: str, user_text: str, json_mode: bool = False) -> str:
    """POST to the n8n process webhook (qwen2.5:14b). Returns raw model output string."""
    payload = {"system_prompt": system_prompt, "user_text": user_text, "format_json": json_mode}
    resp = httpx.post(_PROCESS_WEBHOOK_URL, json=payload, timeout=_TIMEOUT)
    resp.raise_for_status()
    return _webhook_content(resp, "process")


def _groq_available() -> bool:
    return bool(_GROQ_API_KEY)


def _groq_body(system_prompt: str, user_text: str) -> dict:
    """Pure builder for the Groq chat-completions payload (text-only; kept pure so it is testable offline)."""
    body: dict = {
        "model": _GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        "temperature": 0.3,
        # Reasoning models spend completion tokens thinking before the JSON — leave enough room,
        # or Groq returns 400 json_validate_failed ("max completion tokens reached").
        "max_tokens": 3072,
        "response_format": {"type": "json_object"},
    }
    if _GROQ_REASONING_EFFORT:
        body["reasoning_effort"] = _GROQ_REASONING_EFFORT
    return body


def _retry_after_seconds(resp: httpx.Response, default: float = 6.0, cap: float = 15.0) -> float:
    try:
        return min(float(resp.headers.get("retry-after", default)), cap)
    except (TypeError, ValueError):
        return default


def _call_groq(system_prompt: str, user_text: str, patient: bool = False) -> str:
    """Single text-only Groq call (the account has no vision model). Returns raw content string.

    The free tier is 8000 tokens/min. `patient=True` (issue generation — latency is acceptable)
    waits out 429s across several attempts so the rich issue still gets produced. `patient=False`
    (preview/suggestions — must stay snappy) gives up quickly and lets the caller fall back."""
    body = _groq_body(system_prompt, user_text)
    url = f"{_GROQ_BASE_URL}/chat/completions"
    headers = {"Authorization": f"Bearer {_GROQ_API_KEY}", "Content-Type": "application/json"}
    max_attempts = 8 if patient else 2
    resp = None
    for attempt in range(max_attempts):
        resp = httpx.post(url, headers=headers, json=body, timeout=_TIMEOUT)
        if resp.status_code == 429 and attempt < max_attempts - 1:
            wait = _retry_after_seconds(resp, default=10.0 if patient else 3.0, cap=60.0 if patient else 8.0)
            logger.warning("Groq rate-limited (429) — waiting %.1fs (attempt %d/%d)", wait, attempt + 1, max_attempts)
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    resp.raise_for_status()  # exhausted retries → surface so the caller can fall back
    return resp.json()["choices"][0]["message"]["content"]


def _loads_obj(raw: str) -> dict:
    """Parse model JSON to a dict. Some models wrap the object in a one-element array — unwrap it."""
    data = json.loads(_strip_fences(raw))
    if isinstance(data, list):
        data = next((d for d in data if isinstance(d, dict)), {})
    if not isinstance(data, dict):
        raise ValueError(f"expected a JSON object, got {type(data).__name__}")
    return data


def _strip_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    return raw


def preview(payload: PreviewRequest) -> PreviewResponse:
    language_name = _LANGUAGE_NAMES.get(payload.language, "English")
    system_prompt = _apply_app_tokens(_PREVIEW_SYSTEM_PROMPT.replace("{language_name}", language_name))

    context = {
        "route": payload.implicit.route,
        "x": payload.implicit.x,
        "y": payload.implicit.y,
        "workshop_tag": payload.workshop_tag,
    }
    context_text = json.dumps(context, ensure_ascii=False, indent=2)

    try:
        raw = None
        # Best: the local vision model reads the screenshot. If it is unavailable, degrade gracefully
        # to Groq text (route-based guesses) so suggestions ALWAYS appear rather than vanishing.
        if payload.implicit.screenshot_b64:
            try:
                raw = _call_vision_webhook(system_prompt, context_text, payload.implicit.screenshot_b64)
            except Exception as exc:
                logger.warning("Vision preview failed (%s) — falling back to text suggestions", exc)
        if raw is None:
            if _groq_available():
                raw = _call_groq(system_prompt, context_text)
            else:
                raw = _call_process_webhook(system_prompt, context_text, json_mode=True)
        return PreviewResponse(**_loads_obj(raw))
    except Exception as exc:
        logger.warning("Preview failed: %s", exc)
        return PreviewResponse(topic_options=[])


def process(payload: FeedbackPayload, code_context: str = "") -> ProcessedIssue:
    context = {
        "feedback_type": payload.explicit.feedback_type,
        "rating": payload.explicit.rating,
        "context_topic": payload.explicit.context_topic,
        "what_happened": payload.explicit.what_happened,
        "expected": payload.explicit.expected,
        "desired": payload.explicit.desired,
        "comment": payload.explicit.comment,
        "route": payload.implicit.route,
        "x": payload.implicit.x,
        "y": payload.implicit.y,
        "model_id": payload.implicit.model_id,
        "workshop_tag": payload.workshop_tag,
    }
    # The issue is generated from the text fields only. The screenshot is NOT analysed here — it is
    # uploaded and embedded in the issue verbatim (see main.py) for developers to look at directly.
    text = json.dumps(context, ensure_ascii=False, indent=2)
    if code_context:
        text += f"\n\n<CODEBASE CONTEXT — relevant source files from the target app repo>\n{code_context}\n</CODEBASE CONTEXT>"

    system_prompt = _apply_app_tokens(_SYSTEM_PROMPT)

    # Step 2: generate the structured issue. The canonical path is the local text model (via the
    # n8n process webhook). GROQ_API_KEY is an OPTIONAL cloud accelerator — when set it is preferred
    # (stronger model), otherwise we use local Ollama. If BOTH are unreachable we still build an
    # issue from the raw fields — so a submission ALWAYS produces a GitHub issue.
    raw = None
    if _groq_available():
        try:
            raw = _call_groq(system_prompt, text, patient=True)
        except Exception as exc:
            logger.warning("Groq generation failed (%s) — trying local text model", exc)
    if raw is None:
        try:
            raw = _call_process_webhook(system_prompt, text, json_mode=True)
        except Exception as exc:
            logger.error("Local text model unreachable (%s) — using field-only fallback", exc)
            return _fallback_issue(payload)

    try:
        data = _loads_obj(raw)
        # Labels are derived
        data.pop("labels", None)
        issue = ProcessedIssue(**data)
    except Exception as exc:
        logger.error("Issue JSON parse error: %s — raw: %s", exc, raw[:200])
        return _fallback_issue(payload)

    issue.labels = labeling.derive_labels(payload)
    issue.title = labeling.normalize_title(issue.title, payload)
    return issue


def _fallback_issue(payload: FeedbackPayload) -> ProcessedIssue:
    """Build an issue straight from the submitted fields, no model involved."""
    e = payload.explicit
    comment = (e.comment or "").strip()
    summary = comment.splitlines()[0][:70] if comment else "Workshop feedback"

    rows = [
        ("Type", e.feedback_type),
        ("Rating", e.rating),
        ("Topic", e.context_topic),
        ("What happened", e.what_happened),
        ("Expected", e.expected),
        ("Desired", e.desired),
        ("Route", payload.implicit.route),
    ]
    details = "\n".join(f"| {k} | {v} |" for k, v in rows if v not in (None, ""))

    body = (
        "## Summary\n"
        f"{comment or '_No comment provided._'}\n\n"
        "## Details\n"
        "| Field | Value |\n| --- | --- |\n"
        f"{details}\n\n"
        "> Filed without AI processing — the model did not return the expected "
        "format. The reporter's words are reproduced above unchanged.\n"
    )

    return ProcessedIssue(
        title=labeling.normalize_title(summary, payload),
        markdown_body=body,
        labels=labeling.derive_labels(payload),
    )


if __name__ == "__main__":
    # Offline self-check (no network): payload shape + JSON extraction.
    body = _groq_body("sys", "hi")
    assert body["messages"][0]["content"] == "sys"
    assert body["messages"][1]["content"] == "hi"
    assert body["response_format"] == {"type": "json_object"}, "Groq calls force JSON mode"
    assert body["model"] == _GROQ_MODEL

    assert _strip_fences('```json\n{"a": 1}\n```') == '{"a": 1}'
    assert _strip_fences('{"a": 1}') == '{"a": 1}'

    assert _loads_obj('{"title": "x"}') == {"title": "x"}
    assert _loads_obj('[{"title": "x"}]') == {"title": "x"}, "unwrap one-element array"
    assert _loads_obj('```json\n[{"a":1}]\n```') == {"a": 1}
    print("ai_agent self-check ok")
