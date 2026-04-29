#!/data/data/com.termux/files/usr/bin/bash

# KREST Web Client — Open Browser
# Assumes server is already running

KREST_DIR="${KREST_DIR:-$HOME/KREST}"
cd "$KREST_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           KREST Web Interface                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╕${NC}"

# Check if server is responding
if curl -s --max-time 3 http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is UP${NC}"
    
    # Get PID if available
    if [ -f "server.pid" ]; then
        pid=$(cat server.pid 2>/dev/null)
        if [ -n "$pid" ]; then
            echo "  PID: $pid"
        fi
    fi
    
    echo -e "${GREEN}→ Opening browser...${NC}"
    
    # Try multiple methods to open browser
    if command -v termux-open-url > /dev/null 2>&1; then
        termux-open-url "http://localhost:3000"
    elif [ -n "$DISPLAY" ]; then
        xdg-open "http://localhost:3000" 2>/dev/null || true
    else
        # Fallback: try am (Android) or just print URL
        am start -a android.intent.action.VIEW -d "http://localhost:3000" > /dev/null 2>&1 || true
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Web: http://localhost:3000"
    echo "  Stop: $KREST_DIR/stop-server.sh"
    echo "  Status: $KREST_DIR/status-server.sh"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo -e "${RED}✗ Server is NOT running${NC}"
    echo ""
    echo "  Start it with one of:"
    echo "    cd ~/KREST && ./krest-launch.sh"
    echo "    alias krest='cd ~/KREST && ./run-server-and-client.sh'"
    echo "    ~/.shortcuts/krest (widget)"
    echo ""
    echo "  Or check status:"
    echo "    ~/KREST/status-server.sh"
    exit 1
fi
