/**
 * server/controllers/notificationController.js
 * In-app notification inbox for the authenticated user.
 *
 * Endpoints:
 *   GET   /api/notifications           — paginated list (newest first)
 *   GET   /api/notifications/unread-count — badge count
 *   PATCH /api/notifications/:id/read  — mark one as read
 *   PATCH /api/notifications/read-all  — mark all as read
 *
 * FRD §11, Master Prompt §4.11
 */
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

// ---------------------------------------------------------------------------
// GET /api/notifications
// Query: ?page=1&limit=20&unreadOnly=true
// ---------------------------------------------------------------------------
exports.listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { recipientId: req.user._id };
    if (req.query.unreadOnly === 'true') {
      filter.isRead = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/notifications/unread-count
// ---------------------------------------------------------------------------
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
    });
    res.status(200).json({ success: true, data: { unreadCount } });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/notifications/:id/read
// ---------------------------------------------------------------------------
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/notifications/read-all
// ---------------------------------------------------------------------------
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount ?? result.nModified ?? 0 },
    });
  } catch (err) {
    next(err);
  }
};
