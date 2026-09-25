/**
 * server/models/User.js
 * User collection — mirrors HRMS employee fields for Phase 1 (local copy).
 * Phase 2: replace local sync with live HRMS API feed (see INTEGRATIONS.md).
 *
 * FRD §4 (User Roles), Master Prompt §4.1
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ALL_ROLES } = require('../../shared/constants');

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by default
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    grade: {
      type: String,
      trim: true,
    },
    // Self-referential: reporting manager
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Multi-role array — a user can hold multiple roles simultaneously
    // e.g., a Dept Head is both 'supervisor' and 'dept_innovation_team'
    roles: {
      type: [{ type: String, enum: ALL_ROLES }],
      default: ['employee'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'User must have at least one role',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Tracks when the user last changed their password (for security audit)
    passwordChangedAt: Date,
    // For password reset flows (future SSO integration)
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // Account lockout: failed login attempts tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    // When account is locked until (null = not locked)
    lockUntil: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        return ret;
      },
    },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ employeeId: 1 }, { unique: true });
userSchema.index({ department: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isActive: 1 });

// ---------------------------------------------------------------------------
// Pre-save hook: hash password on create / change
// ---------------------------------------------------------------------------
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

// ---------------------------------------------------------------------------
// Instance method: compare plain password with hashed
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns true if the user holds at least one of the given roles.
 * @param {string[]} roles
 */
userSchema.methods.hasRole = function (...roles) {
  return roles.some((r) => this.roles.includes(r));
};

// ---------------------------------------------------------------------------
// Account lockout methods
// ---------------------------------------------------------------------------

/**
 * Check if account is locked.
 * @returns {boolean} true if locked and lockUntil is in the future
 */
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

/**
 * Increment failed login attempts and lock if threshold exceeded.
 * Lock duration: 15 minutes after 5 failed attempts.
 */
userSchema.methods.incFailedAttempts = function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }
};

/**
 * Reset failed login attempts and unlock account.
 * Called after successful login.
 */
userSchema.methods.resetFailedAttempts = function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
};

module.exports = mongoose.model('User', userSchema);
