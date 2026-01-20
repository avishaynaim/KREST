#!/data/data/com.termux/files/usr/bin/bash

# Start Places Search Application
# This script starts the server and opens the browser

cd /data/data/com.termux/files/home/src

# Kill any existing server
pkill -f "node.*server.js"

# Wait a moment
sleep 1

# Start server in background
nohup node server.js > ../server.log 2>&1 &

# Wait for server to start
sleep 3

# Open in browser
termux-open-url http://localhost:3000

# Show notification
termux-notification --title "Places App" --content "Server started on port 3000" --button1 "Open" --button1-action "termux-open-url http://localhost:3000"

echo "✅ Places Search App started!"
echo "🌐 Server running on http://localhost:3000"
echo "📱 Browser should open automatically"
echo ""
echo "To stop the server, run: pkill -f 'node.*server.js'"
