import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { googleMapsClient } from './placesClient.js';
import { processLocation } from './locationService.js';
import { searchPlaces } from './placesSearchService.js';
import { validateQueryParameters } from './validation.js';
import { rateLimitMiddleware, startCleanupSchedule } from './rateLimiter.js';
import { adaptiveTilingSearch, convertNewPlaceToOldFormat } from './adaptiveTilingSearch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

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

    // Deduplicate across type groups
    const seenIds = new Map();
    const deduplicatedResults = [];
    for (const place of allResults) {
      if (!seenIds.has(place.id)) {
        seenIds.set(place.id, true);
        deduplicatedResults.push(place);
      } else {
        allMetrics.duplicateHits++;
      }
    }

    allMetrics.uniquePlaces = deduplicatedResults.length;

    console.log(`\n✅ All type groups complete: ${deduplicatedResults.length} unique places found`);

    const result = { places: deduplicatedResults, metrics: allMetrics };

    // Convert to old format for compatibility
    const formattedPlaces = result.places.map(place =>
      convertNewPlaceToOldFormat(place, location.latitude, location.longitude)
    );

    // Sort ALL places by rating (highest first), then by review count
    formattedPlaces.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.reviewCount - a.reviewCount;
    });

    // Print ALL results nicely to console (before filtering)
    console.log('\n' + '═'.repeat(100));
    console.log('📊 ALL SEARCH RESULTS - ORDERED BY RATING (BEFORE CLIENT FILTERS)');
    console.log('═'.repeat(100));
    console.log(`Total Found: ${formattedPlaces.length}`);
    console.log('─'.repeat(100));
    console.log(` # │ Rating │ Reviews │ Place Name`);
    console.log('─'.repeat(100));

    formattedPlaces.forEach((place, index) => {
      const rank = (index + 1).toString().padStart(3, ' ');
      const rating = place.rating.toFixed(1);
      const reviews = place.reviewCount.toString().padStart(6, ' ');
      const name = place.name;
      console.log(`${rank} │  ${rating}  │ ${reviews} │ ${name}`);
    });

    console.log('═'.repeat(100) + '\n');

    // Apply client-side filters (rating, reviews)
    const minRatingFilter = params.minRating !== undefined ? params.minRating : config.defaultMinRating;
    const minReviewsFilter = params.minReviews !== undefined ? params.minReviews : config.defaultMinReviews;

    const filteredPlaces = formattedPlaces.filter(place => {
      if (place.rating < minRatingFilter) return false;
      if (place.reviewCount < minReviewsFilter) return false;
      return true;
    });

    // Return results
    const allTypes = typeGroups.flat(); // Flatten typeGroups array

    res.json({
      success: true,
      method: 'adaptive_tiling',
      algorithm: 'SMART_ALGO_RANGE_v1.3',
      algorithmDescription: 'Full coverage + hours + Google Maps links',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        formattedAddress: location.formattedAddress,
      },
      filters: {
        radius: radiusMeters / 1000,
        minRating: minRatingFilter,
        minReviews: minReviewsFilter,
        types: allTypes,
      },
      metrics: result.metrics,
      totalFound: result.places.length,
      afterFilters: filteredPlaces.length,
      places: filteredPlaces,
    });
  } catch (error) {
    console.error('Adaptive Tiling API Error:', error);

    res.status(500).json({
      success: false,
      error: 'ADAPTIVE_SEARCH_ERROR',
      message: error.message,
    });
  }
});

// Main search endpoint with comprehensive validation (primary endpoint)
// Apply rate limiting middleware
app.get('/api/places/search', rateLimitMiddleware, async (req, res) => {
  try {
    // Validate all query parameters
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

    // Process location (handles geocoding if city name provided)
    const location = await processLocation({
      city: params.city,
      latitude: params.latitude,
      longitude: params.longitude,
    });

    // Search for places with validated parameters
    const closedSaturday = req.query.closedSaturday !== 'false';
    const places = await searchPlaces({
      latitude: location.latitude,
      longitude: location.longitude,
      radius: params.radius,
      minRating: params.minRating,
      minReviews: params.minReviews,
      type: params.type,
      closedSaturday: closedSaturday,
      opennow: params.opennow,
    });

    // Print results nicely to console
    console.log('\n' + '═'.repeat(100));
    console.log('📊 SEARCH RESULTS - ORDERED BY RATING');
    console.log('═'.repeat(100));
    console.log(`Total Found: ${places.length}`);
    console.log('─'.repeat(100));
    console.log(` # │ Rating │ Reviews │ Place Name`);
    console.log('─'.repeat(100));

    places.forEach((place, index) => {
      const rank = (index + 1).toString().padStart(3, ' ');
      const rating = place.rating.toFixed(1);
      const reviews = place.reviewCount.toString().padStart(6, ' ');
      const name = place.name;
      console.log(`${rank} │  ${rating}  │ ${reviews} │ ${name}`);
    });

    console.log('═'.repeat(100) + '\n');

    // Return results with metadata
    res.json({
      success: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        formattedAddress: location.formattedAddress,
      },
      filters: {
        radius: params.radius || config.defaultRadius,
        minRating: params.minRating !== undefined ? params.minRating : config.defaultMinRating,
        minReviews: params.minReviews !== undefined ? params.minReviews : config.defaultMinReviews,
        type: params.type || 'both',
      },
      count: places.length,
      places,
    });
  } catch (error) {
    console.error('API Error:', error.message);

    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = error.message;

    // Validation errors
    if (error.message.includes('must be provided') ||
        error.message.includes('Invalid coordinates') ||
        error.message.includes('Radius must be') ||
        error.message.includes('between')) {
      statusCode = 400;
      errorCode = 'INVALID_PARAMETERS';
    }
    // Location errors (geocoding)
    else if (error.message.includes('City not found')) {
      statusCode = 400;
      errorCode = 'INVALID_LOCATION';
    }
    // Rate limit errors
    else if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
      statusCode = 503;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      message = 'Google API rate limit exceeded. Please try again later.';
    }
    // API errors (including timeout)
    else if (error.message.includes('GOOGLE_API_ERROR') ||
             error.message.includes('timeout') ||
             error.message.includes('API key')) {
      statusCode = 500;
      errorCode = 'GOOGLE_API_ERROR';
    }

    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message,
    });
  }
});

// Legacy endpoint (backward compatibility)
// Apply rate limiting middleware
app.get('/api/places', rateLimitMiddleware, async (req, res) => {
  try {
    // Extract query parameters
    const { city, latitude, longitude, radius, minRating, minReviews } = req.query;

    // Convert numeric parameters
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    const rad = radius ? parseFloat(radius) : undefined;
    const minRat = minRating ? parseFloat(minRating) : undefined;
    const minRev = minReviews ? parseInt(minReviews, 10) : undefined;

    // Process location (handles geocoding if city name provided)
    const location = await processLocation({
      city,
      latitude: lat,
      longitude: lng,
    });

    // Search for places
    const places = await searchPlaces({
      latitude: location.latitude,
      longitude: location.longitude,
      radius: rad,
      minRating: minRat,
      minReviews: minRev,
    });

    // Print results nicely to console
    console.log('\n' + '═'.repeat(100));
    console.log('📊 SEARCH RESULTS - ORDERED BY RATING');
    console.log('═'.repeat(100));
    console.log(`Total Found: ${places.length}`);
    console.log('─'.repeat(100));
    console.log(` # │ Rating │ Reviews │ Place Name`);
    console.log('─'.repeat(100));

    places.forEach((place, index) => {
      const rank = (index + 1).toString().padStart(3, ' ');
      const rating = place.rating.toFixed(1);
      const reviews = place.reviewCount.toString().padStart(6, ' ');
      const name = place.name;
      console.log(`${rank} │  ${rating}  │ ${reviews} │ ${name}`);
    });

    console.log('═'.repeat(100) + '\n');

    // Return results
    res.json({
      success: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        formattedAddress: location.formattedAddress,
      },
      filters: {
        radius: rad || config.defaultRadius,
        minRating: minRat !== undefined ? minRat : config.defaultMinRating,
        minReviews: minRev !== undefined ? minRev : config.defaultMinReviews,
      },
      count: places.length,
      places,
    });
  } catch (error) {
    console.error('API Error:', error.message);

    // Return appropriate error response
    const statusCode = error.message.includes('must be provided') ||
                      error.message.includes('Invalid coordinates') ||
                      error.message.includes('Radius cannot exceed')
      ? 400
      : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
const server = app.listen(config.port, () => {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        SERVER STARTED                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 Web Interface: http://localhost:${config.port}`);
  console.log(`🔧 API Endpoint:  http://localhost:${config.port}/api/places/search`);
  console.log(`❤️  Health Check:  http://localhost:${config.port}/health\n`);

  console.log(`Configuration:`);
  console.log(`  - Default radius: ${config.defaultRadius} km`);
  console.log(`  - Max radius: ${config.maxRadius} km`);
  console.log(`  - Default min rating: ${config.defaultMinRating}`);
  console.log(`  - Default min reviews: ${config.defaultMinReviews}`);

  console.log(`\nRate Limiting:`);
  console.log(`  - Limit: 100 requests per hour per IP`);
  console.log(`  - Cleanup interval: every 15 minutes`);

  console.log('\n✅ Ready to accept requests!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Start rate limit cleanup schedule
  startCleanupSchedule();

  // Notify nodejs-mobile bridge that server is ready (if running in mobile context)
  try {
    if (global.nodejs && global.nodejs.channel) {
      global.nodejs.channel.send('server-ready');
      console.log('[nodejs-mobile] Server ready notification sent to WebView\n');
    }
  } catch (err) {
    // Bridge might not be available in development/non-mobile environment
    console.log('[Development] nodejs-mobile bridge not available - running in desktop mode\n');
  }
});

// Increase server timeout to 5 minutes (300 seconds) to handle multiple page requests
// Google API pagination can take time: up to 6 pages * 3 seconds delay = 18+ seconds minimum
server.timeout = 300000; // 5 minutes
server.keepAliveTimeout = 310000; // Slightly longer than timeout
server.headersTimeout = 320000; // Slightly longer than keepAliveTimeout
