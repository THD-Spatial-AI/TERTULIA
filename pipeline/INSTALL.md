# Installation

The whole stack (Ollama + n8n + FastAPI backend) runs in Docker Compose, so it
installs the same way on **Linux, macOS, and Windows**. Pick the entry point for
your platform below — they all do the same thing:

1. Check that Docker + Docker Compose are installed and running
2. Create both env files (if missing): a root `.env` with a freshly generated,
   per-machine `N8N_ENCRYPTION_KEY`, and `backend/.env` from its example
3. Build and start the three containers (GPU auto-detected)
4. Pull the two Ollama models (`qwen2.5:14b`, `qwen2.5vl:7b`)
5. Install the React package's dependencies (if `npm` is present)

## Prerequisite (all platforms)

**Docker** with the Compose v2 plugin must be installed and running first:

- **Windows / macOS** → [Docker Desktop](https://docs.docker.com/get-docker/)
- **Linux** → [Docker Engine](https://docs.docker.com/engine/install/) (or, on a
  dedicated Ubuntu/Pop!_OS GPU workstation, `./setup_workstation.sh` installs
  Docker **and** the NVIDIA Container Toolkit for you)

The installers do **not** install Docker — that step is OS-specific and needs
admin rights, so it's kept separate.

## Install

### Linux / macOS (or Windows Git Bash / WSL)

```bash
make install        # or:  ./install.sh
```

### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

## GPU vs. CPU

GPU is detected automatically via `nvidia-smi`:

- **NVIDIA GPU present** → the stack uses it for inference (fast).
- **No GPU** → the installers layer `docker-compose.cpu.yml`, which clears the
  GPU reservation so the stack still starts. Inference runs on the CPU — fine for
  testing the pipeline end to end, just slower.

## Final manual step

Ollama, n8n, and the backend come up automatically, but n8n needs its two
workflows imported once:

1. Open <http://localhost:5678> and create the local n8n account
2. **Menu → Workflows → Import from file** and import both files from
   `n8n-workflows/` (`vision.json` and `process.json`)
3. Make sure each workflow is **Active**

## Secrets

- **`backend/.env`** — application secrets: `GITHUB_TOKEN`, `GITHUB_REPO`,
  `WORKSHOP_TOKEN`. Fill these in with real values before a workshop.
- **`.env`** (project root) — `N8N_ENCRYPTION_KEY`, which encrypts credentials
  stored in n8n. The installer generates a unique random key per machine; never
  share or commit it.

Both files (and every `.env*` except the `.example` templates) are git-ignored.
`docker compose` refuses to start if `N8N_ENCRYPTION_KEY` is unset, so a misconfig
fails loudly instead of silently using a weak shared default.

Then edit `backend/.env` with your real `GITHUB_TOKEN`, `GITHUB_REPO`,
and `WORKSHOP_TOKEN`, and recreate the backend so it picks them up:

```bash
make restart        # Linux/macOS/Git Bash
# or:  docker compose up -d --force-recreate feedback-pipeline
```

## Everyday commands (`make`)

| Command         | What it does                                  |
| --------------- | --------------------------------------------- |
| `make up`       | Start the stack                               |
| `make down`     | Stop it                                        |
| `make restart`  | Recreate containers (reloads `.env` changes)  |
| `make logs`     | Tail all logs                                  |
| `make ps`       | Show container status                          |
| `make models`   | (Re)pull the Ollama models                     |
| `make frontend` | Install React deps + typecheck                 |
| `make clean`    | Stop and delete all volumes (**destructive**)  |
| `make help`     | List every target                              |

On Windows without `make`, use `docker compose ...` directly, or re-run
`install.ps1` (it's safe to run again — it won't overwrite an existing `.env`).

## Verify it's running

```bash
curl http://localhost:9000/health      # backend  → {"status":"ok"} (or similar)
```

Ports: backend `9000`, n8n `5678`, Ollama `11434`.
