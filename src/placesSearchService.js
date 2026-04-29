import { searchNearby } from './placesClient.js';
import { config } from './config.js';
import { appendFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { calculateDistance } from './geoUtils.js';

export { calculateDistance };

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

/**
 * Convert Places API v1 place object to legacy format
 */
function convertNewPlaceToLegacy(newPlace, searchLatLng) {
  const lat = newPlace.location?.latitude || 0;
  const lng = newPlace.location?.longitude || 0;

  const name = newPlace.displayName?.text || newPlace.name || 'Unknown';
  const placeId = newPlace.id?.replace('places/', '') || newPlace.place_id || newPlace.id;

  const geometry = { location: { lat, lng } };

  let openingHours = {};
  if (newPlace.currentOpeningHours || newPlace.regularOpeningHours) {
    const src = newPlace.currentOpeningHours || newPlace.regularOpeningHours;
    openingHours = { weekday_text: formatPeriodsTo24Hour(src) };
  }

  let url;
  if (newPlace.googleMapsUri) {
    url = `${newPlace.googleMapsUri}${newPlace.googleMapsUri.includes('?') ? '&' : '?'}hl=he`;
  } else {
    const pid = placeId || '';
    url = `https://www.google.com/maps/place/?q=place_id:${pid}&hl=he`;
  }

  return {
    place_id: placeId,
    name,
    geometry,
    rating: newPlace.rating || 0,
    user_ratings_total: newPlace.userRatingCount || 0,
    opening_hours: openingHours,
    url,
    types: newPlace.types || [],
    primaryType: newPlace.primaryType,
    businessStatus: newPlace.businessStatus,
    formatted_address: newPlace.formattedAddress,
    editorialSummary: newPlace.editorialSummary?.text || null,
    formatted_phone_number: newPlace.internationalPhoneNumber || null,
    photos: newPlace.photos ? newPlace.photos.map(p => ({
      reference: p.name,
      width: p.width,
      height: p.height,
    })) : [],
    website: newPlace.websiteUri || null,
  };
}

/**
 * Format legacy place for UI response
 */
function formatPlace(place, searchLat, searchLng) {
  const distance = calculateDistance(
    searchLat, searchLng,
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
    distance,
    openingHours: formatPeriodsTo24Hour(place.opening_hours),
    phone: place.formatted_phone_number || null,
    photos: place.photos || [],
    googleMapsUrl: place.url
      ? `${place.url}${place.url.includes('?') ? '&' : '?'}hl=he`
      : `https://www.google.com/maps/place/?q=place_id:${place.place_id}&hl=he`,
    placeId: place.place_id,
  };
}

/**
 * Main search function
 */
export async function searchPlaces({ latitude, longitude, radius, minRating, minReviews, type, closedSaturday = true, opennow }) {
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

  const isProduction = process.env.NODE_ENV === 'production';
  const logPath = isProduction ? null : join(process.cwd(), 'google-api-debug.log');
  if (logPath) {
    try {
      const header = `SEARCH STARTED: ${new Date().toISOString()}\n` +
        `Location: ${latitude}, ${longitude}\n` +
        `Radius: ${searchRadius}km\n` +
        `Type: ${type || 'both'}\n` +
        `Open Now: ${opennow !== undefined ? opennow : 'not set'}\n` +
        `Filter Closed Saturday: ${filterClosedSaturday}\n` +
        `${'='.repeat(80)}\n\n`;
      await writeFile(logPath, header);
    } catch (err) {
      console.error('Failed to clear log file:', err.message);
    }
  }

  if (searchRadius > config.maxRadius) {
    throw new Error(`Radius cannot exceed ${config.maxRadius} km`);
  }

  let placeTypes = [];
  if (type === 'restaurant') {
    placeTypes = ['restaurant'];
  } else if (type === 'cafe') {
    placeTypes = ['cafe'];
  } else {
    placeTypes = ['restaurant', 'cafe'];
  }

  const radiusMeters = searchRadius * 1000;

  try {
    let allPlaces = [];

    for (const placeType of placeTypes) {
      let nextPageToken = null;
      let pageCount = 0;

      console.log(`\n--- Searching for type: ${placeType} ---`);

      do {
        if (nextPageToken) {
          console.log(`⏱️  Waiting 3 seconds before fetching next page...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log(`>>> GOOGLE PLACES SEARCH NEARBY (${placeType} page ${pageCount + 1})`);

        const response = await searchNearby({
          latitude,
          longitude,
          radius: radiusMeters,
          types: [placeType],
          openNow: opennow,
        });

        console.log(`  Status: ${response.status}, Results: ${response.places.length}`);

        if (logPath) {
          try {
            await appendFile(logPath, `PAGE ${pageCount+1}: ${response.places.length} places, token: ${response.nextPageToken || 'none'}\n`);
          } catch {}
        }

        if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
          throw new Error(`Places search failed: ${response.status}`);
        }

        const legacy = response.places.map(p => convertNewPlaceToLegacy(p, { latitude, longitude }));
        allPlaces = allPlaces.concat(legacy);
        nextPageToken = response.nextPageToken;
        pageCount++;

        console.log(`  ✓ Total accumulated: ${allPlaces.length} places`);
      } while (nextPageToken);

      console.log(`✅ Completed ${placeType}: ${allPlaces.length} total places, ${pageCount} page(s)`);
    }

    if (allPlaces.length === 0) {
      return [];
    }

    // Deduplicate
    const uniqueMap = new Map();
    allPlaces.forEach(p => {
      if (!uniqueMap.has(p.place_id)) {
        uniqueMap.set(p.place_id, p);
      }
    });
    const uniquePlaces = Array.from(uniqueMap.values());
    console.log(`\nUnique places after dedup: ${uniquePlaces.length}`);

    console.log('=== FILTERING PLACES ===');
    let filtSat = 0, filtRating = 0, filtReviews = 0;

    const filtered = uniquePlaces.filter((place, idx) => {
      const name = place.name || 'Unknown';

      if (filterClosedSaturday) {
        const closed = isClosedOnSaturday(place.opening_hours);
        const satHours = place.opening_hours?.weekday_text?.[6] || 'No data';
        if (!closed) {
          filtSat++;
          if (idx < 5) console.log(`❌ ${name} - OPEN Sat: "${satHours}"`);
          return false;
        }
      }

      const rating = place.rating || 0;
      if (rating < minRatingFilter) {
        filtRating++;
        if (idx < 5) console.log(`❌ ${name} - Low rating: ${rating} < ${minRatingFilter}`);
        return false;
      }

      const reviews = place.user_ratings_total || 0;
      if (reviews < minReviewsFilter) {
        filtReviews++;
        if (idx < 5) console.log(`❌ ${name} - Few reviews: ${reviews} < ${minReviewsFilter}`);
        return false;
      }

      if (idx < 5) console.log(`✅ ${name} - passed`);
      return true;
    });

    console.log('=== FILTER SUMMARY ===');
    console.log(`Total: ${uniquePlaces.length}, Sat: ${filtSat}, Rating: ${filtRating}, Reviews: ${filtReviews}`);
    console.log(`Results: ${filtered.length}`);

    // Format and sort
    const formatted = filtered.map(p => formatPlace(p, latitude, longitude));
    formatted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);

    console.log(`Returning ${formatted.length} places`);
    return formatted;
  } catch (error) {
    if (error.message.includes('Radius')) throw error;
    if (error.message.includes('timeout')) throw error;
    if (error.response?.status === 429 || error.message.includes('OVER_QUERY_LIMIT')) {
      throw new Error('RATE_LIMIT_EXCEEDED: Google API rate limit exceeded');
    }
    if (error.response?.status === 403 || error.message.includes('API key')) {
      throw new Error('GOOGLE_API_ERROR: Invalid or missing API key');
    }
    throw new Error(`Places search error: ${error.message}`);
  }
}
