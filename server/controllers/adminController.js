/**
 * server/controllers/adminController.js
 * Admin Management Console (Phase 6).
 * FRD §12
 */
const User = require('../models/User');
const Category = require('../models/Category');
const EvaluationCriteria = require('../models/EvaluationCriteria');
const DepartmentTarget = require('../models/DepartmentTarget');
const SystemConfig = require('../models/SystemConfig');
const HolidayCalendar = require('../models/HolidayCalendar');
const Announcement = require('../models/Announcement');
const AuditLog = require('../models/AuditLog');
const auditService = require('../services/auditService');
const AppError = require('../utils/AppError');
const { AUDIT_ACTION, ALL_ROLES } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// USER MANAGEMENT
// ---------------------------------------------------------------------------
exports.getUsers = async (req, res, next) => {
  try {
    // Support search/filter for the admin console.
    const { q, role, department, isActive } = req.query;
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { employeeId: rx }];
    }
    if (role) filter.roles = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // password is select:false; toJSON also strips it.
    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// Create a user (FRD §12 user provisioning). Password is hashed by the model hook.
exports.createUser = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, department, designation, grade, roles, managerId } =
      req.body;

    if (!employeeId || !name || !email || !password || !department) {
      return next(
        new AppError('employeeId, name, email, password and department are required.', 422)
      );
    }

    const rolesToSet = Array.isArray(roles) && roles.length > 0 ? roles : ['employee'];
    const invalid = rolesToSet.filter((r) => !ALL_ROLES.includes(r));
    if (invalid.length > 0) {
      return next(new AppError(`Invalid role(s): ${invalid.join(', ')}`, 422));
    }

    const user = await User.create({
      employeeId,
      name,
      email,
      password,
      department,
      designation,
      grade,
      roles: rolesToSet,
      managerId: managerId || null,
    });

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { roles: user.roles },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    // roles is an ARRAY on the User model (user.roles), not user.role.
    const { roles, role, isActive, department } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    // Accept either an array (roles) or a single role string for convenience.
    let nextRoles;
    if (Array.isArray(roles)) nextRoles = roles;
    else if (role) nextRoles = [role];

    if (nextRoles) {
      if (nextRoles.length === 0) {
        return next(new AppError('A user must have at least one role.', 422));
      }
      const invalid = nextRoles.filter((r) => !ALL_ROLES.includes(r));
      if (invalid.length > 0) {
        return next(new AppError(`Invalid role(s): ${invalid.join(', ')}`, 422));
      }
      user.roles = nextRoles;
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (department) user.department = department;

    await user.save();

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { roles: user.roles, isActive: user.isActive }
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Deactivate (soft-delete) a user — FRD §12.
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (user._id.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot deactivate your own account.', 400));
    }

    user.isActive = false;
    await user.save();

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { isActive: false, action: 'deactivate' },
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// CATEGORIES MANAGEMENT
// ---------------------------------------------------------------------------
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// EVALUATION CRITERIA MANAGEMENT
// ---------------------------------------------------------------------------
exports.getCriteria = async (req, res, next) => {
  try {
    const criteria = await EvaluationCriteria.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: criteria });
  } catch (err) {
    next(err);
  }
};

// Replace the active criteria set. EvaluationCriteria is one document PER
// criterion (fields: criterionName, decimal weight 0–1, scoreRangeMin/Max,
// guidance). Weights must sum to 1.0 (=100%). This deactivates the current
// active set and inserts a new versioned set atomically.
exports.updateCriteria = async (req, res, next) => {
  try {
    const { criteria, ideathonEventId = null } = req.body;

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return next(new AppError('At least one criterion is required.', 422));
    }

    // Validate shape + weights.
    for (const c of criteria) {
      if (!c.criterionName || typeof c.criterionName !== 'string') {
        return next(new AppError('Each criterion requires a criterionName.', 422));
      }
      const w = Number(c.weight);
      if (!Number.isFinite(w) || w < 0 || w > 1) {
        return next(
          new AppError(
            `Each criterion weight must be a decimal between 0 and 1 (got "${c.weight}" for "${c.criterionName}").`,
            422
          )
        );
      }
    }

    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    // Allow small floating-point tolerance.
    if (Math.abs(totalWeight - 1) > 0.001) {
      return next(
        new AppError(
          `Criteria weights must sum to 1.0 (100%). Current total: ${totalWeight.toFixed(3)}.`,
          422
        )
      );
    }

    const scope = { ideathonEventId: ideathonEventId || null };

    // Determine next version number for this scope.
    const latest = await EvaluationCriteria.findOne(scope).sort({ version: -1 }).lean();
    const nextVersion = latest ? latest.version + 1 : 1;

    // Deactivate the current active set for this scope.
    await EvaluationCriteria.updateMany({ ...scope, isActive: true }, { $set: { isActive: false } });

    // Insert the new active set (one doc per criterion).
    const docs = criteria.map((c) => ({
      ideathonEventId: ideathonEventId || null,
      criterionName: c.criterionName.trim(),
      weight: Number(c.weight),
      scoreRangeMin: c.scoreRangeMin ?? 1,
      scoreRangeMax: c.scoreRangeMax ?? 10,
      guidance: c.guidance || '',
      isActive: true,
      version: nextVersion,
      createdBy: req.user._id,
    }));
    const created = await EvaluationCriteria.insertMany(docs);

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'EvaluationCriteria',
      entityId: `set:v${nextVersion}`,
      metadata: { count: created.length, version: nextVersion, ideathonEventId },
    });

    res.status(200).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DEPARTMENT TARGETS MANAGEMENT
// ---------------------------------------------------------------------------
exports.getTargets = async (req, res, next) => {
  try {
    const targets = await DepartmentTarget.find().sort({ department: 1 }).lean();
    res.status(200).json({ success: true, data: targets });
  } catch (err) {
    next(err);
  }
};

exports.upsertTarget = async (req, res, next) => {
  try {
    const { department, financialYear, targetType, targetValue } = req.body;

    const target = await DepartmentTarget.findOneAndUpdate(
      { department, financialYear, targetType },
      { targetValue, createdBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// SYSTEM CONFIG & HOLIDAYS
// ---------------------------------------------------------------------------
exports.getConfig = async (req, res, next) => {
  try {
    const config = await SystemConfig.findOne().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: config || {} });
  } catch (err) {
    next(err);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const config = await SystemConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

exports.getHolidays = async (req, res, next) => {
  try {
    const holidays = await HolidayCalendar.find().sort({ date: 1 }).lean();
    res.status(200).json({ success: true, data: holidays });
  } catch (err) {
    next(err);
  }
};

exports.addHoliday = async (req, res, next) => {
  try {
    const { date, description, financialYear } = req.body;
    const holiday = await HolidayCalendar.create({ date: new Date(date), description, financialYear });
    res.status(201).json({ success: true, data: holiday });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// ANNOUNCEMENTS MANAGEMENT (FRD §12)
// ---------------------------------------------------------------------------
exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();
    res.status(200).json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, richTextBody, expiryDate, isActive } = req.body;
    if (!title || !richTextBody || !expiryDate) {
      return next(new AppError('title, richTextBody and expiryDate are required.', 422));
    }

    const announcement = await Announcement.create({
      title,
      richTextBody,
      expiryDate: new Date(expiryDate),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityType: 'Announcement',
      entityId: announcement._id.toString(),
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
};

const ANNOUNCEMENT_UPDATABLE = ['title', 'richTextBody', 'expiryDate', 'isActive'];

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of ANNOUNCEMENT_UPDATABLE) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = field === 'expiryDate' ? new Date(req.body[field]) : req.body[field];
      }
    }

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!announcement) return next(new AppError('Announcement not found', 404));

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'Announcement',
      entityId: announcement._id.toString(),
    });

    res.status(200).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return next(new AppError('Announcement not found', 404));

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityType: 'Announcement',
      entityId: req.params.id,
    });

    res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// AUDIT LOG VIEWER (FRD §12)
// ---------------------------------------------------------------------------
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.entityId) filter.entityId = req.query.entityId;
    if (req.query.actorId) filter.actorId = req.query.actorId;
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email employeeId')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};
