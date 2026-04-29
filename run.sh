#!/bin/bash
# KREST Server Runner
cd "$(dirname "$0")"

# Ensure .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file missing. Copy from .env.example and add your Google API key."
    exit 1
fi

echo "================================"
echo "  Starting KREST Server"
echo "  $(date)"
echo "================================"

# Run server
export NODE_OPTIONS="--max-old-space-size=256"
node src/server.js
