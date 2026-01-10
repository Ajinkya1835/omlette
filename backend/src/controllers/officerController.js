// backend/src/controllers/officerController.js
import Violation from "../models/Violation.js";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Notification from "../models/Notification.js";

// VIOLATION MANAGEMENT
export const getObjectedViolations = async (req, res) => {
  try {
    const violations = await Violation.find({ status: "OBJECTED" })
      .populate("reportedBy", "name email")
      .populate({
        path: "relatedProperty",
        select: "propertyName propertyType address owner",
        populate: {
          path: "owner",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Build owner violation history counts
    const ownerIds = Array.from(
      new Set(
        violations
          .map((v) => v.relatedProperty?.owner?._id?.toString())
          .filter(Boolean)
      )
    );

    let ownerCountsMap = new Map();
    if (ownerIds.length > 0) {
      const ownerProperties = await Property.find({ owner: { $in: ownerIds } })
        .select("_id owner")
        .lean();

      const propertyIds = ownerProperties.map((p) => p._id);

      if (propertyIds.length > 0) {
        const counts = await Violation.aggregate([
          { $match: { relatedProperty: { $in: propertyIds } } },
          {
            $lookup: {
              from: "properties",
              localField: "relatedProperty",
              foreignField: "_id",
              as: "prop",
            },
          },
          { $unwind: "$prop" },
          {
            $group: {
              _id: "$prop.owner",
              total: { $sum: 1 },
              unpaid: {
                $sum: {
                  $cond: [{ $eq: ["$status", "PAID"] }, 0, 1],
                },
              },
              violationTypes: { $push: "$violationType" },
            },
          },
        ]);

        ownerCountsMap = new Map(
          counts.map((c) => {
            const typeCounts = c.violationTypes?.reduce((acc, type) => {
              if (!type) return acc;
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {}) || {};

            const repeatBonus = Object.values(typeCounts).reduce((sum, count) => {
              return sum + (count > 1 ? count - 1 : 0);
            }, 0);

            const riskScore = c.unpaid * 2 + c.total + repeatBonus;

            return [c._id.toString(), { total: c.total, unpaid: c.unpaid, riskScore }];
          })
        );
      }
    }

    const enriched = violations.map((v) => {
      const ownerId = v.relatedProperty?.owner?._id?.toString();
      return {
        ...v,
        ownerHistory: ownerId
          ? ownerCountsMap.get(ownerId) || { total: 0, unpaid: 0 }
          : { total: 0, unpaid: 0 },
      };
    });

    res.json({ violations: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id).populate({
      path: "relatedProperty",
      select: "owner propertyName",
      populate: { path: "owner", select: "name email phone" },
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "OBJECTED") {
      return res.status(400).json({ message: "Only objected violations can be confirmed" });
    }

    violation.status = "CLOSED";
    violation.decision.decision = "CONFIRMED";
    violation.decision.requiresHuman = true;

    await violation.save();

    const amount = violation.decision?.amount || 0;
    const ownerId = violation.relatedProperty?.owner?._id;
    if (ownerId) {
      await Notification.create({
        recipient: ownerId,
        type: amount > 0 ? "PAYMENT_DUE" : "VIOLATION_STATUS_CHANGED",
        title: amount > 0 ? "Payment due for confirmed violation" : "Violation confirmed",
        message:
          amount > 0
            ? `Your objection for violation ${violation._id} was reviewed and the violation was confirmed. Fine amount: ₹${amount}. Please pay to close the case.`
            : `Your objection for violation ${violation._id} was reviewed and the violation was confirmed. No payment is due.`,
        link: "/owner/violations",
        relatedEntity: { entityType: "VIOLATION", entityId: violation._id },
        priority: amount > 0 ? "HIGH" : "MEDIUM",
      });
    }

    res.json({ message: "Violation confirmed", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const overrideViolation = async (req, res) => {
  try {
    const { reason } = req.body;

    const violation = await Violation.findById(req.params.id).populate({
      path: "relatedProperty",
      select: "owner propertyName",
      populate: { path: "owner", select: "name email phone" },
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "OBJECTED") {
      return res.status(400).json({ message: "Only objected violations can be overridden" });
    }

    violation.status = "CLOSED";
    violation.decision.decision = "OVERRIDDEN";
    violation.decision.requiresHuman = true;
    violation.decision.overrideReason = reason || "Officer overridden the objection";
    violation.decision.amount = 0;

    await violation.save();

    const ownerId = violation.relatedProperty?.owner?._id;
    if (ownerId) {
      await Notification.create({
        recipient: ownerId,
        type: "VIOLATION_STATUS_CHANGED",
        title: "Violation overridden",
        message: `Your objection for violation ${violation._id} was reviewed and the violation was waived. Reason: ${violation.decision.overrideReason}. No payment is due.`,
        link: "/owner/violations",
        relatedEntity: { entityType: "VIOLATION", entityId: violation._id },
        priority: "MEDIUM",
      });
    }

    res.json({ message: "Violation overridden", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// USER APPROVAL MANAGEMENT
// @route   GET /api/officer/pending-citizens
// @access  Private/Officer
export const getPendingCitizens = async (req, res) => {
  try {
    const citizens = await User.find({
      role: "CITIZEN",
      approved: false,
    }).select("-password");

    res.json({
      count: citizens.length,
      citizens,
    });
  } catch (error) {
    console.error("Error fetching pending citizens:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/officer/pending-owners
// @access  Private/Officer
export const getPendingOwners = async (req, res) => {
  try {
    const owners = await User.find({
      role: "PERMIT_HOLDER",
      approved: false,
    }).select("-password");

    res.json({
      count: owners.length,
      owners,
    });
  } catch (error) {
    console.error("Error fetching pending owners:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/officer/pending-properties
// @access  Private/Officer
export const getPendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      status: "PENDING_APPROVAL",
    }).populate("owner", "name email phone");

    res.json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Error fetching pending properties:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/officer/approve-citizen/:userId
// @access  Private/Officer
export const approveCitizen = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== "CITIZEN") {
      return res.status(404).json({ message: "Citizen not found" });
    }

    user.approved = true;
    user.approvedBy = req.user._id;
    user.approvalReason = "Approved by officer";

    await user.save();

    res.json({
      message: "Citizen approved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        approved: user.approved,
      },
    });
  } catch (error) {
    console.error("Error approving citizen:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/officer/approve-owner/:userId
// @access  Private/Officer
export const approveOwner = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== "PERMIT_HOLDER") {
      return res.status(404).json({ message: "Owner not found" });
    }

    user.approved = true;
    user.approvedBy = req.user._id;
    user.approvalReason = "Approved by officer";

    await user.save();

    res.json({
      message: "Owner approved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        approved: user.approved,
      },
    });
  } catch (error) {
    console.error("Error approving owner:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/officer/reject-user/:userId
// @access  Private/Officer
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.approved) {
      // Set rejection reason
      user.approvalReason = reason || "Rejected by officer";
      await user.save();

      return res.json({
        message: "User rejection recorded",
        user: {
          id: user._id,
          name: user.name,
          approved: user.approved,
        },
      });
    }

    res.status(400).json({ message: "Only pending users can be rejected" });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/officer/approve-property/:propertyId
// @access  Private/Officer
export const approveProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ message: "Property is not pending approval" });
    }

    property.status = "ACTIVE";
    property.approvedBy = req.user._id;
    property.approvalDate = new Date();

    await property.save();

    res.json({
      message: "Property approved successfully",
      property: {
        id: property._id,
        propertyName: property.propertyName,
        status: property.status,
      },
    });
  } catch (error) {
    console.error("Error approving property:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/officer/reject-property/:propertyId
// @access  Private/Officer
export const rejectProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { reason } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ message: "Property is not pending approval" });
    }

    property.status = "REJECTED";
    property.rejectionReason = reason || "Rejected by officer";

    await property.save();

    res.json({
      message: "Property rejected successfully",
      property: {
        id: property._id,
        propertyName: property.propertyName,
        status: property.status,
      },
    });
  } catch (error) {
    console.error("Error rejecting property:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/officer/dashboard-stats
// @access  Private/Officer
export const getDashboardStats = async (req, res) => {
  try {
    const pendingCitizens = await User.countDocuments({
      role: "CITIZEN",
      approved: false,
    });

    const pendingOwners = await User.countDocuments({
      role: "PERMIT_HOLDER",
      approved: false,
    });

    const pendingProperties = await Property.countDocuments({
      status: "PENDING_APPROVAL",
    });

    const approvedCitizens = await User.countDocuments({
      role: "CITIZEN",
      approved: true,
    });

    const approvedOwners = await User.countDocuments({
      role: "PERMIT_HOLDER",
      approved: true,
    });

    const objectedViolations = await Violation.countDocuments({ status: "OBJECTED" });

    res.json({
      pending: {
        citizens: pendingCitizens,
        owners: pendingOwners,
        properties: pendingProperties,
      },
      approved: {
        citizens: approvedCitizens,
        owners: approvedOwners,
      },
      total: {
        citizens: pendingCitizens + approvedCitizens,
        owners: pendingOwners + approvedOwners,
      },
      violations: objectedViolations,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};