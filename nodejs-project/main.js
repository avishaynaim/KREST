import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './src/config.js';
import { googleMapsClient } from './src/placesClient.js';
import { processLocation } from './src/locationService.js';
import { searchPlaces } from './src/placesSearchService.js';
import { validateQueryParameters } from './src/validation.js';
import { rateLimitMiddleware, startCleanupSchedule } from './src/rateLimiter.js';
import { adaptiveTilingSearch, convertNewPlaceToOldFormat } from './src/adaptiveTilingSearch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Serve static files from public directory (served from parent app in mobile context)
// In mobile, we don't serve static files here since Capacitor serves the web UI
// But we keep this for development/debugging
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// NEW: Adaptive Tiling Search endpoint (uses Google Places API New)
app.get('/api/places/adaptive', rateLimitMiddleware, async (req, res) => {
  try {
    // Validate parameters
    const validation = validateQueryParameters(req.query);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PARAMETERS',
        message: validation.errors.join('; '),
        errors: validation.errors,
      });
    }

    const params = validation.params;

    // Process location
    const location = await processLocation({
      city: params.city,
      latitude: params.latitude,
      longitude: params.longitude,
    });

    // Determine place types for New API
    // Search each type SEPARATELY to maximize results (like old API)
    const typeGroups = [];
    if (!params.type || params.type === 'both') {
      typeGroups.push(['restaurant']);
      typeGroups.push(['cafe', 'coffee_shop']);
    } else if (params.type === 'restaurant') {
      typeGroups.push(['restaurant']);
    } else if (params.type === 'cafe') {
      typeGroups.push(['cafe', 'coffee_shop']);
    }

    // Get radius in meters
    const radiusMeters = (params.radius || config.defaultRadius) * 1000;

    console.log('\n🚀 Starting ADAPTIVE TILING SEARCH...');
    console.log(`📋 Will search ${typeGroups.length} type group(s) separately`);

    // Execute adaptive tiling search for EACH type group separately
    const allResults = [];
    const allMetrics = {
      tilesProcessed: 0,
      apiCalls: 0,
      uniquePlaces: 0,
      duplicateHits: 0,
      truncatedTiles: 0,
      completeTiles: 0,
      maxDepthReached: 0,
      minRadiusReached: 0,
      budgetExhausted: false,
    };

    for (let i = 0; i < typeGroups.length; i++) {
      const types = typeGroups[i];
      console.log(`\n🔍 Searching type group ${i + 1}/${typeGroups.length}: ${types.join(', ')}`);

      const result = await adaptiveTilingSearch(
        location.latitude,
        location.longitude,
        radiusMeters,
        types,
        config.googlePlacesApiKey
      );

      allResults.push(...result.places);

      // Accumulate metrics
      allMetrics.tilesProcessed += result.metrics.tilesProcessed;
      allMetrics.apiCalls += result.metrics.apiCalls;
      allMetrics.uniquePlaces += result.metrics.uniquePlaces;
      allMetrics.duplicateHits += result.metrics.duplicateHits;
      allMetrics.truncatedTiles += result.metrics.truncatedTiles;
      allMetrics.completeTiles += result.metrics.completeTiles;
      allMetrics.maxDepthReached += result.metrics.maxDepthReached;
      allMetrics.minRadiusReached += result.metrics.minRadiusReached;
      allMetrics.budgetExhausted = allMetrics.budgetExhausted || result.metrics.budgetExhausted;
    }

    // Remove duplicates based on place_id
    const seenIds = new Set();
    const uniqueResults = [];
    for (const place of allResults) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        uniqueResults.push(place);
      }
    }

    allMetrics.uniquePlaces = uniqueResults.length;

    console.log(`\n📊 Final Results:`);
    console.log(`   • Total unique places: ${allMetrics.uniquePlaces}`);
    console.log(`   • Tiles processed: ${allMetrics.tilesProcessed}`);
    console.log(`   • API calls made: ${allMetrics.apiCalls}`);
    console.log(`   • Budget exhausted: ${allMetrics.budgetExhausted}`);

    res.json({
      success: true,
      places: uniqueResults,
      metrics: allMetrics,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });
  } catch (error) {
    console.error('Error in /api/places/adaptive:', error);
    res.status(500).json({
      success: false,
      error: 'SEARCH_FAILED',
      message: error.message,
    });
  }
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.path} not found`,
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Notify the WebView that the server is ready
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Try to send a message through the nodejs-mobile bridge
      if (global.nodejs && global.nodejs.channel) {
        global.nodejs.channel.send('server-ready');
      }
    } catch (err) {
      // Bridge might not be available in non-mobile environment
      console.log('nodejs-mobile bridge not available');
    }
  }

  // Start cleanup schedule for rate limiter
  startCleanupSchedule();
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  process.exit(0);
});
