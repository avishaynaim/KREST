import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration constants
export const config = {
  // Google Places API Key
  // In mobile context: provided by WebView through nodejs-mobile bridge
  // In development: from .env file or environment variable
  // This is made optional here and will be validated when actually used
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || null,

  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),

  // Search defaults
  defaultRadius: 15, // kilometers
  maxRadius: 50, // kilometers
  defaultMinRating: 4.5, // minimum 4.5 stars
  defaultMinReviews: 100, // minimum 100 reviews required
};

// Flag to track if config has been initialized with API key from bridge
let configInitialized = false;

/**
 * Initialize configuration with API key from bridge
 * Called by nodejs-mobile bridge when WebView sends API key
 * @param {string} apiKey - Google Places API key from WebView
 */
export function initializeConfigWithApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  config.googlePlacesApiKey = apiKey;
  configInitialized = true;
  console.log('[Config] API key received from WebView - configuration initialized');
}

/**
 * Check if config is properly initialized
 * @returns {boolean} True if API key is available
 */
export function isConfigInitialized() {
  return config.googlePlacesApiKey !== null && config.googlePlacesApiKey !== '';
}
