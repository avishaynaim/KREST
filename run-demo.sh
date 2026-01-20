#!/bin/bash

# Demo script to run server and client

echo "=== Places API Demo ==="
echo ""

# Start server in background
echo "Starting server..."
node src/server.js > server-demo.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✓ Server started (PID: $SERVER_PID)"
    echo ""

    # Run client examples
    echo "=== Example 1: Search by coordinates ==="
    node client.js --lat 32.0853 --lng 34.7818
    echo ""
    echo "Press Enter to continue..."
    read

    echo "=== Example 2: Search with JSON output ==="
    node client.js --lat 32.0853 --lng 34.7818 --format json | head -30
    echo "..."
    echo ""

    # Stop server
    echo "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    echo "✓ Server stopped"
else
    echo "✗ Server failed to start"
    echo "Server log:"
    cat server-demo.log
    exit 1
fi

echo ""
echo "=== Demo Complete ==="
