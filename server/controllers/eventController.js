/**
 * server/controllers/eventController.js
 * Ideathon Event CRUD and management (Phase 3).
 * FR-IE
 */
const IdeathonEvent = require('../models/IdeathonEvent');
const Idea = require('../models/Idea');
const Evaluation = require('../models/Evaluation');
const auditService = require('../services/auditService');
const AppError = require('../utils/AppError');
const notificationService = require('../services/notificationService');
const {
  EVENT_STATUS,
  EVENT_VISIBILITY,
  AUDIT_ACTION,
  IDEA_STATUS,
  NOTIFICATION_EVENT,
  ROLES,
} = require('../../shared/constants');

// Allow-list of event fields a client may set — guards against mass assignment
// of protected fields (participants, createdBy, extensionHistory, status).
const EVENT_UPDATABLE_FIELDS = [
  'eventName',
  'theme',
  'description',
  'eventType',
  'initiative',
  'startDate',
  'endDate',
  'targetDepartments',
  'maxParticipants',
  'ideaCategory',
  'visibility',
  'minQualifyingScore',
  'quorumType',
  'quorumValue',
];

// ---------------------------------------------------------------------------
// GET /api/events/explore
// List visible events (active, upcoming, or closed).
// Applies visibility rules: if restricted, only show if user's dept is in targetDepartments.
// ---------------------------------------------------------------------------
exports.exploreEvents = async (req, res, next) => {
  try {
    const { status, type, initiative, category } = req.query;

    // FR-IE-04 — Type / Initiative / Business Category accept comma-separated
    // multi-select values (e.g. `type=ideathon,workshop`).
    const multi = (v) =>
      typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];

    // Base filter: published events, or restricted events where user's dept is targeted.
    // Drafts are never visible through the employee-facing explore endpoint
    // (FR-IE-02 — draft = admin only; admins use GET /api/events).
    const query = {
      $or: [
        { visibility: EVENT_VISIBILITY.PUBLISHED },
        {
          visibility: EVENT_VISIBILITY.RESTRICTED,
          targetDepartments: req.user.department
        }
      ],
      status: { $ne: EVENT_STATUS.DRAFT }
    };

    if (status && status !== EVENT_STATUS.DRAFT) query.status = status;

    const types = multi(type);
    if (types.length) query.eventType = types.length > 1 ? { $in: types } : types[0];

    const initiatives = multi(initiative);
    if (initiatives.length) query.initiative = initiatives.length > 1 ? { $in: initiatives } : initiatives[0];

    const categories = multi(category);
    if (categories.length) query.ideaCategory = categories.length > 1 ? { $in: categories } : categories[0];

    const events = await IdeathonEvent.find(query)
      .sort({ startDate: -1 })
      .lean();

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/events/facets
// Distinct Initiative / Business Category values available to this user —
// powers the FR-IE-04 multi-select filter options.
// ---------------------------------------------------------------------------
exports.getEventFacets = async (req, res, next) => {
  try {
    const visibilityFilter = {
      $or: [
        { visibility: EVENT_VISIBILITY.PUBLISHED },
        { visibility: EVENT_VISIBILITY.RESTRICTED, targetDepartments: req.user.department },
      ],
      status: { $ne: EVENT_STATUS.DRAFT },
    };

    const [initiatives, categories] = await Promise.all([
      IdeathonEvent.distinct('initiative', visibilityFilter),
      IdeathonEvent.distinct('ideaCategory', visibilityFilter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        initiatives: initiatives.filter(Boolean).sort(),
        categories: categories.filter(Boolean).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/events/mine — FR-IE-03
// Events the current user has registered for (My Events).
// ---------------------------------------------------------------------------
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await IdeathonEvent.find({
      participants: req.user._id,
      status: { $ne: EVENT_STATUS.DRAFT },
    })
      .sort({ startDate: -1 })
      .lean();

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/events — Admin list (includes drafts, all visibilities)
// ---------------------------------------------------------------------------
exports.listEvents = async (req, res, next) => {
  try {
    const { status, visibility } = req.query;
    const query = {};
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;

    const events = await IdeathonEvent.find(query)
      .sort({ createdAt: -1 })
      .populate('participants', 'name department email')
      .populate('createdBy', 'name')
      .lean();

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/events/:id/join
// User joins an event.
// ---------------------------------------------------------------------------
exports.joinEvent = async (req, res, next) => {
  try {
    const event = await IdeathonEvent.findById(req.params.id);
    if (!event) return next(new AppError('Event not found', 404));

    if (event.status !== EVENT_STATUS.ACTIVE) {
      return next(new AppError('You can only join active events.', 400));
    }

    // Check visibility / restriction
    if (event.visibility === EVENT_VISIBILITY.RESTRICTED && !event.targetDepartments.includes(req.user.department)) {
      return next(new AppError('This event is restricted to specific departments.', 403));
    }

    // Check if max participants reached
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return next(new AppError('This event has reached its maximum participant limit.', 400));
    }

    // Check if already joined
    if (event.participants.some(id => id.toString() === req.user._id.toString())) {
      return res.status(200).json({ success: true, message: 'You have already joined this event.' });
    }

    event.participants.push(req.user._id);
    await event.save();

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE, // or a specific join action
      entityType: 'IdeathonEvent',
      entityId: event._id.toString(),
      metadata: { joined: true }
    });

    // FR-IE-03 — join confirmation sent to the registering employee.
    notificationService.trigger(NOTIFICATION_EVENT.IDEATHON_JOIN_CONFIRMED, {
      event,
      user: req.user,
    });

    res.status(200).json({ success: true, message: 'Successfully joined event.' });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/events/:id/leaderboard
// Gets the leaderboard for an event, ranked by average evaluation score.
// ---------------------------------------------------------------------------
exports.getLeaderboard = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const eventId = req.params.id;
    
    const leaderboard = await Idea.aggregate([
      { $match: { linkedEventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $lookup: {
          from: 'evaluations',
          localField: '_id',
          foreignField: 'ideaId',
          as: 'evaluations'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedByData'
        }
      },
      { $unwind: { path: '$submittedByData', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          evaluationsCount: { $size: '$evaluations' },
          averageScore: {
            $round: [
              {
                $cond: [
                  { $gt: [{ $size: '$evaluations' }, 0] },
                  { $avg: '$evaluations.weightedTotal' },
                  0
                ]
              },
              2
            ]
          },
          submittedBy: {
            _id: '$submittedByData._id',
            name: '$submittedByData.name',
            department: '$submittedByData.department'
          }
        }
      },
      {
        $project: {
          title: 1,
          ideaId: 1,
          department: 1,
          status: 1,
          submittedBy: 1,
          evaluationsCount: 1,
          averageScore: 1
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/events/:id
// Fetch a single event's details. Enforces the same visibility rules as
// explore: drafts are hidden, and restricted events are visible only to
// targeted departments (admins bypass both checks).
// ---------------------------------------------------------------------------
exports.getEventById = async (req, res, next) => {
  try {
    const event = await IdeathonEvent.findById(req.params.id)
      .populate('participants', 'name department')
      .populate('createdBy', 'name')
      .lean();

    if (!event) return next(new AppError('Event not found.', 404));

    const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes(ROLES.ADMIN);
    if (!isAdmin) {
      const isDraft = event.status === EVENT_STATUS.DRAFT || event.visibility === EVENT_VISIBILITY.DRAFT;
      const isRestrictedHidden =
        event.visibility === EVENT_VISIBILITY.RESTRICTED &&
        !(event.targetDepartments || []).includes(req.user.department);
      if (isDraft || isRestrictedHidden) {
        return next(new AppError('You do not have access to this event.', 403));
      }
    }

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// ADMIN ENDPOINTS
// ---------------------------------------------------------------------------

// Create Event
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = { createdBy: req.user._id };
    for (const field of EVENT_UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        eventData[field] = req.body[field];
      }
    }
    // status is settable on create (e.g. immediately ACTIVE), but not participants.
    if (req.body.status) eventData.status = req.body.status;

    const event = await IdeathonEvent.create(eventData);

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityType: 'IdeathonEvent',
      entityId: event._id.toString(),
    });

    // If launched as active + published, notify eligible users.
    if (event.status === EVENT_STATUS.ACTIVE && event.visibility === EVENT_VISIBILITY.PUBLISHED) {
      const User = require('../models/User');
      const deptFilter =
        event.visibility === EVENT_VISIBILITY.RESTRICTED && event.targetDepartments?.length
          ? { department: { $in: event.targetDepartments }, isActive: true }
          : { isActive: true };
      const eligibleUsers = await User.find(deptFilter).select('_id name email').lean();
      if (eligibleUsers.length > 0) {
        notificationService.trigger(NOTIFICATION_EVENT.NEW_IDEATHON_LAUNCHED, {
          event,
          eligibleUsers,
        });
      }
    }

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// Update Event
exports.updateEvent = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of EVENT_UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const event = await IdeathonEvent.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!event) return next(new AppError('Event not found', 404));

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'IdeathonEvent',
      entityId: event._id.toString(),
    });

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// Extend Event (Admin only)
exports.extendEvent = async (req, res, next) => {
  try {
    const { newEndDate, justification } = req.body;
    
    if (!justification || justification.trim().length < 20) {
      return next(new AppError('Extension justification must be at least 20 characters.', 422));
    }

    const event = await IdeathonEvent.findById(req.params.id);
    if (!event) return next(new AppError('Event not found', 404));

    event.extensionHistory.push({
      newEndDate: new Date(newEndDate),
      justification: justification.trim(),
      extendedBy: req.user._id
    });
    event.endDate = new Date(newEndDate);
    // A later deadline warrants a fresh 48h closing reminder (FRD §11).
    event.closingReminderSent = false;
    if (event.status === EVENT_STATUS.CLOSED && event.endDate > new Date()) {
      event.status = EVENT_STATUS.ACTIVE; // Re-activate if it was closed
    }

    await event.save();

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'IdeathonEvent',
      entityId: event._id.toString(),
      metadata: { action: 'extend_deadline', newEndDate, justification }
    });

    // FR-IE-07 — extension must notify all registered participants.
    const User = require('../models/User');
    const participants = await User.find({ _id: { $in: event.participants } })
      .select('_id name email')
      .lean();
    if (participants.length > 0) {
      notificationService.trigger(NOTIFICATION_EVENT.IDEATHON_EXTENDED, {
        event,
        participants,
      });
    }

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// Close Event (Admin only) — FR-AD-03
exports.closeEvent = async (req, res, next) => {
  try {
    const event = await IdeathonEvent.findById(req.params.id);
    if (!event) return next(new AppError('Event not found', 404));

    if (event.status === EVENT_STATUS.CLOSED) {
      return res.status(200).json({ success: true, data: event, message: 'Event is already closed.' });
    }

    event.status = EVENT_STATUS.CLOSED;
    await event.save();

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityType: 'IdeathonEvent',
      entityId: event._id.toString(),
      metadata: { action: 'close_event' },
    });

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};
