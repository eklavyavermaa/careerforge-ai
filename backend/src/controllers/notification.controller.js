const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Notification = require('../models/Notification.model');
const { getPagination, buildPaginationMeta } = require('../utils/paginate');

// @desc    List the user's notifications (paginated, optionally unread-only)
// @route   GET /api/v1/notifications
exports.getUserNotifications = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: { notifications, unreadCount },
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/v1/notifications/:id/read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found.', 404));

  res.status(200).json({ success: true, data: { notification } });
});

// @desc    Mark all of the user's notifications as read
// @route   PATCH /api/v1/notifications/read-all
exports.markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) return next(new AppError('Notification not found.', 404));

  res.status(200).json({ success: true, message: 'Notification deleted.' });
});
