/**
 * server/middleware/sanitize.js
 * Express-5-safe NoSQL-injection sanitization.
 *
 * Why hand-rolled: express-mongo-sanitize and xss-clean both reassign
 * req.query, which is a read-only getter in Express 5 and throws at runtime.
 * This middleware mutates req.body and req.params in place and only reads
 * req.query, so it is compatible with Express 5.
 *
 * Protection: strips keys beginning with '$' and any key containing '.' from
 * request payloads, defeating MongoDB operator-injection attacks such as
 * { "email": { "$gt": "" } } or dotted-path traversal.
 *
 * NOTE: This intentionally does NOT HTML-escape string values. Several fields
 * (problemStatement, proposedSolution, …) legitimately store react-quill HTML;
 * blanket escaping would corrupt them. XSS is handled at render time on the
 * client via DOMPurify before dangerouslySetInnerHTML.
 *
 * FRD NFR Security; audit finding: sanitization middleware not registered.
 */

// Recursively remove injection-prone keys from an object/array, in place.
function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    for (const item of value) stripDangerousKeys(item);
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
        continue;
      }
      stripDangerousKeys(value[key]);
    }
  }
}

module.exports = function sanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') stripDangerousKeys(req.body);
  if (req.params && typeof req.params === 'object') stripDangerousKeys(req.params);
  // req.query is read-only in Express 5; controllers cast/validate query values.
  next();
};
