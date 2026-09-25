/**
 * server/models/RefreshToken.js
 * Refresh token store for rotation with family-based reuse detection.
 *
 * Security pattern:
 * - Each token is stored with a tokenHash (SHA-256 of the raw token).
 * - Rotation: old token marked isRevoked=true, new token issued in same family.
 * - Reuse detection: if a revoked token is presented again, the ENTIRE
 *   family is invalidated — all active sessions in that chain are terminated.
 *   This prevents silent token theft from going undetected.
 *
 * FRD §14 NFR Security, Master Prompt §9
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the raw token string (never store raw tokens)
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Family groups a chain of rotated tokens. If any revoked family member
    // is replayed, the entire family (all sessions in the chain) is killed.
    family: {
      type: String,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Indexes
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ family: 1 });
// TTL index: MongoDB auto-removes documents after expiresAt
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Hash a raw token string.
 * @param {string} rawToken
 * @returns {string} SHA-256 hex digest
 */
refreshTokenSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Invalidate (revoke) all tokens belonging to a family.
 * Called when reuse of a revoked token is detected.
 * @param {string} family
 */
refreshTokenSchema.statics.revokeFamily = async function (family) {
  await this.updateMany({ family }, { $set: { isRevoked: true } });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
