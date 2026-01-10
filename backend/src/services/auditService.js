import AuditLog from "../models/AuditLog.js";

/**
 * Log an audit entry
 * @param {Object} data - Audit data
 * @param {ObjectId} data.user - User who performed the action
 * @param {String} data.action - Action performed (CREATE, UPDATE, DELETE, etc.)
 * @param {String} data.entityType - Type of entity affected
 * @param {ObjectId} data.entityId - ID of the entity
 * @param {Object} data.changes - Changes made (optional)
 * @param {String} data.ipAddress - IP address (optional)
 * @param {String} data.userAgent - User agent (optional)
 * @param {Object} data.metadata - Additional metadata (optional)
 */
export const logAudit = async (data) => {
  try {
    const auditLog = await AuditLog.create({
      user: data.user,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata || {},
    });
    return auditLog;
  } catch (error) {
    console.error("Error logging audit:", error);
    // Don't throw - audit failures shouldn't break the main flow
    return null;
  }
};

/**
 * Get audit logs for a specific entity
 * @param {String} entityType - Type of entity
 * @param {ObjectId} entityId - ID of the entity
 * @param {Number} limit - Number of records to return
 */
export const getEntityAuditLogs = async (entityType, entityId, limit = 50) => {
  try {
    const logs = await AuditLog.find({ entityType, entityId })
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

/**
 * Get audit logs for a specific user
 * @param {ObjectId} userId - User ID
 * @param {Number} limit - Number of records to return
 */
export const getUserAuditLogs = async (userId, limit = 50) => {
  try {
    const logs = await AuditLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return logs;
  } catch (error) {
    console.error("Error fetching user audit logs:", error);
    throw error;
  }
};
