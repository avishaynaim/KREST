import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
function validateConfig() {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
  }
}

// Validate configuration on module load
validateConfig();

// Configuration constants
export const config = {
  // Google Places API Key
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,

  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),

  // Search defaults
  defaultRadius: 15, // kilometers
  maxRadius: 50, // kilometers
  defaultMinRating: 4.5, // minimum 4.5 stars
  defaultMinReviews: 100, // minimum 100 reviews required
};
