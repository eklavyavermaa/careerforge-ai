const AnalyticsEvent = require('../models/AnalyticsEvent.model');

/**
 * Fire-and-forget analytics logging. Intentionally never throws or awaits
 * in the caller — a logging failure must never break the user-facing
 * request that triggered it.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string} eventType - must match AnalyticsEvent's eventType enum
 * @param {object} [metadata]
 */
exports.logEvent = (userId, eventType, metadata = {}) => {
  AnalyticsEvent.create({ user: userId, eventType, metadata }).catch((err) => {
    console.error(`[Analytics] Failed to log event "${eventType}":`, err.message);
  });
};
