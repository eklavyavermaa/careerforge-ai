const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, maxlength: 150, default: '' },
    bio: { type: String, maxlength: 1000, default: '' },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    experienceLevel: {
      type: String,
      enum: ['student', 'fresher', 'junior', 'mid', 'senior'],
      default: 'student',
    },
    skills: [{ type: String, trim: true }],
    links: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      leetcode: { type: String, default: '' },
    },
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startYear: Number,
        endYear: Number,
        grade: String,
      },
    ],
    experience: [
      {
        company: String,
        title: String,
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
