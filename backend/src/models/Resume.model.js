const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Untitled Resume',
    },
    version: {
      type: Number,
      default: 1,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    originalFileName: String,
    fileSize: Number,
    mimeType: String,
    extractedText: {
      type: String,
      select: false, // large field, opt-in only
    },
    isActive: {
      type: Boolean,
      default: true, // marks the "current" resume for the user
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'failed'],
      default: 'uploaded',
    },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
