# Places API - Find Computer-Friendly Cafes Closed on Saturday

API service for finding restaurants and cafes that are closed on Saturday (kosher/halal establishments) - ideal for finding quiet workspaces on weekends.

## Features

- Search by city name or coordinates
- Filter for places closed on Saturday
- Quality filters (minimum rating and review count)
- Distance calculation and sorting
- Comprehensive place information (hours, photos, ratings, etc.)
- Rate limiting (100 requests per hour per IP)
- Comprehensive parameter validation and error handling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key
3. Enable these APIs:
   - Places API
   - Geocoding API

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your actual Google API key
```

### 4. Start Server

```bash
npm start
```

Server will start on http://localhost:3000

## CLI Client

A command-line client is included for easy searching:

### Basic Usage

```bash
# Search by city
node client.js --city "Tel Aviv"

# Search by coordinates
node client.js --lat 32.0853 --lng 34.7818

# High-quality restaurants only
node client.js --city "Jerusalem" --rating 4.5 --reviews 100 --type restaurant

# JSON output for scripting
node client.js --city "Tel Aviv" --format json
```

### Features

- Beautiful color-coded table output
- JSON output for scripting
- Rate limit tracking
- Comprehensive error handling
- Support for all API filters

**See [CLIENT.md](./CLIENT.md) for complete CLI documentation and examples.**

## API Usage (Direct HTTP)

### Search by City

```bash
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv"
```

### Search by Coordinates

```bash
curl "http://localhost:3000/api/places/search?latitude=32.0853&longitude=34.7818"
```

### With Custom Filters

```bash
curl "http://localhost:3000/api/places/search?city=Tel%20Aviv&radius=30&minRating=4.0&minReviews=50"
```

## Response Example

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
    "minReviews": 20
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
      "photos": [...],
      "googleMapsUrl": "https://maps.google.com/?cid=123456"
    }
  ]
}
```

## Default Parameters

- **Radius**: 20 km (max: 50 km)
- **Minimum Rating**: 3.0 stars
- **Minimum Reviews**: 20

## Rate Limiting

The API implements IP-based rate limiting to prevent abuse:

- **100 requests per hour** per IP address
- Rate limit headers included in every response (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- 429 error returned when limit exceeded
- Health endpoint (`/health`) is not rate limited

**Tip**: Cache results on the client side to minimize requests.

## Documentation

- **[CLIENT.md](./CLIENT.md)** - CLI client documentation and examples
- **[API.md](./API.md)** - Complete API endpoint documentation
- **[src/README.md](./src/README.md)** - Technical implementation details

## How It Works

1. **Location Input**: Accepts city name or coordinates (city names are geocoded)
2. **Search**: Queries Google Places API for restaurants and cafes within radius
3. **Filter**: Keeps only places closed on Saturday with sufficient rating and reviews
4. **Sort**: Orders results by distance from search location
5. **Return**: Comprehensive place information including hours, photos, and contact details

## Project Structure

```
/
├── src/
│   ├── config.js              # Configuration constants
│   ├── placesClient.js        # Google Maps client
│   ├── locationService.js     # Location handling & geocoding
│   ├── placesSearchService.js # Search & filtering logic
│   ├── validation.js          # Parameter validation
│   ├── rateLimiter.js         # Rate limiting middleware
│   └── server.js              # Express API server
├── client.js                  # CLI client
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Environment template
├── package.json               # Dependencies and scripts
├── CLIENT.md                  # CLI client documentation
├── API.md                     # API documentation
└── README.md                  # This file
```

## Requirements

- Node.js (ES modules support)
- Google Places API key with Places API and Geocoding API enabled

## Development

```bash
# Run with auto-reload
npm run dev
```

## Notes

- The API identifies Saturday as index 6 in Google's weekday_text array (Sunday=0)
- Places without opening hours data are excluded from results
- Coordinates take precedence when both city name and coordinates are provided
- No authentication required (public endpoint)

## License

MIT
