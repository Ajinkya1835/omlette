// backend/src/controllers/propertyController.js
import Property from "../models/Property.js";

// Get all active properties
export const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: "ACTIVE" })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all active properties (minimal data for map view)
export const getAllPropertiesForMap = async (req, res) => {
  try {
    const properties = await Property.find({ status: "ACTIVE" })
      .select("_id propertyName propertyType address latitude longitude")
      .sort({ propertyName: 1 })
      .lean();

    res.json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Error fetching properties for map:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get nearby properties within radius
export const getNearbyProperties = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseInt(radius) || 3000; // Default 3km

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Use geospatial query if locationGeo exists, otherwise fallback to distance calculation
    let properties;

    try {
      // Try geospatial query first
      properties = await Property.find({
        status: "ACTIVE",
        locationGeo: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
        .populate("owner", "name email phone")
        .limit(50)
        .lean();
    } catch (geoError) {
      // Fallback: manual distance calculation
      console.log("Geospatial query failed, using fallback method");
      
      const allProperties = await Property.find({ status: "ACTIVE" })
        .populate("owner", "name email phone")
        .lean();

      // Calculate distance and filter
      properties = allProperties
        .map((property) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            property.latitude,
            property.longitude
          );
          return { ...property, distance };
        })
        .filter((property) => property.distance <= radiusInMeters)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 50);
    }

    // Add distance field for display
    const propertiesWithDistance = properties.map((property) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        property.latitude,
        property.longitude
      );
      return {
        ...property,
        distance: Math.round(distance),
        distanceKm: (distance / 1000).toFixed(2),
      };
    });

    res.json({
      success: true,
      count: propertiesWithDistance.length,
      center: { latitude, longitude },
      radius: radiusInMeters,
      properties: propertiesWithDistance,
    });
  } catch (error) {
    console.error("Error fetching nearby properties:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get property by ID
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "name email phone")
      .lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
