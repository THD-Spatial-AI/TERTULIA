# Tertulia — Development & Operations Commands
# Usage: make <target>
# Requires: GNU make, PowerShell 5+, Docker Desktop, Python 3.11+, Node 20+

SHELL         := powershell.exe
.SHELLFLAGS   := -NoProfile -NonInteractive -Command
.DEFAULT_GOAL := help

# ─────────────────────────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help message
	@Get-Content Makefile | Where-Object { $$_ -match '^[a-zA-Z_-]+:.*?##' } | ForEach-Object { if ($$_ -match '^([a-zA-Z_-]+).*?##\s*(.+)') { "{0,-25} {1}" -f $$Matches[1], $$Matches[2] } }

# ─────────────────────────────────────────────────────────────────────────────
# Environment setup
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: env
env: ## Copy .env.example files (safe — will not overwrite existing files)
	if (-not (Test-Path '.env'))                { Copy-Item '.env.example' '.env';                         Write-Host 'Created .env (docker-compose vars)' }
	if (-not (Test-Path 'backend\.env'))        { Copy-Item 'backend\.env.example' 'backend\.env';         Write-Host 'Created backend\.env' }
	if (-not (Test-Path 'frontend\.env.local')) { Copy-Item 'frontend\.env.example' 'frontend\.env.local'; Write-Host 'Created frontend\.env.local' }
	Write-Host 'Fill in .env, backend\.env and frontend\.env.local before starting.'

# ─────────────────────────────────────────────────────────────────────────────
# Local (no Docker) — install & run
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: install
install: install-backend install-frontend ## Install all dependencies (backend + frontend)

.PHONY: install-backend
install-backend: ## Create Python venv and install backend dependencies
	Push-Location backend; python -m venv .venv; .\.venv\Scripts\pip install --upgrade pip; .\.venv\Scripts\pip install -r requirements.txt; Pop-Location
	Write-Host 'Backend ready. Activate with: backend\.venv\Scripts\Activate.ps1'

.PHONY: install-frontend
install-frontend: ## Install frontend npm dependencies
	Push-Location frontend; npm install; Pop-Location

.PHONY: dev-backend
dev-backend: ## Start FastAPI backend with hot-reload (port 8001)
	Push-Location backend; .\.venv\Scripts\uvicorn main:app --reload --port 8001; Pop-Location

.PHONY: dev-frontend
dev-frontend: ## Start Vite dev server (port 5173)
	Push-Location frontend; npm run dev; Pop-Location

# ─────────────────────────────────────────────────────────────────────────────
# Docker — production
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: build
build: ## Build all Docker images (production)
	docker compose build

.PHONY: build-backend
build-backend: ## Build backend Docker image only
	docker compose build backend

.PHONY: build-frontend
build-frontend: ## Build frontend Docker image only
	docker compose build frontend

.PHONY: up
up: ## Start all production containers (detached)
	docker compose up -d

.PHONY: down
down: ## Stop and remove containers
	docker compose down

.PHONY: restart
restart: down up ## Stop then restart all containers

# ─────────────────────────────────────────────────────────────────────────────
# Docker — development (live reload)
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: dev-docker
dev-docker: ## Start backend (hot-reload) + Vite frontend in Docker
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up backend frontend-dev

.PHONY: dev-docker-backend
dev-docker-backend: ## Start backend dev container only
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up backend

# ─────────────────────────────────────────────────────────────────────────────
# Logs & status
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: logs
logs: ## Tail logs from all running containers
	docker compose logs -f

.PHONY: logs-backend
logs-backend: ## Tail backend container logs
	docker compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Tail frontend container logs
	docker compose logs -f frontend

.PHONY: ps
ps: ## Show running container status
	docker compose ps

# ─────────────────────────────────────────────────────────────────────────────
# Tests & lint
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: test
test: test-backend test-frontend ## Run all tests

.PHONY: test-backend
test-backend: ## Run backend pytest suite
	Push-Location backend; .\.venv\Scripts\pytest -v; Pop-Location

.PHONY: test-frontend
test-frontend: ## Run frontend Vitest suite
	Push-Location frontend; npm test; Pop-Location

.PHONY: lint
lint: lint-backend lint-frontend ## Lint all code

.PHONY: lint-backend
lint-backend: ## Lint backend Python (ruff if available, else flake8)
	Push-Location backend; if (Test-Path '.\.venv\Scripts\ruff.exe') { .\.venv\Scripts\ruff check . } else { .\.venv\Scripts\flake8 . }; Pop-Location

.PHONY: lint-frontend
lint-frontend: ## Lint frontend TypeScript/React
	Push-Location frontend; npm run lint; Pop-Location

.PHONY: type-check
type-check: ## TypeScript type check on frontend
	Push-Location frontend; npm run type-check; Pop-Location

# ─────────────────────────────────────────────────────────────────────────────
# Build outputs
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: build-frontend-local
build-frontend-local: ## Build frontend dist/ locally (requires node)
	Push-Location frontend; npm run build; Pop-Location

# ─────────────────────────────────────────────────────────────────────────────
# Clean
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: clean
clean: ## Remove build artifacts and caches
	Remove-Item -Recurse -Force -ErrorAction SilentlyContinue 'frontend\dist', 'frontend\.vite'
	Get-ChildItem -Path 'backend' -Recurse -Filter '__pycache__' -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
	Get-ChildItem -Path 'backend' -Recurse -Filter '*.pyc' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
	Write-Host 'Cleaned.'

.PHONY: clean-docker
clean-docker: ## Remove Tertulia Docker images and volumes
	docker compose down --rmi all --volumes --remove-orphans
