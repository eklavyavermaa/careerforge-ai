const { body } = require('express-validator');

exports.updateSettingsValidator = [
  body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme.'),
  body('emailNotifications').optional().isObject(),
  body('emailNotifications.resumeAnalysis').optional().isBoolean(),
  body('emailNotifications.applicationUpdates').optional().isBoolean(),
  body('emailNotifications.weeklyDigest').optional().isBoolean(),
  body('emailNotifications.productUpdates').optional().isBoolean(),
  body('privacy').optional().isObject(),
  body('privacy.profileVisibility')
    .optional()
    .isIn(['private', 'public'])
    .withMessage('Invalid profileVisibility.'),
  body('aiPreferences').optional().isObject(),
  body('aiPreferences.preferredTone')
    .optional()
    .isIn(['formal', 'concise', 'friendly'])
    .withMessage('Invalid preferredTone.'),
];
