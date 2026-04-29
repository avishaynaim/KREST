#!/data/data/com.termux/files/usr/bin/bash
# KREST Duplicate Prevention Stress Test

set -e

cd "$HOME/KREST"

echo "═══════════════════════════════════════════════════"
echo "  KREST Duplicate Prevention Stress Test"
echo "═══════════════════════════════════════════════════"
echo ""

# Clean slate
echo "1. Cleaning up any existing servers..."
./stop-server.sh 2>/dev/null || true
rm -f .server.lock server.pid
sleep 1

count_pids() {
    pgrep -f "node src/server.js" 2>/dev/null | wc -l
}

get_pids() {
    pgrep -f "node src/server.js" 2>/dev/null
}

# Test 1: Single launch
echo "2. Test 1: Single launch"
./krest-launch.sh > /tmp/test1.log 2>&1 &
wait $!
sleep 2
count=$(count_pids)
echo "   PIDs after single launch: $count"
if [ "$count" -eq 1 ]; then
    echo "   ✅ PASS: Exactly 1 instance"
else
    echo "   ❌ FAIL: Expected 1, got $count"
fi

# Test 2: Rapid double-click
echo ""
echo "3. Test 2: Rapid double-click (simulate fast widget taps)"
./stop-server.sh > /dev/null 2>&1 || true
sleep 0.5
./krest-launch.sh > /tmp/test2a.log 2>&1 &
./krest-launch.sh > /tmp/test2b.log 2>&1 &
wait
sleep 2
count=$(count_pids)
echo "   PIDs after double launch: $count"
if [ "$count" -eq 1 ]; then
    echo "   ✅ PASS: Duplicate prevented"
else
    echo "   ❌ FAIL: Expected 1, got $count"
    echo "   PIDs: $(get_pids)"
fi

# Test 3: Triple rapid click
echo ""
echo "4. Test 3: Triple rapid click"
./stop-server.sh > /dev/null 2>&1 || true
sleep 0.5
./krest-launch.sh > /tmp/test3a.log 2>&1 &
./krest-launch.sh > /tmp/test3b.log 2>&1 &
./krest-launch.sh > /tmp/test3c.log 2>&1 &
wait
sleep 2
count=$(count_pids)
echo "   PIDs after triple launch: $count"
if [ "$count" -eq 1 ]; then
    echo "   ✅ PASS: Duplicates prevented"
else
    echo "   ❌ FAIL: Expected 1, got $count"
fi

# Test 4: Toggle test (widget behavior)
echo ""
echo "5. Test 4: Widget toggle (start → stop → start)"
./krest-widget.sh > /tmp/test4a.log 2>&1
sleep 1
count1=$(count_pids)
echo "   After start: $count1 instance(s)"
./krest-widget.sh > /tmp/test4b.log 2>&1
sleep 1
count2=$(count_pids)
echo "   After stop: $count2 instance(s)"
./krest-widget.sh > /tmp/test4c.log 2>&1
sleep 1
count3=$(count_pids)
echo "   After re-start: $count3 instance(s)"
if [ "$count1" -eq 1 ] && [ "$count2" -eq 0 ] && [ "$count3" -eq 1 ]; then
    echo "   ✅ PASS: Toggle works correctly"
else
    echo "   ❌ FAIL: Toggle broken"
fi

# Test 5: Stale PID file handling
echo ""
echo "6. Test 5: Stale PID file recovery"
./stop-server.sh > /dev/null 2>&1 || true
# Create fake PID file with non-existent PID
echo "999999" > server.pid
./krest-launch.sh > /tmp/test5.log 2>&1
sleep 2
count=$(count_pids)
echo "   PIDs after stale PID recovery: $count"
if [ "$count" -eq 1 ]; then
    echo "   ✅ PASS: Recovered from stale PID"
else
    echo "   ❌ FAIL: Expected 1, got $count"
fi

# Cleanup
echo ""
echo "7. Cleanup"
./stop-server.sh > /dev/null 2>&1 || true
rm -f .server.lock server.pid
echo "   Done"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Stress test complete!"
echo "═══════════════════════════════════════════════════"
