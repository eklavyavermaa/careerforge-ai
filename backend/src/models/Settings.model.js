const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    emailNotifications: {
      resumeAnalysis: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: false },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['private', 'public'],
        default: 'private',
      },
    },
    aiPreferences: {
      preferredTone: {
        type: String,
        enum: ['formal', 'concise', 'friendly'],
        default: 'formal',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
