#!/data/data/com.termux/files/usr/bin/bash
# Check KREST server status

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if pgrep -f "node src/server.js" > /dev/null; then
    PID=$(pgrep -f "node src/server.js")
    echo -e "${GREEN}✓ KREST server is running${NC}"
    echo "  PID: $PID"
    
    # Check port
    if pgrep -f "node src/server.js" | xargs -I {} lsof -p {} -iTCP:3000 -sTCP:LISTEN > /dev/null 2>&1; then
        echo "  Port: 3000 LISTENING"
    else
        echo "  Port: Not listening (checking...)"
    fi
    
    # Check health
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "  Health: ${GREEN}OK${NC}"
    else
        echo -e "  Health: ${RED}NOT RESPONDING${NC}"
    fi
    
    echo ""
    echo "  Web: http://localhost:3000"
    echo "  Logs: tail -f server.log"
else
    echo -e "${RED}✗ KREST server is stopped${NC}"
    echo "  Start with: cd ~/KREST && ./krest-launch.sh"
fi
