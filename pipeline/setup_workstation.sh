#!/usr/bin/env bash
# Workstation setup — run once on the Ubuntu/Debian workstation.
# Installs Docker and the NVIDIA Container Toolkit if missing, starts
# all services, and pulls both Ollama models.
set -euo pipefail

COMPOSE_FILE="$(dirname "$0")/docker-compose.yml"

echo "=== Feedback Pipeline — Workstation Setup ==="

# ── 1. Docker Engine ─────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "[1/5] Docker not found — installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --batch --yes --no-tty --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    # Pop!_OS reports ID=pop in /etc/os-release, which isn't in Docker's apt repo.
    # It's an Ubuntu derivative, so hardcode ubuntu/jammy (UBUNTU_CODENAME) instead.
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        ${UBUNTU_CODENAME:-$(. /etc/os-release && echo "$VERSION_CODENAME")} stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "    Docker installed. You've been added to the 'docker' group —"
    echo "    log out/in (or run 'newgrp docker') for it to take effect, then re-run this script."
    exit 0
else
    echo "[1/5] Docker already installed."
fi

# ── 2. NVIDIA Container Toolkit ─────────────────────────────────────────────
if ! docker info 2>/dev/null | grep -q "nvidia"; then
    echo "[2/5] Installing NVIDIA Container Toolkit..."
    # Use the stable/deb path — works on Ubuntu, Pop!_OS, and all Debian derivatives
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
        | sudo gpg --batch --yes --no-tty --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -sL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
        | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
        | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y nvidia-container-toolkit
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker
    echo "    NVIDIA Container Toolkit installed."
else
    echo "[2/5] NVIDIA Container Toolkit already configured."
fi

# ── 3. Start services ────────────────────────────────────────────────────────
# Root .env holds N8N_ENCRYPTION_KEY (required by docker-compose.yml). Generate
# a per-machine key on first run so no two installs share one.
ROOT_ENV="$(dirname "$0")/.env"
if [ ! -f "$ROOT_ENV" ]; then
    KEY="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    printf 'N8N_ENCRYPTION_KEY=%s\n' "$KEY" > "$ROOT_ENV"
    echo "    Generated root .env with a fresh N8N_ENCRYPTION_KEY."
fi

echo "[3/5] Starting Docker services (Ollama + n8n + backend)..."
docker compose -f "$COMPOSE_FILE" up -d --build

# ── 4. Pull models ───────────────────────────────────────────────────────────
echo "[4/5] Waiting for Ollama to be ready..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo " ready."

echo "      Pulling qwen2.5:14b (text/JSON model, ~9 GB VRAM)..."
docker compose -f "$COMPOSE_FILE" exec ollama ollama pull qwen2.5:14b

echo "      Pulling qwen2.5vl:7b (vision model, ~5 GB VRAM)..."
docker compose -f "$COMPOSE_FILE" exec ollama ollama pull qwen2.5vl:7b

# ── 5. Status ────────────────────────────────────────────────────────────────
echo "[5/5] Verifying services..."
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "=== All done! ==="
echo ""
echo "  Ollama   → http://localhost:11434"
echo "  n8n      → http://localhost:5678   ← open this next"
echo "  Backend  → http://localhost:9000/health"
echo ""
echo "Next: open http://localhost:5678, create an account, then"
echo "      import the two workflows from n8n-workflows/ via"
echo "      Menu → Workflows → Import from file"
