# ─────────────────────────────────────────────────────────────────────────────
# Feedback Pipeline — install / operate the full stack (ollama + n8n + backend)
#
#   make install     one-shot: check → env → build → up → pull models → frontend
#   make up          start the stack        make down     stop it
#   make logs        tail all logs          make ps       show container status
#   make models      pull the Ollama models make frontend install React deps
#   make clean       stop + delete volumes  make help     list all targets
#
# Works on Linux, macOS, and Windows (Git Bash / WSL, where `make` is available).
# On Windows PowerShell without make, use  .\install.ps1  instead.
# GPU is auto-detected: without an NVIDIA card the CPU override is applied.
# ─────────────────────────────────────────────────────────────────────────────

SHELL := /bin/sh

# Auto-detect an NVIDIA GPU. If nvidia-smi is missing, layer the CPU override
# so `docker compose up` does not fail trying to reserve a GPU that isn't there.
GPU := $(shell command -v nvidia-smi >/dev/null 2>&1 && echo 1 || echo 0)
ifeq ($(GPU),1)
COMPOSE_FILES := -f docker-compose.yml
GPU_MSG := NVIDIA GPU detected — using GPU inference.
else
COMPOSE_FILES := -f docker-compose.yml -f docker-compose.cpu.yml
GPU_MSG := No NVIDIA GPU detected — using CPU override (slower inference).
endif

DC       := docker compose $(COMPOSE_FILES)
ENV_FILE := backend/.env
ENV_EXAMPLE := backend/.env.example

.DEFAULT_GOAL := help

.PHONY: help install check env build up down restart logs ps models frontend clean

help: ## List available targets
	@echo "Feedback Pipeline — available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  $(GPU_MSG)"

install: check env build up models frontend ## Full install: everything, from zero to running
	@echo ""
	@echo "=== Install complete ==="
	@echo "  Backend  → http://localhost:9000/health"
	@echo "  n8n      → http://localhost:5678   (open this next)"
	@echo "  Ollama   → http://localhost:11434"
	@echo ""
	@echo "Final step: open http://localhost:5678, create an account, then import"
	@echo "both workflows from n8n-workflows/ (Menu → Workflows → Import from file)."

check: ## Verify Docker and Docker Compose are installed
	@command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is not installed. See https://docs.docker.com/get-docker/"; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo "ERROR: 'docker compose' (v2) is not available. Update Docker Desktop / the compose plugin."; exit 1; }
	@docker info >/dev/null 2>&1 || { echo "ERROR: Docker daemon is not running. Start Docker Desktop / the docker service."; exit 1; }
	@echo "OK: Docker and Docker Compose are ready. $(GPU_MSG)"

env: ## Create both .env files; generate a per-machine N8N_ENCRYPTION_KEY
	@if [ ! -f .env ]; then \
		key=$$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'); \
		printf 'N8N_ENCRYPTION_KEY=%s\n' "$$key" > .env; \
		echo "Created root .env with a freshly generated N8N_ENCRYPTION_KEY."; \
	else \
		echo "Root .env already exists — leaving it untouched."; \
	fi
	@if [ ! -f $(ENV_FILE) ]; then \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		echo "Created $(ENV_FILE) from example — EDIT IT before going live:"; \
		echo "  GITHUB_TOKEN, GITHUB_REPO, WORKSHOP_TOKEN"; \
	else \
		echo "$(ENV_FILE) already exists — leaving it untouched."; \
	fi

build: ## Build the backend image
	$(DC) build

up: ## Start the full stack in the background
	$(DC) up -d

down: ## Stop the stack
	$(DC) down

restart: ## Recreate containers (reloads .env changes)
	$(DC) up -d --force-recreate

logs: ## Tail logs from all services
	$(DC) logs -f

ps: ## Show container status
	$(DC) ps

models: ## Wait for Ollama, then pull both models
	@echo "Waiting for Ollama to be ready..."
	@until curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; do printf "."; sleep 2; done; echo " ready."
	@echo "Pulling qwen2.5:14b (text/JSON, ~9 GB VRAM)..."
	$(DC) exec ollama ollama pull qwen2.5:14b
	@echo "Pulling qwen2.5vl:7b (vision, ~5 GB VRAM)..."
	$(DC) exec ollama ollama pull qwen2.5vl:7b

frontend: ## Install the React package dependencies + typecheck
	@command -v npm >/dev/null 2>&1 || { echo "SKIP: npm not found — skipping frontend deps (backend stack is unaffected)."; exit 0; }
	cd overlay && npm install && npm run typecheck

clean: ## Stop the stack and delete all volumes (DESTRUCTIVE)
	$(DC) down -v
