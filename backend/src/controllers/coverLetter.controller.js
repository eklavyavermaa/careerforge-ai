const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Resume = require('../models/Resume.model');
const CoverLetter = require('../models/CoverLetter.model');
const { generateStructuredJson } = require('../services/gemini.service');
const { buildCoverLetterPrompt } = require('../utils/prompts/coverLetter.prompt');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');
const { logEvent } = require('../utils/events');

// @desc    Generate an AI cover letter from a resume (+ optional JD)
// @route   POST /api/v1/cover-letters
exports.generateCoverLetter = catchAsync(async (req, res, next) => {
  const { resumeId, jobDescription, companyName, roleTitle, tone } = req.body;

  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id }).select('+extractedText');
  if (!resume) return next(new AppError('Resume not found.', 404));
  if (!resume.extractedText) {
    return next(new AppError('This resume has no extracted text available to generate a cover letter.', 422));
  }

  const prompt = buildCoverLetterPrompt({
    resumeText: resume.extractedText,
    jobDescription,
    companyName,
    roleTitle,
    tone: tone || 'formal',
  });

  const { parsed } = await generateStructuredJson(prompt, { temperature: 0.6 });

  if (!parsed || typeof parsed.coverLetter !== 'string' || !parsed.coverLetter.trim()) {
    return next(new AppError('The AI returned an unexpected response format. Please try again.', 502));
  }

  const coverLetter = await CoverLetter.create({
    user: req.user._id,
    resume: resume._id,
    companyName: companyName?.trim() || '',
    roleTitle: roleTitle?.trim() || '',
    jobDescription: jobDescription?.trim() || '',
    tone: tone || 'formal',
    content: parsed.coverLetter.trim(),
  });

  logEvent(req.user._id, 'cover_letter_generated', { resumeId: resume._id, coverLetterId: coverLetter._id });

  res.status(201).json({
    success: true,
    message: 'Cover letter generated successfully.',
    data: { coverLetter },
  });
});

// @desc    List the user's generated cover letters (paginated)
// @route   GET /api/v1/cover-letters
exports.getUserCoverLetters = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [coverLetters, total] = await Promise.all([
    CoverLetter.find(filter)
      .populate('resume', 'title version')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CoverLetter.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { coverLetters },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get a single cover letter by ID
// @route   GET /api/v1/cover-letters/:id
exports.getCoverLetterById = catchAsync(async (req, res, next) => {
  const coverLetter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'resume',
    'title version'
  );
  if (!coverLetter) return next(new AppError('Cover letter not found.', 404));

  res.status(200).json({ success: true, data: { coverLetter } });
});

// @desc    Delete a cover letter
// @route   DELETE /api/v1/cover-letters/:id
exports.deleteCoverLetter = catchAsync(async (req, res, next) => {
  const coverLetter = await CoverLetter.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!coverLetter) return next(new AppError('Cover letter not found.', 404));

  res.status(200).json({ success: true, message: 'Cover letter deleted successfully.' });
});
