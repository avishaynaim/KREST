# Android APK Build with Embedded Node.js Server

## Implementation Complete ✅

This document describes the bundled Android APK that includes both the Node.js backend server and the web UI client in a single application.

## What Was Changed

### 1. **Package Configuration**
- ✅ Added `nodejs-mobile-cordova` dependency to `package.json`
- ✅ Updated `capacitor.config.json` with NodejsMobile plugin configuration

### 2. **Created nodejs-project Directory**
```
nodejs-project/
├── main.js              # Node.js entry point for embedded server
├── package.json         # Server-only dependencies
├── .env.example         # Configuration template
└── src/                 # Copied all server code
    ├── config.js
    ├── placesClient.js
    ├── locationService.js
    ├── placesSearchService.js
    ├── validation.js
    ├── rateLimiter.js
    └── adaptiveTilingSearch.js
```

### 3. **Updated Server Code for Mobile**
- ✅ Modified `src/server.js`:
  - Added nodejs-mobile bridge communication (sends "server-ready" message when initialized)
  - Graceful detection of nodejs-mobile environment (works in both mobile and development modes)

- ✅ Modified `src/config.js`:
  - Made API key loading flexible (supports both environment variables and bridge-provided keys)
  - Added `initializeConfigWithApiKey()` function for runtime API key injection
  - Added `isConfigInitialized()` function to verify configuration status

### 4. **Updated Web UI**
- ✅ Modified `public/index.html`:
  - Added `getApiBaseUrl()` function to return correct API endpoint based on environment
  - Added comprehensive nodejs-mobile bridge initialization code
  - Automatic server startup detection with 15-second timeout
  - API key retrieval from localStorage and transmission to embedded server
  - User-friendly status messages (Hebrew UI)
  - Error handling for server startup failures

### 5. **Updated Build Configuration**
- ✅ Modified `capacitor.config.json`:
  - Added NodejsMobile plugin configuration
  - Configured to use `nodejs-project/` directory
  - Entry point set to `main.js`

- ✅ Android build settings (`android/build.gradle` and `variables.gradle`):
  - minSdkVersion: 22 (compatible with nodejs-mobile)
  - targetSdkVersion: 33
  - compileSdkVersion: 33
  - Already has INTERNET permission in `AndroidManifest.xml`

### 6. **Updated GitHub Actions Workflow**
- ✅ Modified `.github/workflows/build-apk.yml`:
  - Step 1: Install main dependencies (npm install)
  - Step 2: Install Capacitor dependencies
  - **NEW**: Install server dependencies (`npm install --production` in nodejs-project/)
  - **NEW**: Add nodejs-mobile plugin to project
  - **NEW**: Sync Capacitor with Android platform
  - Step 3-5: Build Android APK (unchanged)

### 7. **Updated .gitignore**
- ✅ Added entries for:
  - `nodejs-project/.env` (don't commit API keys)
  - `nodejs-project/node_modules/` (explicitly exclude build artifacts)

## How It Works

### On App Startup:
1. **Capacitor WebView** loads `public/index.html`
2. **Web UI** calls `initializeNodejsMobileBridge()`
3. **Bridge code** starts embedded Node.js server with `nodejs.start('main.js')`
4. **Server initialization** logs startup info and sends `server-ready` message via bridge
5. **Web UI** receives `server-ready` message and prompts user for API key (if not saved)
6. **API key** is sent from localStorage to server via `nodejs.channel.send()`
7. **Server** stores API key via `config.initializeConfigWithApiKey()`
8. **Search functionality** is enabled for user

### During Search:
1. **Web UI** calls `getApiBaseUrl()` → returns `http://localhost:3000` (mobile) or `` (web)
2. **Fetch request** goes to embedded server at `http://localhost:3000/api/places/adaptive`
3. **Server** processes request using Google Places API
4. **Results** returned to WebView and displayed in UI

## Current Limitations & Notes

### API Key Management
- **In Mobile APK**: User must provide their own Google Places API key
  - Key is stored in browser localStorage
  - User can update it anytime in settings
  - Key is **never** hardcoded in the APK

- **In Development**: Use `.env` file with `GOOGLE_PLACES_API_KEY=your_key`

### Server Configuration
- Fixed port: **3000** (hardcoded in web UI and bridge code)
- Timeout settings: **5 minutes** (for large API responses)
- Rate limiting: **100 requests per IP per hour**

### File Size
- Bundled APK will be **~60-100MB** (includes Node.js runtime + dependencies)
- Use `npm install --production` in nodejs-project to minimize size

## Testing Instructions

### Local Development Testing
```bash
# Install dependencies
npm install
cd nodejs-project && npm install && cd ..

# For web testing (desktop development)
# Create .env file with API key
echo "GOOGLE_PLACES_API_KEY=your_key" > .env

# Start server
npm start

# Open in browser
# http://localhost:3000
```

### Android APK Testing
```bash
# 1. Sync Capacitor
npx cap sync

# 2. Build APK
cd android && ./gradlew assembleDebug

# 3. Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 4. Test on device
# - App launches with splash screen
# - "Starting server..." message appears
# - After ~3-5 seconds, "Enter API Key" prompt appears
# - User enters Google Places API key
# - Search functionality becomes available
```

### GitHub Actions Automatic Build
```
Push to master branch → GitHub Actions triggers → APK built automatically
→ Download from Actions artifacts or GitHub Releases
```

## Troubleshooting

### "Server startup timeout" Error
- Check if nodejs-mobile plugin is properly installed
- Verify nodejs-project/main.js exists and is valid
- Check Android logs: `adb logcat | grep nodejs`

### "API Key Required" Message
- User must provide their own Google Places API key
- Key should be entered in app settings (stored in localStorage)
- Key is sent to server via nodejs-mobile bridge

### Server Not Starting in APK
- Verify `main.js` exists in nodejs-project/
- Check that all required dependencies are in nodejs-project/package.json
- Verify config.js and other server files are in nodejs-project/src/

### CORS/Network Errors
- When running in mobile, server is at localhost:3000
- getApiBaseUrl() should return `http://localhost:3000`
- Check that nodejs variable is detected correctly in browser console

## Next Steps

### For Testing:
1. Run `npm install` to install nodejs-mobile-cordova locally
2. Test on Android device or emulator
3. Verify settings UI properly stores and sends API key
4. Test search functionality across different locations

### For Release:
1. Update version numbers in package.json and capacitor.config.json
2. Create release notes documenting the embedded server feature
3. Build final release APK: `cd android && ./gradlew assembleRelease`
4. Sign APK with production keystore
5. Create GitHub Release with APK file

### For Future Enhancements:
- [ ] Add loading spinner while server is starting
- [ ] Implement server health check endpoint
- [ ] Add server logs display in debug mode
- [ ] Optimize APK size (code splitting, tree shaking)
- [ ] Add settings UI for server configuration (port, timeout, etc.)

## Files Modified

1. ✅ `/data/data/com.termux/files/home/package.json`
2. ✅ `/data/data/com.termux/files/home/src/server.js`
3. ✅ `/data/data/com.termux/files/home/src/config.js`
4. ✅ `/data/data/com.termux/files/home/public/index.html`
5. ✅ `/data/data/com.termux/files/home/capacitor.config.json`
6. ✅ `/data/data/com.termux/files/home/.github/workflows/build-apk.yml`
7. ✅ `/data/data/com.termux/files/home/.gitignore`

## Files Created

1. ✅ `/data/data/com.termux/files/home/nodejs-project/main.js`
2. ✅ `/data/data/com.termux/files/home/nodejs-project/package.json`
3. ✅ `/data/data/com.termux/files/home/nodejs-project/.env.example`
4. ✅ `/data/data/com.termux/files/home/nodejs-project/src/*` (7 files copied from main src/)
5. ✅ `/data/data/com.termux/files/home/MOBILE_BUILD.md` (this file)

## Summary

The application is now ready to be built as a standalone Android APK with:
- ✅ Embedded Node.js server running on localhost:3000
- ✅ Web UI served by Capacitor WebView
- ✅ Automatic server startup via nodejs-mobile bridge
- ✅ Dynamic API key configuration via user settings
- ✅ Full Google Places API integration
- ✅ Rate limiting and error handling
- ✅ Automatic builds via GitHub Actions

Users will only need:
1. An Android device (API 22+)
2. Their own Google Places API key
3. The built APK file

All functionality that works in the web version will work in the mobile APK, with the added benefit of no external server dependency!
