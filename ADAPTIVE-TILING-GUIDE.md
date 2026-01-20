# Adaptive Tiling Search Algorithm - Implementation Guide

## 🎯 CODE NAME: SMART ALGO RANGE v1.1

**Status:** ✅ WORKING - Full center coverage with optimized overlap

**Bug Fixed:** Previous version (0.8 overlap) had 650m+ center gap on large radii, causing places near search center to be missed when using 10km+ radius.

## Overview

This implementation solves the **Google Places API result limitation** (60 max results) by using an **adaptive tiling algorithm** that subdivides the search area into overlapping circles and recursively refines areas with many results.

## How It Works

### Algorithm Steps

1. **Start with single tile** covering entire search radius
2. **Search each tile** using Google Places API (New) `searchNearby`
3. **Check if truncated**: If tile returns 20 results (max) → likely more exist
4. **Subdivide** truncated tiles into 4 overlapping child tiles (NW, NE, SW, SE)
5. **Deduplicate** all results globally by `place.id`
6. **Stop conditions**: min radius reached OR max depth reached OR budget exhausted

### Why This Works

- **Coverage**: Overlapping tiles ensure no boundary misses
- **Efficiency**: Only subdivides areas with many results
- **Comprehensive**: Can find 100s-1000s of places vs 60 limit
- **Compliant**: Uses API normally, not a bypass

## Configuration Knobs

Located in `src/adaptiveTilingSearch.js`:

```javascript
ADAPTIVE_TILING_CONFIG = {
  MIN_TILE_RADIUS: 500,      // Stop if tile < 500m
  MAX_DEPTH: 5,              // Max 5 subdivision levels (4^5=1024 tiles)
  MAX_RESULT_COUNT: 20,      // Google's limit per request
  OVERLAP_FACTOR: 0.7,       // ✅ FIXED: 0.7 ensures full center coverage (was 0.8)
  MAX_API_CALLS: 200,        // Safety budget limit
  API_TIMEOUT: 10000,        // 10s per API call
}
```

**⚠️ CRITICAL:** OVERLAP_FACTOR must be ≤ 0.7071 (1/√2) to ensure child tiles cover parent center. Previous value of 0.8 created a coverage gap.

### Tuning Tradeoffs

| Parameter | Increase → | Decrease → |
|-----------|------------|------------|
| MIN_TILE_RADIUS | Faster, fewer results | Slower, more comprehensive |
| MAX_DEPTH | More comprehensive, slower | Faster, may miss places |
| OVERLAP_FACTOR | More coverage, more duplicates | Less coverage, faster |
| MAX_API_CALLS | More results, higher cost | Faster, may hit limit |

## API Endpoints

### New Adaptive Endpoint

```
GET /api/places/adaptive
```

**Same parameters as old endpoint:**
- `city` or `latitude`+`longitude` (required)
- `radius` (km, optional, default: 15)
- `minRating` (optional, default: 4.5)
- `minReviews` (optional, default: 100)
- `type` (restaurant|cafe|both, optional, default: both)

**Example:**
```bash
curl "http://localhost:3000/api/places/adaptive?city=Rehovot&radius=5&minRating=4.5&minReviews=100"
```

### Response Format

```json
{
  "success": true,
  "method": "adaptive_tiling",
  "location": { ... },
  "filters": { ... },
  "metrics": {
    "tilesProcessed": 45,
    "apiCalls": 45,
    "uniquePlaces": 234,
    "duplicateHits": 67,
    "truncatedTiles": 12,
    "completeTiles": 33
  },
  "totalFound": 234,
  "afterFilters": 87,
  "places": [ ... ]
}
```

### Old Endpoint (Still Works)

```
GET /api/places/search
```

Uses old Nearby Search API, limited to 60 results.

## Integration with UI

Update `public/index.html` to use adaptive endpoint:

```javascript
// Change this line:
response = await fetch(`/api/places/search?${params}`, ...);

// To this:
response = await fetch(`/api/places/adaptive?${params}`, ...);
```

## Google Places API (New) Details

### Endpoint
```
POST https://places.googleapis.com/v1/places:searchNearby
```

### Headers
```
X-Goog-Api-Key: <your-api-key>
X-Goog-FieldMask: places.id,places.displayName,places.primaryType,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.businessStatus
Content-Type: application/json
```

### Request Body
```json
{
  "includedPrimaryTypes": ["restaurant", "cafe", "coffee_shop"],
  "maxResultCount": 20,
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 31.8943, "longitude": 34.8115 },
      "radius": 5000
    }
  }
}
```

### Deduplication

Places are deduplicated by `place.id` field (e.g., `"places/ChIJ..."`).

## Performance Characteristics

### Typical Results (5km radius, urban area)

| Metric | Old API | Adaptive Tiling |
|--------|---------|-----------------|
| Results | 60 | 200-500 |
| API Calls | 3 | 30-100 |
| Time | 10s | 30-120s |
| Coverage | Partial | Comprehensive |

### Cost Estimation

- **Old API**: $0.032 per search (2 types × 3 pages × $0.005)
- **Adaptive**: $0.20-0.50 per search (40-100 calls × $0.005)
- **Tradeoff**: 6-15x cost for 3-8x more results

## Troubleshooting

### Too Few Results
- Decrease `MIN_TILE_RADIUS` (more subdivisions)
- Increase `MAX_DEPTH` (deeper recursion)
- Increase `MAX_API_CALLS` budget

### Too Slow
- Increase `MIN_TILE_RADIUS` (fewer subdivisions)
- Decrease `MAX_DEPTH` (stop earlier)
- Decrease search `radius` (smaller area)

### Budget Exhausted
- Increase `MAX_API_CALLS` in config
- Use smaller search radius
- Increase `MIN_TILE_RADIUS` (less subdivision)

## Example Usage

```bash
# Install dependencies
npm install axios

# Restart server
node src/server.js

# Test adaptive search (should get 200+ results vs 60)
curl "http://localhost:3000/api/places/adaptive?city=Tel%20Aviv&radius=10&minRating=4.0"
```

## Comparison Example

```bash
# Old endpoint (limited to 60)
time curl "http://localhost:3000/api/places/search?city=Rehovot&radius=5" | jq '.count'
# Output: 60, Time: ~10s

# New adaptive endpoint (100s-1000s)
time curl "http://localhost:3000/api/places/adaptive?city=Rehovot&radius=5" | jq '.totalFound'
# Output: 234, Time: ~45s
```

## Notes

- This is **not** a bypass or hack - it's legitimate coverage refinement
- Google allows this usage pattern
- Results are comprehensive within the search area
- Deduplication ensures no duplicate places
- Metrics show exactly how the algorithm performed
