const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Resume = require('../models/Resume.model');
const ResumeAnalysis = require('../models/ResumeAnalysis.model');
const { uploadPdfBuffer, deletePdf } = require('../services/cloudinary.service');
const { extractTextFromPdf } = require('../services/pdf.service');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');
const { logEvent } = require('../utils/events');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripHeavyFields = (resumeDoc) => {
  const obj = resumeDoc.toObject();
  delete obj.extractedText;
  return obj;
};

// @desc    Upload a new resume (PDF), extract its text, and store it
// @route   POST /api/v1/resumes
exports.uploadResume = catchAsync(async (req, res, next) => {
  const rawTitle = req.body.title?.trim();
  const fallbackTitle = req.file.originalname.replace(/\.pdf$/i, '').trim();
  const resumeTitle = rawTitle || fallbackTitle || 'Untitled Resume';

  // Extract text first: fail fast on a bad/corrupt PDF before spending a
  // Cloudinary upload on a file we'd have to reject anyway.
  const { text: extractedText } = await extractTextFromPdf(req.file.buffer);

  const uploadResult = await uploadPdfBuffer(req.file.buffer, {
    public_id: `resume_${req.user._id}_${Date.now()}`,
  });

  const existingVersions = await Resume.countDocuments({
    user: req.user._id,
    title: { $regex: `^${escapeRegex(resumeTitle)}$`, $options: 'i' },
  });

  // Only one resume is ever "active" per user at a time.
  await Resume.updateMany({ user: req.user._id, isActive: true }, { isActive: false });

  const resume = await Resume.create({
    user: req.user._id,
    title: resumeTitle,
    version: existingVersions + 1,
    fileUrl: uploadResult.secure_url,
    cloudinaryPublicId: uploadResult.public_id,
    originalFileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    extractedText,
    isActive: true,
    status: 'uploaded',
  });

  logEvent(req.user._id, 'resume_uploaded', { resumeId: resume._id, title: resume.title });

  res.status(201).json({
    success: true,
    message: 'Resume uploaded successfully.',
    data: { resume: stripHeavyFields(resume) },
  });
});

// @desc    Get all resumes for the logged-in user (paginated)
// @route   GET /api/v1/resumes
exports.getUserResumes = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  const [resumes, total] = await Promise.all([
    Resume.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Resume.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { resumes },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get a single resume by ID (optionally including extracted text)
// @route   GET /api/v1/resumes/:id
exports.getResumeById = catchAsync(async (req, res, next) => {
  const includeText = req.query.includeText === 'true';

  let query = Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (includeText) query = query.select('+extractedText');

  const resume = await query;
  if (!resume) return next(new AppError('Resume not found.', 404));

  res.status(200).json({ success: true, data: { resume } });
});

// @desc    Update a resume's title
// @route   PATCH /api/v1/resumes/:id
exports.updateResumeTitle = catchAsync(async (req, res, next) => {
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title: req.body.title.trim() },
    { new: true, runValidators: true }
  );

  if (!resume) return next(new AppError('Resume not found.', 404));

  res.status(200).json({
    success: true,
    message: 'Resume title updated successfully.',
    data: { resume },
  });
});

// @desc    Delete a resume (Cloudinary file + DB record + its analyses)
// @route   DELETE /api/v1/resumes/:id
exports.deleteResume = catchAsync(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  await deletePdf(resume.cloudinaryPublicId);
  await ResumeAnalysis.deleteMany({ resume: resume._id });
  await resume.deleteOne();

  // If we just deleted the active resume, promote the most recently
  // uploaded remaining one so the user always has an active resume (if any exist).
  if (resume.isActive) {
    const mostRecent = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (mostRecent) {
      mostRecent.isActive = true;
      await mostRecent.save();
    }
  }

  res.status(200).json({ success: true, message: 'Resume deleted successfully.' });
});

// @desc    Get version history for a resume (all uploads sharing its title)
// @route   GET /api/v1/resumes/:id/versions
exports.getVersionHistory = catchAsync(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const versions = await Resume.find({
    user: req.user._id,
    title: { $regex: `^${escapeRegex(resume.title)}$`, $options: 'i' },
  }).sort({ version: -1 });

  res.status(200).json({
    success: true,
    data: { title: resume.title, versions },
  });
});
