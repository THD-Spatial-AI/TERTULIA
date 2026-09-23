#!/usr/bin/env bash
# Full deployment script for the Feedback Pipeline on the university VM.
# Run this once after SSHing in. Safe to re-run (idempotent).
#
# Prerequisites on the VM:
#   - Docker + docker compose (v2) installed
#   - Port 80/443 open in the firewall
#   - A subdomain pointing at this VM (e.g. feedback-api.th-deg.de)
#
# Usage:
#   1. SCP this file to the VM:
#        scp pipeline/backend/deploy_vm.sh user@<vm-ip>:~/deploy_vm.sh
#      OR clone the repo directly on the VM and cd into it.
#
#   2. Edit the variables below (SUBDOMAIN, REPO_URL, WORKSHOP_TAG).
#      The script reads GITLAB_URL / GITLAB_PRIVATE_TOKEN / GITLAB_PROJECT_ID
#      / GROQ_API_KEY / WORKSHOP_TOKEN from environment variables — export them
#      before running, or paste values directly into the .env block below.
#
#   3. Run:  bash ~/deploy_vm.sh

set -euo pipefail

# ─── Configuration — edit before running ─────────────────────────────────────
SUBDOMAIN="feedback-api.th-deg.de"          # subdomain pointing at this VM
REPO_URL="https://github.com/<org>/tertulia.git"
INSTALL_DIR="/opt/feedback-pipeline"
WORKSHOP_TAG="${WORKSHOP_TAG:-workshop-2026-munich}"

# Secrets — export these before running, or fill them in here:
: "${GITHUB_TOKEN:?Export GITHUB_TOKEN before running}"
: "${GITHUB_REPO:=THD-Spatial-AI/Storcito-Wildfire}"
: "${GROQ_API_KEY:?Export GROQ_API_KEY before running}"
: "${WORKSHOP_TOKEN:?Export WORKSHOP_TOKEN before running}"
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "======================================================="
echo "  Feedback Pipeline — VM Deployment"
echo "  $(date)"
echo "======================================================="

# ── Step 1: Install dependencies ──────────────────────────────────────────────
echo ""
echo "[1/6] Installing nginx and certbot..."
sudo apt-get update -qq
sudo apt-get install -y -qq nginx certbot python3-certbot-nginx

# ── Step 2: Clone / update repo ───────────────────────────────────────────────
echo ""
echo "[2/6] Deploying application files..."
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "  Repo exists — pulling latest..."
  git -C "$INSTALL_DIR" pull --ff-only
else
  echo "  Cloning repo to $INSTALL_DIR..."
  sudo git clone "$REPO_URL" "$INSTALL_DIR"
  sudo chown -R "$USER:$USER" "$INSTALL_DIR"
fi

# ── Step 3: Write .env ────────────────────────────────────────────────────────
echo ""
echo "[3/6] Writing .env..."
cat > "$INSTALL_DIR/pipeline/backend/.env" <<EOF
GITHUB_TOKEN=$GITHUB_TOKEN
GITHUB_REPO=$GITHUB_REPO

GROQ_API_KEY=$GROQ_API_KEY

WORKSHOP_TOKEN=$WORKSHOP_TOKEN
EOF
chmod 600 "$INSTALL_DIR/pipeline/backend/.env"
echo "  .env written (mode 600)"

# ── Step 4: Start Docker container ────────────────────────────────────────────
echo ""
echo "[4/6] Starting Docker container..."
cd "$INSTALL_DIR/pipeline"
docker compose pull --quiet 2>/dev/null || true
docker compose up -d --build
echo "  Container started. Waiting for health check..."
sleep 5
HEALTH=$(curl -s http://localhost:8000/health)
if echo "$HEALTH" | grep -q '"ok"'; then
  echo "  Health check passed: $HEALTH"
else
  echo "  ERROR: health check failed — got: $HEALTH"
  docker compose logs --tail=30
  exit 1
fi

# ── Step 5: Configure nginx ───────────────────────────────────────────────────
echo ""
echo "[5/6] Configuring nginx..."
sudo tee /etc/nginx/sites-available/feedback > /dev/null <<NGINX
server {
    listen 80;
    server_name $SUBDOMAIN;

    location / {
        proxy_pass         http://127.0.0.1:8000;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/feedback /etc/nginx/sites-enabled/feedback
sudo nginx -t
sudo systemctl reload nginx
echo "  nginx configured for $SUBDOMAIN"

# ── Step 6: SSL certificate ───────────────────────────────────────────────────
echo ""
echo "[6/6] Obtaining SSL certificate..."
sudo certbot --nginx -d "$SUBDOMAIN" \
  --non-interactive --agree-tos \
  --email "admin@th-deg.de" \
  --redirect
sudo systemctl reload nginx
echo "  SSL certificate installed."

# ── Step 7: Create GitHub labels ──────────────────────────────────────────────
echo ""
echo "[7/7] Creating GitHub labels in $GITHUB_REPO..."
API="https://api.github.com/repos/$GITHUB_REPO/labels"
AUTH="Authorization: Bearer $GITHUB_TOKEN"

create_label() {
  local name="$1" color="${2#\#}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API" \
    -H "$AUTH" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"color\":\"$color\"}")
  case "$status" in
    201) echo "  created  $name" ;;
    422) echo "  exists   $name (skipped)" ;;
    *)   echo "  ERROR $status  $name" ;;
  esac
}

create_label "scope::ui"          "#0075ca"
create_label "scope::map"         "#008672"
create_label "scope::data"        "#e4e669"
create_label "scope::performance" "#d93f0b"
create_label "type::bug"          "#d73a4a"
create_label "type::feature"      "#a2eeef"
create_label "type::question"     "#cfd3d7"
create_label "priority::critical" "#b60205"
create_label "priority::high"     "#e11d48"
create_label "priority::medium"   "#f59e0b"
create_label "priority::low"      "#6b7280"
create_label "$WORKSHOP_TAG"      "#5319e7"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "======================================================="
echo "  Deployment complete!"
echo ""
echo "  Backend URL : https://$SUBDOMAIN"
echo "  Health check: https://$SUBDOMAIN/health"
echo ""
echo "  Set these in the Wildfire app before each workshop:"
echo "    VITE_WORKSHOP_MODE=true"
echo "    VITE_FEEDBACK_API_URL=https://$SUBDOMAIN"
echo "    VITE_WORKSHOP_TOKEN=$WORKSHOP_TOKEN"
echo "    VITE_WORKSHOP_TAG=$WORKSHOP_TAG"
echo ""
echo "  Smoke test:"
echo "    curl -X POST https://$SUBDOMAIN/api/v1/feedback \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -H 'X-Workshop-Token: $WORKSHOP_TOKEN' \\"
echo "      -d '{\"explicit\":{\"feedback_type\":\"bug\",\"rating\":2,\"comment\":\"test\"},\"implicit\":{\"route\":\"/map\",\"x\":0.5,\"y\":0.5},\"workshop_tag\":\"$WORKSHOP_TAG\"}'"
echo "======================================================="
