const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity
 * @param {Object} params - Activity log parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userName - User name
 * @param {String} params.action - Action type
 * @param {String} params.actionLabel - Human readable action label
 * @param {String} params.description - Activity description
 * @param {String} params.ipAddress - IP address
 * @param {String} params.status - Status (success, failed, warning)
 * @param {Object} params.metadata - Additional metadata
 */
const logActivity = async (params) => {
  try {
    const {
      userId,
      userName,
      action,
      actionLabel,
      description,
      ipAddress = 'Unknown',
      status = 'success',
      metadata = {}
    } = params;

    console.log('Creating activity log with params:', params);

    const log = await ActivityLog.create({
      user: userId,
      userName,
      action,
      actionLabel,
      ipAddress,
      description,
      status,
      metadata
    });

    console.log('Activity log created successfully:', log);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent activity logging from breaking the main flow
  }
};

module.exports = { logActivity };