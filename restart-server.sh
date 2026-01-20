#!/bin/bash

echo "🔄 Restarting server..."
echo ""

# Find and kill old server
OLD_PID=$(ps aux | grep "node src/server.js" | grep -v grep | awk '{print $2}')

if [ ! -z "$OLD_PID" ]; then
    echo "Found old server (PID: $OLD_PID)"
    kill $OLD_PID
    sleep 2
    echo "✅ Old server stopped"
    echo ""
fi

echo "Starting new server with web interface..."
echo ""
echo "Once started, open your browser and visit:"
echo ""
echo "  🌐  http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node src/server.js
