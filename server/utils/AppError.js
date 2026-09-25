/**
 * server/utils/AppError.js
 * Operational error class — distinguishes known errors (like 404, 403)
 * from unexpected programmer errors. All controller errors should use this.
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {*}     [errors]  - Optional field-level validation errors
   */
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // mark as operational (known) error
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
