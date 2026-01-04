// backend/src/controllers/mapSearchController.js
import Violation from "../models/Violation.js";
import Property from "../models/Property.js";

// Search violations by location and filters
export const searchViolationsOnMap = async (req, res) => {
  try {
    const { lat, lng, radius, status, violationType } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseInt(radius) || 5000; // Default 5km

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Build query
    const query = {
      locationGeo: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInMeters / 6378100], // Earth radius in meters
        },
      },
    };

    // Add optional filters
    if (status) {
      query.status = status;
    }

    if (violationType) {
      query.violationType = violationType;
    }

    // Role-based access control
    if (req.user.role === "PERMIT_HOLDER") {
      // Owners can only see violations related to their properties
      const userProperties = await Property.find({ owner: req.user.userId });
      const propertyCoords = userProperties.map(p => ({
        lat: p.latitude,
        lng: p.longitude,
      }));
      
      // For now, just return violations (in production, you'd link violations to properties)
      // This is a simplified implementation
    }

    if (req.user.role === "CITIZEN") {
      // Citizens can only see their own violations
      query.reportedBy = req.user.userId;
    }

    // Execute query
    const violations = await Violation.find(query)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100) // Limit results for performance
      .lean();

    res.json({
      success: true,
      count: violations.length,
      radius: radiusInMeters,
      center: { latitude, longitude },
      violations,
    });
  } catch (error) {
    console.error("Map search error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Search properties by location
export const searchPropertiesOnMap = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInMeters = parseInt(radius) || 5000;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Build query
    const query = {
      locationGeo: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInMeters / 6378100],
        },
      },
    };

    // Role-based filtering
    if (req.user.role === "PERMIT_HOLDER") {
      // Owners can only see their own properties
      query.owner = req.user.userId;
    } else if (req.user.role === "CITIZEN") {
      // Citizens cannot access property map search
      return res.status(403).json({ message: "Access denied" });
    }

    const properties = await Property.find(query)
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      count: properties.length,
      radius: radiusInMeters,
      center: { latitude, longitude },
      properties,
    });
  } catch (error) {
    console.error("Property map search error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get nearby violations (within radius)
export const getNearbyViolations = async (req, res) => {
  try {
    const { lat, lng, maxDistance } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistanceMeters = parseInt(maxDistance) || 1000; // Default 1km

    // Use $near for sorted results by distance
    const violations = await Violation.find({
      locationGeo: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    })
      .populate("reportedBy", "name")
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: violations.length,
      violations,
    });
  } catch (error) {
    console.error("Nearby violations error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get violation clusters for map view (aggregated by area)
export const getViolationClusters = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied. Officers only." });
    }

    const { status } = req.query;

    const matchStage = status ? { status } : {};

    // Aggregate violations by approximate location (simplified clustering)
    const clusters = await Violation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            lat: { $round: [{ $arrayElemAt: ["$location.latitude", 0] }, 2] },
            lng: { $round: [{ $arrayElemAt: ["$location.longitude", 0] }, 2] },
          },
          count: { $sum: 1 },
          violations: { $push: "$_id" },
        },
      },
      { $limit: 200 },
    ]);

    res.json({
      success: true,
      clusters,
    });
  } catch (error) {
    console.error("Clustering error:", error);
    res.status(500).json({ message: error.message });
  }
};
