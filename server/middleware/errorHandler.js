/**
 * server/middleware/errorHandler.js
 * Centralized error handling middleware.
 * Sends a consistent error shape to all API consumers.
 *
 * Response shape:
 * { success: false, message: string, errors?: [...], stack?: string }
 *
 * Master Prompt §2 (Cross-cutting)
 */
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// ---------------------------------------------------------------------------
// Mongoose-specific error converters
// ---------------------------------------------------------------------------
const handleMongooseCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleMongooseDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field: ${field}`, 409);
};

const handleMongooseValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError('Validation failed', 422, errors);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401);

// ---------------------------------------------------------------------------
// Development: include stack trace
// ---------------------------------------------------------------------------
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    requestId: req.id,
    errors: err.errors || null,
    stack: err.stack,
  });
};

// ---------------------------------------------------------------------------
// Production: no stack trace leakage
// ---------------------------------------------------------------------------
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId: req.id,
      errors: err.errors || null,
    });
  } else {
    // Programmer/unknown error — log it, send generic message
    logger.error('UNHANDLED ERROR', { err, requestId: req.id });
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      requestId: req.id,
    });
  }
};

// ---------------------------------------------------------------------------
// Global error handler middleware (4-argument signature required by Express)
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Log all errors (operational + unexpected)
  logger.error(`[${req.method}] ${req.originalUrl} → ${err.statusCode}`, {
    message: err.message,
    userId: req.user?._id,
    requestId: req.id,
  });

  // Convert known Mongoose/JWT errors to AppError instances
  let error = err;
  if (err.name === 'CastError') error = handleMongooseCastError(err);
  if (err.code === 11000) error = handleMongooseDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleMongooseValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

module.exports = errorHandler;
