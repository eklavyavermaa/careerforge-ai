const catchAsync = require('../utils/catchAsync');
const Profile = require('../models/Profile.model');

const ALLOWED_FIELDS = [
  'headline',
  'bio',
  'location',
  'phone',
  'targetRole',
  'experienceLevel',
  'skills',
  'links',
  'education',
  'experience',
];

// @desc    Get the logged-in user's profile (auto-creates an empty one on first access)
// @route   GET /api/v1/profile
exports.getMyProfile = catchAsync(async (req, res) => {
  let profile = await Profile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await Profile.create({ user: req.user._id });
  }
  res.status(200).json({ success: true, data: { profile } });
});

// @desc    Update (or create) the logged-in user's profile
// @route   PATCH /api/v1/profile
exports.updateMyProfile = catchAsync(async (req, res) => {
  const updates = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { profile },
  });
});
