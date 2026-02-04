# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KREST is a Places Search API for finding restaurants and cafes closed on Saturday (kosher/halal establishments). It combines a Node.js backend with a web PWA and Android app via Capacitor.

## Commands

```bash
# Start API server (port 3000)
npm start

# Development with auto-reload
npm run dev

# CLI client
npm run client
node client.js --city "Tel Aviv"
node client.js --lat 32.0853 --lng 34.7818 --format json

# Android APK build
./build-apk.sh              # Full build with SDK setup
./build-apk-now.sh          # Quick rebuild

# Test endpoints
curl http://localhost:3000/health
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv"
```

## Architecture

### Backend (src/)
- **server.js** - Express API server, endpoint definitions, middleware
- **placesSearchService.js** - Core search logic, Saturday closure filtering
- **adaptiveTilingSearch.js** - Tiling algorithm for comprehensive geographic coverage
- **locationService.js** - Geocoding via Google Geocoding API
- **validation.js** - Query parameter validation
- **rateLimiter.js** - IP-based rate limiting (100 req/hour, in-memory)
- **config.js** - Environment config and defaults

### Frontend (public/)
- **index.html** - Main PWA with RTL Hebrew support, Leaflet maps, all client-side filtering
- **service-worker.js** - Offline support
- Single-file architecture: HTML contains all CSS and JavaScript

### Mobile (android/ + nodejs-project/)
- Capacitor WebView app with embedded Node.js server
- **MainActivity.java** - Capacitor bridge activity
- **nodejs-project/** - Symlinked backend for APK embedding

## Key Implementation Details

### Saturday Detection
The API checks `openingHours[6]` (Saturday, Sunday=0) for "Closed" keyword. Places without hours data are excluded.

### Client-Side Filters (public/index.html)
- `filterClosedSaturday()` - Filters places closed Saturday 8AM-5PM
- `filterOpenNow()` - Filters places currently open
- `filterOpenAtTime()` - Filters places open on specific day/time
- All filtering happens client-side after server returns results

### API Endpoints
- `GET /api/places/search` - Primary endpoint with full validation
- `GET /api/places/adaptive` - Uses tiling algorithm for dense areas
- `POST /api/kosher-check` - AI-powered kosher verification (OpenRouter)
- `GET /health` - Health check (not rate limited)

### Environment Variables
```
GOOGLE_PLACES_API_KEY=required
OPENROUTER_API_KEY=optional (for kosher-check)
PORT=3000
```

## Conventions

- ES Modules (`"type": "module"` in package.json)
- No TypeScript, no build step for backend
- Hebrew RTL interface, English code
- Settings persisted to localStorage in frontend
- In-memory rate limiting (resets on restart)
