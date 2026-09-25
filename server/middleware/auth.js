/**
 * server/middleware/auth.js
 * Authentication & Authorization middleware.
 *
 * protect()    — verifies JWT access token; populates req.user
 * authorize()  — checks req.user.roles against allowed roles list; returns 403 if denied
 *
 * RBAC enforcement notes:
 * - Every non-public route handler must call protect() + authorize(...roles)
 * - Frontend role checks (useRole() hook) are for UX only — never trusted
 * - No implicit trust: each route explicitly declares its allowed roles
 *
 * FRD §4 RBAC, NFR Security, Master Prompt §3
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ALL_ROLES } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// protect — verify access token, attach user to request
// ---------------------------------------------------------------------------
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No authentication token provided', 401));
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify and decode
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token expired', 401));
      }
      return next(new AppError('Invalid access token', 401));
    }

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.sub).select('-password').lean();
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }
    if (!user.isActive) {
      return next(new AppError('Account has been deactivated', 401));
    }

    // 4. Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return next(new AppError('Password recently changed. Please log in again.', 401));
      }
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// authorize — role-based access control
// Usage: router.post('/path', protect, authorize('admin', 'supervisor'), handler)
// ---------------------------------------------------------------------------
const authorize = (...allowedRoles) => {
  // Validate allowed roles at startup to catch typos early
  allowedRoles.forEach((role) => {
    if (!ALL_ROLES.includes(role)) {
      throw new Error(
        `authorize() called with unknown role: "${role}". Valid roles: ${ALL_ROLES.join(', ')}`
      );
    }
  });

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const hasAccess = allowedRoles.some((role) => req.user.roles.includes(role));
    if (!hasAccess) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          403
        )
      );
    }
    next();
  };
};

// ---------------------------------------------------------------------------
// optionalAuth — attach user if token present, but don't require it
// Used for public endpoints that have role-aware behavior (e.g., gallery)
// ---------------------------------------------------------------------------
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub).select('-password').lean();
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (_) {
    // Silently ignore invalid tokens for optional auth
    next();
  }
};

module.exports = { protect, authorize, optionalAuth };
