/**
 * server/models/SystemConfig.js
 * Singleton system configuration document.
 * Holds global admin-configurable settings: SLA values, escalation rules,
 * quorum defaults, notification toggle flags, and other workflow config.
 *
 * Pattern: there is always exactly one document (ensured via upsert in seed).
 * Access via SystemConfig.getSingleton() helper.
 *
 * FRD FR-AD-05, Master Prompt §4 (admin config)
 */
const mongoose = require('mongoose');
const { SLA_BUSINESS_DAYS } = require('../../shared/constants');

const systemConfigSchema = new mongoose.Schema(
  {
    // Singleton marker — always 'global'
    key: {
      type: String,
      default: 'global',
      unique: true,
    },

    // SLA values in business days — FRD §5.1
    sla: {
      supervisorDays:   { type: Number, default: SLA_BUSINESS_DAYS.SUPERVISOR },
      departmentDays:   { type: Number, default: SLA_BUSINESS_DAYS.DEPARTMENT },
      committeeDays:    { type: Number, default: SLA_BUSINESS_DAYS.COMMITTEE },
    },

    // Default quorum for Innovation Committee voting — FR-05-04
    defaultQuorum: {
      type:  { type: String, enum: ['majority', 'fixed_count'], default: 'majority' },
      value: { type: Number, default: null },
    },

    // Minimum idea qualifying score for shortlisting (global default) — FRD §8.2
    minQualifyingScore: {
      type: Number,
      default: 6.0,
      min: 0,
      max: 10,
    },

    // Notification toggle flags (admin can silence channels globally)
    notifications: {
      emailEnabled:          { type: Boolean, default: true },
      inAppEnabled:          { type: Boolean, default: true },
      dashboardAlertEnabled: { type: Boolean, default: true },
    },

    // Gallery auto-publish check interval in minutes — FR-06-01
    galleryPublishIntervalMinutes: {
      type: Number,
      default: 5,
    },

    // Auto-save interval in ms (passed to frontend config endpoint) — FR-02-05
    autoSaveIntervalMs: {
      type: Number,
      default: 2 * 60 * 1000,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

/**
 * Returns the singleton config document, creating it with defaults if absent.
 */
systemConfigSchema.statics.getSingleton = async function () {
  let config = await this.findOne({ key: 'global' });
  if (!config) {
    config = await this.create({ key: 'global' });
  }
  return config;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
