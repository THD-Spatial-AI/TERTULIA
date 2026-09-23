# ─────────────────────────────────────────────────────────────────────────────
# Feedback Pipeline — Windows installer (PowerShell)
#
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
#   # or, once execution policy allows it:  .\install.ps1
#
# Brings the whole stack up from a fresh checkout on Windows:
#   1. verify Docker Desktop + Docker Compose are installed and running
#   2. create backend\.env from the example (if missing)
#   3. build + start ollama + n8n + backend  (GPU auto-detected)
#   4. pull both Ollama models
#   5. install the React package dependencies (if npm is present)
#
# Requires Docker Desktop (https://docs.docker.com/get-docker/). GPU inference
# on Windows needs an NVIDIA card with WSL2 + Docker Desktop GPU support;
# otherwise the CPU override is applied automatically (slower, still works).
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$EnvFile    = 'backend\.env'
$EnvExample = 'backend\.env.example'

Write-Host '=== Feedback Pipeline — installer (Windows) ===' -ForegroundColor Cyan

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'ERROR: Docker is not installed. Install Docker Desktop:' -ForegroundColor Red
    Write-Host '  https://docs.docker.com/get-docker/'
    exit 1
}
try { docker compose version | Out-Null } catch {
    Write-Host "ERROR: 'docker compose' (v2) is not available. Update Docker Desktop." -ForegroundColor Red
    exit 1
}
try { docker info | Out-Null } catch {
    Write-Host 'ERROR: the Docker daemon is not running. Start Docker Desktop and retry.' -ForegroundColor Red
    exit 1
}

# ── GPU auto-detection ───────────────────────────────────────────────────────
$ComposeFiles = @('-f', 'docker-compose.yml')
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    Write-Host '[1/5] Docker OK. NVIDIA GPU detected — using GPU inference.'
} else {
    $ComposeFiles += @('-f', 'docker-compose.cpu.yml')
    Write-Host '[1/5] Docker OK. No NVIDIA GPU detected — using CPU override (inference will be slower).'
}
function Invoke-DC { docker compose @ComposeFiles @args }

# ── 2. Environment files ─────────────────────────────────────────────────────
# Root .env: holds N8N_ENCRYPTION_KEY (compose-level). Generated per machine so
# no two installs share an n8n credential-encryption key.
if (-not (Test-Path '.env')) {
    $bytes = New-Object 'System.Byte[]' 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $key = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    "N8N_ENCRYPTION_KEY=$key" | Out-File -FilePath '.env' -Encoding ascii -NoNewline
    Write-Host '[2/5] Created root .env with a freshly generated N8N_ENCRYPTION_KEY.'
} else {
    Write-Host '[2/5] Root .env already exists — leaving it untouched.'
}
# Backend app secrets.
if (-not (Test-Path $EnvFile)) {
    Copy-Item $EnvExample $EnvFile
    Write-Host "      Created $EnvFile from the example."
    Write-Host '      >>> EDIT IT before a real workshop: GITHUB_TOKEN, GITHUB_REPO, WORKSHOP_TOKEN <<<' -ForegroundColor Yellow
} else {
    Write-Host "      $EnvFile already exists — leaving it untouched."
}

# ── 3. Build + start ─────────────────────────────────────────────────────────
Write-Host '[3/5] Building and starting services (ollama + n8n + backend)...'
Invoke-DC up -d --build

# ── 4. Pull models ───────────────────────────────────────────────────────────
Write-Host '[4/5] Waiting for Ollama to be ready...'
while ($true) {
    try {
        Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:11434/api/tags' -TimeoutSec 3 | Out-Null
        break
    } catch { Write-Host '.' -NoNewline; Start-Sleep -Seconds 2 }
}
Write-Host ' ready.'
Write-Host '      Pulling qwen2.5:14b (text/JSON model)...'
Invoke-DC exec ollama ollama pull qwen2.5:14b
Write-Host '      Pulling qwen2.5vl:7b (vision model)...'
Invoke-DC exec ollama ollama pull qwen2.5vl:7b

# ── 5. Frontend deps ─────────────────────────────────────────────────────────
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host '[5/5] Installing React package dependencies...'
    Push-Location overlay
    try { npm install; npm run typecheck } finally { Pop-Location }
} else {
    Write-Host '[5/5] npm not found — skipping frontend deps (the backend stack is unaffected).'
}

Write-Host ''
Write-Host '=== Install complete ===' -ForegroundColor Green
Invoke-DC ps
Write-Host ''
Write-Host '  Backend  -> http://localhost:9000/health'
Write-Host '  n8n      -> http://localhost:5678   (open this next)'
Write-Host '  Ollama   -> http://localhost:11434'
Write-Host ''
Write-Host 'Final step: open http://localhost:5678, create an account, then import both'
Write-Host 'workflows from n8n-workflows\ (Menu -> Workflows -> Import from file).'
