#!/data/data/com.termux/files/usr/bin/bash

cd /data/data/com.termux/files/home/android

export JAVA_HOME=/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk

echo "Cleaning previous build..."
./gradlew clean --no-daemon

echo ""
echo "Building APK with AAPT (not AAPT2)..."
./gradlew assembleDebug --no-daemon

if [ -f app/build/outputs/apk/debug/app-debug.apk ]; then
    echo ""
    echo "======================================"
    echo "✅ APK BUILD SUCCESSFUL!"
    echo "======================================"
    echo ""
    echo "APK Location:"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
    echo ""
    echo "Full path:"
    echo "/data/data/com.termux/files/home/android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo ""
    echo "======================================"
    echo "❌ BUILD FAILED"
    echo "======================================"
    echo "Check errors above"
fi
