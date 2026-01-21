# Setting Up Your Google API Key

Your API key has been added to `.env`, but you need to enable the required APIs in Google Cloud Console.

## Current Status

✅ API Key: Configured in `.env`
❌ APIs: Need to be enabled

## Steps to Enable APIs

### 1. Go to Google Cloud Console

Open in your browser:
```
https://console.cloud.google.com/apis/dashboard
```

### 2. Enable Places API

1. Click **"+ ENABLE APIS AND SERVICES"**
2. Search for **"Places API"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for it to enable (takes a few seconds)

### 3. Enable Geocoding API

1. Click **"+ ENABLE APIS AND SERVICES"** again
2. Search for **"Geocoding API"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for it to enable

### 4. Check API Key Restrictions (Important!)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under **"API restrictions"**, choose one:
   - **Option A (Recommended)**: Select "Restrict key" and choose:
     - ✓ Places API
     - ✓ Geocoding API
   - **Option B (For testing)**: Select "Don't restrict key"

4. Under **"Application restrictions"** (optional):
   - For testing: "None"
   - For production: Set IP restrictions

5. Click **"SAVE"**

### 5. Test Your Setup

After enabling the APIs (wait 1-2 minutes for propagation), run:

```bash
node test-api-key.js
```

You should see:
```
✅ SUCCESS! API key is working!

Results:
- City: Tel Aviv
- Latitude: 32.0853
- Longitude: 34.7818
- Formatted Address: Tel Aviv-Yafo, Israel
```

## Alternative: Test with Coordinates First

If you want to test the system while waiting for APIs to enable, you can search by coordinates (doesn't require Geocoding API):

```bash
# Start server (new Termux session)
node src/server.js

# Run client with coordinates (another session)
node client.js --lat 32.0853 --lng 34.7818
```

This will still require Places API to be enabled.

## Troubleshooting

### Error: 403 Forbidden
- **Cause**: APIs not enabled or API key restrictions too strict
- **Fix**: Enable Places API and Geocoding API, check restrictions

### Error: OVER_QUERY_LIMIT
- **Cause**: Exceeded free tier quota
- **Fix**: Check quota in Console, enable billing if needed

### Error: REQUEST_DENIED
- **Cause**: API key restrictions blocking the request
- **Fix**: Check "API restrictions" and "Application restrictions"

### APIs Enabled but Still Getting 403
- **Wait**: API changes can take 1-5 minutes to propagate
- **Try**: Clear browser cache, reload Console
- **Check**: Make sure you're using the correct project

## Free Tier Quotas

Google provides generous free tiers:

**Places API:**
- Nearby Search: $0 for first 5,000 requests/month
- Place Details: $0 for first 5,000 requests/month

**Geocoding API:**
- $0 for first 40,000 requests/month

**Your Usage:**
- Each search uses 1 Nearby Search + N Place Details (N = number of results)
- Geocoding used only when searching by city name
- Rate limited to 100 requests/hour anyway

## Quick Reference

| What You Need | Where to Get It |
|---------------|-----------------|
| API Dashboard | https://console.cloud.google.com/apis/dashboard |
| Enable APIs | Click "+ ENABLE APIS AND SERVICES" |
| API Credentials | https://console.cloud.google.com/apis/credentials |
| Check Quotas | https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas |

## Test Commands

```bash
# Test API key
node test-api-key.js

# Test functionality (no API needed)
node test-functionality.js

# Start server
node src/server.js

# Test with coordinates (Places API only)
node client.js --lat 32.0853 --lng 34.7818

# Test with city name (Places API + Geocoding API)
node client.js --city "Tel Aviv"
```

## Security Note

⚠️ **Important**: Your API key is now in the `.env` file. To keep it secure:

1. **Never commit `.env` to git** (already in `.gitignore`)
2. **Don't share your `.env` file**
3. **Use API restrictions** in Google Cloud Console
4. **Monitor usage** regularly in Console
5. **Regenerate key** if exposed publicly

## Next Steps

1. ✅ API key is configured
2. ⏳ Enable Places API (Google Cloud Console)
3. ⏳ Enable Geocoding API (Google Cloud Console)
4. ⏳ Check API restrictions
5. ⏳ Wait 1-2 minutes
6. ✅ Run `node test-api-key.js`
7. ✅ Start using the system!

Once the APIs are enabled, you'll be able to:
- ✓ Search by city name
- ✓ Search by coordinates
- ✓ Get real restaurant data
- ✓ Filter by rating and reviews
- ✓ See opening hours
- ✓ Get directions

## Support

If you continue having issues:
1. Check Google Cloud Console for error messages
2. Verify billing is set up (required even for free tier)
3. Make sure the project has APIs enabled
4. Check the project selector (top bar) is on the correct project

Good luck! 🚀
