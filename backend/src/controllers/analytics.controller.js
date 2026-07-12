const catchAsync = require('../utils/catchAsync');
const Resume = require('../models/Resume.model');
const ResumeAnalysis = require('../models/ResumeAnalysis.model');
const InterviewSession = require('../models/InterviewSession.model');
const Application = require('../models/Application.model');
const LearningRoadmap = require('../models/LearningRoadmap.model');
const CoverLetter = require('../models/CoverLetter.model');
const AnalyticsEvent = require('../models/AnalyticsEvent.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');

const WEEKS_BACK = 8;

// @desc    High-level dashboard summary across every module
// @route   GET /api/v1/analytics/summary
exports.getDashboardSummary = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const [
    resumeCount,
    analysisCount,
    latestAnalysis,
    interviewCount,
    completedInterviews,
    applicationStats,
    activeRoadmaps,
    coverLetterCount,
  ] = await Promise.all([
    Resume.countDocuments({ user: userId }),
    ResumeAnalysis.countDocuments({ user: userId }),
    ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 }),
    InterviewSession.countDocuments({ user: userId }),
    InterviewSession.find({ user: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('overallScore'),
    Application.aggregate([{ $match: { user: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    LearningRoadmap.countDocuments({ user: userId, status: 'active' }),
    CoverLetter.countDocuments({ user: userId }),
  ]);

  const avgInterviewScore = completedInterviews.length
    ? Math.round(
        completedInterviews.reduce((sum, s) => sum + (s.overallScore || 0), 0) / completedInterviews.length
      )
    : null;

  const applicationsByStatus = applicationStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const totalApplications = applicationStats.reduce((sum, s) => sum + s.count, 0);

  res.status(200).json({
    success: true,
    data: {
      resumeCount,
      analysisCount,
      latestAtsScore: latestAnalysis?.atsScore ?? null,
      latestResumeScore: latestAnalysis?.resumeScore ?? null,
      latestIndustryReadinessScore: latestAnalysis?.industryReadinessScore ?? null,
      interviewCount,
      completedInterviewCount: completedInterviews.length,
      avgInterviewScore,
      totalApplications,
      applicationsByStatus,
      activeRoadmaps,
      coverLetterCount,
    },
  });
});

// @desc    Weekly activity counts by event type, for progress charts
// @route   GET /api/v1/analytics/weekly-progress
exports.getWeeklyProgress = catchAsync(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - WEEKS_BACK * 7);

  const weeklyProgress = await AnalyticsEvent.aggregate([
    { $match: { user: req.user._id, createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          week: { $isoWeek: '$createdAt' },
          year: { $isoWeekYear: '$createdAt' },
          eventType: '$eventType',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        week: '$_id.week',
        eventType: '$_id.eventType',
        count: 1,
      },
    },
  ]);

  res.status(200).json({ success: true, data: { weeklyProgress } });
});

// @desc    Recent activity feed (paginated)
// @route   GET /api/v1/analytics/recent-activity
exports.getRecentActivity = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [events, total] = await Promise.all([
    AnalyticsEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AnalyticsEvent.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { events },
    pagination: buildPaginationMeta(total, page, limit),
  });
});
