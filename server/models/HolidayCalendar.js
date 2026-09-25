/**
 * server/models/HolidayCalendar.js
 * Public holiday records for business-day SLA calculation.
 * Seeded with no holidays by default; Admin adds via Admin → Master Data.
 *
 * FRD §5.1 (SLA TATs), Implementation Plan (confirmed by user)
 */
const mongoose = require('mongoose');

const holidayCalendarSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Holiday date is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxlength: [200, 'Name too long'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isNational: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

holidayCalendarSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('HolidayCalendar', holidayCalendarSchema);
