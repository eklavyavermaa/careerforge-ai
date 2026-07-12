const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    resourceUrl: { type: String, default: '' },
    estimatedHours: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const roadmapMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    skill: { type: String, required: true },
    items: [roadmapItemSchema],
  },
  { _id: true }
);

const learningRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    basedOnResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    missingSkills: [{ type: String }],
    milestones: [roadmapMilestoneSchema],
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningRoadmap', learningRoadmapSchema);
