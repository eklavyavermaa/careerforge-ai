const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Resume = require('../models/Resume.model');
const ResumeAnalysis = require('../models/ResumeAnalysis.model');
const LearningRoadmap = require('../models/LearningRoadmap.model');
const { generateStructuredJson } = require('../services/gemini.service');
const { buildRoadmapPrompt } = require('../utils/prompts/roadmap.prompt');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');
const { logEvent } = require('../utils/events');
const { createNotification } = require('../utils/notify');

const recomputeProgress = (roadmap) => {
  let total = 0;
  let completed = 0;
  roadmap.milestones.forEach((milestone) => {
    milestone.items.forEach((item) => {
      total += 1;
      if (item.isCompleted) completed += 1;
    });
  });
  roadmap.progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  if (roadmap.progressPercentage === 100) {
    roadmap.status = 'completed';
  } else if (roadmap.status === 'completed') {
    roadmap.status = 'active';
  }
};

// @desc    Generate a personalized learning roadmap (optionally skill-gap
//          driven by a resume's latest analysis)
// @route   POST /api/v1/roadmaps
exports.generateRoadmap = catchAsync(async (req, res, next) => {
  const { targetRole, resumeId } = req.body;

  let missingSkills = [];
  let extractedSkills = [];
  let basedOnResume = null;

  if (resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return next(new AppError('Resume not found.', 404));
    basedOnResume = resume._id;

    const latestAnalysis = await ResumeAnalysis.findOne({ resume: resume._id, user: req.user._id }).sort({
      createdAt: -1,
    });
    if (latestAnalysis) {
      missingSkills = latestAnalysis.missingSkills || [];
      extractedSkills = latestAnalysis.extractedSkills || [];
    }
  }

  const prompt = buildRoadmapPrompt({ targetRole, missingSkills, extractedSkills });
  const { parsed } = await generateStructuredJson(prompt, { temperature: 0.5 });

  if (!parsed || !Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  const milestones = parsed.milestones
    .filter((m) => m && m.title && Array.isArray(m.items))
    .map((m) => ({
      title: String(m.title).trim(),
      skill: String(m.skill || m.title).trim(),
      items: m.items
        .filter((i) => i && i.title)
        .map((i, idx) => ({
          title: String(i.title).trim(),
          description: String(i.description || '').trim(),
          estimatedHours: Number(i.estimatedHours) || 0,
          isCompleted: false,
          order: idx,
        })),
    }))
    .filter((m) => m.items.length > 0);

  if (milestones.length === 0) {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  const roadmap = await LearningRoadmap.create({
    user: req.user._id,
    targetRole,
    basedOnResume,
    missingSkills,
    milestones,
    progressPercentage: 0,
    status: 'active',
  });

  logEvent(req.user._id, 'roadmap_generated', { roadmapId: roadmap._id, targetRole });

  res.status(201).json({
    success: true,
    message: 'Learning roadmap generated successfully.',
    data: { roadmap },
  });
});

// @desc    List the user's roadmaps (paginated)
// @route   GET /api/v1/roadmaps
exports.getUserRoadmaps = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [roadmaps, total] = await Promise.all([
    LearningRoadmap.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LearningRoadmap.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { roadmaps },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get a single roadmap by ID
// @route   GET /api/v1/roadmaps/:id
exports.getRoadmapById = catchAsync(async (req, res, next) => {
  const roadmap = await LearningRoadmap.findOne({ _id: req.params.id, user: req.user._id });
  if (!roadmap) return next(new AppError('Roadmap not found.', 404));

  res.status(200).json({ success: true, data: { roadmap } });
});

// @desc    Toggle completion of a single learning item and recompute progress
// @route   PATCH /api/v1/roadmaps/:id/items/:itemId
exports.updateItemProgress = catchAsync(async (req, res, next) => {
  const { id, itemId } = req.params;
  const { isCompleted } = req.body;

  const roadmap = await LearningRoadmap.findOne({ _id: id, user: req.user._id });
  if (!roadmap) return next(new AppError('Roadmap not found.', 404));

  let item = null;
  let parentMilestone = null;
  for (const milestone of roadmap.milestones) {
    const found = milestone.items.id(itemId);
    if (found) {
      item = found;
      parentMilestone = milestone;
      break;
    }
  }
  if (!item) return next(new AppError('Learning item not found in this roadmap.', 404));

  item.isCompleted = Boolean(isCompleted);
  recomputeProgress(roadmap);
  await roadmap.save();

  if (item.isCompleted && parentMilestone.items.every((i) => i.isCompleted)) {
    await createNotification({
      user: req.user._id,
      type: 'roadmap_milestone',
      title: 'Milestone completed!',
      message: `You completed the "${parentMilestone.title}" milestone in your "${roadmap.targetRole}" roadmap.`,
      link: `/roadmaps/${roadmap._id}`,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Learning item updated.',
    data: { roadmap },
  });
});

// @desc    Delete a roadmap
// @route   DELETE /api/v1/roadmaps/:id
exports.deleteRoadmap = catchAsync(async (req, res, next) => {
  const roadmap = await LearningRoadmap.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!roadmap) return next(new AppError('Roadmap not found.', 404));

  res.status(200).json({ success: true, message: 'Roadmap deleted successfully.' });
});
