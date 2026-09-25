/**
 * server/controllers/authController.js
 * Authentication controller — local JWT implementation.
 * AuthProvider interface: swappable for AD/OIDC (see INTEGRATIONS.md).
 *
 * Token strategy:
 * - Access token: short-lived (15 min), sent in Authorization header
 * - Refresh token: long-lived (7 days), httpOnly + sameSite=strict cookie
 * - Refresh token rotation with family-based reuse detection (see RefreshToken model)
 *
 * Session timeout: 30 min inactivity enforced by frontend (access token TTL + refresh)
 * FRD NFR Security, Master Prompt §4 (auth), Implementation Plan
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AppError = require('../utils/AppError');
const auditService = require('../services/auditService');
const { AUDIT_ACTION } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Token generation helpers
// ---------------------------------------------------------------------------

/**
 * Generate a JWT access token (15 min TTL).
 */
const signAccessToken = (userId, roles) =>
  jwt.sign({ sub: userId, roles }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

/**
 * Generate a cryptographically random refresh token string.
 */
const generateRawRefreshToken = () => crypto.randomBytes(64).toString('hex');

/**
 * Store a new refresh token document.
 * @param {string} userId
 * @param {string} family  - UUID identifying the rotation chain
 * @param {string} rawToken
 * @param {object} meta    - { ipAddress, userAgent }
 */
const storeRefreshToken = async (userId, family, rawToken, meta = {}) => {
  const tokenHash = RefreshToken.hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || 7, 10) * 24 * 60 * 60 * 1000
  );
  await RefreshToken.create({
    tokenHash,
    userId,
    family,
    expiresAt,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });
  return { tokenHash, expiresAt };
};

/**
 * Set refresh token as httpOnly cookie.
 */
const setRefreshCookie = (res, rawToken, expiresAt) => {
  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/api/auth/refresh',
  });
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    // Fetch user with password field (select:false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return next(new AppError('Invalid credentials', 401));
    }

    // SECURITY: Check if account is locked
    if (user.isLocked()) {
      const minutesRemaining = Math.ceil((user.lockUntil - new Date()) / 60000);
      return next(
        new AppError(
          `Account is locked due to repeated failed login attempts. Try again in ${minutesRemaining} minutes.`,
          423
        )
      );
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      // SECURITY: Increment failed attempts and lock if threshold exceeded
      user.incFailedAttempts();
      await user.save();
      return next(new AppError('Invalid credentials', 401));
    }

    // SECURITY: Reset failed attempts on successful login
    user.resetFailedAttempts();
    await user.save();

    // Generate tokens
    const accessToken = signAccessToken(user._id, user.roles);
    const rawRefreshToken = generateRawRefreshToken();
    const family = uuidv4(); // new family on fresh login
    const { expiresAt } = await storeRefreshToken(
      user._id,
      family,
      rawRefreshToken,
      { ipAddress: req.ip, userAgent: req.get('user-agent') }
    );

    setRefreshCookie(res, rawRefreshToken, expiresAt);

    // Audit log
    await auditService.log({
      actorId: user._id,
      action: AUDIT_ACTION.LOGIN,
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          department: user.department,
          designation: user.designation,
          roles: user.roles,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
exports.refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return next(new AppError('Refresh token not found', 401));
    }

    const tokenHash = RefreshToken.hashToken(rawToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    // Token not found at all
    if (!storedToken) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // REUSE DETECTION: revoked token presented → family compromise detected
    if (storedToken.isRevoked) {
      await RefreshToken.revokeFamily(storedToken.family);
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return next(
        new AppError(
          'Session security violation detected. All sessions have been terminated. Please log in again.',
          401
        )
      );
    }

    // Expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return next(new AppError('Refresh token expired. Please log in again.', 401));
    }

    // Mark old token as revoked (rotation)
    storedToken.isRevoked = true;
    storedToken.usedAt = new Date();
    await storedToken.save();

    // Fetch user
    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      return next(new AppError('User not found or deactivated', 401));
    }

    // Issue new token pair in the same family (rotation)
    const accessToken = signAccessToken(user._id, user.roles);
    const newRawRefreshToken = generateRawRefreshToken();
    const { expiresAt } = await storeRefreshToken(
      user._id,
      storedToken.family, // same family — maintains chain
      newRawRefreshToken,
      { ipAddress: req.ip, userAgent: req.get('user-agent') }
    );

    setRefreshCookie(res, newRawRefreshToken, expiresAt);

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
exports.logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (rawToken) {
      const tokenHash = RefreshToken.hashToken(rawToken);
      const storedToken = await RefreshToken.findOne({ tokenHash });
      if (storedToken) {
        // Revoke the entire family (all sessions in this chain)
        await RefreshToken.revokeFamily(storedToken.family);
      }
    }

    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    if (req.user) {
      await auditService.log({
        actorId: req.user._id,
        action: AUDIT_ACTION.LOGOUT,
        entityType: 'User',
        entityId: req.user._id.toString(),
        ipAddress: req.ip,
      });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me — return current authenticated user
// ---------------------------------------------------------------------------
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};
