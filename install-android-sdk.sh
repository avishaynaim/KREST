#!/data/data/com.termux/files/usr/bin/bash

cd /data/data/com.termux/files/home/android-sdk

echo "Downloading Android Command Line Tools..."
curl -L -o cmdtools.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

echo "Extracting..."
unzip -q cmdtools.zip

echo "Setting up directory structure..."
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

echo "Installing SDK components..."
export ANDROID_SDK_ROOT=/data/data/com.termux/files/home/android-sdk
yes | cmdline-tools/latest/bin/sdkmanager --licenses
cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

echo "Creating local.properties..."
echo "sdk.dir=/data/data/com.termux/files/home/android-sdk" > /data/data/com.termux/files/home/android/local.properties

echo "✅ Android SDK installed successfully!"
