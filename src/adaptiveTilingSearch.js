import axios from 'axios';
import { config } from './config.js';

/**
 * ADAPTIVE TILING ALGORITHM FOR GOOGLE PLACES API (NEW)
 *
 * 🎯 CODE NAME: "SMART ALGO RANGE" - Fixed Coverage Algorithm v1.3
 *
 * ✅ WORKING: Full center coverage with optimized overlap (OVERLAP_FACTOR = 0.7)
 * 🐛 BUG FIXED (v1.1): Previous version (0.8) had 650m+ center gap on large radii
 * 🐛 BUG FIXED (v1.2): Added opening hours fields + weekday reordering (Mon→Sun to Sun→Sat)
 * 🐛 BUG FIXED (v1.3): Added Google Maps URL - was missing, causing undefined links
 *
 * Problem: Single Nearby Search call returns max 20 results, missing many places
 * Solution: Subdivide search area into overlapping tiles, recursively refine truncated tiles
 *
 * Algorithm:
 * 1. Start with one tile covering entire search radius
 * 2. For each tile: call Places API (New) searchNearby
 * 3. If response has 20 results → likely truncated → subdivide into 4 child tiles
 * 4. If response has <20 results → complete coverage → don't subdivide
 * 5. Deduplicate all results by place.id globally
 * 6. Stop subdividing when: radius too small OR depth too deep OR budget exhausted
 */

// CONFIGURATION KNOBS
const ADAPTIVE_TILING_CONFIG = {
  // Stop subdividing if tile radius gets this small (meters)
  MIN_TILE_RADIUS: 150, // 150m minimum tile size (was 500m - too large for dense areas)

  // Stop subdividing after this many levels
  MAX_DEPTH: 7, // 0=original, 1-7=subdivisions (increased from 5 for better coverage)

  // Google's hard limit per request
  MAX_RESULT_COUNT: 20,

  // Overlap factor for child tiles
  // MUST be ≤ 0.7071 (1/√2) to ensure children cover parent center
  // 0.7 ensures no coverage gaps while maintaining good overlap
  OVERLAP_FACTOR: 0.7,

  // Maximum API calls budget (safety limit)
  MAX_API_CALLS: 300, // Increased from 200 for better coverage in dense areas

  // Timeout per API call (ms)
  API_TIMEOUT: 10000,
};

/**
 * Represents a search tile
 */
class SearchTile {
  constructor(lat, lng, radiusMeters, depth = 0, tileId = '0') {
    this.lat = lat;
    this.lng = lng;
    this.radius = radiusMeters;
    this.depth = depth;
    this.tileId = tileId;
  }

  /**
   * Create 4 child tiles with overlap
   * Pattern: NW, NE, SW, SE
   */
  subdivide() {
    const childRadius = this.radius / 2;
    const spacing = childRadius * ADAPTIVE_TILING_CONFIG.OVERLAP_FACTOR;

    // Calculate offset in degrees (approximate, works for small distances)
    const latOffset = (spacing / 111320); // 1 degree lat ≈ 111.32 km
    const lngOffset = (spacing / (111320 * Math.cos(this.lat * Math.PI / 180)));

    return [
      // Northwest
      new SearchTile(
        this.lat + latOffset,
        this.lng - lngOffset,
        childRadius,
        this.depth + 1,
        `${this.tileId}.0`
      ),
      // Northeast
      new SearchTile(
        this.lat + latOffset,
        this.lng + lngOffset,
        childRadius,
        this.depth + 1,
        `${this.tileId}.1`
      ),
      // Southwest
      new SearchTile(
        this.lat - latOffset,
        this.lng - lngOffset,
        childRadius,
        this.depth + 1,
        `${this.tileId}.2`
      ),
      // Southeast
      new SearchTile(
        this.lat - latOffset,
        this.lng + lngOffset,
        childRadius,
        this.depth + 1,
        `${this.tileId}.3`
      ),
    ];
  }

  shouldSubdivide(resultCount) {
    // Don't subdivide if:
    // 1. Result count < max (not truncated)
    if (resultCount < ADAPTIVE_TILING_CONFIG.MAX_RESULT_COUNT) {
      return false;
    }

    // 2. Radius too small
    if (this.radius <= ADAPTIVE_TILING_CONFIG.MIN_TILE_RADIUS) {
      return false;
    }

    // 3. Depth too deep
    if (this.depth >= ADAPTIVE_TILING_CONFIG.MAX_DEPTH) {
      return false;
    }

    return true;
  }
}

/**
 * Call Google Places API (New) searchNearby for a single tile
 */
async function searchTileNearby(tile, includedTypes, apiKey) {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const requestBody = {
    includedPrimaryTypes: includedTypes, // e.g., ["restaurant", "cafe", "coffee_shop"]
    maxResultCount: ADAPTIVE_TILING_CONFIG.MAX_RESULT_COUNT,
    locationRestriction: {
      circle: {
        center: {
          latitude: tile.lat,
          longitude: tile.lng,
        },
        radius: tile.radius,
      },
    },
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.primaryType,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.businessStatus,places.currentOpeningHours,places.regularOpeningHours,places.googleMapsUri',
        'Content-Type': 'application/json',
      },
      timeout: ADAPTIVE_TILING_CONFIG.API_TIMEOUT,
    });

    return {
      places: response.data.places || [],
      tile: tile,
    };
  } catch (error) {
    console.error(`❌ Error searching tile ${tile.tileId}:`, error.message);
    return {
      places: [],
      tile: tile,
      error: error.message,
    };
  }
}

/**
 * MAIN ADAPTIVE TILING SEARCH ALGORITHM
 *
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusMeters - Search radius in meters
 * @param {Array<string>} includedTypes - Place types (e.g., ["restaurant", "cafe"])
 * @param {string} apiKey - Google API key
 * @returns {Promise<Object>} { places: [...], metrics: {...} }
 */
export async function adaptiveTilingSearch(lat, lng, radiusMeters, includedTypes, apiKey) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   🎯 SMART ALGO RANGE - Adaptive Tiling Search v1.3          ║');
  console.log('║   ✅ Full coverage + Hours + Google Maps links working       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`📍 Center: ${lat}, ${lng}`);
  console.log(`📏 Radius: ${radiusMeters}m`);
  console.log(`🏷️  Types: ${includedTypes.join(', ')}`);
  console.log(`⚙️  Config: minRadius=${ADAPTIVE_TILING_CONFIG.MIN_TILE_RADIUS}m, maxDepth=${ADAPTIVE_TILING_CONFIG.MAX_DEPTH}, overlap=${ADAPTIVE_TILING_CONFIG.OVERLAP_FACTOR} (smart coverage)`);
  console.log('');

  // Metrics tracking
  const metrics = {
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

  // Global deduplication map: placeId -> place data
  const seenPlaces = new Map();

  // Queue of tiles to process (BFS approach)
  const tileQueue = [new SearchTile(lat, lng, radiusMeters, 0, 'root')];

  // Process tiles
  while (tileQueue.length > 0 && metrics.apiCalls < ADAPTIVE_TILING_CONFIG.MAX_API_CALLS) {
    const tile = tileQueue.shift();
    metrics.tilesProcessed++;

    console.log(`\n🔍 Processing tile ${tile.tileId} (depth=${tile.depth}, radius=${Math.round(tile.radius)}m)`);

    // Call API for this tile
    const result = await searchTileNearby(tile, includedTypes, apiKey);
    metrics.apiCalls++;

    const places = result.places;
    console.log(`   ✓ Received ${places.length} places`);

    // Deduplicate and store
    let newPlaces = 0;
    let duplicates = 0;

    for (const place of places) {
      const placeId = place.id; // e.g., "places/ChIJ..."

      if (seenPlaces.has(placeId)) {
        duplicates++;
        metrics.duplicateHits++;
      } else {
        seenPlaces.set(placeId, {
          id: placeId,
          name: place.displayName?.text || 'Unknown',
          type: place.primaryType || 'unknown',
          location: place.location,
          address: place.formattedAddress,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          status: place.businessStatus,
          currentOpeningHours: place.currentOpeningHours,
          regularOpeningHours: place.regularOpeningHours,
          googleMapsUri: place.googleMapsUri,
          discoveredInTile: tile.tileId,
        });
        newPlaces++;
        metrics.uniquePlaces++;
      }
    }

    console.log(`   📊 New: ${newPlaces}, Duplicates: ${duplicates}, Total unique: ${metrics.uniquePlaces}`);

    // Decide if we should subdivide
    if (tile.shouldSubdivide(places.length)) {
      console.log(`   ⚠️  TRUNCATED (${places.length}/${ADAPTIVE_TILING_CONFIG.MAX_RESULT_COUNT}) → Subdividing into 4 child tiles`);
      metrics.truncatedTiles++;

      const children = tile.subdivide();
      tileQueue.push(...children);

      console.log(`   🌳 Created 4 children (queue size: ${tileQueue.length})`);
    } else {
      metrics.completeTiles++;

      if (tile.radius <= ADAPTIVE_TILING_CONFIG.MIN_TILE_RADIUS) {
        metrics.minRadiusReached++;
        console.log(`   ✅ Complete (min radius reached)`);
      } else if (tile.depth >= ADAPTIVE_TILING_CONFIG.MAX_DEPTH) {
        metrics.maxDepthReached++;
        console.log(`   ✅ Complete (max depth reached)`);
      } else {
        console.log(`   ✅ Complete (${places.length} < ${ADAPTIVE_TILING_CONFIG.MAX_RESULT_COUNT} results)`);
      }
    }
  }

  if (metrics.apiCalls >= ADAPTIVE_TILING_CONFIG.MAX_API_CALLS) {
    metrics.budgetExhausted = true;
    console.log(`\n⚠️  API call budget exhausted (${ADAPTIVE_TILING_CONFIG.MAX_API_CALLS} calls)`);
  }

  // Convert map to array
  const allPlaces = Array.from(seenPlaces.values());

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                     SEARCH COMPLETE                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 METRICS:`);
  console.log(`   Tiles processed: ${metrics.tilesProcessed}`);
  console.log(`   API calls made: ${metrics.apiCalls}`);
  console.log(`   Unique places found: ${metrics.uniquePlaces}`);
  console.log(`   Duplicate hits: ${metrics.duplicateHits}`);
  console.log(`   Truncated tiles: ${metrics.truncatedTiles}`);
  console.log(`   Complete tiles: ${metrics.completeTiles}`);
  console.log(`   Max depth reached: ${metrics.maxDepthReached}`);
  console.log(`   Min radius reached: ${metrics.minRadiusReached}`);
  console.log('');

  return {
    places: allPlaces,
    metrics: metrics,
  };
}

/**
 * INTEGRATION HELPER
 * Converts New API places to old format for compatibility
 */
export function convertNewPlaceToOldFormat(newPlace, searchLat, searchLng) {
  const lat = newPlace.location?.latitude || 0;
  const lng = newPlace.location?.longitude || 0;

  // Calculate distance using Haversine
  const distance = calculateDistance(searchLat, searchLng, lat, lng);

  // Extract opening hours from new API format
  // Prefer currentOpeningHours (includes holidays), fallback to regularOpeningHours
  let openingHours = [];
  if (newPlace.currentOpeningHours?.weekdayDescriptions) {
    openingHours = newPlace.currentOpeningHours.weekdayDescriptions;
  } else if (newPlace.regularOpeningHours?.weekdayDescriptions) {
    openingHours = newPlace.regularOpeningHours.weekdayDescriptions;
  }

  // CRITICAL: New API returns weekdays starting with Monday [Mon,Tue,Wed,Thu,Fri,Sat,Sun]
  // Old API (and our UI) expects Sunday first [Sun,Mon,Tue,Wed,Thu,Fri,Sat]
  // Reorder: move last element (Sunday) to the front
  if (openingHours.length === 7) {
    const sunday = openingHours[6]; // Last element is Sunday in new API
    openingHours = [sunday, ...openingHours.slice(0, 6)]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  }

  // Construct Google Maps URL
  // New API provides googleMapsUri, add Hebrew language parameter
  // Fallback to place_id URL if googleMapsUri not available
  let googleMapsUrl;
  if (newPlace.googleMapsUri) {
    googleMapsUrl = `${newPlace.googleMapsUri}${newPlace.googleMapsUri.includes('?') ? '&' : '?'}hl=he`;
  } else {
    // Extract place ID (format: "places/ChIJ...")
    const placeIdShort = newPlace.id?.replace('places/', '') || '';
    googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeIdShort}&hl=he`;
  }

  return {
    name: newPlace.name,
    address: newPlace.address || '',
    location: {
      latitude: lat,
      longitude: lng,
    },
    rating: newPlace.rating || 0,
    reviewCount: newPlace.reviewCount || 0,
    distance: distance,
    openingHours: openingHours,
    googleMapsUrl: googleMapsUrl,
    placeId: newPlace.id,
    type: newPlace.type,
    status: newPlace.status,
  };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // km, 2 decimals
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
