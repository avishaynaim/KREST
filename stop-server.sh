#!/data/data/com.termux/files/usr/bin/bash
# Stop KREST server

set -e

echo "Stopping KREST server..."

# Kill processes
pkill -f "node src/server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Clean up PID file
rm -f server.pid

sleep 1

# Verify stopped
if pgrep -f "node src/server.js" > /dev/null; then
    echo "⚠️  Server still running (PID: $(pgrep -f 'node src/server.js'))"
    echo "Force killing..."
    pkill -9 -f "node src/server.js" 2>/dev/null || true
    sleep 1
fi

if pgrep -f "node src/server.js" > /dev/null; then
    echo "❌ Failed to stop server"
    exit 1
else
    echo "✅ KREST server stopped"
fi
