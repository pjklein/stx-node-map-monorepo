.PHONY: cpr commit push run clean cleannodecache cleannodeinfo

# Default commit message (override with: make cpr MSG='your message')
MSG ?= chore: update project

cpr: commit push run

commit:
	@echo "📝 Committing frontend..."
	cd frontend && git add -A && git commit -m '$(MSG)' || echo "Nothing to commit in frontend"
	@echo "📝 Committing backend..."
	cd backend && git add -A && (git add src/ || true) && git commit -m '$(MSG)' || echo "Nothing to commit in backend"
	@echo "📝 Committing monorepo..."
	git add frontend backend && git commit -m '$(MSG)' || echo "Nothing to commit in monorepo"

push:
	@echo "🚀 Pushing all repositories..."
	cd frontend && git push origin develop || echo "Frontend push failed/skipped"
	cd backend && git push origin develop || echo "Backend push failed/skipped"
	git push origin main || echo "Monorepo push failed/skipped"

run:
	@echo "▶️  Starting services..."
	@mkdir -p backend/logs frontend/logs
	@echo "Starting discoverer..."
	@(cd backend && bash -c 'source env.sh && .venv/bin/python run.py discoverer' >> logs/discoverer.log 2>&1 &) || echo "Discoverer may already be running"
	@sleep 2
	@echo "Starting API..."
	@(cd backend && bash -c 'source env.sh && .venv/bin/python run.py api' >> logs/api.log 2>&1 &) || echo "API may already be running"
	@sleep 2
	@echo "Starting UI..."
	@(cd frontend && HOST=0.0.0.0 npm run start:dev >> logs/npm.log 2>&1 &) || echo "UI may already be running"
	@echo "✅ All services started (check ports 8089 and 3000)"
	@echo "📝 Logs: backend/logs/discoverer.log, backend/logs/api.log, frontend/logs/npm.log"

clean:
	@echo "🧹 Stopping services..."
	@(pkill -9 -f "python.*run.py") > /dev/null 2>&1 &
	@(pkill -9 -f "npm start") > /dev/null 2>&1 &
	@(pkill -9 -f "node.*react") > /dev/null 2>&1 &
	@sleep 1
	@echo "✅ Services stopped"

cleannodecache:
	@echo "🗑️  Clearing node cache (data.json)..."
	@rm -f backend/data.json
	@echo "✅ Node cache cleared - next run will do full discovery"

cleannodeinfo:
	@echo "🔄 Refreshing node info without network walk..."
	@(cd backend && bash -c 'source env.sh && .venv/bin/python run.py rescan')
	@echo "✅ Node info refreshed"
