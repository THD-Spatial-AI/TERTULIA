#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Feedback Pipeline — cross-platform installer (Linux / macOS / Git Bash / WSL)
#
#   ./install.sh
#
# Brings the whole stack up from a fresh checkout:
#   1. verify Docker + Docker Compose are installed and running
#   2. create backend/.env from the example (if missing)
#   3. build + start ollama + n8n + backend  (GPU auto-detected)
#   4. pull both Ollama models
#   5. install the React package dependencies (if npm is present)
#
# This does NOT install Docker for you (that needs OS-specific, root-level steps
# and differs per platform). If Docker is missing it tells you where to get it.
# On a dedicated Ubuntu/Pop!_OS GPU workstation, setup_workstation.sh can also
# install Docker + the NVIDIA Container Toolkit automatically.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE="backend/.env"
ENV_EXAMPLE="backend/.env.example"

echo "=== Feedback Pipeline — installer ==="

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not installed."
    echo "  Linux:   https://docs.docker.com/engine/install/  (or run ./setup_workstation.sh)"
    echo "  Windows/macOS: install Docker Desktop → https://docs.docker.com/get-docker/"
    exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: 'docker compose' (v2) is not available. Update Docker Desktop / the compose plugin."
    exit 1
fi
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: the Docker daemon is not running. Start Docker Desktop / the docker service and retry."
    exit 1
fi

# ── GPU auto-detection ───────────────────────────────────────────────────────
COMPOSE_FILES=(-f docker-compose.yml)
if command -v nvidia-smi >/dev/null 2>&1; then
    echo "[1/5] Docker OK. NVIDIA GPU detected — using GPU inference."
else
    COMPOSE_FILES+=(-f docker-compose.cpu.yml)
    echo "[1/5] Docker OK. No NVIDIA GPU detected — using CPU override (inference will be slower)."
fi
dc() { docker compose "${COMPOSE_FILES[@]}" "$@"; }

# ── 2. Environment files ─────────────────────────────────────────────────────
# Root .env: holds N8N_ENCRYPTION_KEY (compose-level). Generated per machine so
# no two installs share an n8n credential-encryption key.
if [ ! -f .env ]; then
    KEY="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    printf 'N8N_ENCRYPTION_KEY=%s\n' "$KEY" > .env
    echo "[2/5] Created root .env with a freshly generated N8N_ENCRYPTION_KEY."
else
    echo "[2/5] Root .env already exists — leaving it untouched."
fi
# Backend app secrets.
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "      Created $ENV_FILE from the example."
    echo "      >>> EDIT IT before a real workshop: GITHUB_TOKEN, GITHUB_REPO, WORKSHOP_TOKEN <<<"
else
    echo "      $ENV_FILE already exists — leaving it untouched."
fi

# ── 3. Build + start ─────────────────────────────────────────────────────────
echo "[3/5] Building and starting services (ollama + n8n + backend)..."
dc up -d --build

# ── 4. Pull models ───────────────────────────────────────────────────────────
echo "[4/5] Waiting for Ollama to be ready..."
until curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; do printf "."; sleep 2; done
echo " ready."
echo "      Pulling qwen2.5:14b (text/JSON model)..."
dc exec ollama ollama pull qwen2.5:14b
echo "      Pulling qwen2.5vl:7b (vision model)..."
dc exec ollama ollama pull qwen2.5vl:7b

# ── 5. Frontend deps ─────────────────────────────────────────────────────────
if command -v npm >/dev/null 2>&1; then
    echo "[5/5] Installing React package dependencies..."
    ( cd overlay && npm install && npm run typecheck )
else
    echo "[5/5] npm not found — skipping frontend deps (the backend stack is unaffected)."
fi

echo ""
echo "=== Install complete ==="
dc ps
echo ""
echo "  Backend  → http://localhost:9000/health"
echo "  n8n      → http://localhost:5678   (open this next)"
echo "  Ollama   → http://localhost:11434"
echo ""
echo "Final step: open http://localhost:5678, create an account, then import both"
echo "workflows from n8n-workflows/ (Menu → Workflows → Import from file)."
