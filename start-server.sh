#!/bin/bash
cd "$(dirname "$0")"

# Ensure environment
if [ ! -f .env ]; then
    echo "ERROR: .env missing"
    exit 1
fi

# Start server detached
nohup node src/server.js > server.log 2>&1 &
echo $! > server.pid
echo "Server started (PID: $(cat server.pid))"
