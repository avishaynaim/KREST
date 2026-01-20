#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# optional notifications + keep CPU awake
termux-toast "Launching MyScript…" 2>/dev/null || true
termux-wake-lock 2>/dev/null || true

cd "$HOME/apps/myscript"
PYBIN=$(command -v python3 || command -v python)
LOGFILE="$PWD/app.log"

# run in background and log output
( "$PYBIN" app.py >> "$LOGFILE" 2>&1 ) &
disown

termux-toast "MyScript running in background" 2>/dev/null || true
