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
  googlePlacesApiKeyBackup: process.env.GOOGLE_PLACES_API_KEY_BACKUP || null,

  // OpenRouter API Key for kosher info
  openRouterApiKey: process.env.OPENROUTER_API_KEY || null,

  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),

  // Search defaults
  defaultRadius: 15, // kilometers
  maxRadius: 50, // kilometers
  defaultMinRating: 4.5, // minimum 4.5 stars
  defaultMinReviews: 100, // minimum 100 reviews required
};

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
  console.log('[Config] API key received from WebView - configuration initialized');
}

/**
 * Check if config is properly initialized
 * @returns {boolean} True if API key is available
 */
export function isConfigInitialized() {
  return (config.googlePlacesApiKey !== null && config.googlePlacesApiKey !== '');
}

/** Get all available Google Places API keys (primary + backup) */
export function getAvailableApiKeys() {
  const keys = [];
  if (config.googlePlacesApiKey) keys.push(config.googlePlacesApiKey);
  if (config.googlePlacesApiKeyBackup) keys.push(config.googlePlacesApiKeyBackup);
  return keys;
}
