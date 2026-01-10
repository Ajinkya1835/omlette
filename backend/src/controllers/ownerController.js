// backend/src/controllers/ownerController.js
import Violation from "../models/Violation.js";
import Property from "../models/Property.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

// Get owner profile
export const getOwnerProfile = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.user._id).select("-password");
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

    const user = await User.findById(req.user._id);
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

    const updatedUser = await User.findById(req.user._id).select("-password");
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

    // Get all properties and manually filter
    const allProperties = await Property.find({}).sort({ createdAt: -1 }).lean();
    const properties = allProperties.filter(p => p.owner.toString() === req.user._id.toString());

    console.log(`Owner ${req.user._id} has ${properties.length} properties`);

    res.json(properties);
  } catch (error) {
    console.error("Error fetching owner properties:", error);
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
      owner: req.user._id,
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
    if (property.owner.toString() !== req.user._id.toString()) {
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

    // Update locationGeo if coordinates changed
    if (latitude || longitude) {
      property.locationGeo = {
        type: "Point",
        coordinates: [
          parseFloat(longitude || property.longitude),
          parseFloat(latitude || property.latitude)
        ],
      };
    }

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

    // Get all properties and manually filter (workaround for ObjectId matching issue)
    const allProps = await Property.find({});
    const ownedProperties = allProps.filter(p => p.owner.toString() === req.user._id.toString());
    
    console.log(`Owner ${req.user._id.toString()} has ${ownedProperties.length} properties`);

    const propertyIds = ownedProperties.map((p) => p._id);

    // Find violations linked to owner's properties
    const violations = await Violation.find({
      relatedProperty: { $in: propertyIds },
      status: "AWAITING_OWNER",
    })
      .populate("reportedBy", "name email")
      .populate({
        path: "relatedProperty",
        select: "propertyName propertyType address owner",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${violations.length} violations for owner`);

    res.json(violations);
  } catch (error) {
    console.error("Error fetching owner violations:", error);
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

    // Get owner's properties
    const ownedProperties = await Property.find({ owner: req.user._id }).select("_id");
    const propertyIds = ownedProperties.map((p) => p._id);

    // Count previous paid/closed violations for this owner
    const previousViolationsCount = await Violation.countDocuments({
      relatedProperty: { $in: propertyIds },
      status: { $in: ["PAID", "CLOSED"] },
      _id: { $ne: violation._id } // Exclude current violation
    });

    console.log(`Owner has ${previousViolationsCount} previous violations`);

    // Calculate multiplier: 2^(number of previous violations)
    // 0 previous = 1x, 1 previous = 2x, 2 previous = 4x, 3 previous = 8x, etc.
    const multiplier = Math.pow(2, previousViolationsCount);
    
    // Get base fine amount (default to 1000 if not set)
    const baseFine = violation.decision?.amount || 1000;
    const finalFine = baseFine * multiplier;

    console.log(`Fine calculation: Base: ₹${baseFine} × ${multiplier}x = ₹${finalFine}`);

    // Update violation decision with new amount
    if (!violation.decision) {
      violation.decision = {};
    }
    violation.decision.decision = "FINE";
    violation.decision.amount = finalFine;

    // Create payment record
    const receiptNumber = `RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = await Payment.create({
      violation: violation._id,
      payer: req.user._id,
      amount: finalFine,
      paymentMethod: "CASH",
      transactionId: transactionId,
      paymentReference: previousViolationsCount > 0 
        ? `Repeat violation - ${multiplier}x multiplier applied (${previousViolationsCount} previous violations)` 
        : "First violation",
      status: "COMPLETED",
      receiptNumber: receiptNumber,
      paymentDate: new Date(),
      notes: `Base fine: ₹${baseFine}, Multiplier: ${multiplier}x (${previousViolationsCount} previous violations), Final amount: ₹${finalFine}`,
    });

    console.log("✅ Payment created:", payment._id, "Receipt:", receiptNumber, "Amount:", finalFine);

    violation.status = "PAID";
    await violation.save();

    res.json({ 
      message: `Violation accepted. Fine: ₹${finalFine} (${multiplier}x multiplier for ${previousViolationsCount} previous violations)`, 
      violation,
      payment: {
        receiptNumber,
        amount: finalFine,
        baseFine,
        multiplier,
        previousViolations: previousViolationsCount,
        transactionId,
      }
    });
  } catch (error) {
    console.error("Error accepting violation:", error);
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
    violation.objectionReason = reason;

    await violation.save();

    res.json({ message: "Violation objected successfully", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};