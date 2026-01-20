#!/data/data/com.termux/files/usr/bin/bash

export JAVA_HOME=/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk
cd /data/data/com.termux/files/home/android

echo "Starting APK build..."
echo "This will take 10-30 minutes..."
echo ""

./gradlew assembleDebug --no-daemon

if [ $? -eq 0 ]; then
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
    echo "❌ Build failed. Check errors above."
fi
