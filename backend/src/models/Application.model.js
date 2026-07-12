const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    jobUrl: { type: String, default: '' },
    location: { type: String, default: '' },
    salaryRange: { type: String, default: '' },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    coverLetter: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'wishlist',
        'applied',
        'oa_assessment',
        'interview_scheduled',
        'interviewing',
        'offer',
        'rejected',
        'withdrawn',
      ],
      default: 'wishlist',
      index: true,
    },
    appliedDate: Date,
    notes: { type: String, default: '' },
    timeline: [
      {
        status: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
