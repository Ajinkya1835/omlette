// backend/src/controllers/ownerController.js
import Violation from "../models/Violation.js";
import Property from "../models/Property.js";
import User from "../models/User.js";

// Get owner profile
export const getOwnerProfile = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update owner profile
export const updateOwnerProfile = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, email } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    await user.save();

    const updatedUser = await User.findById(req.user.userId).select("-password");
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all properties owned by the user
export const getOwnerProperties = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const properties = await Property.find({ owner: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new property
export const addProperty = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      propertyName,
      propertyType,
      address,
      wardNumber,
      zone,
      latitude,
      longitude,
      permitNumber,
      permitValidFrom,
      permitValidTo,
    } = req.body;

    // Check if permit number already exists
    const existingProperty = await Property.findOne({ permitNumber });
    if (existingProperty) {
      return res.status(400).json({ message: "Permit number already exists" });
    }

    const property = new Property({
      owner: req.user.userId,
      propertyName,
      propertyType,
      address,
      wardNumber,
      zone,
      latitude,
      longitude,
      locationGeo: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      permitNumber,
      permitValidFrom,
      permitValidTo,
      status: "ACTIVE",
    });

    await property.save();

    res.status(201).json({ message: "Property added successfully", property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update property details
export const updateProperty = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Verify ownership
    if (property.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to update this property" });
    }

    const {
      propertyName,
      propertyType,
      address,
      wardNumber,
      zone,
      latitude,
      longitude,
      permitValidFrom,
      permitValidTo,
      status,
    } = req.body;

    if (propertyName) property.propertyName = propertyName;
    if (propertyType) property.propertyType = propertyType;
    if (address) property.address = address;
    if (wardNumber) property.wardNumber = wardNumber;
    if (zone) property.zone = zone;
    if (latitude) property.latitude = latitude;
    if (longitude) property.longitude = longitude;
    if (permitValidFrom) property.permitValidFrom = permitValidFrom;
    if (permitValidTo) property.permitValidTo = permitValidTo;
    if (status) property.status = status;

    await property.save();

    res.json({ message: "Property updated successfully", property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get violations awaiting owner response
export const getOwnerViolations = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violations = await Violation.find({
      status: "AWAITING_OWNER",
    })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(violations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner accepts the violation
export const acceptViolation = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "AWAITING_OWNER") {
      return res.status(400).json({ message: "Action not allowed on this violation" });
    }

    if (violation.decision?.decision === "FINE") {
      violation.status = "PAID";
    } else {
      violation.status = "CLOSED";
    }

    await violation.save();

    res.json({ message: "Violation accepted", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner objects to the violation
export const objectViolation = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Objection reason is required" });
    }

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "AWAITING_OWNER") {
      return res.status(400).json({ message: "Action not allowed on this violation" });
    }

    violation.status = "OBJECTED";
    violation.decision.requiresHuman = true;
    violation.decision.overrideReason = reason;

    await violation.save();

    res.json({ message: "Violation objected successfully", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};