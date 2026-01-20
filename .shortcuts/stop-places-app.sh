#!/data/data/com.termux/files/usr/bin/bash

# Stop Places Search Application

# Kill server process
pkill -f "node.*server.js"

# Show notification
termux-notification --title "Places App" --content "Server stopped"

echo "🛑 Places Search App stopped!"
