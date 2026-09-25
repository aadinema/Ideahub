/**
 * server/services/authorizationService.js
 * Centralized object-level authorization policy helpers.
 *
 * Usage:
 *   const canAccess = await authorizationService.canAccessIdea(user, idea, 'read');
 *   if (!canAccess) return next(new AppError('Access denied', 403));
 *
 * Policies:
 *   - Admin can access any object
 *   - Submitter can access their own ideas
 *   - Supervisors can access their team's ideas
 *   - Committee/Evaluators can access assigned/workflow-scoped ideas
 *   - Implementation owners can access their implementations
 *   - Benefits can only be accessed by submitter, implementation owner, or admin
 */

const Idea = require('../models/Idea');
const Implementation = require('../models/Implementation');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES, IDEA_STATUS } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// canAccessIdea(user, idea, action)
// Check if user can access an idea for the given action ('read', 'write', 'delete')
// ---------------------------------------------------------------------------
exports.canAccessIdea = async (user, idea, action = 'read') => {
  if (!user || !idea) return false;

  // Admin can access any idea
  if (user.roles.includes(ROLES.ADMIN)) return true;

  // Submitter can always access their own ideas
  if (idea.submittedBy?.toString() === user._id.toString()) {
    // But can only delete drafts
    if (action === 'delete' && idea.status !== IDEA_STATUS.DRAFT) return false;
    return true;
  }

  // Supervisors can access their team's ideas
  if (user.roles.includes(ROLES.SUPERVISOR)) {
    const teamMember = await User.findById(idea.submittedBy).select('managerId').lean();
    if (teamMember?.managerId?.toString() === user._id.toString()) return true;
  }

  // Committee/evaluators can access ideas in workflow or assigned to them
  if (user.roles.includes(ROLES.INNOVATION_COMMITTEE)) {
    if ([IDEA_STATUS.UNDER_COMMITTEE_REVIEW, IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION].includes(idea.status)) {
      return true;
    }
  }

  if (user.roles.includes(ROLES.DEPT_INNOVATION_TEAM)) {
    // Can access ideas from their department in specific statuses or if assigned as evaluator
    if (idea.department === user.department &&
        [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION, IDEA_STATUS.SHORTLISTED, IDEA_STATUS.REJECTED_BY_DEPT].includes(idea.status)) {
      return true;
    }
    if (idea.assignedEvaluators?.includes(user._id)) {
      return true;
    }
  }

  // Published ideas visible to all
  if (action === 'read' && idea.status === IDEA_STATUS.PUBLISHED) return true;

  return false;
};

// ---------------------------------------------------------------------------
// canAccessImplementation(user, implementation, idea, action)
// Check if user can access an implementation for the given action
// ---------------------------------------------------------------------------
exports.canAccessImplementation = async (user, implementation, idea, action = 'read') => {
  if (!user || !implementation) return false;

  // Admin can access any implementation
  if (user.roles.includes(ROLES.ADMIN)) return true;

  // Idea submitter can read
  if (idea.submittedBy?.toString() === user._id.toString()) {
    return action === 'read';
  }

  // Implementation owner can read/write
  if (implementation.ownerId?.toString() === user._id.toString()) {
    return true;
  }

  // Committee can create/read
  if (user.roles.includes(ROLES.INNOVATION_COMMITTEE)) {
    return action === 'read' || action === 'create';
  }

  return false;
};

// ---------------------------------------------------------------------------
// canAccessBenefit(user, benefit, idea, implementation, action)
// Check if user can access a benefit for the given action
// ---------------------------------------------------------------------------
exports.canAccessBenefit = async (user, benefit, idea, implementation, action = 'read') => {
  if (!user || !idea) return false;

  // Admin can access any benefit
  if (user.roles.includes(ROLES.ADMIN)) return true;

  // Idea submitter can read
  if (idea.submittedBy?.toString() === user._id.toString()) {
    return action === 'read';
  }

  // Implementation owner can create/read
  if (implementation && implementation.ownerId?.toString() === user._id.toString()) {
    return action === 'read' || action === 'create';
  }

  // Committee can read and endorse
  if (user.roles.includes(ROLES.INNOVATION_COMMITTEE)) {
    return true;
  }

  return false;
};

// ---------------------------------------------------------------------------
// validateImplementationOwner(ownerId, implementationDepartment)
// Verify that the owner exists, is active, and is eligible for the role
// ---------------------------------------------------------------------------
exports.validateImplementationOwner = async (ownerId, implementationDepartment) => {
  if (!ownerId) {
    throw new AppError('Implementation owner ID is required', 400);
  }

  const owner = await User.findById(ownerId).select('_id name department isActive roles');
  if (!owner) {
    throw new AppError('Selected implementation owner does not exist', 404);
  }

  if (!owner.isActive) {
    throw new AppError('Selected implementation owner is not active', 400);
  }

  // Owner should be from the implementation's department or be admin/coordinator
  if (
    owner.department !== implementationDepartment &&
    !owner.roles.includes(ROLES.ADMIN)
  ) {
    throw new AppError(
      'Implementation owner must be from the same department or an administrator',
      400
    );
  }

  return owner;
};

// ---------------------------------------------------------------------------
// throwIfNotAuthorized(canAccess, message)
// Helper to throw error if authorization check fails
// ---------------------------------------------------------------------------
exports.throwIfNotAuthorized = (canAccess, message = 'Access denied') => {
  if (!canAccess) {
    throw new AppError(message, 403);
  }
};

module.exports = exports;
