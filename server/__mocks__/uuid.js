/**
 * server/__mocks__/uuid.js
 * Jest mock for the `uuid` package (test environment only).
 *
 * Why: uuid@14 ships ESM that Jest's CommonJS runtime cannot parse. Plain
 * Node loads it fine (require(esm) is supported on Node ≥22), which is why
 * the server runs — only Jest chokes. authController uses just `v4`, and
 * crypto.randomUUID() produces an identical RFC 4122 version-4 UUID, so
 * behavior in tests is unchanged. Production code never loads this file.
 */
module.exports = {
  v4: () => require('crypto').randomUUID(),
};
