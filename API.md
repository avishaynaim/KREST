# Places API Documentation

API service for finding computer-friendly cafes and workspaces that are closed on Saturday (kosher/halal establishments).

## Base URL
```
http://localhost:3000
```

## Endpoints

### GET /api/places/search

**Primary endpoint** with comprehensive parameter validation and error handling.

Searches for restaurants and cafes closed on Saturday within a specified radius.

**Query Parameters:**

| Parameter | Type | Required | Default | Valid Range | Description |
|-----------|------|----------|---------|-------------|-------------|
| `city` | string | No* | - | - | City name for geocoding (e.g., "Tel Aviv") |
| `latitude` | number | No* | - | -90 to 90 | Latitude coordinate |
| `longitude` | number | No* | - | -180 to 180 | Longitude coordinate |
| `radius` | number | No | 20 | 1 to 50 | Search radius in kilometers |
| `minRating` | number | No | 3.0 | 1.0 to 5.0 | Minimum rating filter |
| `minReviews` | number | No | 20 | >= 1 | Minimum review count filter |
| `type` | string | No | both | "restaurant" or "cafe" | Place type filter |

*Either `city` OR `latitude`/`longitude` must be provided. If both are provided, coordinates take precedence.

**Example Requests:**

```bash
# Using city name
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv"

# Using coordinates
curl "http://localhost:3000/api/places/search?latitude=32.0853&longitude=34.7818"

# With custom filters
curl "http://localhost:3000/api/places/search?latitude=32.0853&longitude=34.7818&radius=30&minRating=4.0&minReviews=50"

# Filter by type (restaurants only)
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv&type=restaurant"

# Filter by type (cafes only)
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv&type=cafe"

# All parameters
curl "http://localhost:3000/api/places/search?latitude=32.0853&longitude=34.7818&radius=10&minRating=4.5&minReviews=100&type=restaurant"

# Coordinates take precedence
curl "http://localhost:3000/api/places/search?city=Jerusalem&latitude=32.0853&longitude=34.7818"
# Uses Tel Aviv coordinates, ignores Jerusalem
```

**Success Response (200):**

```json
{
  "success": true,
  "location": {
    "latitude": 32.0853,
    "longitude": 34.7818,
    "formattedAddress": "Tel Aviv-Yafo, Israel"
  },
  "filters": {
    "radius": 20,
    "minRating": 3.0,
    "minReviews": 20,
    "type": "both"
  },
  "count": 5,
  "places": [
    {
      "name": "Example Cafe",
      "address": "123 Dizengoff Street, Tel Aviv",
      "location": {
        "latitude": 32.0850,
        "longitude": 34.7820
      },
      "rating": 4.5,
      "reviewCount": 120,
      "distance": 0.25,
      "openingHours": [
        "Sunday: Closed",
        "Monday: 8:00 AM – 6:00 PM",
        "Tuesday: 8:00 AM – 6:00 PM",
        "Wednesday: 8:00 AM – 6:00 PM",
        "Thursday: 8:00 AM – 6:00 PM",
        "Friday: 8:00 AM – 2:00 PM",
        "Saturday: Closed"
      ],
      "phone": "+972-3-1234567",
      "photos": [
        {
          "reference": "photo_reference_string",
          "width": 800,
          "height": 600
        }
      ],
      "googleMapsUrl": "https://maps.google.com/?cid=123456",
      "placeId": "ChIJexampleplaceid"
    }
  ]
}
```

**Error Responses:**

```json
// 400 Bad Request - INVALID_PARAMETERS (validation errors)
{
  "success": false,
  "error": "INVALID_PARAMETERS",
  "message": "Either city name or coordinates (latitude and longitude) must be provided",
  "errors": [
    "Either city name or coordinates (latitude and longitude) must be provided"
  ]
}

// 400 Bad Request - Multiple validation errors
{
  "success": false,
  "error": "INVALID_PARAMETERS",
  "message": "Radius must be between 1 and 50 km; Minimum rating must be between 1.0 and 5.0",
  "errors": [
    "Radius must be between 1 and 50 km",
    "Minimum rating must be between 1.0 and 5.0"
  ]
}

// 400 Bad Request - INVALID_LOCATION (geocoding failed)
{
  "success": false,
  "error": "INVALID_LOCATION",
  "message": "City not found: InvalidCityName"
}

// 500 Internal Server Error - GOOGLE_API_ERROR (API failures, including timeouts)
{
  "success": false,
  "error": "GOOGLE_API_ERROR",
  "message": "Request timeout - Google API did not respond within 10 seconds"
}

// 503 Service Unavailable - RATE_LIMIT_EXCEEDED
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Google API rate limit exceeded. Please try again later."
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETERS` | 400 | One or more query parameters are invalid or missing |
| `INVALID_LOCATION` | 400 | City not found or geocoding failed |
| `GOOGLE_API_ERROR` | 500 | Google API error (includes timeouts after 10 seconds) |
| `RATE_LIMIT_EXCEEDED` | 503 | Google API rate limit exceeded (client-side, see Rate Limiting section) |
| `INTERNAL_ERROR` | 500 | Other server errors |

## Rate Limiting

The API implements IP-based rate limiting to prevent abuse:

- **Limit**: 100 requests per hour per IP address
- **Window**: Fixed 1-hour window (not sliding)
- **Tracking**: Based on client IP address (supports X-Forwarded-For and X-Real-IP headers)
- **Storage**: In-memory (resets on server restart)

### Rate Limit Headers

Every API response includes rate limit information:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed per window (100) |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit resets |

**Example response headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1705334400
```

### Rate Limit Exceeded Response

When the rate limit is exceeded (429 Too Many Requests):

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Maximum 100 requests per hour allowed.",
  "limit": 100,
  "remaining": 0,
  "resetTime": 1705334400,
  "retryAfter": 3420
}
```

**Additional Headers:**
- `Retry-After`: Seconds until rate limit resets

### Notes on Rate Limiting

- The health endpoint (`/health`) is **not** rate limited
- Rate limits are per IP address, not per API key (public endpoint)
- Expired rate limit entries are cleaned up every 15 minutes
- Rate limits reset on server restart (in-memory storage)
- Consider caching results on the client side to minimize requests

### GET /api/places

**Legacy endpoint** maintained for backward compatibility. Same functionality as `/api/places/search` but without the `type` parameter and with less comprehensive error codes.

Use `/api/places/search` for new integrations.

### GET /health

Health check endpoint.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-01-14T12:00:00.000Z"
}
```

## Response Fields

### Place Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the establishment |
| `address` | string | Formatted street address |
| `location` | object | Coordinates object with `latitude` and `longitude` |
| `rating` | number | Google rating (0-5) |
| `reviewCount` | number | Total number of reviews |
| `distance` | number | Distance from search location in kilometers |
| `openingHours` | string[] | Array of 7 strings (Sunday-Saturday) with opening hours |
| `phone` | string\|null | Phone number (may be null) |
| `photos` | object[] | Array of photo objects with `reference`, `width`, `height` |
| `googleMapsUrl` | string | Direct link to Google Maps |
| `placeId` | string | Google Place ID |

## Filtering Logic

The API applies the following filters in order:

1. **Location Filter**: Finds restaurants and cafes within the specified radius
2. **Saturday Closure Filter**: Checks opening hours for "Closed" on Saturday (index 6 in weekday_text)
3. **Rating Filter**: Excludes places with rating < minRating
4. **Review Count Filter**: Excludes places with reviewCount < minReviews
5. **Sorting**: Results sorted by distance (closest first)

**Note**: Places without opening hours data are excluded from results.

## Parameter Validation

All parameters are validated before processing:

- **Radius**: Must be between 1 and 50 km
- **Rating**: Must be between 1.0 and 5.0
- **Reviews**: Must be at least 1
- **Type**: Must be either "restaurant" or "cafe" (case-insensitive)
- **Coordinates**: Latitude must be between -90 and 90, longitude between -180 and 180
- **Location**: Either city name OR coordinates must be provided

Multiple validation errors are returned together in the response.

## Timeout Handling

- All Google API calls have a 10-second timeout
- If a request takes longer than 10 seconds, the API returns:
  - Status: 500
  - Error code: `GOOGLE_API_ERROR`
  - Message: "Request timeout - Google API did not respond within 10 seconds"

## Common Use Cases

### Find nearest kosher restaurants

```bash
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv&radius=5&type=restaurant"
```

### High-quality cafes only

```bash
curl "http://localhost:3000/api/places/search?latitude=32.0853&longitude=34.7818&minRating=4.5&minReviews=100&type=cafe"
```

### Wide search area (both restaurants and cafes)

```bash
curl "http://localhost:3000/api/places/search?city=Jerusalem&radius=50"
```

## Notes

- All distances are calculated using the Haversine formula
- Saturday is assumed to be index 6 in Google's weekday_text array (Sunday=0)
- The API checks for the word "Closed" (case-insensitive) in the Saturday opening hours
- Geocoding uses Google Geocoding API for city names
- Results are limited by Google Places API pagination (typically 20-60 results)
- No authentication required (public endpoint)

## Setup

1. Get a Google Places API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable both Places API and Geocoding API
3. Set `GOOGLE_PLACES_API_KEY` in `.env` file
4. Start server: `npm start`

## Error Handling

- Invalid API key: Returns 403 error from Google API
- City not found: Returns 500 with "City not found" message
- Missing location: Returns 400 with descriptive error
- Invalid coordinates: Returns 400 with range requirements
- API failures: Returns 500 with error details
