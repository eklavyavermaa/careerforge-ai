const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Resume = require('../models/Resume.model');
const ResumeAnalysis = require('../models/ResumeAnalysis.model');
const { generateStructuredJson } = require('../services/gemini.service');
const { buildResumeAnalysisPrompt } = require('../utils/prompts/resumeAnalysis.prompt');
const { validateResumeAnalysis, normalizeResumeAnalysis } = require('../utils/aiResponseValidator');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');
const { logEvent } = require('../utils/events');
const { createNotification } = require('../utils/notify');

const stripRawResponse = (analysisDoc) => {
  const obj = analysisDoc.toObject();
  delete obj.rawAiResponse;
  return obj;
};

// @desc    Run AI analysis on a resume (optionally against a job description)
// @route   POST /api/v1/analysis
exports.analyzeResume = catchAsync(async (req, res, next) => {
  const { resumeId, jobDescription } = req.body;

  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id }).select('+extractedText');
  if (!resume) return next(new AppError('Resume not found.', 404));
  if (!resume.extractedText) {
    return next(new AppError('This resume has no extracted text available to analyze.', 422));
  }

  resume.status = 'processing';
  await resume.save();

  const prompt = buildResumeAnalysisPrompt(resume.extractedText, jobDescription);

  let parsed;
  let raw;
  try {
    ({ parsed, raw } = await generateStructuredJson(prompt));
  } catch (err) {
    resume.status = 'failed';
    await resume.save();
    return next(err);
  }

  const { valid, reason } = validateResumeAnalysis(parsed);
  if (!valid) {
    resume.status = 'failed';
    await resume.save();
    console.error('[Analysis] AI response failed validation:', reason);
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  const normalized = normalizeResumeAnalysis(parsed, { hasJobDescription: Boolean(jobDescription) });

  const analysis = await ResumeAnalysis.create({
    user: req.user._id,
    resume: resume._id,
    jobDescription: jobDescription || null,
    ...normalized,
    rawAiResponse: raw,
    aiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    status: 'completed',
  });

  resume.status = 'analyzed';
  await resume.save();

  logEvent(req.user._id, 'resume_analyzed', {
    resumeId: resume._id,
    analysisId: analysis._id,
    atsScore: normalized.atsScore,
  });
  await createNotification({
    user: req.user._id,
    type: 'resume_analyzed',
    title: 'Resume analysis complete',
    message: `Your resume "${resume.title}" scored ${normalized.atsScore}/100 on ATS compatibility.`,
    link: `/analysis/${analysis._id}`,
  });

  res.status(201).json({
    success: true,
    message: 'Resume analyzed successfully.',
    data: { analysis: stripRawResponse(analysis) },
  });
});

// @desc    Get all analyses for the logged-in user (paginated, newest first)
// @route   GET /api/v1/analysis
exports.getUserAnalyses = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [analyses, total] = await Promise.all([
    ResumeAnalysis.find(filter)
      .populate('resume', 'title version originalFileName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ResumeAnalysis.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { analyses },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get all analyses for one specific resume (its full report history)
// @route   GET /api/v1/analysis/resume/:resumeId
exports.getAnalysesForResume = catchAsync(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const { page, limit, skip } = getPagination(req.query);
  const filter = { resume: resume._id, user: req.user._id };

  const [analyses, total] = await Promise.all([
    ResumeAnalysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ResumeAnalysis.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { resume: { id: resume._id, title: resume.title }, analyses },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get a single analysis report by ID
// @route   GET /api/v1/analysis/:id
exports.getAnalysisById = catchAsync(async (req, res, next) => {
  const analysis = await ResumeAnalysis.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'resume',
    'title version originalFileName'
  );

  if (!analysis) return next(new AppError('Analysis report not found.', 404));

  res.status(200).json({ success: true, data: { analysis } });
});
