import { geocode } from './placesClient.js';

/**
 * Validates coordinate ranges
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateCoordinates(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Geocodes a city name to coordinates using Google Geocoding API
 * @param {string} cityName - Name of the city
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 * @throws {Error} - If geocoding fails
 */
export async function geocodeCity(cityName) {
  return await geocode(cityName);
}

/**
 * Processes location input with precedence logic
 * @param {Object} params - Location parameters
 * @param {string} params.city - City name (optional)
 * @param {number} params.latitude - Latitude coordinate (optional)
 * @param {number} params.longitude - Longitude coordinate (optional)
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 * @throws {Error} - If location validation fails
 */
export async function processLocation({ city, latitude, longitude }) {
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const hasCity = city && city.trim().length > 0;

  if (!hasCoordinates && !hasCity) {
    throw new Error('Either city name or coordinates must be provided');
  }

  if (hasCoordinates) {
    if (!validateCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates. Latitude must be between -90 and 90, longitude must be between -180 and 180');
    }
    return {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      formattedAddress: `${latitude}, ${longitude}`,
    };
  }

  if (hasCity) {
    return await geocodeCity(city);
  }
}
