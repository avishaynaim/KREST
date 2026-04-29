#!/data/data/com.termux/files/usr/bin/bash

# KREST One-Click Launcher
# Ensures only ONE server instance ever runs

cd "$(dirname "$0")"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

LOCK_FILE=".server.lock"
PID_FILE="server.pid"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   KREST One-Click Launcher                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╕${NC}"

# Function to get running server PID (returns 0 if found, 1 if not)
get_server_pid() {
    local pid
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE" 2>/dev/null | tr -d ' \n')
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            echo "$pid"
            return 0
        fi
    fi
    pid=$(pgrep -f "node src/server.js" 2>/dev/null | head -1)
    if [ -n "$pid" ]; then
        echo "$pid"
        return 0
    fi
    return 1
}

# Function to kill all server processes
kill_all_servers() {
    local killed=0
    
    # Kill by stored PID
    if [ -f "$PID_FILE" ]; then
        local oldpid
        oldpid=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$oldpid" ] && ps -p "$oldpid" > /dev/null 2>&1; then
            kill "$oldpid" 2>/dev/null && killed=$((killed + 1))
        fi
        rm -f "$PID_FILE"
    fi
    
    # Kill any node src/server.js (should be none after above)
    local pids
    pids=$(pgrep -f "node src/server.js" 2>/dev/null)
    if [ -n "$pids" ]; then
        for pid in $pids; do
            kill "$pid" 2>/dev/null && killed=$((killed + 1))
        done
    fi
    
    # Wait a bit
    if [ $killed -gt 0 ]; then
        sleep 0.5
    fi
}

# Check current state
current_pid=$(get_server_pid 2>/dev/null || true)

if [ -n "$current_pid" ]; then
    # Already running - verify health
    if curl -s --max-time 2 http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server already running (PID: $current_pid)${NC}"
        echo -e "${GREEN}✓ Health check OK${NC}"
        ALREADY_RUNNING=1
    else
        echo -e "${YELLOW}⚠ Server process exists but not responding${NC}"
        echo -e "${YELLOW}→ Restarting...${NC}"
        kill_all_servers
        ALREADY_RUNNING=0
    fi
else
    ALREADY_RUNNING=0
fi

# Start if needed
if [ $ALREADY_RUNNING -eq 0 ]; then
    echo -e "${GREEN}→ Starting KREST server...${NC}"
    
    # Check .env
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  .env missing${NC}"
        cp .env.example .env 2>/dev/null || true
        if [ ! -f .env ]; then
            echo "❌ Cannot create .env. Copy manually: cp .env.example .env"
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Edit .env and add GOOGLE_PLACES_API_KEY${NC}"
        echo "   Run: nano .env"
        exit 1
    fi
    
    # Clean up any strays
    kill_all_servers
    
    # Wait for lock to clear
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid
        lock_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$lock_pid" ] && ps -p "$lock_pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠ Another instance is starting (PID $lock_pid)${NC}"
            echo -e "${YELLOW}→ Waiting for lock...${NC}"
            for i in $(seq 1 10); do
                sleep 0.5
                if [ ! -f "$LOCK_FILE" ] || ! ps -p "$lock_pid" > /dev/null 2>&1; then
                    echo "  Lock released"
                    break
                fi
                echo -n "."
            done
            echo ""
        else
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Acquire lock
    echo "$$" > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT
    
    # Start server
    bash start-server.sh
    
    # Wait for readiness
    echo -n "  Waiting"
    SERVER_READY=0
    for i in $(seq 1 20); do
        sleep 1
        echo -n "."
        # Check process alive
        if ! pgrep -f "node src/server.js" > /dev/null; then
            echo ""
            echo -e "${RED}✗ Server died during startup${NC}"
            tail -3 server.log 2>/dev/null || true
            rm -f "$LOCK_FILE"
            exit 1
        fi
        # Check health
        if curl -s --max-time 2 http://localhost:3000/health > /dev/null 2>&1; then
            SERVER_READY=1
            echo " ✓"
            break
        fi
    done
    echo ""
    
    if [ $SERVER_READY -eq 0 ]; then
        echo -e "${YELLOW}⚠ Health check timeout (server may be slow)${NC}"
    fi
    
    # Save canonical PID
    local canonical_pid
    canonical_pid=$(pgrep -f "node src/server.js" | head -1)
    if [ -n "$canonical_pid" ]; then
        echo "$canonical_pid" > "$PID_FILE"
    fi
    
    rm -f "$LOCK_FILE"
    trap - EXIT
    echo -e "${GREEN}✓ Server started${NC}"
fi

# Open browser
sleep 1
if command -v termux-open-url > /dev/null 2>&1; then
    termux-open-url "http://localhost:3000"
elif [ -n "$DISPLAY" ]; then
    xdg-open "http://localhost:3000" 2>/dev/null || am start -a android.intent.action.VIEW -d "http://localhost:3000" > /dev/null 2>&1 || true
else
    echo -e "${GREEN}→ Starting CLI client...${NC}"
    node client.js || true
fi

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  KREST Server: http://localhost:3000"
echo "  Stop: ./stop-server.sh"
echo "  Status: ./status-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
