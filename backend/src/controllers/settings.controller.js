const catchAsync = require('../utils/catchAsync');
const Settings = require('../models/Settings.model');

const ALLOWED_FIELDS = ['theme', 'emailNotifications', 'privacy', 'aiPreferences'];

// @desc    Get the logged-in user's settings (auto-creates defaults on first access)
// @route   GET /api/v1/settings
exports.getMySettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne({ user: req.user._id });
  if (!settings) {
    settings = await Settings.create({ user: req.user._id });
  }
  res.status(200).json({ success: true, data: { settings } });
});

// @desc    Update (or create) the logged-in user's settings
// @route   PATCH /api/v1/settings
exports.updateMySettings = catchAsync(async (req, res) => {
  const updates = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const settings = await Settings.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully.',
    data: { settings },
  });
});
