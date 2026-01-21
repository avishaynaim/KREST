# Places API Client

Command-line interface (CLI) client for searching restaurants and cafes closed on Saturday using the Places API.

## Features

- 🔍 Search by city name or coordinates
- 🎯 Customizable filters (radius, rating, reviews, type)
- 📊 Beautiful table output with colors
- 📝 JSON output for scripting
- ⚡ Rate limit tracking and display
- 🚨 Comprehensive error handling
- 🌐 Support for remote API servers

## Installation

The client is included with the Places API. No additional installation required.

## Usage

### Basic Syntax

```bash
node client.js [OPTIONS]
```

Or using npm script:

```bash
npm run client -- [OPTIONS]
```

### Quick Start

```bash
# Search in Tel Aviv (requires server running)
node client.js --city "Tel Aviv"

# Search by coordinates
node client.js --lat 32.0853 --lng 34.7818
```

## Command Line Options

### Location (Required)

Choose one of the following:

| Option | Description | Example |
|--------|-------------|---------|
| `-c, --city <name>` | City name | `--city "Tel Aviv"` |
| `--lat <latitude>` | Latitude (-90 to 90) | `--lat 32.0853` |
| `--lng <longitude>` | Longitude (-180 to 180) | `--lng 34.7818` |

### Filters (Optional)

| Option | Description | Default | Range | Example |
|--------|-------------|---------|-------|---------|
| `-r, --radius <km>` | Search radius | 20 | 1-50 | `--radius 10` |
| `--rating <stars>` | Minimum rating | 3.0 | 1.0-5.0 | `--rating 4.5` |
| `--reviews <count>` | Minimum reviews | 20 | >= 1 | `--reviews 100` |
| `-t, --type <type>` | Place type | both | restaurant/cafe | `--type restaurant` |

### Output (Optional)

| Option | Description | Values | Example |
|--------|-------------|--------|---------|
| `-f, --format <format>` | Output format | table, json | `--format json` |

### Connection (Optional)

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--host <hostname>` | API hostname | localhost | `--host api.example.com` |
| `--port <port>` | API port | 3000 | `--port 8080` |

### Other

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |

## Examples

### 1. Basic Search by City

```bash
node client.js --city "Tel Aviv"
```

**Output:**
```
Search Results
────────────────────────────────────────────────────
Location: Tel Aviv-Yafo, Israel
Coordinates: 32.0853, 34.7818
Filters: radius=20km, rating>=3.0, reviews>=20, type=both
Results: 5 places found
Rate Limit: 99/100 requests remaining (resets 3:45:00 PM)
────────────────────────────────────────────────────

1. Cafe Landwer
   Dizengoff St 117, Tel Aviv-Yafo, Israel
   ★★★★½ 4.5 (1250 reviews) • 0.75km away
   📞 +972-3-1234567
   🗓️  Saturday: Closed
   🔗 https://maps.google.com/?cid=123456

2. Benedict
   Rothschild Blvd 29, Tel Aviv-Yafo, Israel
   ★★★★ 4.0 (890 reviews) • 1.20km away
   📞 +972-3-7654321
   🗓️  Saturday: Closed
   🔗 https://maps.google.com/?cid=789012
```

### 2. Search by Coordinates

```bash
node client.js --lat 32.0853 --lng 34.7818 --radius 5
```

### 3. High-Quality Restaurants Only

```bash
node client.js --city "Jerusalem" --rating 4.5 --reviews 100 --type restaurant
```

### 4. JSON Output for Scripting

```bash
node client.js --city "Tel Aviv" --format json > results.json
```

**JSON Output:**
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
  "places": [...]
}
```

### 5. Cafes Only with Custom Filters

```bash
node client.js --city "Haifa" --type cafe --radius 15 --rating 4.0 --reviews 50
```

### 6. Remote API Server

```bash
node client.js --city "Tel Aviv" --host api.example.com --port 8080
```

### 7. Using npm Script

```bash
npm run client -- --city "Tel Aviv" --rating 4.0
```

## Output Formats

### Table Format (Default)

Beautiful, human-readable output with:
- Color-coded information
- Star ratings (★★★★½)
- Distance with units
- Phone numbers and links
- Rate limit information with color warnings

**Colors:**
- 🟢 Green: Place names, good rate limit
- 🟡 Yellow: Ratings, moderate rate limit
- 🔵 Blue: Links and phone numbers
- 🟣 Magenta: Opening hours
- 🔴 Red: Low rate limit, errors

### JSON Format

Machine-readable output suitable for:
- Piping to other tools
- Saving to files
- Processing with jq
- Integration with scripts

**Example with jq:**
```bash
# Get only place names
node client.js --city "Tel Aviv" --format json | jq '.places[].name'

# Count results
node client.js --city "Tel Aviv" --format json | jq '.count'

# Get top 3 by rating
node client.js --city "Tel Aviv" --format json | jq '.places | sort_by(-.rating) | .[0:3]'
```

## Rate Limiting

The client displays rate limit information with each request:

```
Rate Limit: 75/100 requests remaining (resets 3:45:00 PM)
```

**Color Coding:**
- 🟢 Green (50-100 remaining): Good
- 🟡 Yellow (20-49 remaining): Moderate
- 🔴 Red (0-19 remaining): Low

**When Rate Limited (429):**
```
Error
────────────────────────────────────────────────────
Status: 429
Code: RATE_LIMIT_EXCEEDED
Message: Rate limit exceeded. Maximum 100 requests per hour allowed.

Please try again in 45 minutes.
────────────────────────────────────────────────────
```

## Error Handling

The client provides clear error messages for all scenarios:

### 1. Missing Location

```bash
node client.js --radius 10
```
```
Error: Either --city or --lat/--lng must be provided
Use --help for usage information
```

### 2. Server Not Running

```
Error
────────────────────────────────────────────────────
Message: Request failed: connect ECONNREFUSED 127.0.0.1:3000

Tip: Make sure the API server is running with: npm start
────────────────────────────────────────────────────
```

### 3. Invalid Parameters

```bash
node client.js --city "Tel Aviv" --radius 100
```
```
Error
────────────────────────────────────────────────────
Status: 400
Code: INVALID_PARAMETERS
Message: Radius must be between 1 and 50 km
Details:
  • Radius must be between 1 and 50 km
────────────────────────────────────────────────────
```

### 4. City Not Found

```bash
node client.js --city "InvalidCityXYZ"
```
```
Error
────────────────────────────────────────────────────
Status: 400
Code: INVALID_LOCATION
Message: City not found: InvalidCityXYZ
────────────────────────────────────────────────────
```

## Scripting Examples

### Save Results to File

```bash
# JSON format
node client.js --city "Tel Aviv" --format json > tel-aviv-places.json

# Table format (with colors)
node client.js --city "Tel Aviv" > tel-aviv-places.txt
```

### Check Multiple Cities

```bash
#!/bin/bash
cities=("Tel Aviv" "Jerusalem" "Haifa" "Eilat")

for city in "${cities[@]}"; do
  echo "Searching in $city..."
  node client.js --city "$city" --format json > "${city// /-}.json"
  sleep 1  # Be nice to the API
done
```

### Filter and Process with jq

```bash
# Get places within 1km with high ratings
node client.js --city "Tel Aviv" --format json | \
  jq '.places[] | select(.distance < 1 and .rating >= 4.5)'

# Extract just names and distances
node client.js --city "Tel Aviv" --format json | \
  jq '.places[] | {name, distance}'

# Count places by type (requires filtering in separate calls)
restaurants=$(node client.js --city "Tel Aviv" --type restaurant --format json | jq '.count')
cafes=$(node client.js --city "Tel Aviv" --type cafe --format json | jq '.count')
echo "Restaurants: $restaurants, Cafes: $cafes"
```

### Cronjob for Daily Reports

```bash
# Add to crontab: Run daily at 8 AM
0 8 * * * cd /path/to/places-api && node client.js --city "Tel Aviv" --format json > /path/to/daily-report-$(date +\%Y-\%m-\%d).json
```

## Troubleshooting

### Client Can't Connect

**Problem:** `Request failed: connect ECONNREFUSED`

**Solution:**
1. Make sure the API server is running: `npm start`
2. Check the server is on the correct port (default: 3000)
3. Verify with: `curl http://localhost:3000/health`

### Unknown Option Error

**Problem:** `Unknown option: --xyz`

**Solution:**
- Check spelling of option names
- Use `--help` to see all available options
- Remember: use `--` before options when using `npm run client`

### Rate Limit Exceeded

**Problem:** `Rate limit exceeded. Maximum 100 requests per hour allowed.`

**Solution:**
- Wait for the rate limit to reset (shown in error message)
- Cache results to minimize requests
- Consider increasing the rate limit in server configuration

### No Places Found

**Problem:** `No places found matching your criteria.`

**Solution:**
- Increase the radius: `--radius 30`
- Lower the rating threshold: `--rating 3.0`
- Reduce the review count: `--reviews 10`
- Try a different location or type

## Tips & Best Practices

1. **Cache Results**: Save JSON output to files to avoid repeated API calls
2. **Use Appropriate Filters**: Start with defaults, then refine
3. **Check Rate Limits**: Monitor the rate limit display to avoid being blocked
4. **JSON for Scripts**: Use `--format json` when piping or processing data
5. **Table for Humans**: Use table format (default) for readable output
6. **Remote APIs**: Use `--host` and `--port` for deployed APIs
7. **Error Handling**: Always check exit codes in scripts (`$?`)

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (connection, API, validation, etc.) |

**Example in scripts:**
```bash
if node client.js --city "Tel Aviv" > results.txt; then
  echo "Search successful"
else
  echo "Search failed with exit code $?"
fi
```

## Integration Examples

### Python Script

```python
import subprocess
import json

result = subprocess.run(
    ['node', 'client.js', '--city', 'Tel Aviv', '--format', 'json'],
    capture_output=True,
    text=True
)

if result.returncode == 0:
    data = json.loads(result.stdout)
    print(f"Found {data['count']} places")
    for place in data['places']:
        print(f"- {place['name']} ({place['distance']}km)")
```

### Shell Script with Error Handling

```bash
#!/bin/bash

CITY="Tel Aviv"
OUTPUT_FILE="results.json"

if node client.js --city "$CITY" --format json > "$OUTPUT_FILE" 2>&1; then
  COUNT=$(jq '.count' "$OUTPUT_FILE")
  echo "Success: Found $COUNT places in $CITY"
else
  echo "Error: Search failed"
  cat "$OUTPUT_FILE"
  exit 1
fi
```

## Support

For issues, questions, or feature requests:
- Check the main README.md for API documentation
- See API.md for endpoint details
- Run `node client.js --help` for usage information

## License

MIT
