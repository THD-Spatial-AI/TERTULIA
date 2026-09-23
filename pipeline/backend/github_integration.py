import base64
import logging
import os
import re
import time

import httpx

logger = logging.getLogger(__name__)

_GITHUB_API = "https://api.github.com"
_REPO = os.environ.get("GITHUB_REPO", "")
_TOKEN = os.environ.get("GITHUB_TOKEN", "")
_ASSETS_BRANCH = "feedback"

# Source root inside the Wildfire monorepo
_SRC_ROOT = "wildfire-app/frontend/src"
_SRC_EXTENSIONS = (".tsx", ".ts", ".jsx", ".js")
_SRC_EXCLUDE = ("node_modules", "dist", "build", ".test.", ".spec.", "__snapshots__")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


# ── Screenshot upload ──────────────────────────────────────────────────────────

def _ensure_assets_branch() -> bool:
    r = httpx.get(
        f"{_GITHUB_API}/repos/{_REPO}/branches/{_ASSETS_BRANCH}",
        headers=_headers(), timeout=10,
    )
    if r.status_code == 200:
        return True
    # Create branch from main HEAD
    r2 = httpx.get(
        f"{_GITHUB_API}/repos/{_REPO}/branches/main",
        headers=_headers(), timeout=10,
    )
    if r2.status_code != 200:
        return False
    sha = r2.json()["commit"]["sha"]
    r3 = httpx.post(
        f"{_GITHUB_API}/repos/{_REPO}/git/refs",
        headers=_headers(),
        json={"ref": f"refs/heads/{_ASSETS_BRANCH}", "sha": sha},
        timeout=10,
    )
    return r3.status_code == 201


def upload_screenshot(screenshot_b64: str, slug: str) -> str | None:
    """Upload a base64 JPEG to the feedback-assets branch. Returns a raw embeddable URL or None."""
    try:
        if not _ensure_assets_branch():
            logger.warning("Could not ensure feedback-assets branch")
            return None
        path = f"screenshots/{slug}.jpg"
        url = f"{_GITHUB_API}/repos/{_REPO}/contents/{path}"
        payload: dict = {
            "message": f"screenshot: {slug}",
            "content": screenshot_b64,
            "branch": _ASSETS_BRANCH,
        }
        # Include existing file SHA if present (required for updates)
        existing = httpx.get(
            url, headers=_headers(), params={"ref": _ASSETS_BRANCH}, timeout=10,
        )
        if existing.status_code == 200:
            payload["sha"] = existing.json()["sha"]
        r = httpx.put(url, headers=_headers(), json=payload, timeout=30)
        if r.status_code in (200, 201):
            return f"https://raw.githubusercontent.com/{_REPO}/{_ASSETS_BRANCH}/{path}"
        logger.warning("Screenshot upload failed: %s %s", r.status_code, r.text[:200])
    except Exception:
        logger.exception("Screenshot upload error")
    return None


# ── Source code fetching ───────────────────────────────────────────────────────

# Keyed by real route segments — see the <Route path=...> table in the app
_ROUTE_ALIASES: dict[str, list[str]] = {
    "login":           ["login", "auth", "signin"],
    "register":        ["register", "signup", "auth"],
    "forgot-password": ["forgot", "password", "reset"],
    "map":             ["map", "maplibre", "layer", "MapControl"],
    "model-dashboard": ["model-dashboard", "dashboard", "model"],
    "model-results":   ["model-results", "results", "viewer", "model"],
    "comparison":      ["comparison", "compare", "chart"],
    "admin-dashboard": ["admin-dashboard", "admin", "dashboard"],
    "notifications":   ["notification", "alert"],
    "profile":         ["profile", "user", "account"],
    "settings":        ["settings", "config", "preferences"],
    "weather":         ["weather", "wind", "climate"],
    "feedback":        ["feedback"],
}


def _squash(text: str) -> str:
    """Fold separators so `model-dashboard` matches `ModelDashboard.tsx`."""
    return re.sub(r"[-_]", "", text.lower())


# Present in every path, so useless for ranking
_NOISE = _squash(_SRC_ROOT)


def _score_file(path: str, route_keywords: list[str]) -> int:
    filename = _squash(path.split("/")[-1])
    full = _squash(path)
    score = 0
    for kw in route_keywords:
        k = _squash(kw)
        if not k or k in _NOISE:
            continue
        if k in filename:
            score += 3  # keyword in filename → stronger match
        elif k in full:
            score += 1  # keyword only in parent directory
    return score


def fetch_relevant_files(route: str, x: float, y: float) -> str:
    """Fetch source files from the Wildfire repo relevant to the given route and coordinates.
    Returns a formatted string ready to inject into the LLM prompt, or empty string on failure."""
    try:
        # Build keywords purely from route — coordinates are context for the AI, not for file lookup
        segments = [
            s.lower() for s in route.strip("/").split("/")
            if s and not s.startswith("?") and not s.isdigit()  # drop :id params
        ]
        keywords: list[str] = []
        for seg in segments:
            keywords.extend(_ROUTE_ALIASES.get(seg, [seg]))
        if not keywords:
            keywords = ["App", "main"]

        # Fetch full file tree
        r = httpx.get(
            f"{_GITHUB_API}/repos/{_REPO}/git/trees/main?recursive=1",
            headers=_headers(), timeout=15,
        )
        if r.status_code != 200:
            return ""

        tree = r.json().get("tree", [])

        # Filter and score candidate files
        candidates = []
        for item in tree:
            p = item["path"]
            if item["type"] != "blob":
                continue
            if not p.startswith(_SRC_ROOT):
                continue
            if not p.endswith(_SRC_EXTENSIONS):
                continue
            if any(ex in p for ex in _SRC_EXCLUDE):
                continue
            score = _score_file(p, keywords)
            if score > 0:
                candidates.append((score, p))

        if not candidates:
            return ""

        # Take top 2 by score. Kept small on purpose: the Groq free tier is 8000 tokens/minute,
        # and injected source is the largest slice of the prompt.
        top = sorted(candidates, key=lambda t: t[0], reverse=True)[:2]

        parts = []
        for _, path in top:
            content_r = httpx.get(
                f"{_GITHUB_API}/repos/{_REPO}/contents/{path}",
                headers=_headers(), timeout=15,
            )
            if content_r.status_code != 200:
                continue
            raw = base64.b64decode(content_r.json()["content"]).decode("utf-8", errors="replace")
            lines = raw.splitlines()
            truncated = len(lines) > 60
            snippet = "\n".join(lines[:60])
            if truncated:
                snippet += f"\n// ... ({len(lines) - 60} more lines)"
            parts.append(f"### `{path}`\n```tsx\n{snippet}\n```")

        return "\n\n".join(parts)
    except Exception:
        logger.exception("fetch_relevant_files error")
        return ""


# ── Issue creation ─────────────────────────────────────────────────────────────

def create_issue(title: str, markdown_body: str, labels: list[str]) -> str:
    url = f"{_GITHUB_API}/repos/{_REPO}/issues"
    response = httpx.post(
        url,
        headers=_headers(),
        json={"title": title, "body": markdown_body, "labels": labels},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()["html_url"]


# ── Workshop report helpers ────────────────────────────────────────────────────

def fetch_workshop_issues(tag: str) -> list[dict]:
    """Fetch all issues tagged with the workshop label (paginated, max 1000)."""
    issues: list[dict] = []
    page = 1
    while True:
        r = httpx.get(
            f"{_GITHUB_API}/repos/{_REPO}/issues",
            headers=_headers(),
            params={"labels": tag, "state": "all", "per_page": 100, "page": page},
            timeout=20,
        )
        if r.status_code != 200:
            logger.warning("fetch_workshop_issues page %d failed: %s", page, r.status_code)
            break
        batch = r.json()
        if not batch:
            break
        issues.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return issues


def push_workflow_file(content: str) -> bool:
    """Create or update the GitHub Actions workflow file in the Wildfire repo."""
    path = ".github/workflows/workshop-report.yml"
    url = f"{_GITHUB_API}/repos/{_REPO}/contents/{path}"
    encoded = base64.b64encode(content.encode()).decode()
    payload: dict = {"message": "ci: add workshop report workflow", "content": encoded}
    existing = httpx.get(url, headers=_headers(), timeout=10)
    if existing.status_code == 200:
        payload["sha"] = existing.json()["sha"]
        payload["message"] = "ci: update workshop report workflow"
    r = httpx.put(url, headers=_headers(), json=payload, timeout=15)
    return r.status_code in (200, 201)
