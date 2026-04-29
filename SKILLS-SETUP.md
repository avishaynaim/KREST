# KREST Skills — Complete Setup Summary

**Created:** 2026-04-29 16:36
**Server Status:** ✅ RUNNING (http://localhost:3000)

---

## Skills Created

### 1. krest-server-client

**Trigger phrases:**
- "run krest"
- "start krest"
- "launch krest"
- "open krest"
- "krest server client"

**What it does:**
- Kills any existing KREST server processes (singleton enforcement)
- Starts fresh server via `start-server.sh`
- Waits for health check (up to 20s)
- Runs `client.js` with your arguments
- Server keeps running after client exits

**Usage:**
```bash
krest                          # default: Tel Aviv
krest --city Jerusalem
krest --lat 32.0853 --lng 34.7818
krest --city Haifa --rating 4.0 --reviews 50
```

**Script:** `~/KREST/run-server-and-client.sh`
**Skill file:** `~/.hermes/skills/krest-server-client/SKILL.md`

---

### 2. krest-web-client

**Trigger phrases:**
- "open krest web"
- "krest browser"
- "krest web"
- "krest ui"
- "show krest"

**What it does:**
- Checks if server is responding at `/health`
- If YES → opens browser to `http://localhost:3000`
- If NO → prints error with start instructions (exit 1)

**Usage:**
```bash
krest-web                     # open web UI
# Or via alias
alias krest-web='cd ~/KREST && ./open-web.sh'
krest-web
```

**Script:** `~/KREST/open-web.sh`
**Skill file:** `~/.hermes/skills/krest-web-client/SKILL.md`

---

## Files Created/Modified

### In ~/KREST/

| File | Purpose |
|------|---------|
| `run-server-and-client.sh` | Main script — start server + run CLI client |
| `open-web.sh` | Open web browser (server must be running) |
| `krest-launch.sh` | Start server + open browser (updated with lock) |
| `krest-widget.sh` | Toggle on/off (updated with dedup) |
| `stop-server.sh` | Stop server (already existed) |
| `status-server.sh` | Show status (already existed) |
| `start-server.sh` | Start server in background (already existed) |
| `ONE-CLICK-LAUNCHER.md` | Full documentation |

### In ~/.shortcuts/ (Termux:Widget)

| Shortcut | Target | Purpose |
|----------|--------|---------|
| `krest` | `run-server-and-client.sh` | Start + client |
| `krest-web` | `open-web.sh` | Open web only |
| `krest-widget` | `krest-widget.sh` | Toggle on/off |
| `krest-stop` | `stop-server.sh` | Stop server |
| `krest-status` | `status-server.sh` | Status check |

### Skills (Hermes)

```
~/.hermes/skills/
├── krest-server-client/SKILL.md   # run krest
└── krest-web-client/SKILL.md      # krest-web
```

---

## Duplicate Prevention

All launcher scripts use **singleton enforcement**:

```bash
# Before starting:
pkill -f "node src/server.js"      # kill all existing
rm -f server.pid .server.lock      # clean stale files

# After starting:
pgrep -f "node src/server.js"      # should be exactly 1
```

**Safe even if:**
- You run `krest` from 3 terminals simultaneously
- You tap widget 10 times rapidly
- Previous server crashed and left zombie

---

## Quick Reference

### One-liners

```bash
# Start server (if needed) + run CLI client
krest --city Tel Aviv

# Just open web UI (server must already be running)
krest-web

# Toggle server from home screen widget
# → Add Termux:Widget → select krest-widget

# Stop server
krest-stop
# or: ~/KREST/stop-server.sh

# Check status
krest-status
```

### Aliases (add to ~/.bashrc)

```bash
alias krest='cd ~/KREST && ./run-server-and-client.sh'
alias krest-web='cd ~/KREST && ./open-web.sh'
```

### Direct script execution

```bash
cd ~/KREST
./run-server-and-client.sh --lat 32.0853 --lng 34.7818
./open-web.sh
./stop-server.sh
./status-server.sh
```

---

## Widget Setup (Home Screen)

1. Install **Termux:Widget** from F-Droid
2. Long-press home → Widgets → Termux:Widget
3. Drag to home screen
4. Select script:
   - **krest-widget** → toggle button (on/off)
   - **krest** → start-only button
   - **krest-web** → open web only
   - **krest-stop** → stop button
   - **krest-status** → show status

---

## Test Results

✅ **krest-server-client skill** — verified
  - Kills duplicates correctly
  - Starts server fresh
  - Runs client with args
  - Exit code propagates

✅ **krest-web-client skill** — verified
  - Detects server health
  - Opens browser when healthy
  - Shows error + instructions when down

✅ **All scripts** — bash syntax valid
✅ **All shortcuts** — executable, linked correctly
✅ **Server** — currently running at http://localhost:3000

---

## Architecture

```
User Invocation
       │
       ├─► "run krest" ──► krest-server-client skill
       │                      └─► run-server-and-client.sh
       │                            ├─ Kill all existing servers
       │                            ├─ Start fresh server
       │                            ├─ Wait for health
       │                            └─ Run client.js "$@"
       │
       ├─► "open krest web" ──► krest-web-client skill
       │                         └─► open-web.sh
       │                               ├─ Check health
       │                               ├─ termux-open-url http://localhost:3000
       │                               └─ Show status
       │
       └─► Widget tap ──► ~/.shortcuts/krest[-web|-widget|-stop|-status]
                             └─► Corresponding script (all have dedup logic)
```

---

## Error Handling

| Scenario | krest-server-client | krest-web-client |
|----------|---------------------|------------------|
| Server already running | Kills it, restarts fresh | Detects healthy → opens browser |
| Server crashed/zombie | Kills all, starts clean | Detects unhealthy → error msg |
| No ~/KREST | Error + exit 1 | Error + exit 1 |
| .env missing | Copies example, warns | Error (server not running) |
| API key invalid | Warns, continues (fails later) | Not applicable |
| Client args invalid | Propagates client exit code | N/A |
| Browser not available | Still runs client | Prints URL for manual open |

---

## Dependencies

- **Node.js** (for server + client)
- **curl** (health checks)
- **termux-open-url** (Android browser) or **xdg-open** (Linux)
- **pkill/pgrep** (process management)
- **bash** (all scripts)

All standard on Termux.

---

## Next Steps

1. **Add aliases** to ~/.bashrc:
   ```bash
   echo "alias krest='cd ~/KREST && ./run-server-and-client.sh'" >> ~/.bashrc
   echo "alias krest-web='cd ~/KREST && ./open-web.sh'" >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Install Termux:Widget** from F-Droid for home screen button

3. **Enable Google APIs** (if not done):
   - Places API ✓
   - Geocoding API ✓
   Then test: `krest --city "Tel Aviv"`

---

## File Locations

```
~/KREST/
├── run-server-and-client.sh    # Skill: krest-server-client
├── open-web.sh                 # Skill: krest-web-client
├── krest-launch.sh             # Used by ~/.shortcuts/krest
├── krest-widget.sh             # Used by ~/.shortcuts/krest-widget
├── stop-server.sh              # Used by ~/.shortcuts/krest-stop
├── status-server.sh            # Used by ~/.shortcuts/krest-status
├── start-server.sh             # Background server starter
├── client.js                   # CLI client
├── src/server.js               # Main server
└── server.log                  # Runtime logs

~/.shortcuts/
├── krest          → ~/KREST/run-server-and-client.sh
├── krest-web      → ~/KREST/open-web.sh
├── krest-widget   → ~/KREST/krest-widget.sh
├── krest-stop     → ~/KREST/stop-server.sh
└── krest-status   → ~/KREST/status-server.sh

~/.hermes/skills/
├── krest-server-client/SKILL.md
└── krest-web-client/SKILL.md
```

---

## All Commands Cheatsheet

```bash
# Start + client
krest                                # alias, runs ~/KREST/run-server-and-client.sh
krest --city Jerusalem               # with args

# Open web
krest-web                            # alias, opens browser
~/.shortcuts/krest-web               # via shortcut

# Widget (home screen)
# → Termux:Widget → select krest-widget

# Manual control
cd ~/KREST && ./stop-server.sh       # stop
cd ~/KREST && ./status-server.sh     # status
cd ~/KREST && ./start-server.sh      # start only
tail -f ~/KREST/server.log           # logs

# Direct client (server already running)
cd ~/KREST && node client.js --city "Haifa"
```

---

**Both skills are loaded and ready to use!**
Say "run krest" or "open krest web" to invoke them.
