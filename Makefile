.PHONY: help install dev start stop logs clean test lint build docker-build docker-up docker-down docker-logs health

help:
	@echo "REX API Gateway - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run in development mode"
	@echo "  make start        - Run in production mode"
	@echo "  make stop         - Stop running server"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run ESLint"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start all services with Docker Compose"
	@echo "  make docker-down  - Stop all services"
	@echo "  make docker-logs  - View Docker logs"
	@echo ""
	@echo "Monitoring:"
	@echo "  make health       - Check service health"
	@echo "  make logs         - View application logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Clean up generated files"

install:
	npm install

dev:
	npm run dev

start:
	npm start

stop:
	@pkill -f "node src/server.js" || echo "No server running"

logs:
	@echo "Run: npm run dev with proper logging"

test:
	npm test

lint:
	npx eslint src/

build:
	npm run build

docker-build:
	docker build -t rex-gateway:latest .

docker-up:
	docker-compose up -d
	@echo "✅ Services started"
	@echo "🌐 Gateway: http://localhost:3000"
	@echo "🔐 Auth Server: http://localhost:8000"
	@echo "🤖 Identity Server: http://localhost:8001"
	@sleep 5
	@make health

docker-down:
	docker-compose down
	@echo "✅ Services stopped"

docker-logs:
	docker-compose logs -f gateway

docker-ps:
	docker-compose ps

health:
	@echo "Checking gateway health..."
	@curl -s http://localhost:3000/health | jq '.' || echo "Gateway not responding"

clean:
	rm -rf node_modules
	rm -rf coverage
	rm -f npm-debug.log
	@echo "✅ Cleaned up"

env-setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env from .env.example"; \
		echo "⚠️  Please update .env with your configuration"; \
	else \
		echo ".env already exists"; \
	fi
