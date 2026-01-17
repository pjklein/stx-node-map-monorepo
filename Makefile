.PHONY: cpr commit push run clean cleannodecache cleannodeinfo

# Default commit message (override with: make cpr MSG='your message')
MSG ?= chore: update project

cpr: commit push run

commit:
	@echo "📝 Committing all changes..."
	git add -A && git commit -m '$(MSG)' || echo "Nothing to commit"

push:
	@echo "🚀 Pushing to main repository..."
	git push origin main || echo "Push failed/skipped"

run:
	@echo "▶️  Starting services..."
	@mkdir -p backend/logs frontend/logs
	@echo "Starting discoverer..."
	@(cd backend && bash -c 'source env.sh && $(PWD)/backend/.venv/bin/python run.py discoverer') >> backend/logs/discoverer.log 2>&1 &
	@sleep 2
	@echo "Starting API..."
	@(cd backend && bash -c 'source env.sh && $(PWD)/backend/.venv/bin/python run.py api') >> backend/logs/api.log 2>&1 &
	@sleep 2
	@echo "Starting UI..."
	@(cd frontend && HOST=0.0.0.0 npm run start:dev) >> frontend/logs/npm.log 2>&1 &
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
	@(cd backend && bash -c 'source env.sh && $(PWD)/backend/.venv/bin/python run.py rescan')
	@echo "✅ Node info refreshed"
