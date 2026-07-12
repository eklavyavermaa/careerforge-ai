const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'resume_uploaded',
        'resume_analyzed',
        'jd_match_run',
        'cover_letter_generated',
        'interview_session_completed',
        'roadmap_generated',
        'application_added',
        'application_status_updated',
        'login',
      ],
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for weekly-progress style aggregation queries
analyticsEventSchema.index({ user: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
