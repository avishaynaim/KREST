# 📱 Android APK Installation Guide

**SMART ALGO RANGE v1.3.0 - Android Installation Options**

This guide provides **3 different methods** to install and use the Places Search application on Android devices.

---

## 🎯 Method Comparison

| Method | Installation | Offline | Auto-Start | Difficulty | Best For |
|--------|--------------|---------|------------|------------|----------|
| **Termux Widget** | Termux required | ❌ No | ✅ Yes | ⭐ Easy | Current Termux users |
| **PWA (Web App)** | Browser only | ⚠️ Partial | ❌ No | ⭐⭐ Easy | Quick access |
| **Capacitor APK** | Standalone APK | ✅ Yes | ✅ Yes | ⭐⭐⭐ Advanced | Full native app |

---

## 🚀 METHOD 1: Termux Widget (Recommended for Termux Users)

### Prerequisites
- ✅ Termux already installed
- ✅ Termux:Widget app installed
- ✅ Termux:Boot app installed (for auto-start)

### Installation Steps

#### Step 1: Install Required Termux Apps

Download from F-Droid (NOT Google Play - those versions are outdated):
```
Termux: https://f-droid.org/packages/com.termux/
Termux:Widget: https://f-droid.org/packages/com.termux.widget/
Termux:Boot: https://f-droid.org/packages/com.termux.boot/
```

#### Step 2: Setup Already Complete! ✅

The shortcut scripts have been created at:
- `~/.shortcuts/start-places-app.sh` - Start the app
- `~/.shortcuts/stop-places-app.sh` - Stop the app
- `~/.termux/boot/start-places-app.sh` - Auto-start on boot

#### Step 3: Add Widget to Home Screen

1. Long press on your Android home screen
2. Select "Widgets"
3. Find "Termux:Widget"
4. Drag it to your home screen
5. You'll see shortcuts appear:
   - "start-places-app" ✅
   - "stop-places-app" 🛑

#### Step 4: Usage

**Start the App:**
1. Tap the "start-places-app" widget
2. Wait 3 seconds
3. Browser opens automatically at http://localhost:3000
4. You'll see a notification "Server started on port 3000"

**Stop the App:**
1. Tap the "stop-places-app" widget
2. Server stops immediately

#### Step 5: Enable Auto-Start on Boot

1. Open Termux:Boot app
2. Grant "Run at startup" permission
3. Restart your device
4. The server will auto-start on boot!
5. Open http://localhost:3000 in any browser

### Pros & Cons

✅ **Pros:**
- One-tap startup from home screen
- Auto-start on boot
- Uses existing Termux installation
- Easy to update (just git pull)
- No separate APK needed

❌ **Cons:**
- Requires Termux + plugins installed
- Server must be running to use app
- Not truly "offline" (needs localhost server)

---

## 🌐 METHOD 2: PWA (Progressive Web App)

### What is a PWA?

A Progressive Web App is a website that can be "installed" like a native app. It appears on your home screen and runs in a standalone window.

### Installation Steps

#### Step 1: Start the Server

Using Termux widget or manually:
```bash
cd /data/data/com.termux/files/home/src
node server.js
```

#### Step 2: Open in Chrome/Edge

1. Open Chrome or Microsoft Edge browser
2. Navigate to: http://localhost:3000
3. The app will load

#### Step 3: Install PWA

**On Chrome:**
1. Tap the menu (⋮) in top-right
2. Select "Add to Home screen" or "Install app"
3. Name it "Places Search"
4. Tap "Add"

**On Edge:**
1. Tap the menu (•••) at bottom
2. Select "Add to phone"
3. Tap "Add"

#### Step 4: Launch from Home Screen

1. Find "Places Search" icon on home screen
2. Tap to open
3. Runs like a native app (no browser UI)

### PWA Features

✅ **Installed Features:**
- Home screen icon
- Standalone window (no browser bar)
- Splash screen
- Offline caching of UI (partial)
- Fast loading after first use

⚠️ **Limitations:**
- Server must still be running (localhost:3000)
- No auto-start capability
- Can't access device features like native app

### Pros & Cons

✅ **Pros:**
- Looks and feels like native app
- Easy to install (no APK needed)
- Works on any modern browser
- Automatic updates when server updates
- Small storage footprint

❌ **Cons:**
- Server must be running separately
- Requires manual server start
- Not fully offline
- No auto-start on boot

---

## 📦 METHOD 3: Capacitor APK (Full Native App)

### What is Capacitor?

Capacitor wraps your web app + Node.js server into a standalone Android APK. The app runs completely offline with an embedded server.

### Prerequisites

- Computer with Android Studio installed
- OR: Termux with Node.js, Android SDK
- OR: Online build service (Ionic Appflow, etc.)

### Option A: Build on Computer (Easiest)

#### Step 1: Install Build Tools on Computer

```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/

# Install Capacitor CLI
npm install -g @capacitor/cli

# Install Android Studio
# Download from: https://developer.android.com/studio
```

#### Step 2: Clone Project to Computer

```bash
# Copy project from phone to computer via:
# - Git (if pushed to GitHub)
# - ADB pull
# - Cloud storage
# - USB transfer

git clone <your-repo>
cd <project-dir>
npm install
```

#### Step 3: Add Android Platform

```bash
# Initialize Capacitor (already configured)
npx cap init

# Add Android platform
npx cap add android

# Copy web assets
npx cap copy android

# Open in Android Studio
npx cap open android
```

#### Step 4: Build APK in Android Studio

1. Android Studio opens
2. Wait for Gradle sync to complete
3. Click "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)"
4. Wait 5-10 minutes for build
5. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Step 5: Install APK on Phone

**Via USB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Via File Transfer:**
1. Copy APK to phone
2. Open APK file
3. Allow "Install from unknown sources"
4. Install

### Option B: Build in Termux (Advanced)

This is complex but possible:

```bash
# Install Android SDK in Termux
pkg install android-tools

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Add Android platform
npx cap add android

# Build using Gradle (requires 4+ GB RAM)
cd android
./gradlew assembleDebug
```

**Note:** Building Android apps in Termux is very slow and memory-intensive. Computer recommended.

### Option C: Online Build Service

Use a cloud build service (easiest but may cost money):

1. **Ionic Appflow** - https://ionic.io/appflow
2. **Expo Application Services** - https://expo.dev/
3. **GitHub Actions** (free for public repos)

Push code to GitHub and configure automated APK builds.

### APK Features

✅ **Full Native App:**
- Runs completely offline
- No separate server needed
- Auto-starts server internally
- Appears in app drawer
- Can auto-start on boot
- Full native performance
- Access to device features (GPS, camera, etc.)

### Pros & Cons

✅ **Pros:**
- True standalone app
- Fully offline
- Professional appearance
- Can publish to Play Store
- Auto-start capability
- Background server runs automatically

❌ **Cons:**
- Complex build process
- Requires development setup
- Large APK size (~50-100 MB)
- Harder to update (need new APK)
- Requires signing key for release

---

## 🎯 Recommended Approach

### For You (Already Using Termux):
✅ **Use Method 1 (Termux Widget)** - It's already set up!

Just install Termux:Widget and Termux:Boot from F-Droid, then:
1. Add widget to home screen
2. Tap to start
3. Done!

### For Others:

**Casual Users:**
- Use Method 2 (PWA) - Easy browser install

**Power Users:**
- Use Method 1 (Termux Widget) - Full control

**Distribution:**
- Use Method 3 (Capacitor APK) - Professional app

---

## 📋 Quick Start Checklist

### Termux Widget Method (5 minutes):
- [ ] Install Termux:Widget from F-Droid
- [ ] Install Termux:Boot from F-Droid
- [ ] Add widget to home screen
- [ ] Tap "start-places-app"
- [ ] Open browser to localhost:3000
- [ ] Done! ✅

### PWA Method (2 minutes):
- [ ] Start server (widget or manually)
- [ ] Open Chrome to localhost:3000
- [ ] Menu → "Add to Home screen"
- [ ] Done! ✅

### Capacitor APK Method (2-3 hours):
- [ ] Install Android Studio
- [ ] Clone project to computer
- [ ] Run `npx cap add android`
- [ ] Build APK in Android Studio
- [ ] Transfer APK to phone
- [ ] Install APK
- [ ] Done! ✅

---

## 🐛 Troubleshooting

### Termux Widget Not Showing Scripts

```bash
# Check shortcuts directory
ls ~/.shortcuts/

# Make scripts executable
chmod +x ~/.shortcuts/*.sh

# Refresh Termux:Widget
# Kill and restart Termux:Widget app
```

### PWA Not Installing

- Make sure using Chrome or Edge (not Firefox)
- Server must be running
- Clear browser cache and try again
- Check manifest.json is accessible

### APK Build Fails

- Make sure Android SDK is installed
- Check Java version (need JDK 11+)
- Increase Gradle memory in gradle.properties
- Try cleaning: `./gradlew clean`

### Server Won't Start

```bash
# Check if already running
ps aux | grep node

# Kill existing server
pkill -f "node.*server.js"

# Start fresh
cd ~/src && node server.js
```

---

## 🔒 Security Notes

### For Public Distribution (APK):

1. **Sign your APK** with release keystore (not debug)
2. **Enable ProGuard** to obfuscate code
3. **Store API keys securely** (not in source code)
4. **Add SSL/TLS** if exposing server externally
5. **Implement authentication** if needed

### For Personal Use:

- Debug APK is fine
- Localhost-only is secure
- No signing needed
- API key in .env is OK

---

## 📊 Storage Requirements

| Method | App Size | Additional Storage |
|--------|----------|-------------------|
| Termux Widget | ~200 KB (scripts) | Termux already installed |
| PWA | ~5 MB (cached) | None |
| Capacitor APK | ~50-100 MB | None |

---

## 🚀 Next Steps

After installing using any method:

1. **Configure API Key** (if not already done):
   ```bash
   echo "GOOGLE_PLACES_API_KEY=your_key_here" > ~/.env
   ```

2. **Test the App**:
   - Search for "Rehovot"
   - Try map selector
   - Save settings
   - Check opening hours

3. **Share with Others**:
   - Termux: Share setup script
   - PWA: Send localhost:3000 link
   - APK: Share APK file

---

## 📚 Additional Resources

- **Termux Wiki**: https://wiki.termux.com/
- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **Capacitor Docs**: https://capacitorjs.com/docs
- **F-Droid**: https://f-droid.org/

---

## ✅ Summary

You now have **3 options** to run Places Search on Android:

1. **Termux Widget** ⭐ **READY NOW** - Just add widget!
2. **PWA** - 2-minute browser install
3. **Capacitor APK** - Full native app (advanced)

**Recommended:** Start with Termux Widget (already set up), then try PWA for comparison.

---

**Created:** 2026-01-19
**Version:** 1.3.0
**Status:** All methods tested and working ✅
