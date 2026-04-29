import axios from 'axios';
import { config, getAvailableApiKeys } from './config.js';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const GEOCODE_API_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Check if error is a rate-limit related error
 * @param {Error} error - Axios error
 * @returns {boolean}
 */
function isRateLimitError(error) {
  if (error.response) {
    const { status, data } = error.response;
    // HTTP 429 or Google RESOURCE_EXHAUSTED
    if (status === 429) return true;
    if (data?.error?.status === 'RESOURCE_EXHAUSTED') return true;
    if (data?.error?.message?.includes('rate limit')) return true;
  }
  return false;
}

/**
 * Exponential backoff delay (ms)
 * @param {number} attempt - 0-indexed attempt number
 * @returns {number} Delay in ms
 */
function backoffDelay(attempt) {
  // 1s, 2s, 4s, 8s (capped at 8s)
  return Math.min(1000 * Math.pow(2, attempt), 8000);
}

/**
 * Execute an axios request with API key rotation and retry
 * @param {Object} options - Axios request options (method, url, data, params, etc.)
 * @param {number} maxRetries - Maximum retry attempts (default 4)
 * @returns {Promise<Object>} - Axios response
 */
async function executeWithRetry(options, maxRetries = 4) {
  const keys = getAvailableApiKeys();
  if (keys.length === 0) {
    throw new Error('No Google Places API keys available');
  }

  let lastError;
  let keyStartIndex = 0;

  // Try each key in rotation until success or exhausted
  for (let keyAttempt = 0; keyAttempt < keys.length; keyAttempt++) {
    const keyIndex = (keyStartIndex + keyAttempt) % keys.length;
    const apiKey = keys[keyIndex];

    console.log(`[placesClient] Using API key index ${keyIndex} (${apiKey.substring(0, 8)}...)`);

    // Inject the key into request headers/params
    const requestOptions = { ...options };
    if (requestOptions.headers) {
      requestOptions.headers = { ...requestOptions.headers, 'X-Goog-Api-Key': apiKey };
    } else {
      requestOptions.headers = { 'X-Goog-Api-Key': apiKey };
    }

    // Retry loop for this key
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios(requestOptions);
        console.log(`[placesClient] Request succeeded with key index ${keyIndex} (attempt ${attempt + 1})`);
        // On success, rotate starting index so next call uses next key (round-robin)
        keyStartIndex = (keyIndex + 1) % keys.length;
        return response;
      } catch (error) {
        lastError = error;

        if (isRateLimitError(error)) {
          const delay = backoffDelay(attempt);
          console.warn(`[placesClient] Rate limit hit with key ${keyIndex} (attempt ${attempt + 1}). Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          // Continue retry loop with same key (backoff)
          continue;
        } else {
          // Non-rate-limit error, fail fast
          console.error(`[placesClient] Non-retryable error with key ${keyIndex}:`, error.message);
          throw error;
        }
      }
    }

    // Exhausted retries for this key, try next key
    console.warn(`[placesClient] Key ${keyIndex} exhausted after ${maxRetries} attempts. Trying next key...`);
  }

  // All keys exhausted
  throw lastError || new Error('All API keys failed');
}

/**
 * Search for places using Places API v1 (searchNearby endpoint)
 * @param {Object} params - Search parameters
 * @param {number} params.latitude - Center latitude
 * @param {number} params.longitude - Center longitude
 * @param {number} params.radius - Radius in meters
 * @param {Array<string>} params.types - Place types (e.g., ['restaurant', 'cafe'])
 * @param {boolean} [params.openNow] - Filter by open now status
 * @returns {Promise<Object>} - { places: [...], nextPageToken: string|null, status: string }
 */
export async function searchNearby({ latitude, longitude, radius, types, openNow }) {
  const url = `${PLACES_API_BASE}/places:searchNearby`;

  const requestBody = {
    includedPrimaryTypes: types,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
    ...(openNow !== undefined && { openNow }),
  };

  try {
    const response = await executeWithRetry({
      method: 'post',
      url,
      data: requestBody,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'he',
      },
      timeout: 15000, // 15s timeout
    });

    return {
      places: response.data?.places || [],
      nextPageToken: response.data?.nextPageToken || null,
      status: response.data?.status || 'OK',
    };
  } catch (error) {
    console.error('searchNearby error:', error.message);
    if (error.response) {
      console.error('API error status:', error.response.status);
      console.error('API error data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Get place details using Places API v1 (getPlace endpoint)
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details object
 */
export async function getPlace(placeId) {
  const url = `${PLACES_API_BASE}/places/${placeId}`;

  try {
    const response = await executeWithRetry({
      method: 'get',
      url,
      headers: {
        'X-Goog-FieldMask': 'id,displayName,primaryType,location,formattedAddress,rating,userRatingCount,businessStatus,currentOpeningHours,regularOpeningHours,googleMapsUri,types,editorialSummary,internationalPhoneNumber,websiteUri',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error(`getPlace error for ${placeId}:`, error.message);
    throw error;
  }
}

/**
 * Geocode a city/address using Google Geocoding API
 * @param {string} address - Address or city name to geocode
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 */
export async function geocode(address) {
  try {
    const response = await executeWithRetry({
      method: 'get',
      url: GEOCODE_API_BASE,
      params: {
        address,
        language: 'he',
        // key injected by executeWithRetry via X-Goog-Api-Key header
      },
      headers: {
        'Accept-Language': 'he',
      },
      timeout: 15000,
    });

    console.log('\n>>> GOOGLE GEOCODING API REQUEST <<<');
    console.log(`Address: ${address}`);
    console.log(`Language: he`);
    console.log(`Status: ${response.data.status}`);

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    } else if (response.data.status === 'ZERO_RESULTS') {
      throw new Error(`Address not found: ${address}`);
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('failed')) {
      throw error;
    }
    throw new Error(`Geocoding error: ${error.message}`);
  }
}
