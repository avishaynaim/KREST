#!/data/data/com.termux/files/usr/bin/bash
set -e

# optional: keep CPU awake while it runs
termux-wake-lock 2>/dev/null || true

# go to your folders
cd "$HOME/APP_FOLDER/SCRIPT_FOLDER"   # e.g. $HOME/myapp/script

# pick python (python3 if available, else python)
PYBIN=$(command -v python || command -v python)

# run
"$PYBIN" app.py

# optional: release wake lock
termux-wake-unlock 2>/dev/null || true
