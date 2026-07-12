const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Application = require('../models/Application.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');
const { logEvent } = require('../utils/events');
const { createNotification } = require('../utils/notify');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTABLE_FIELDS = ['createdAt', 'appliedDate', 'company'];

// @desc    Create a new job application
// @route   POST /api/v1/applications
exports.createApplication = catchAsync(async (req, res) => {
  const { company, role, jobUrl, location, salaryRange, resume, coverLetter, status, appliedDate, notes } =
    req.body;

  const initialStatus = status || 'wishlist';

  const application = await Application.create({
    user: req.user._id,
    company,
    role,
    jobUrl,
    location,
    salaryRange,
    resume: resume || null,
    coverLetter,
    status: initialStatus,
    appliedDate,
    notes,
    timeline: [{ status: initialStatus, note: 'Application created.', date: new Date() }],
  });

  logEvent(req.user._id, 'application_added', { applicationId: application._id, company, role });

  res.status(201).json({
    success: true,
    message: 'Application added successfully.',
    data: { application },
  });
});

// @desc    List the user's applications (paginated, filterable, searchable, sortable)
// @route   GET /api/v1/applications
exports.getUserApplications = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ company: regex }, { role: regex }];
  }

  const sortField = SORTABLE_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('resume', 'title version')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { applications },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Application counts grouped by status, for tracker/dashboard widgets
// @route   GET /api/v1/applications/stats
exports.getApplicationStats = catchAsync(async (req, res) => {
  const stats = await Application.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCounts = stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  res.status(200).json({ success: true, data: { total, statusCounts } });
});

// @desc    Get a single application by ID
// @route   GET /api/v1/applications/:id
exports.getApplicationById = catchAsync(async (req, res, next) => {
  const application = await Application.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'resume',
    'title version'
  );
  if (!application) return next(new AppError('Application not found.', 404));

  res.status(200).json({ success: true, data: { application } });
});

// @desc    Update application details (not status - see updateApplicationStatus)
// @route   PATCH /api/v1/applications/:id
exports.updateApplication = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'company',
    'role',
    'jobUrl',
    'location',
    'salaryRange',
    'resume',
    'coverLetter',
    'appliedDate',
    'notes',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const application = await Application.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!application) return next(new AppError('Application not found.', 404));

  res.status(200).json({
    success: true,
    message: 'Application updated successfully.',
    data: { application },
  });
});

// @desc    Update an application's status and append a timeline entry
// @route   PATCH /api/v1/applications/:id/status
exports.updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) return next(new AppError('Application not found.', 404));

  application.status = status;
  application.timeline.push({ status, note: note || '', date: new Date() });
  await application.save();

  logEvent(req.user._id, 'application_status_updated', { applicationId: application._id, status });
  await createNotification({
    user: req.user._id,
    type: 'application_status_changed',
    title: 'Application status updated',
    message: `${application.company} — ${application.role} is now marked as "${status.replace(/_/g, ' ')}".`,
    link: `/applications`,
  });

  res.status(200).json({
    success: true,
    message: 'Application status updated.',
    data: { application },
  });
});

// @desc    Delete an application
// @route   DELETE /api/v1/applications/:id
exports.deleteApplication = catchAsync(async (req, res, next) => {
  const application = await Application.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!application) return next(new AppError('Application not found.', 404));

  res.status(200).json({ success: true, message: 'Application deleted successfully.' });
});
