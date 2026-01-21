/**
 * Parameter validation utilities
 */

/**
 * Validates radius parameter
 * @param {any} radius - Radius value to validate
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateRadius(radius) {
  if (radius === undefined || radius === null || radius === '') {
    return { valid: true, value: undefined }; // Will use default
  }

  const parsed = parseFloat(radius);

  if (isNaN(parsed)) {
    return { valid: false, error: 'Radius must be a valid number' };
  }

  if (parsed < 1 || parsed > 50) {
    return { valid: false, error: 'Radius must be between 1 and 50 km' };
  }

  return { valid: true, value: parsed };
}

/**
 * Validates minRating parameter
 * @param {any} minRating - Rating value to validate
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateMinRating(minRating) {
  if (minRating === undefined || minRating === null || minRating === '') {
    return { valid: true, value: undefined }; // Will use default
  }

  const parsed = parseFloat(minRating);

  if (isNaN(parsed)) {
    return { valid: false, error: 'Minimum rating must be a valid number' };
  }

  if (parsed < 1.0 || parsed > 5.0) {
    return { valid: false, error: 'Minimum rating must be between 1.0 and 5.0' };
  }

  return { valid: true, value: parsed };
}

/**
 * Validates minReviews parameter
 * @param {any} minReviews - Review count value to validate
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateMinReviews(minReviews) {
  if (minReviews === undefined || minReviews === null || minReviews === '') {
    return { valid: true, value: undefined }; // Will use default
  }

  const parsed = parseInt(minReviews, 10);

  if (isNaN(parsed)) {
    return { valid: false, error: 'Minimum reviews must be a valid number' };
  }

  if (parsed < 1) {
    return { valid: false, error: 'Minimum reviews must be at least 1' };
  }

  return { valid: true, value: parsed };
}

/**
 * Validates type parameter
 * @param {any} type - Place type to validate
 * @returns {{ valid: boolean, value?: string, error?: string }}
 */
export function validateType(type) {
  if (type === undefined || type === null || type === '') {
    return { valid: true, value: undefined }; // Will use default (both)
  }

  const normalized = type.toLowerCase().trim();

  if (normalized === 'both') {
    return { valid: true, value: undefined }; // Treat "both" same as undefined
  }

  if (normalized !== 'restaurant' && normalized !== 'cafe') {
    return { valid: false, error: 'Type must be either "restaurant", "cafe", or "both"' };
  }

  return { valid: true, value: normalized };
}

/**
 * Validates opennow parameter
 * @param {any} opennow - Open now value to validate
 * @returns {{ valid: boolean, value?: boolean, error?: string }}
 */
export function validateOpenNow(opennow) {
  if (opennow === undefined || opennow === null || opennow === '') {
    return { valid: true, value: undefined }; // Will use default
  }

  // Handle string boolean values
  if (typeof opennow === 'string') {
    const normalized = opennow.toLowerCase().trim();
    if (normalized === 'true') return { valid: true, value: true };
    if (normalized === 'false') return { valid: true, value: false };
  }

  // Handle actual boolean
  if (typeof opennow === 'boolean') {
    return { valid: true, value: opennow };
  }

  return { valid: false, error: 'opennow must be a boolean value (true or false)' };
}

/**
 * Validates location parameters
 * @param {string} city - City name
 * @param {any} latitude - Latitude value
 * @param {any} longitude - Longitude value
 * @returns {{ valid: boolean, city?: string, latitude?: number, longitude?: number, error?: string }}
 */
export function validateLocation(city, latitude, longitude) {
  const hasCity = city && city.trim().length > 0;
  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  // At least one must be provided
  if (!hasCity && !hasCoordinates) {
    return {
      valid: false,
      error: 'Either city name or coordinates (latitude and longitude) must be provided'
    };
  }

  // If coordinates provided, validate them
  if (hasCoordinates) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return { valid: false, error: 'Latitude and longitude must be valid numbers' };
    }

    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (lng < -180 || lng > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { valid: true, latitude: lat, longitude: lng, city: hasCity ? city : undefined };
  }

  // Only city provided
  return { valid: true, city };
}

/**
 * Validates all query parameters at once
 * @param {Object} query - Query parameters object
 * @returns {{ valid: boolean, params?: Object, errors?: string[] }}
 */
export function validateQueryParameters(query) {
  const errors = [];
  const params = {};

  // Validate location
  const locationValidation = validateLocation(query.city, query.latitude, query.longitude);
  if (!locationValidation.valid) {
    errors.push(locationValidation.error);
  } else {
    if (locationValidation.city) params.city = locationValidation.city;
    if (locationValidation.latitude !== undefined) params.latitude = locationValidation.latitude;
    if (locationValidation.longitude !== undefined) params.longitude = locationValidation.longitude;
  }

  // Validate radius
  const radiusValidation = validateRadius(query.radius);
  if (!radiusValidation.valid) {
    errors.push(radiusValidation.error);
  } else if (radiusValidation.value !== undefined) {
    params.radius = radiusValidation.value;
  }

  // Validate minRating
  const ratingValidation = validateMinRating(query.minRating);
  if (!ratingValidation.valid) {
    errors.push(ratingValidation.error);
  } else if (ratingValidation.value !== undefined) {
    params.minRating = ratingValidation.value;
  }

  // Validate minReviews
  const reviewsValidation = validateMinReviews(query.minReviews);
  if (!reviewsValidation.valid) {
    errors.push(reviewsValidation.error);
  } else if (reviewsValidation.value !== undefined) {
    params.minReviews = reviewsValidation.value;
  }

  // Validate type
  const typeValidation = validateType(query.type);
  if (!typeValidation.valid) {
    errors.push(typeValidation.error);
  } else if (typeValidation.value !== undefined) {
    params.type = typeValidation.value;
  }

  // Validate opennow
  const openNowValidation = validateOpenNow(query.opennow);
  if (!openNowValidation.valid) {
    errors.push(openNowValidation.error);
  } else if (openNowValidation.value !== undefined) {
    params.opennow = openNowValidation.value;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, params };
}
