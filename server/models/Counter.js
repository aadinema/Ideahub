/**
 * server/models/Counter.js
 * Atomic sequence counter for concurrency-safe human-readable ID generation.
 * Uses findOneAndUpdate with $inc — prevents count()+1 race conditions
 * under concurrent submissions (500 concurrent users — NFR Performance).
 *
 * Usage: const seq = await Counter.nextSequence('idea', 2026);
 *        → "IDEA-2026-0001"
 */
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true }, // e.g. 'idea'
    year:        { type: Number, required: true }, // calendar year of FY start
    seq:         { type: Number, default: 0 },
  },
  { timestamps: false }
);

// Compound unique index — one counter doc per entity+year
counterSchema.index({ entityType: 1, year: 1 }, { unique: true });

/**
 * Atomically increments and returns the next sequence number.
 * The returned value is already incremented (post-increment).
 * @param {string} entityType - e.g. 'idea'
 * @param {number} year       - e.g. 2026
 * @returns {Promise<number>} next sequence integer
 */
counterSchema.statics.nextSequence = async function (entityType, year) {
  const doc = await this.findOneAndUpdate(
    { entityType, year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

/**
 * Formats a sequence number into a human-readable ID string.
 * @param {string} prefix  - e.g. 'IDEA'
 * @param {number} year    - e.g. 2026
 * @param {number} seq     - e.g. 7
 * @returns {string}       - e.g. 'IDEA-2026-0007'
 */
counterSchema.statics.formatId = function (prefix, year, seq) {
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
};

module.exports = mongoose.model('Counter', counterSchema);
