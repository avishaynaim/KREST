# 🌐 Using the Web Interface

Your Places API now has a beautiful web interface!

## How to Use

### Step 1: Start the Server

In your Termux terminal, run:

```bash
node src/server.js
```

You should see:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                        SERVER STARTED                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

🌐 Web Interface: http://localhost:3000
🔧 API Endpoint:  http://localhost:3000/api/places/search
❤️  Health Check:  http://localhost:3000/health
```

### Step 2: Open the Website

Open your browser (Chrome, Firefox, etc.) and visit:

```
http://localhost:3000
```

Or if you're on the same Android device, just type in your browser:

```
localhost:3000
```

### Step 3: Search for Places

1. Enter a city name (e.g., "Tel Aviv", "Jerusalem", "Haifa")
2. Adjust the filters:
   - 📏 Search radius (1-50 km)
   - ⭐ Minimum rating (1.0-5.0)
   - 💬 Minimum reviews
   - 🍽️ Type (restaurants, cafes, or both)
3. Click **"🔍 Search Places"**
4. Wait 10-30 seconds for results

### What You'll See

The website will show you:

- 📍 **Location details** - City name and coordinates
- 📊 **Search results** - Number of places found
- 🗺️ **Places list** with:
  - Restaurant/cafe name
  - Address
  - ⭐ Star rating and reviews
  - 📏 Distance from search center
  - 📞 Phone number
  - 🗓️ Saturday hours (closed)
  - 🔗 Google Maps button to open directions

### Features

✨ **Beautiful Design**
- Modern gradient background
- Card-based layout
- Smooth animations
- Mobile-responsive

🎨 **Color-Coded Ratings**
- Gold stars (★★★★½)
- Visual rating display
- Review counts

📱 **Mobile-Friendly**
- Works on phone browsers
- Touch-friendly buttons
- Responsive layout

🔗 **Direct Integration**
- Connects to your running API
- Real-time search results
- One-click Google Maps directions

## Tips

### Search Examples

- **Tel Aviv cafes**: City: "Tel Aviv", Type: "Cafe"
- **Jerusalem restaurants**: City: "Jerusalem", Type: "Restaurant"
- **High-rated only**: Min Rating: 4.0+
- **Popular places**: Min Reviews: 100+
- **Nearby**: Radius: 5-10 km
- **Wide search**: Radius: 30-50 km

### Troubleshooting

**Page Won't Load**
- Make sure the server is running (see terminal)
- Check you're using the correct URL: `localhost:3000`
- Try `http://127.0.0.1:3000` instead

**No Results Found**
- Try increasing the search radius
- Lower the minimum rating
- Lower the minimum reviews
- Try a different city

**Search Takes Too Long**
- This is normal (10-30 seconds)
- Google API needs to fetch and filter places
- Wait for the loading spinner to finish

**Error Messages**
- Check the terminal for server errors
- Verify your API key is working: `node test-api-key.js`
- Check Google Cloud Console for API quotas

## Access from Other Devices

### From Another Phone/Computer on Same Network

1. Find your device's IP address:
```bash
ifconfig | grep "inet "
```

2. On the other device, visit:
```
http://YOUR_IP_ADDRESS:3000
```

For example: `http://192.168.1.100:3000`

### Using Termux on Android

The web interface works great in:
- Chrome browser
- Firefox browser
- Samsung Internet
- Any modern mobile browser

Just open the browser and visit `localhost:3000` while the server is running!

## Stopping the Server

To stop the server:
1. Go back to your Termux terminal
2. Press `Ctrl + C`

## File Location

The web interface file is located at:
```
/data/data/com.termux/files/home/public/index.html
```

You can customize the design by editing this file!

---

**🎉 Enjoy your web-based Places Finder!**

No more terminal commands - just point, click, and search!
