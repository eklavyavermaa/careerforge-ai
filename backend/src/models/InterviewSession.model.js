const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    category: {
      type: String,
      enum: ['hr', 'technical', 'behavioral'],
      required: true,
    },
    userAnswer: { type: String, default: '' },
    aiFeedback: { type: String, default: '' },
    score: { type: Number, min: 0, max: 10, default: null },
  }
  // Subdocuments keep their default auto-generated _id so a specific
  // question can be addressed reliably via /interviews/:id/questions/:questionId,
  // instead of relying on array index (which can shift).
);

const interviewSessionSchema = new mongoose.Schema(
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
    experienceLevel: {
      type: String,
      enum: ['student', 'fresher', 'junior', 'mid', 'senior'],
      default: 'fresher',
    },
    questions: [interviewQuestionSchema],
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    overallFeedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    completedAt: Date,
  },
  { timestamps: true }
);

interviewSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
