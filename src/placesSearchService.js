import { googleMapsClient, apiKey } from './placesClient.js';
import { config } from './config.js';
import { appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Converts degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format opening hours from periods array to 24-hour format strings
 * Old API periods format: { open: { day: 0, time: "0900" }, close: { day: 0, time: "1700" } }
 * @param {Object} openingHours - opening_hours object from Places API
 * @returns {Array<string>} Array of formatted strings like "Sunday: 09:00 – 17:00"
 */
function formatPeriodsTo24Hour(openingHours) {
  if (!openingHours?.periods) {
    // Fallback to weekday_text if no periods available
    return openingHours?.weekday_text || [];
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayHours = new Map(); // day -> array of {open, close} times

  // Group periods by day
  for (const period of openingHours.periods) {
    const openDay = period.open?.day;
    const openTime = period.open?.time; // "0900" format
    const closeTime = period.close?.time; // "1700" format

    if (openDay === undefined || !openTime) continue;

    // Format "0900" to "09:00"
    const formatTime = (t) => t ? `${t.slice(0, 2)}:${t.slice(2)}` : '00:00';

    if (!dayHours.has(openDay)) {
      dayHours.set(openDay, []);
    }
    dayHours.get(openDay).push({
      open: formatTime(openTime),
      close: closeTime ? formatTime(closeTime) : '00:00'
    });
  }

  // Build formatted strings for each day (Sunday first: 0-6)
  const result = [];
  for (let day = 0; day < 7; day++) {
    const times = dayHours.get(day);
    if (!times || times.length === 0) {
      result.push(`${dayNames[day]}: Closed`);
    } else {
      // Sort times and format
      times.sort((a, b) => a.open.localeCompare(b.open));
      const timeRanges = times.map(t => `${t.open} – ${t.close}`).join(', ');
      result.push(`${dayNames[day]}: ${timeRanges}`);
    }
  }

  return result;
}

/**
 * Checks if a place is closed on Saturday during business hours (8 AM - 5 PM)
 * @param {Object} openingHours - Opening hours object from Place Details API
 * @returns {boolean} True if closed during business hours on Saturday, false otherwise
 */
export function isClosedOnSaturday(openingHours) {
  // If no opening hours data, INCLUDE the place (might be closed on Saturday)
  if (!openingHours || !openingHours.weekday_text) {
    return true;
  }

  // weekday_text is an array of strings like:
  // ["Sunday: Closed", "Monday: 9:00 AM – 5:00 PM", "Tuesday: 9:00 AM – 5:00 PM", ...]
  // In Google's format, the array starts with Sunday (index 0)
  // Saturday is at index 6 (0=Sunday, 1=Monday, ..., 6=Saturday)

  const saturdayIndex = 6;
  const saturdayText = openingHours.weekday_text[saturdayIndex];

  // If no Saturday entry, consider it closed
  if (!saturdayText) {
    return true;
  }

  const lowerText = saturdayText.toLowerCase();

  // Check if explicitly closed
  const closedKeywords = ['closed', 'cerrado', 'fermé', 'geschlossen', 'סגור', 'chiuso'];
  const isClosedByKeyword = closedKeywords.some(keyword => lowerText.includes(keyword));

  // If explicitly marked as closed, it's closed
  if (isClosedByKeyword) {
    return true;
  }

  // Check if it's open 24 hours
  const is24Hours = lowerText.includes('24 hours') || lowerText.includes('24 שעות') || lowerText.includes('open 24 hours');
  if (is24Hours) {
    return false; // Open 24 hours means open during business hours
  }

  // Try to parse opening hours and check if open during business hours (8 AM - 5 PM)
  // Look for time patterns like "10:00 AM – 6:00 PM" or "10:00–18:00"
  const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?[\s–-]+(\d{1,2}):(\d{2})\s*(am|pm)?/gi;
  const matches = [...saturdayText.matchAll(timePattern)];

  if (matches.length === 0) {
    // No time pattern found, assume closed if not explicitly marked as open
    return true;
  }

  // Convert business hours to minutes: 8 AM = 480, 5 PM = 1020
  const businessStart = 8 * 60; // 8:00 AM
  const businessEnd = 17 * 60;  // 5:00 PM

  for (const match of matches) {
    let openHour = parseInt(match[1]);
    const openMin = parseInt(match[2]);
    const openPeriod = match[3]?.toLowerCase();
    let closeHour = parseInt(match[4]);
    const closeMin = parseInt(match[5]);
    const closePeriod = match[6]?.toLowerCase();

    // Convert to 24-hour format
    if (openPeriod === 'pm' && openHour !== 12) openHour += 12;
    if (openPeriod === 'am' && openHour === 12) openHour = 0;
    if (closePeriod === 'pm' && closeHour !== 12) closeHour += 12;
    if (closePeriod === 'am' && closeHour === 12) closeHour = 0;

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    // Check if the place is open during ANY part of business hours (8 AM - 5 PM)
    // If opening time is before/at 5 PM AND closing time is after/at 8 AM, there's overlap
    if (openTime <= businessEnd && closeTime >= businessStart) {
      return false; // Open during business hours
    }
  }

  // If no matching hours found that overlap with business hours, consider it closed
  return true;
}

/**
 * Fetches place details including opening hours with timeout
 * @param {string} placeId - Google Place ID
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} Place details
 */
export async function getPlaceDetails(placeId, timeout = 10000) {
  try {
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total',
                 'opening_hours', 'formatted_phone_number', 'photos', 'place_id', 'url'],
        language: 'he',
        key: apiKey,
      },
      timeout,
    });

    // No logging for place details - only log the initial places from nearby search

    if (response.data.status === 'OK') {
      return response.data.result;
    }

    return null;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timeout - Google API did not respond within 10 seconds');
    }
    console.error(`Error fetching details for place ${placeId}:`, error.message);
    return null;
  }
}

/**
 * Formats a place object for API response
 * @param {Object} place - Place details from Google API
 * @param {number} searchLat - Search location latitude
 * @param {number} searchLng - Search location longitude
 * @returns {Object} Formatted place object
 */
export function formatPlace(place, searchLat, searchLng) {
  const distance = calculateDistance(
    searchLat,
    searchLng,
    place.geometry.location.lat,
    place.geometry.location.lng
  );

  return {
    name: place.name,
    address: place.formatted_address,
    location: {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    },
    rating: place.rating || 0,
    reviewCount: place.user_ratings_total || 0,
    distance: distance,
    openingHours: formatPeriodsTo24Hour(place.opening_hours),
    phone: place.formatted_phone_number || null,
    photos: place.photos?.map(photo => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
    })) || [],
    googleMapsUrl: place.url
      ? `${place.url}${place.url.includes('?') ? '&' : '?'}hl=he`
      : `https://www.google.com/maps/place/?q=place_id:${place.place_id}&hl=he`,
    placeId: place.place_id,
  };
}

/**
 * Searches for restaurants and cafes
 * @param {Object} params - Search parameters
 * @param {number} params.latitude - Search location latitude
 * @param {number} params.longitude - Search location longitude
 * @param {number} params.radius - Search radius in kilometers (default: 20)
 * @param {number} params.minRating - Minimum rating filter (default: 3.0)
 * @param {number} params.minReviews - Minimum review count filter (default: 20)
 * @param {string} params.type - Place type: "restaurant", "cafe", or undefined for both (default: both)
 * @param {boolean} params.closedSaturday - Filter for places closed on Saturday (default: true)
 * @param {boolean} params.opennow - Filter for places open now (optional)
 * @returns {Promise<Array>} Filtered and sorted places
 */
export async function searchPlaces({ latitude, longitude, radius, minRating, minReviews, type, closedSaturday = true, opennow }) {
  // Apply defaults
  const searchRadius = radius || config.defaultRadius;
  const minRatingFilter = minRating !== undefined ? minRating : config.defaultMinRating;
  const minReviewsFilter = minReviews !== undefined ? minReviews : config.defaultMinReviews;
  const filterClosedSaturday = closedSaturday;

  console.log('\n=== SEARCH PARAMETERS ===');
  console.log(`Location: ${latitude}, ${longitude}`);
  console.log(`Radius: ${searchRadius}km`);
  console.log(`Min Rating: ${minRatingFilter}`);
  console.log(`Min Reviews: ${minReviewsFilter}`);
  console.log(`Type: ${type || 'both'}`);
  console.log(`Filter Closed Saturday: ${filterClosedSaturday}`);
  console.log(`Open Now: ${opennow !== undefined ? opennow : 'not set'}`);
  console.log('========================\n');

  // Clear log file at start of search
  const logPath = join(process.cwd(), 'google-api-debug.log');
  try {
    const header = `SEARCH STARTED: ${new Date().toISOString()}\n` +
      `Location: ${latitude}, ${longitude}\n` +
      `Radius: ${searchRadius}km\n` +
      `Type: ${type || 'both'}\n` +
      `Open Now: ${opennow !== undefined ? opennow : 'not set'}\n` +
      `Filter Closed Saturday: ${filterClosedSaturday}\n` +
      `${'='.repeat(80)}\n\n`;
    writeFileSync(logPath, header);
  } catch (err) {
    console.error('Failed to clear log file:', err.message);
  }

  // Validate radius
  if (searchRadius > config.maxRadius) {
    throw new Error(`Radius cannot exceed ${config.maxRadius} km`);
  }

  // Determine place types for API query
  let placeTypes = [];
  if (type === 'restaurant') {
    placeTypes = ['restaurant'];
  } else if (type === 'cafe') {
    placeTypes = ['cafe'];
  } else {
    // Search both separately to get more results (60 each = 120 total)
    placeTypes = ['restaurant', 'cafe'];
  }

  // Convert radius from km to meters for Google API
  const radiusMeters = searchRadius * 1000;

  try {
    // Search for each place type separately with pagination
    let allPlaces = [];

    // GOOGLE PLACES API PAGINATION:
    // - Each request returns max 20 results
    // - next_page_token allows fetching more results
    // - Must wait 2-3 seconds between page requests (or get INVALID_REQUEST)
    // - Tokens are search-specific, short-lived, one-time use only
    // - Google typically limits to ~60 results (3 pages) but we'll fetch ALL available

    for (const placeType of placeTypes) {
      let nextPageToken = null;
      let pageCount = 0;

      console.log(`\n--- Searching for type: ${placeType} ---`);
      console.log(`📄 Will fetch ALL pages until Google stops providing next_page_token`);

      do {
        // CRITICAL: Must wait 2-3 seconds before using next_page_token
        // Calling immediately → INVALID_REQUEST error
        if (nextPageToken) {
          console.log(`⏱️  Waiting 3 seconds before fetching next page (Google requirement)...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const requestParams = {
          location: { lat: latitude, lng: longitude },
          radius: radiusMeters,
          type: placeType,
          language: 'he',
          key: apiKey,
          ...(nextPageToken && { pagetoken: nextPageToken }),
          ...(opennow !== undefined && { opennow: opennow }),
        };

        console.log(`\n>>> GOOGLE PLACES NEARBY API REQUEST (${placeType} page ${pageCount + 1}) <<<`);
        console.log(`  ALL PARAMETERS SENT TO GOOGLE:`);
        const paramsForLog = { ...requestParams, key: '***hidden***' };
        console.log(JSON.stringify(paramsForLog, null, 2));

        // Also write request params to log file
        try {
          const requestLog = `REQUEST (${placeType} page ${pageCount + 1}):\n${JSON.stringify(paramsForLog, null, 2)}\n\n`;
          appendFileSync(logPath, requestLog);
        } catch (err) {
          console.error('Failed to write request to log file:', err.message);
        }

        const response = await googleMapsClient.placesNearby({
          params: requestParams,
          timeout: 10000, // 10-second timeout
        });

        // Console: Log response status only
        console.log(`  <<< Response status: ${response.data.status} >>>`);
        console.log(`  <<< Results count: ${response.data.results?.length || 0} >>>`);

        // File: Log only place names and ranks
        const places = response.data.results || [];
        try {
          places.forEach((place, index) => {
            const rank = allPlaces.length + index + 1;
            const rating = place.rating || 'N/A';
            const reviews = place.user_ratings_total || 0;
            const logLine = `${rank}\t${rating}\t${reviews}\t${place.name}\n`;
            appendFileSync(logPath, logLine);
          });

          // Log next_page_token info after each page
          const tokenInfo = `\nRESPONSE (${placeType} page ${pageCount + 1}):\n` +
            `  Status: ${response.data.status}\n` +
            `  Results this page: ${places.length}\n` +
            `  next_page_token exists: ${!!response.data.next_page_token}\n` +
            `  next_page_token value: ${response.data.next_page_token || 'NONE'}\n\n`;
          appendFileSync(logPath, tokenInfo);
        } catch (err) {
          console.error('Failed to write to log file:', err.message);
        }

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          console.error(`  ERROR: ${response.data.status} - ${response.data.error_message || 'No error message'}`);
          throw new Error(`Places search failed: ${response.data.status}`);
        }

        const resultsThisPage = response.data.results || [];
        allPlaces = allPlaces.concat(resultsThisPage);
        nextPageToken = response.data.next_page_token;
        pageCount++;

        console.log(`  ✓ Fetched ${resultsThisPage.length} places`);
        console.log(`  📊 Total accumulated: ${allPlaces.length} places`);
        console.log(`  🔗 next_page_token exists: ${!!nextPageToken}`);

        if (!nextPageToken) {
          console.log(`  ✅ PAGINATION COMPLETE - Google has no more results`);
        } else {
          console.log(`  ➡️  Continuing to next page...`);
        }

      } while (nextPageToken); // Keep going until Google stops providing next_page_token

      const typeCount = allPlaces.filter(p => p.types?.includes(placeType)).length;
      console.log(`\n>>> ✅ Completed ${placeType}: ${typeCount} places across ${pageCount} page(s)`);
    }

    if (allPlaces.length === 0) {
      return [];
    }

    // Remove duplicates based on place_id (same place may appear in both restaurant and cafe)
    const uniquePlacesMap = new Map();
    allPlaces.forEach(place => {
      if (!uniquePlacesMap.has(place.place_id)) {
        uniquePlacesMap.set(place.place_id, place);
      }
    });
    const places = Array.from(uniquePlacesMap.values());

    console.log(`\n=== FETCHING PLACE DETAILS ===`);
    console.log(`Found ${allPlaces.length} total places (${places.length} unique)`);
    console.log(`Fetching details for ${places.length} places...`);

    // Fetch details for each place to get opening hours
    const placesWithDetails = [];
    let detailsFailed = 0;

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      try {
        if (i % 10 === 0) {
          console.log(`  Progress: ${i}/${places.length} details fetched...`);
        }
        const details = await getPlaceDetails(place.place_id);
        if (details) {
          placesWithDetails.push(details);
        } else {
          detailsFailed++;
        }
      } catch (error) {
        console.error(`  Failed to get details for ${place.name}: ${error.message}`);
        detailsFailed++;
      }
    }

    console.log(`✓ Successfully fetched details for ${placesWithDetails.length} places`);
    console.log(`✗ Failed to fetch details for ${detailsFailed} places`);

    console.log('\n=== FILTERING PLACES ===');

    // Filter places
    let filteredBySaturday = 0;
    let filteredByRating = 0;
    let filteredByReviews = 0;

    const filteredPlaces = placesWithDetails.filter((place, index) => {
      const placeName = place.name || 'Unknown';

      // Check Saturday closure (only if filter is enabled)
      if (filterClosedSaturday) {
        const isClosed = isClosedOnSaturday(place.opening_hours);
        const saturdayHours = place.opening_hours?.weekday_text?.[6] || 'No data'; // Saturday is index 6

        if (!isClosed) {
          filteredBySaturday++;
          if (index < 5) {
            console.log(`❌ [${placeName}] - OPEN on Saturday: "${saturdayHours}"`);
          }
          return false;
        } else {
          if (index < 5) {
            console.log(`✅ [${placeName}] - Closed on Saturday: "${saturdayHours}"`);
          }
        }
      }

      // Check minimum rating
      const rating = place.rating || 0;
      if (rating < minRatingFilter) {
        filteredByRating++;
        if (index < 5) {
          console.log(`❌ [${placeName}] - Rating too low: ${rating} < ${minRatingFilter}`);
        }
        return false;
      }

      // Check minimum review count
      const reviewCount = place.user_ratings_total || 0;
      if (reviewCount < minReviewsFilter) {
        filteredByReviews++;
        if (index < 5) {
          console.log(`❌ [${placeName}] - Not enough reviews: ${reviewCount} < ${minReviewsFilter}`);
        }
        return false;
      }

      if (index < 5) {
        console.log(`✅ [${placeName}] - PASSED all filters (Rating: ${rating}, Reviews: ${reviewCount})`);
      }
      return true;
    });

    console.log('\n=== FILTER SUMMARY ===');
    console.log(`Total places fetched: ${placesWithDetails.length}`);
    console.log(`Filtered by Saturday: ${filteredBySaturday}`);
    console.log(`Filtered by Rating: ${filteredByRating}`);
    console.log(`Filtered by Reviews: ${filteredByReviews}`);
    console.log(`Final result count: ${filteredPlaces.length}`);
    console.log('======================\n');

    // Format places and add distance
    const formattedPlaces = filteredPlaces.map(place =>
      formatPlace(place, latitude, longitude)
    );

    // Sort by rating (highest first), then by review count as tiebreaker
    formattedPlaces.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.reviewCount - a.reviewCount;
    });

    console.log(`Returning ${formattedPlaces.length} places after sorting`);

    return formattedPlaces;
  } catch (error) {
    // Re-throw specific errors
    if (error.message.includes('Radius cannot exceed')) {
      throw error;
    }
    if (error.message.includes('timeout')) {
      throw error;
    }

    // Check for rate limit errors
    if (error.response?.status === 429 || error.message.includes('OVER_QUERY_LIMIT')) {
      throw new Error('RATE_LIMIT_EXCEEDED: Google API rate limit exceeded');
    }

    // Check for API key errors
    if (error.response?.status === 403 || error.message.includes('API key')) {
      throw new Error('GOOGLE_API_ERROR: Invalid or missing API key');
    }

    throw new Error(`Places search error: ${error.message}`);
  }
}
