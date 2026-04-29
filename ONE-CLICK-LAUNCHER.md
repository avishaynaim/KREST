# KREST One-Click Launcher

One-command setup to run the KREST server and open the client on your Android device with Termux.

## What is KREST?

Finds computer-friendly cafes & workspaces **closed on Saturday** (perfect for weekend work in Israel). Uses Google Places API with Hebrew support.

- **Web UI:** http://localhost:3000
- **API:** `/api/places/search?city=Tel+Aviv`
- **CLI:** `node client.js --city "Jerusalem"`

---

## Quick Start (3 options)

### Option 1: Termux:Widget Home Screen Button (Recommended)

1. Install **Termux:Widget** from [F-Droid](https://f-droid.org/packages/com.termux.widget/) or Play Store
2. In Termux, run:
   ```bash
   cd ~/KREST
   ./krest-launch.sh
   ```
3. Long-press your home screen → Widgets → Termux:Widget → Add
4. Tap the widget to toggle server on/off

**Result:** One-tap server control from your home screen with toast notifications! 🎯

### Option 2: Direct Launcher Icon

1. Use a file manager with `.desktop` support (e.g., Simple File Manager Pro)
2. Navigate to: `~/KREST/krest.desktop`
3. Open it → adds icon to your app drawer
4. Tap to launch server + browser

### Option 3: Termux Command

```bash
cd ~/KREST && ./krest-launch.sh
```

---

## Script Reference

| Script | Purpose |
|--------|---------|
| `./krest-launch.sh` | Start server + open web UI (main launcher) |
| `./krest-widget.sh` | Toggle script for Termux:Widget |
| `./stop-server.sh` | Stop the server |
| `./status-server.sh` | Check if server is running |
| `./start-server.sh` | Start server in background only |
| `./client.js` | CLI search client |

---

## What Each Script Does

### krest-launch.sh (Main)
- Checks if server already running
- Starts server in background if needed
- Waits for health check (up to 15s)
- Opens browser to `http://localhost:3000`
- Displays helpful status info

### krest-widget.sh (Widget)
- Toggle: start if stopped, stop if running
- Shows toast notification on state change
- Place in `~/.shortcuts/` for Termux:Widget

### stop-server.sh
- Kills all `node src/server.js` processes
- Removes PID file
- Verifies cleanup

### status-server.sh
- Shows: Running/Stopped
- Displays PID, port status, health
- Gives next-step instructions

---

## Android Desktop Setup Guide

### Create Home Screen Shortcut (without widgets)

```bash
# 1. Create a simple launcher script
cat > ~/KREST/launch-android.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd $HOME/KREST
./krest-launch.sh
EOF
chmod +x ~/KREST/launch-android.sh

# 2. Use Termux:API to create shortcut
pkg install termux-api
termux-create-shortcut --name "KREST" --script ~/KREST/launch-android.sh
```

OR manually create `.desktop` file that Termux can execute.

### Using Activity Launcher Apps

Apps like **Activity Launcher** or **Shortcut Maker** can create shortcuts to:
- Termux activity with custom command
- URL: `http://localhost:3000` (opens browser directly)

---

## Troubleshooting

### Server won't start
```bash
cd ~/KREST
cat .env | grep GOOGLE
# Should show your API key, not empty or PLACEHOLDER

# Check node_modules
ls node_modules  # should exist

# Try restarting
./stop-server.sh
./krest-launch.sh
```

### "Geocoding failed: REQUEST_DENIED"
→ Enable **Geocoding API** in Google Cloud Console
→ Wait 2 minutes and retry

### "Places API error 400"
→ Enable **Places API** in Google Cloud Console
→ Check API key restrictions allow Places API

### Port 3000 already in use
```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Widget not showing in widget picker
- Make sure script has execute permission: `chmod +x ~/.shortcuts/krest`
- Termux:Widget requires scripts in `~/.shortcuts/`
- Restart home screen or reboot if needed

---

## File Locations

```
~/KREST/
├── krest-launch.sh      ← Main one-click script
├── krest-widget.sh      ← Widget toggle script
├── stop-server.sh       ← Stop server
├── status-server.sh     ← Status check
├── start-server.sh      ← Start only
├── client.js            ← CLI client
├── server.log           ← Runtime logs
├── .env                 ← Your API keys (configured)
└── src/
    └── server.js        ← Main server

~/.shortcuts/
├── krest      → ~/KREST/krest-launch.sh (symlink)
├── yad2-start.sh
└── yad2-stop.sh
```

---

## API Setup (Required Once)

Before first use, ensure Google APIs are enabled:

1. Open: https://console.cloud.google.com/apis/dashboard
2. Enable: **Places API** ✓
3. Enable: **Geocoding API** ✓
4. Credentials → your API key → API restrictions:
   - Select: Places API, Geocoding API
5. Wait 2 minutes
6. Test: `cd ~/KREST && node client.js --city "Tel Aviv"`

---

## Usage Examples

```bash
# One-click start (opens browser)
cd ~/KREST && ./krest-launch.sh

# Start server silently (no browser)
cd ~/KREST && ./start-server.sh

# Check status
cd ~/KREST && ./status-server.sh

# Stop server
cd ~/KREST && ./stop-server.sh

# CLI search (after server started)
node client.js --city "Jerusalem" --rating 4.5 --reviews 100

# Direct API call
curl "http://localhost:3000/api/places/search?city=Haifa&limit=5"
```

---

## Advanced: Customize

Edit `krest-launch.sh` to change:
- Server startup delay (line: `for i in {1..15}`)
- Browser open command (look for `termux-open-url`)
- Auto-stop behavior

---

## Notes

- Server runs in background (PID saved in `server.pid`)
- Rate limit: 100 requests/hour per IP
- Default filters: min 4.5★, 100+ reviews, 15km radius
- Results sorted by rating (highest first)
- Hebrew UI support built-in

---

Created: 2026-04-29 15:45
Part of the KREST project (avishaynaim/KREST)
