# ╔══════════════════════════════════════════════════════════════════╗
# ║                   SocialSphere Makefile                          ║
# ║    Shortcuts for common development and lab operations           ║
# ╚══════════════════════════════════════════════════════════════════╝

.PHONY: help up down logs ps build clean reset \
        seed migrate rollback \
        lab-start lab-stop \
        test test-backend test-frontend test-e2e test-vulns \
        dev-backend dev-frontend \
        docs swagger

# ─────────────────────────────────────────────
# DEFAULT
# ─────────────────────────────────────────────
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo ""
	@echo "  ╔═══════════════════════════════════════╗"
	@echo "  ║         SocialSphere Commands         ║"
	@echo "  ╚═══════════════════════════════════════╝"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# ─────────────────────────────────────────────
# DOCKER
# ─────────────────────────────────────────────
up: ## Start all services (Training Mode - VULNERABLE)
	@echo "⚠️  Starting in TRAINING MODE (intentionally vulnerable)..."
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d
	@echo "✅ Services started. Open http://localhost"

up-secure: ## Start all services (Secure Mode)
	@echo "🔒 Starting in SECURE MODE (hardened)..."
	cp .env.secure .env
	docker compose -f docker-compose.yml -f docker-compose.secure.yml up -d
	@echo "✅ Secure services started. Open http://localhost"

down: ## Stop all services
	docker compose down

down-v: ## Stop all services and remove volumes (DESTROYS DATA)
	docker compose down -v

logs: ## Follow all logs
	docker compose logs -f

logs-backend: ## Follow backend logs
	docker compose logs -f backend

logs-frontend: ## Follow frontend logs
	docker compose logs -f frontend

ps: ## Show running containers
	docker compose ps

build: ## Build all Docker images
	docker compose build --no-cache

# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────
migrate: ## Run database migrations
	docker compose exec backend npm run migrate

rollback: ## Rollback last migration
	docker compose exec backend npm run migrate:rollback

seed: ## Seed database with demo data
	docker compose exec backend npm run seed

db-reset: ## Reset and reseed database
	docker compose exec backend npm run db:reset

db-shell: ## Open PostgreSQL shell
	docker compose exec postgres psql -U socialsphere -d socialsphere

redis-shell: ## Open Redis CLI
	docker compose exec redis redis-cli

# ─────────────────────────────────────────────
# DEVELOPMENT
# ─────────────────────────────────────────────
dev-backend: ## Start backend in dev mode (local, no Docker)
	cd backend && npm run dev

dev-frontend: ## Start frontend in dev mode (local, no Docker)
	cd frontend && npm run dev

install: ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install

# ─────────────────────────────────────────────
# TESTING
# ─────────────────────────────────────────────
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend unit + integration tests
	cd backend && npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

test-e2e: ## Run Playwright E2E tests
	cd frontend && npx playwright test

test-vulns: ## Run automated vulnerability tests
	cd backend && npm run test:vulns

# ─────────────────────────────────────────────
# LAB MODE
# ─────────────────────────────────────────────
lab-info: ## Show all vulnerability challenges
	@echo ""
	@echo "  ╔═══════════════════════════════════════════╗"
	@echo "  ║      SocialSphere Vulnerability Labs      ║"
	@echo "  ║   http://localhost/lab  ←  CTF Panel      ║"
	@echo "  ╚═══════════════════════════════════════════╝"
	@echo ""
	@echo "  50 vulnerabilities spanning OWASP Top 10"
	@echo "  Difficulties: Easy | Medium | Hard | Expert"
	@echo ""

switch-training: ## Switch to Training Mode (vulnerable)
	@sed -i 's/TRAINING_MODE=.*/TRAINING_MODE=true/' .env
	docker compose restart backend
	@echo "⚠️  Switched to TRAINING MODE"

switch-secure: ## Switch to Secure Mode
	@sed -i 's/TRAINING_MODE=.*/TRAINING_MODE=false/' .env
	docker compose restart backend
	@echo "🔒 Switched to SECURE MODE"

# ─────────────────────────────────────────────
# DOCUMENTATION
# ─────────────────────────────────────────────
docs: ## Serve documentation locally
	cd docs && npx serve .

swagger: ## Open Swagger UI
	@echo "📖 Swagger UI: http://localhost:4000/api-docs"

# ─────────────────────────────────────────────
# CLEAN
# ─────────────────────────────────────────────
clean: ## Remove build artifacts
	cd backend && rm -rf dist/
	cd frontend && rm -rf .next/ out/

reset: down-v clean ## Full reset (WARNING: destroys all data)
	@echo "💥 Full reset complete"

# ─────────────────────────────────────────────
# MONITORING
# ─────────────────────────────────────────────
grafana: ## Open Grafana dashboard
	@echo "📊 Grafana: http://localhost:3001 (admin/admin)"

prometheus: ## Open Prometheus
	@echo "📈 Prometheus: http://localhost:9090"

minio: ## Open MinIO console
	@echo "📦 MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"

mailhog: ## Open MailHog
	@echo "📧 MailHog: http://localhost:8025"
