/**
 * server/models/Announcement.js
 * Admin-managed announcements displayed on the home dashboard.
 *
 * FRD FR-01-04, FR-AD-08, Master Prompt §4.9
 */
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title too long'],
    },
    // Rich-text HTML body (from admin rich-text editor)
    richTextBody: {
      type: String,
      required: [true, 'Body is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient dashboard queries
announcementSchema.index({ isActive: 1, expiryDate: 1 });
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
