# Running Places API in Termux (Android)

This guide explains how to run the Places API server and client in Termux on Android.

## Setup

### 1. Prerequisites Check

```bash
# Check Node.js is installed
node --version

# Check npm is installed
npm --version

# Verify project files
ls -la
```

### 2. Configure API Key

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your Google Places API key
nano .env
# or
vim .env
```

Replace `placeholder_api_key_replace_with_actual_key` with your actual Google Places API key.

## Running Server and Client

### Method 1: Two Termux Sessions (Recommended)

Termux allows multiple terminal sessions. This is the best way to run server and client.

**Session 1 - Start Server:**
1. Open Termux
2. Navigate to project: `cd ~/places-api` (or wherever your project is)
3. Start server:
   ```bash
   node src/server.js
   ```
4. You should see:
   ```
   Server listening on port 3000
   Google Places API client initialized successfully
   Configuration:
     - Default radius: 20 km
     - Max radius: 50 km
     - Default min rating: 3.0
     - Default min reviews: 20
   Rate Limiting:
     - Limit: 100 requests per hour per IP
     - Cleanup interval: every 15 minutes
   ```

**Session 2 - Run Client:**
1. Swipe from left edge of Termux window
2. Tap "NEW SESSION"
3. Navigate to project: `cd ~/places-api`
4. Run client:
   ```bash
   node client.js --city "Tel Aviv"
   ```

**Switch Between Sessions:**
- Swipe from left edge to see session drawer
- Tap on session to switch
- Or use keyboard shortcuts: `Ctrl+Alt+N` (new), `Ctrl+Alt+Left/Right` (switch)

### Method 2: Termux-services (Background Server)

If you have `termux-services` installed:

```bash
# Install termux-services (if not already installed)
pkg install termux-services

# Create service directory
mkdir -p ~/.termux/sv/places-api

# Create run script
cat > ~/.termux/sv/places-api/run << 'EOF'
#!/data/data/com.termux/files/usr/bin/sh
cd ~/places-api
exec node src/server.js 2>&1
EOF

chmod +x ~/.termux/sv/places-api/run

# Enable and start service
sv-enable places-api
sv up places-api

# Check status
sv status places-api

# Run client (in same or different session)
node client.js --city "Tel Aviv"

# Stop service when done
sv down places-api
```

### Method 3: Screen/Tmux (Terminal Multiplexer)

If you have `screen` or `tmux` installed:

**Using screen:**
```bash
# Install screen
pkg install screen

# Start screen session
screen -S places-api

# Start server
node src/server.js

# Detach: Press Ctrl+A, then D

# Run client in main session
node client.js --city "Tel Aviv"

# Reattach to server session
screen -r places-api

# Kill session when done: Ctrl+A, then K
```

**Using tmux:**
```bash
# Install tmux
pkg install tmux

# Start tmux
tmux

# Split window: Ctrl+B, then "
# Switch panes: Ctrl+B, then arrow keys

# Top pane - server
node src/server.js

# Switch to bottom pane: Ctrl+B, Down Arrow
# Bottom pane - client
node client.js --city "Tel Aviv"

# Detach: Ctrl+B, then D
# Reattach: tmux attach
```

### Method 4: Simple Background Process

For quick testing (server stops when you close terminal):

```bash
# Start server in background
node src/server.js > server.log 2>&1 &

# Save PID
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait a moment for server to start
sleep 2

# Run client
node client.js --city "Tel Aviv"

# Stop server when done
kill $SERVER_PID
```

## Client Usage Examples

Once the server is running, you can use the client in various ways:

### Basic Searches

```bash
# Search by city
node client.js --city "Tel Aviv"

# Search by coordinates
node client.js --lat 32.0853 --lng 34.7818

# With filters
node client.js --city "Jerusalem" --radius 10 --rating 4.0

# Restaurants only
node client.js --city "Haifa" --type restaurant

# JSON output
node client.js --city "Tel Aviv" --format json
```

### Save Results

```bash
# Save to file
node client.js --city "Tel Aviv" > results.txt

# Save JSON
node client.js --city "Tel Aviv" --format json > results.json
```

### Multiple Searches

```bash
# Script to search multiple cities
for city in "Tel Aviv" "Jerusalem" "Haifa"; do
    echo "Searching $city..."
    node client.js --city "$city" --format json > "${city// /-}.json"
    sleep 1
done
```

## Checking Server Status

### Method 1: Direct HTTP Check

```bash
# Install curl if needed
pkg install curl

# Check health endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Method 2: Using Client

```bash
# If client can connect, server is running
node client.js --city "Tel Aviv"

# If server is not running, you'll see:
# Error: Request failed: connect ECONNREFUSED 127.0.0.1:3000
```

### Method 3: Check Process

```bash
# Find server process
ps aux | grep "node src/server.js"

# Or check if port 3000 is in use
netstat -tuln | grep 3000
```

## Stopping the Server

Depending on how you started it:

**Method 1 (Foreground):**
- Press `Ctrl+C` in the server terminal

**Method 2 (Background PID):**
```bash
kill $SERVER_PID
# or
kill <PID_NUMBER>
```

**Method 3 (Find and Kill):**
```bash
# Find PID
ps aux | grep "node src/server.js" | grep -v grep | awk '{print $2}'

# Kill by PID
kill <PID>

# Force kill if needed
kill -9 <PID>
```

**Method 4 (Service):**
```bash
sv down places-api
```

**Method 5 (Screen/Tmux):**
- Reattach to session
- Press `Ctrl+C` in server pane
- Exit session

## Troubleshooting

### Server Won't Start

**Check port is not already in use:**
```bash
netstat -tuln | grep 3000
# or
lsof -i :3000
```

**Kill existing process:**
```bash
pkill -f "node src/server.js"
```

**Check for errors:**
```bash
node src/server.js
# Look for error messages
```

### Client Can't Connect

**Verify server is running:**
```bash
curl http://localhost:3000/health
```

**Check firewall/permissions:**
```bash
# In Termux, this usually isn't an issue for localhost
```

**Try different port:**
```bash
# Edit .env
PORT=8080

# Start server
node src/server.js

# Use client with different port
node client.js --city "Tel Aviv" --port 8080
```

### Rate Limit Errors

```bash
# Wait for rate limit to reset (shown in error message)
# Or restart server to reset in-memory limits
```

### Permission Errors

```bash
# If you see EACCES errors
chmod +x client.js
chmod +x *.sh
```

## Quick Reference Card

```bash
# VIEW QUICK REFERENCE
cat examples/client-quick-reference.txt

# VIEW EXAMPLES
cat examples/client-examples.sh

# RUN FUNCTIONALITY TEST
node test-functionality.js

# FULL HELP
node client.js --help
```

## Termux-Specific Tips

### 1. Keep Termux Running

To prevent Android from killing Termux:
- Enable "Acquire wakelock" in Termux notification
- Or use Termux:Boot to auto-start services

### 2. Save Session State

```bash
# Export session history
history > session-history.txt

# Save current working directory
pwd > last-session.txt
```

### 3. Use Aliases

Add to `~/.bashrc`:
```bash
alias places-server='cd ~/places-api && node src/server.js'
alias places-client='cd ~/places-api && node client.js'
alias places-test='cd ~/places-api && node test-functionality.js'
```

Then:
```bash
source ~/.bashrc
places-server  # Start server
places-client --city "Tel Aviv"  # Run client
```

### 4. Create Shortcuts

Create a script `~/bin/places`:
```bash
#!/data/data/com.termux/files/usr/bin/bash
cd ~/places-api
node client.js "$@"
```

```bash
chmod +x ~/bin/places
places --city "Tel Aviv"
```

## Performance Tips

1. **Use JSON Format for Large Results**: `--format json` is faster for processing
2. **Cache Results**: Save to files to avoid repeated API calls
3. **Use Specific Filters**: Narrow searches reduce API calls
4. **Monitor Rate Limits**: Watch the rate limit display
5. **Close Unused Sessions**: Free up memory

## Next Steps

- See **CLIENT.md** for complete client documentation
- See **API.md** for API endpoint details
- See **README.md** for project overview
- View examples: `ls examples/`

## Support

For issues specific to Termux:
- Check Termux Wiki: https://wiki.termux.com
- Termux Community: https://www.reddit.com/r/termux

For API issues:
- Check server logs
- Run functionality test: `node test-functionality.js`
- See troubleshooting sections in documentation
