#!/data/data/com.termux/files/usr/bin/bash

cd /data/data/com.termux/files/home/android

export JAVA_HOME=/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk

echo "==================================" > ../apk-build.log
echo "APK Build Started: $(date)" >> ../apk-build.log
echo "==================================" >> ../apk-build.log
echo "" >> ../apk-build.log

./gradlew assembleDebug --no-daemon >> ../apk-build.log 2>&1

if [ -f app/build/outputs/apk/debug/app-debug.apk ]; then
    echo "" >> ../apk-build.log
    echo "==================================" >> ../apk-build.log
    echo "✅ BUILD SUCCESS: $(date)" >> ../apk-build.log
    echo "==================================" >> ../apk-build.log
    echo "" >> ../apk-build.log
    echo "APK Size:" >> ../apk-build.log
    ls -lh app/build/outputs/apk/debug/app-debug.apk >> ../apk-build.log
    echo "" >> ../apk-build.log
    echo "APK Path:" >> ../apk-build.log
    echo "/data/data/com.termux/files/home/android/app/build/outputs/apk/debug/app-debug.apk" >> ../apk-build.log
else
    echo "" >> ../apk-build.log
    echo "==================================" >> ../apk-build.log
    echo "❌ BUILD FAILED: $(date)" >> ../apk-build.log
    echo "==================================" >> ../apk-build.log
fi
