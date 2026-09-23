# Feedback Pipeline

Workshop feedback tool for React apps. Participants submit in-app feedback through a floating dialog, an AI agent structures it, and a GitHub issue is created automatically in your repository — no manual transcription.

Works with any React app: wrap your root component with the overlay, point the backend at your GitHub repo, and you're done. It was originally built for and tested with the [Wildfire App](https://github.com/THD-Spatial-AI/Storcito-Wildfire) (THD Spatial AI), which is used as the example throughout this README.

> This is the **feedback half of [Tertulia](../README.md)** — it lives at `pipeline/` in the Tertulia monorepo. The workshop half (`../backend`, `../frontend`) launches participants into the target app and pre-registers their personas here. For the unified stack, run `docker compose` from the repo root; the standalone instructions below still work for pipeline-only development.

---

## How it works

1. **Participant clicks the feedback button** (only visible when `VITE_WORKSHOP_MODE=true`)
2. **Persona form** — collected once per session (name, role, organisation, app familiarity)
3. **Screen selection** — participant drags to highlight the problem area, a screenshot is captured
4. **Feedback dialog** — emoji rating → type (bug / idea / question) → context + comment
5. **Backend receives the payload** and immediately returns `200` — processing is async
6. **AI agent** calls two local Ollama models through n8n webhooks: `qwen2.5vl:7b` describes the screenshot, then `qwen2.5:14b` generates a structured GitHub issue title, body, and labels
7. **GitHub issue is created** in the repo configured via `GITHUB_REPO` (e.g. `THD-Spatial-AI/Storcito-Wildfire`) with screenshot, reporter info, code analysis, and suggested fix

### Local inference architecture (Phase 1 — GPU workstation)

Everything runs locally on the workstation, no external LLM API:

```
FastAPI backend  →  n8n (webhook orchestration)  →  Ollama (GPU inference)
  :9000               :5678                            :11434
                       ├─ /webhook/vision → qwen2.5vl:7b (screenshot description)
                       └─ /webhook/process → qwen2.5:14b (structured issue JSON)
```

Phase 2 moves `feedback-pipeline` + `n8n` to the university VM and keeps only `ollama` on the
workstation, exposed via a Cloudflare Tunnel (see comments in `docker-compose.yml`).

---

## Repository layout

```
tertulia/pipeline/
├── overlay/                 # React package (@spatialhub/feedback)
│   └── src/
│       ├── FeedbackOverlay.tsx   # Root component — wraps your app
│       ├── FeedbackDialog.tsx    # 3-step feedback flow
│       ├── PersonaForm.tsx       # First-session persona modal
│       ├── FeedbackButton.tsx    # FAB trigger
│       ├── api-client.ts         # HTTP calls to backend
│       ├── i18n.ts               # DE / EN / ES / GL translations
│       └── types.ts              # Shared TypeScript types
├── backend/                 # FastAPI microservice
│   ├── main.py              # Routes + background task orchestration
│   ├── models.py            # Pydantic schemas
│   ├── ai_agent.py          # Calls the n8n webhooks — issue generation
│   ├── github_integration.py # GitHub API — issues, screenshots, file fetch
│   ├── report_generator.py  # Workshop report (MD + PDF + Excel)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml   # Phase 2 — backend only, for the VM
│   ├── .env.example
│   └── push_workflow.py     # One-time: pushes GitHub Actions workflow to your app's repo
├── n8n-workflows/            # Imported into n8n — orchestrates the Ollama calls
│   ├── vision.json           # /webhook/vision  → qwen2.5vl:7b
│   └── process.json          # /webhook/process → qwen2.5:14b
├── docker-compose.yml        # Phase 1 — ollama + n8n + backend, all on the workstation
├── setup_workstation.sh      # One-shot workstation bootstrap (see below)
└── github-workflows/
    └── workshop-report.yml  # GitHub Actions workflow for report generation
```

---

## Workstation setup (Phase 1 — local GPU workstation)

Everything (Ollama, n8n, and the backend) runs in Docker on one machine with an NVIDIA GPU.

### 1. Environment variables

```bash
cp backend/.env.example backend/.env
```

Then fill in:

```
GITHUB_TOKEN=ghp_...           # Personal access token (scopes: repo + workflow)
GITHUB_REPO=your-org/your-app-repo   # Repo where issues will be created (e.g. THD-Spatial-AI/Storcito-Wildfire)

# n8n webhook URLs — use the Docker service name, NOT localhost.
# Inside the backend container, "localhost" is the container itself, so
# localhost:5678 fails with connection refused and feedback is silently dropped.
# (Only use localhost:5678 if you run uvicorn natively on the host.)
N8N_VISION_WEBHOOK_URL=http://n8n:5678/webhook/vision
N8N_PROCESS_WEBHOOK_URL=http://n8n:5678/webhook/process

WORKSHOP_TOKEN=pick-something-secret   # Rotate before each workshop
```

Rules that save you a debugging session:

- No quotes around values, no spaces around `=` — Docker's `env_file` can pass quotes through
  literally, and GitHub will reject the token with `401 Unauthorized`.
- After **any** `.env` change, recreate the container — a plain `restart` does **not** reload
  `env_file`:
  ```bash
  docker compose up -d --force-recreate feedback-pipeline
  ```
- Verify what the container actually loaded:
  ```bash
  docker compose exec feedback-pipeline printenv GITHUB_TOKEN WORKSHOP_TOKEN N8N_PROCESS_WEBHOOK_URL
  ```

### 2. Run the setup script

```bash
./setup_workstation.sh
```

This installs Docker (if missing) and the NVIDIA Container Toolkit, starts `ollama` + `n8n` +
`feedback-pipeline` via the root `docker-compose.yml`, and pulls both models (`qwen2.5:14b`,
`qwen2.5vl:7b`). If Docker had to be installed, the script adds your user to the `docker` group
and exits — log out/in (or run `newgrp docker`) and re-run it once.

### 3. Import and activate the n8n workflows

Open `http://localhost:5678`, create the owner account, then for **both**
`n8n-workflows/vision.json` and `n8n-workflows/process.json`:

1. Menu → Workflows → Import from file
2. Save the workflow (Ctrl+S) — importing alone does not persist it
3. Toggle **Active** in the top-right, and save again

Verify both are actually registered (the UI toggle can silently fail to take effect until n8n is
restarted):

```bash
docker compose exec n8n n8n list:workflow --active=true
```

If a workflow you activated doesn't show up as active, restart the container
(`docker compose restart n8n`) and check again.

### 4. Smoke-test the webhooks

```bash
curl -X POST http://localhost:5678/webhook/process \
  -H "Content-Type: application/json" \
  -d '{"system_prompt": "Reply with one short sentence.", "user_text": "Say hello."}'
```

A relevant, on-topic reply means the pipeline is wired correctly. A generic/off-topic reply
despite `HTTP 200` usually means the workflow's "Build Body" code node isn't reading the webhook
payload correctly (n8n nests the POST body under `$json.body`, not `$json` directly).

### 5. Check the backend

```bash
curl http://localhost:9000/health
```

### 6. End-to-end smoke test

This exercises the full chain — token check → n8n → Ollama → GitHub issue:

```bash
curl -X POST http://localhost:9000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -H "X-Workshop-Token: your-workshop-token" \
  -d '{"explicit":{"feedback_type":"bug","rating":3,"comment":"Smoke test - please close"},"implicit":{"route":"/test","x":0.5,"y":0.5},"workshop_tag":"smoke-test"}'
```

You should get `{"status":"received"}` immediately, and a new issue in `GITHUB_REPO` after
**~60 seconds** (LLM inference time). **A `200` here does NOT mean the issue will be created** —
all processing happens in a background task and its failures only appear in the container logs:

```bash
docker compose logs feedback-pipeline --tail 50
```

If no issue appears, see [Troubleshooting](#troubleshooting).

### 7. Create GitHub labels (once)

```bash
cd backend
bash create_labels.sh
```

This creates the 13 labels the AI assigns to every issue.

### 8. Push the GitHub Actions workflow (once)

Requires the token to have the `workflow` scope.

```bash
cd backend
python push_workflow.py
```

This adds `.github/workflows/workshop-report.yml` to the repo set in `GITHUB_REPO`. Then add `WORKSHOP_TOKEN` as a repository secret in that repo's settings.

---

## Frontend setup

These steps apply to any React app (Vite + Tailwind v4 assumed — adjust env-var handling if your bundler differs).

### 1. Install the package

In your app's `package.json`:

```json
"dependencies": {
  "@spatialhub/feedback": "file:../path/to/pipeline/overlay"
}
```

```bash
npm install
```

### 2. Add Tailwind source (v4)

In the app's main CSS file:

```css
@source "../path/to/pipeline/overlay/src";
```

### 3. Wrap the root component

```tsx
import { FeedbackOverlay } from "@spatialhub/feedback";

<FeedbackOverlay
  apiUrl={import.meta.env.VITE_FEEDBACK_API_URL}
  workshopToken={import.meta.env.VITE_WORKSHOP_TOKEN}
  workshopTag={import.meta.env.VITE_WORKSHOP_TAG}
>
  <App />
</FeedbackOverlay>
```

### 4. Set env vars before each workshop

```
VITE_WORKSHOP_MODE=true
VITE_FEEDBACK_API_URL=http://10.1.66.52:9000    # where the BACKEND runs, reachable from the browser
VITE_WORKSHOP_TOKEN=same-value-as-WORKSHOP_TOKEN-in-backend
VITE_WORKSHOP_TAG=workshop-2026-munich
```

The feedback button is hidden when `VITE_WORKSHOP_MODE` is not `true`.

Gotchas that all look like "the backend is down":

- `VITE_FEEDBACK_API_URL` is where the **backend** runs, from the **browser's** point of view.
  If your app runs on localhost but the backend is on another machine (the GPU workstation),
  `http://localhost:9000` points at your own machine — use the workstation's LAN IP instead.
- Vite bakes env vars in at startup — after changing them, **restart the dev server**
  (`npm run dev`) or rebuild. The change is invisible until you do.
- Open the app via `http://localhost:<port>`, **not** `http://127.0.0.1:<port>` — the backend's
  CORS rule allows `localhost`, `10.x.x.x`, and `192.168.x.x` origins, but not `127.0.0.1`
  (see `main.py`).
- If the app is served over **HTTPS**, the browser silently blocks calls to an `http://` backend
  (mixed content) — you need the Phase 2 / tunnel setup with an HTTPS backend URL.

---

## Generating a workshop report

While the backend is running, call the report endpoint directly:

```bash
curl -o report.zip \
  -H "X-Workshop-Token: your-token" \
  "http://localhost:9000/api/v1/workshop/report?tag=workshop-2026-munich"
```

Or, once deployed to the VM, trigger the **Generate Workshop Report** action in your app repo → Actions tab (requires `backend_url` + `WORKSHOP_TOKEN` secret).

The ZIP contains:
- `{tag}-report.md` — full markdown summary
- `{tag}-report.pdf` — printable PDF
- `{tag}-report.xlsx` — spreadsheet (Participants, Issues, Statistics sheets)

---

## GitHub labels

Every issue gets four labels assigned by the AI:

| Axis | Values |
|------|--------|
| Workshop | the `workshop_tag`, verbatim (e.g. `workshop-2026-munich`) |
| Type | `type::bug` · `type::feature` · `type::question` |
| Scope | `scope::ui` · `scope::map` · `scope::data` · `scope::performance` |
| Priority | `priority::critical` · `priority::high` · `priority::medium` · `priority::low` |

**Always use a tag that starts with `workshop-`.** The workshop label is written by the LLM,
and with tags that don't look like a workshop label (e.g. `smoke-test`) it sometimes invents a
prefix (`workshop::smoke-test`). The report generator matches issues by **exact** label, so a
mangled label means the issue silently disappears from the workshop report.

---

## Troubleshooting

Work through these in order — each one was a real failure during setup. The golden rule:
**the client always gets `200 {"status":"received"}`, even when processing fails.** The truth
is in the container logs:

```bash
docker compose logs feedback-pipeline --tail 100
```

### `401 {"detail":"Invalid workshop token"}`

The frontend's `VITE_WORKSHOP_TOKEN` doesn't match what the backend container loaded. Compare:

```bash
docker compose exec feedback-pipeline printenv WORKSHOP_TOKEN
```

If you just changed `.env`, remember: `docker compose up -d --force-recreate feedback-pipeline`
(a `restart` keeps the old env).

### `200` received, but no GitHub issue ever appears

Check the logs and match the error:

| Log line | Cause | Fix |
|----------|-------|-----|
| `api.github.com ... 401 Unauthorized` | `GITHUB_TOKEN` invalid — revoked, mangled by quotes, or trailing whitespace | Validate the token: `curl -H "Authorization: token ghp_..." https://api.github.com/user` should return your login and scopes `repo, workflow`. Fix `.env`, recreate the container |
| `ConnectError` on `localhost:5678` | n8n webhook URLs missing from `.env`, so the code falls back to `localhost` — which inside the container is the container itself | Set `N8N_*_WEBHOOK_URL=http://n8n:5678/...` in `.env`, recreate |
| `404` from the n8n webhook | Workflow imported but not active | See setup step 3 — save, activate, verify with `n8n list:workflow --active=true`, restart n8n if needed |
| `Process LLM parse error` | Model returned non-JSON | Usually transient; if constant, check the workflow's "Build Body" node reads `$json.body` and passes `format_json` |
| `Code context fetched: 0 chars` (alone) | Route not matched in the app repo, or same GitHub 401 as above | Harmless by itself — the issue is still created, just without code analysis |

Also note: issue creation takes **~60s** after the POST (GPU inference) — wait before concluding
it failed.

### Feedback button does nothing / network error in the browser

The browser console (F12 → Network tab) tells you which one:

- **Connection refused** — `VITE_FEEDBACK_API_URL` points at `localhost` but the backend is on
  another machine. Use the backend machine's LAN IP.
- **CORS error** — you opened the app via `127.0.0.1` (use `localhost`), or your origin isn't
  covered by the regex in `main.py`.
- **Mixed content (silent)** — HTTPS app calling an `http://` backend.
- **Nothing happens at all** — `VITE_WORKSHOP_MODE` isn't `true`, or you changed env vars
  without restarting the Vite dev server.

### Generic/off-topic replies from the n8n webhook despite `HTTP 200`

The workflow's "Build Body" code node isn't reading the webhook payload — n8n nests the POST
body under `$json.body`, not `$json` directly.

---

## Deploying to the university VM

Run the deploy script (SSH access required):

```bash
bash pipeline/backend/deploy_vm.sh
```

Then point `VITE_FEEDBACK_API_URL` in your app at the VM's public URL.
