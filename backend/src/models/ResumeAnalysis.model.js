const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
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
    jobDescription: {
      type: String, // optional - present if this was a JD-matching analysis
      default: null,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    resumeScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null, // only set for JD matching
    },
    summary: {
      type: String,
      default: '',
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    extractedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    keywordAnalysis: [
      {
        keyword: String,
        present: Boolean,
        importance: { type: String, enum: ['high', 'medium', 'low'] },
      },
    ],
    grammarIssues: [
      {
        issue: String,
        suggestion: String,
        location: String,
      },
    ],
    improvementSuggestions: [{ type: String }],
    industryReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    rawAiResponse: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
