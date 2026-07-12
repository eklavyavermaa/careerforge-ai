const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    companyName: { type: String, default: '', trim: true },
    roleTitle: { type: String, default: '', trim: true },
    jobDescription: { type: String, default: '' },
    tone: {
      type: String,
      enum: ['formal', 'concise', 'friendly', 'enthusiastic'],
      default: 'formal',
    },
    content: {
      type: String,
      required: true,
    },
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
  },
  { timestamps: true }
);

coverLetterSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CoverLetter', coverLetterSchema);
