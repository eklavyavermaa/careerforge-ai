const Notification = require('../models/Notification.model');

/**
 * Creates an in-app notification. Swallows errors and returns null on
 * failure — notification delivery is a side-effect and should never break
 * the primary action (e.g. completing an interview) that triggered it.
 *
 * @param {{ user: string, type: string, title: string, message: string, link?: string, metadata?: object }} params
 */
exports.createNotification = async ({ user, type, title, message, link = '', metadata = {} }) => {
  try {
    return await Notification.create({ user, type, title, message, link, metadata });
  } catch (err) {
    console.error(`[Notification] Failed to create notification "${type}":`, err.message);
    return null;
  }
};
