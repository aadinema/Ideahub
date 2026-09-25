/**
 * server/models/Notification.js
 * In-app and dashboard alert notification store.
 * Email notifications are fire-and-forget via emailService — not stored here.
 * Only in_app and dashboard_alert channels are persisted for inbox display.
 *
 * FRD §11, Master Prompt §4.11
 */
const mongoose = require('mongoose');
const {
  ALL_NOTIFICATION_CHANNELS,
  ALL_NOTIFICATION_EVENTS: _events, // not needed on schema, used in service
  NOTIFICATION_CHANNEL,
} = require('../../shared/constants');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    triggerEvent: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ALL_NOTIFICATION_CHANNELS,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Notification title too long'],
    },
    body: {
      type: String,
      required: true,
    },
    // Deep link for in-app navigation
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // sentAt is our timestamp
  }
);

// Indexes — Master Prompt §10
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, sentAt: -1 });
// TTL: auto-remove old notifications after 90 days (configurable)
notificationSchema.index(
  { sentAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports = mongoose.model('Notification', notificationSchema);
