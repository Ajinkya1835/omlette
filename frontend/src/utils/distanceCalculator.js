/**
 * Distance Calculator Utility
 * Uses Haversine formula to calculate distance between two coordinates
 */

/**
 * Calculate distance between two geographical points using Haversine formula
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Property latitude
 * @param {number} lon2 - Property longitude
 * @returns {object} - { meters: number, kilometers: string }
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInMeters = R * c;

  return {
    meters: Math.round(distanceInMeters),
    kilometers: (distanceInMeters / 1000).toFixed(2),
  };
};

/**
 * Format distance for display
 * @param {number} kilometers - Distance in kilometers
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (kilometers) => {
  const km = parseFloat(kilometers);
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km}km`;
};
