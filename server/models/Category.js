/**
 * server/models/Category.js
 * Master data for idea categories, subcategories, and initiatives.
 * Admin-managed CRUD. Self-referential (parentId) for category → subcategory tree.
 *
 * FRD FR-AD-04, Master Prompt §4.12
 */
const mongoose = require('mongoose');
const { ALL_CATEGORY_TYPES } = require('../../shared/constants');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name too long'],
    },
    type: {
      type: String,
      enum: ALL_CATEGORY_TYPES,
      required: [true, 'Type is required'],
    },
    // null for top-level categories/initiatives; ObjectId of parent for subcategories
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Unique name per type+parent combination
categorySchema.index({ name: 1, type: 1, parentId: 1 }, { unique: true });
categorySchema.index({ type: 1, isActive: 1 });
categorySchema.index({ parentId: 1 });

module.exports = mongoose.model('Category', categorySchema);
