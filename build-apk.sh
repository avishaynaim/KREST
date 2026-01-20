#!/data/data/com.termux/files/usr/bin/bash

# APK Build Script for Termux
# Run this script to build the Android APK

set -e

echo "======================================"
echo "Places Search - APK Builder"
echo "======================================"
echo ""

# Step 1: Install dependencies
echo "[1/6] Installing npm dependencies..."
npm install

echo ""
echo "[2/6] Installing Capacitor..."
npm install -g @capacitor/cli

echo ""
echo "[3/6] Adding Capacitor Android platform..."
npx cap add android || echo "Android platform already exists"

echo ""
echo "[4/6] Syncing web assets to Android..."
npx cap sync android

echo ""
echo "[5/6] Installing Android SDK (this will take a while)..."
if [ ! -d "$HOME/android-sdk" ]; then
    pkg install -y wget
    mkdir -p $HOME/android-sdk
    cd $HOME/android-sdk

    # Download Android command line tools
    wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
    unzip commandlinetools-linux-9477386_latest.zip

    # Set up SDK
    mkdir -p cmdline-tools/latest
    mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

    # Accept licenses and install build tools
    yes | cmdline-tools/latest/bin/sdkmanager --licenses
    cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

    cd $HOME
fi

# Set up environment
export ANDROID_SDK_ROOT=$HOME/android-sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

echo ""
echo "[6/6] Building APK..."
cd android
./gradlew assembleDebug

echo ""
echo "======================================"
echo "✅ APK BUILD COMPLETE!"
echo "======================================"
echo ""
echo "APK Location:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Install with:"
echo "adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Or copy the APK to your device and install manually."
echo ""
