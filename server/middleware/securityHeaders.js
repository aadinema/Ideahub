/**
 * server/middleware/securityHeaders.js
 * Additional security headers beyond Helmet defaults.
 *
 * Adds:
 * - Content Security Policy (CSP) to prevent XSS and resource injection
 * - X-Content-Type-Options: nosniff (prevent MIME type sniffing)
 * - X-Frame-Options: DENY (prevent clickjacking)
 * - Referrer-Policy: strict-origin-when-cross-origin
 */

const securityHeaders = (req, res, next) => {
  // Content Security Policy: restrictive by default
  // - default-src 'self': only load from same origin
  // - script-src 'self': scripts only from same origin (no inline, no eval)
  // - style-src 'self': styles only from same origin
  // - img-src 'self' data:: images from same origin or data URIs
  // - font-src 'self': fonts only from same origin
  // - connect-src 'self': XHR/WebSocket only to same origin
  // - frame-ancestors 'none': cannot be embedded in iframes
  // - base-uri 'self': base tag can only reference same origin
  // - form-action 'self': forms can only post to same origin
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " + // unsafe-inline for Tailwind; consider using nonces in production
      "img-src 'self' data:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "upgrade-insecure-requests"
  );

  // Prevent browsers from sniffing content type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Control referrer information leaked on navigation
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permission Policy (Permissions-Policy in newer spec)
  // Disable sensitive features by default
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  next();
};

module.exports = securityHeaders;
