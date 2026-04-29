#!/data/data/com.termux/files/usr/bin/bash

# KREST Server + Client Launcher
# Ensures single server instance, then runs client

set -euo pipefail

KREST_DIR="${KREST_DIR:-$HOME/KREST}"
cd "$KREST_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        KREST Server + Client Launcher         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╕${NC}"

# ── Preflight ────────────────────────────────────────────────────────────────
if [ ! -f "src/server.js" ]; then
    echo -e "${RED}✗ KREST not found at $KREST_DIR${NC}"
    echo "  Fix: git clone https://github.com/avishaynaim/KREST.git $KREST_DIR"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env missing — copying from .env.example${NC}"
    cp .env.example .env 2>/dev/null || true
fi

if ! grep -q "GOOGLE_PLACES_API_KEY=[A-Za-z0-9]" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠ Google API key not set or looks invalid${NC}"
    echo "  Edit: nano $KREST_DIR/.env"
fi

# ── Singleton enforcement ─────────────────────────────────────────────────────
echo -e "${YELLOW}→ Ensuring single server instance...${NC}"

# Kill all KREST server processes
existing_pids=$(pgrep -f "node src/server.js" 2>/dev/null || true)
if [ -n "$existing_pids" ]; then
    echo "  Killing existing: $existing_pids"
    kill $existing_pids 2>/dev/null || true
    sleep 1
fi

# Also kill stray npm processes
pkill -f "npm start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Clean stale files
rm -f server.pid .server.lock

# ── Start server ──────────────────────────────────────────────────────────────
echo -e "${GREEN}→ Starting server...${NC}"

if [ -x "./start-server.sh" ]; then
    bash ./start-server.sh
else
    nohup npm start > server.log 2>&1 &
    echo $! > server.pid
fi

# ── Wait for health ────────────────────────────────────────────────────────────
echo -n "  Waiting"
ready=0
for i in $(seq 1 20); do
    sleep 1
    echo -n "."
    if curl -s --max-time 2 http://localhost:3000/health > /dev/null 2>&1; then
        ready=1
        break
    fi
done
echo ""

if [ $ready -ne 1 ]; then
    echo -e "${RED}✗ Server not ready after 20s${NC}"
    echo "  Recent logs:"
    tail -10 server.log 2>/dev/null || echo "  (no server.log)"
    exit 1
fi

canonical_pid=$(pgrep -f "node src/server.js" | head -1)
echo "$canonical_pid" > server.pid
echo -e "${GREEN}✓ Server ready (PID: $canonical_pid)${NC}"

# ── Run client ─────────────────────────────────────────────────────────────────
echo -e "${GREEN}→ Running client...${NC}"

# Default if no args
if [ $# -eq 0 ]; then
    echo "  (default: Tel Aviv)"
    node client.js --city "Tel Aviv"
else
    node client.js "$@"
fi

client_exit=$?

echo ""
echo -e "${GREEN}✅ Client finished (exit: $client_exit)${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Server STILL RUNNING → http://localhost:3000"
echo "  PID: $(cat server.pid)"
echo "  Stop:  $KREST_DIR/stop-server.sh"
echo "  Status: $KREST_DIR/status-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $client_exit
