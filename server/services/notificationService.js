/**
 * server/services/notificationService.js
 * Central notification dispatcher — single trigger() entry point.
 *
 * RULE: Never scatter raw email calls through controllers.
 *       Always call notificationService.trigger(eventKey, payload).
 *
 * This service:
 * 1. Reads NOTIFICATION_MATRIX to determine which channels to use
 * 2. Creates Notification documents for in_app / dashboard_alert channels
 * 3. Calls emailService.send() for email channel (fire-and-forget)
 *
 * FRD §11 (all 15 trigger events), Master Prompt §8
 */
const Notification = require('../models/Notification');
const emailService = require('./emailService');
const logger = require('../utils/logger');
const {
  NOTIFICATION_EVENT,
  NOTIFICATION_MATRIX,
  NOTIFICATION_CHANNEL,
} = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Recipient + template resolvers per event key
// Each resolver returns: { recipients: [{userId, email, name}], emailTemplateKey, emailData, title, body, link }
// ---------------------------------------------------------------------------

const resolvers = {
  [NOTIFICATION_EVENT.IDEA_SUBMITTED]: ({ idea, submitter }) => ({
    recipients: [{ userId: submitter._id, email: submitter.email, name: submitter.name }],
    emailTemplateKey: 'idea_submitted',
    emailData: { idea, user: submitter },
    title: `Idea submitted: ${idea.title}`,
    body: `Your idea "${idea.title}" (${idea.ideaId}) has been submitted and is under supervisor review.`,
    link: `/ideas/${idea._id}`,
  }),

  [NOTIFICATION_EVENT.ASSIGNED_FOR_SUPERVISOR_REVIEW]: ({ idea, supervisor }) => ({
    recipients: [{ userId: supervisor._id, email: supervisor.email, name: supervisor.name }],
    emailTemplateKey: 'assigned_for_supervisor_review',
    emailData: { idea, supervisor },
    title: `New idea to review: ${idea.title}`,
    body: `Idea "${idea.title}" by your team member requires your validation (SLA: 3 business days).`,
    link: `/supervisor/queue`,
  }),

  [NOTIFICATION_EVENT.APPROVED_BY_SUPERVISOR]: ({ idea, submitter }) => ({
    recipients: [{ userId: submitter._id, email: submitter.email, name: submitter.name }],
    emailTemplateKey: 'approved_by_supervisor',
    emailData: { idea, user: submitter },
    title: `Idea approved: ${idea.title}`,
    body: `Your idea "${idea.title}" has been approved by your supervisor and is now under department evaluation.`,
    link: `/ideas/${idea._id}`,
  }),

  [NOTIFICATION_EVENT.RETURNED_FOR_CLARIFICATION]: ({ idea, submitter, comment }) => ({
    recipients: [{ userId: submitter._id, email: submitter.email, name: submitter.name }],
    emailTemplateKey: 'returned_for_clarification',
    emailData: { idea, user: submitter, comment },
    title: `Idea returned for revision: ${idea.title}`,
    body: `Your idea "${idea.title}" has been returned for clarification. Please review the feedback and resubmit.`,
    link: `/ideas/${idea._id}/edit`,
  }),

  [NOTIFICATION_EVENT.IDEA_REJECTED]: ({ idea, submitter, comment }) => ({
    recipients: [{ userId: submitter._id, email: submitter.email, name: submitter.name }],
    emailTemplateKey: 'idea_rejected',
    emailData: { idea, user: submitter, comment },
    title: `Idea not approved: ${idea.title}`,
    body: `Your idea "${idea.title}" has not been approved at this stage.`,
    link: `/ideas/${idea._id}`,
  }),

  [NOTIFICATION_EVENT.ROUTED_TO_DEPT_EVALUATION]: ({ idea, deptTeamMembers }) => ({
    recipients: deptTeamMembers.map((u) => ({ userId: u._id, email: u.email, name: u.name })),
    emailTemplateKey: 'generic',
    emailData: {
      subject: `Idea for evaluation: ${idea.title} [${idea.ideaId}]`,
      body: `<p>A new idea <strong>"${idea.title}"</strong> has been routed to your department for evaluation (SLA: 5 business days).</p><a href="${process.env.CLIENT_ORIGIN}/evaluation/queue">Evaluate now →</a>`,
    },
    title: `New idea to evaluate: ${idea.title}`,
    body: `"${idea.title}" has been routed to your department for scoring (SLA: 5 business days).`,
    link: `/evaluations/queue`,
  }),

  [NOTIFICATION_EVENT.SHORTLISTED_BY_DEPT]: ({ idea, submitter, committeeMembers }) => ({
    recipients: [
      { userId: submitter._id, email: submitter.email, name: submitter.name },
      ...committeeMembers.map((u) => ({ userId: u._id, email: u.email, name: u.name })),
    ],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `Idea shortlisted: ${idea.title} [${idea.ideaId}]`,
      body: `<p>Idea <strong>"${idea.title}"</strong> has been shortlisted by the Department Innovation Team and is now under Innovation Committee review.</p>`,
    },
    title: `Idea shortlisted: ${idea.title}`,
    body: `"${idea.title}" has been shortlisted and routed to the Innovation Committee.`,
    link: `/ideas/${idea._id}`,
  }),

  [NOTIFICATION_EVENT.APPROVED_BY_COMMITTEE]: ({ idea, submitter, deptHead }) => ({
    recipients: [
      { userId: submitter._id, email: submitter.email, name: submitter.name },
      ...(deptHead ? [{ userId: deptHead._id, email: deptHead.email, name: deptHead.name }] : []),
    ],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `Idea approved by Innovation Committee: ${idea.title}`,
      body: `<p>Idea <strong>"${idea.title}"</strong> has been approved by the Innovation Committee.</p>`,
    },
    title: `Committee approved: ${idea.title}`,
    body: `"${idea.title}" has been approved by the Innovation Committee.`,
    link: `/ideas/${idea._id}`,
  }),

  [NOTIFICATION_EVENT.PUBLISHED_TO_GALLERY]: ({ idea, submitter }) => ({
    recipients: [{ userId: submitter._id, email: submitter.email, name: submitter.name }],
    emailTemplateKey: 'published_to_gallery',
    emailData: { idea, user: submitter },
    title: `Your idea is published! ${idea.title}`,
    body: `Your idea "${idea.title}" is now live in the Innovation Gallery — visible to the entire organization!`,
    link: `/gallery`,
  }),

  [NOTIFICATION_EVENT.IMPLEMENTATION_ASSIGNED]: ({ idea, owner, submitter }) => ({
    recipients: [
      { userId: owner._id, email: owner.email, name: owner.name },
      { userId: submitter._id, email: submitter.email, name: submitter.name },
    ],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `Implementation assigned: ${idea.title}`,
      body: `<p>You have been assigned as Implementation Owner for <strong>"${idea.title}"</strong>.</p><a href="${process.env.CLIENT_ORIGIN}/implementations">View your assignments →</a>`,
    },
    title: `Implementation assigned: ${idea.title}`,
    body: `You have been assigned as Implementation Owner for "${idea.title}".`,
    link: `/implementations`,
  }),

  [NOTIFICATION_EVENT.MILESTONE_OVERDUE]: ({ idea, milestone, owner, supervisor }) => ({
    recipients: [
      { userId: owner._id, email: owner.email, name: owner.name },
      ...(supervisor ? [{ userId: supervisor._id, email: supervisor.email, name: supervisor.name }] : []),
    ],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `⚠️ Overdue milestone: ${milestone.title} — ${idea.title}`,
      body: `<p>Milestone <strong>"${milestone.title}"</strong> for idea "${idea.title}" is overdue (target: ${milestone.targetDate?.toDateString()}).</p>`,
    },
    title: `Overdue milestone: ${milestone.title}`,
    body: `Milestone "${milestone.title}" for "${idea.title}" is past its target date.`,
    link: `/implementations`,
  }),

  [NOTIFICATION_EVENT.IMPLEMENTATION_COMPLETED]: ({ idea, submitter, committeeMembers }) => ({
    recipients: [
      { userId: submitter._id, email: submitter.email, name: submitter.name },
      ...committeeMembers.map((u) => ({ userId: u._id, email: u.email, name: u.name })),
    ],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `Implementation complete: ${idea.title}`,
      body: `<p>Implementation of idea <strong>"${idea.title}"</strong> has been marked complete. Benefits realization data is now pending.</p>`,
    },
    title: `Implementation completed: ${idea.title}`,
    body: `"${idea.title}" implementation is complete. Benefits data is pending.`,
    link: `/implementations`,
  }),

  [NOTIFICATION_EVENT.SUPERVISOR_SLA_BREACH]: ({ idea, supervisor, manager }) => ({
    recipients: [
      { userId: supervisor._id, email: supervisor.email, name: supervisor.name },
      ...(manager ? [{ userId: manager._id, email: manager.email, name: manager.name }] : []),
    ],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `⚠️ SLA Breach: Idea pending review for 3+ business days`,
      body: `<p>Idea <strong>"${idea.title}"</strong> [${idea.ideaId}] has exceeded the 3 business day supervisor review SLA. Immediate attention required.</p><a href="${process.env.CLIENT_ORIGIN}/supervisor/queue">Review now →</a>`,
    },
    title: `SLA Breach: ${idea.title}`,
    body: `Idea "${idea.ideaId}" has exceeded the supervisor SLA (3 business days). Escalation raised.`,
    link: `/supervisor/queue`,
  }),

  [NOTIFICATION_EVENT.NEW_IDEATHON_LAUNCHED]: ({ event, eligibleUsers }) => ({
    recipients: eligibleUsers.map((u) => ({ userId: u._id, email: u.email, name: u.name })),
    emailTemplateKey: 'generic',
    emailData: {
      subject: `🚀 New Ideathon: ${event.eventName}`,
      body: `<p>A new Ideathon <strong>"${event.eventName}"</strong> has launched! Submit your ideas before ${new Date(event.endDate).toDateString()}.</p><a href="${process.env.CLIENT_ORIGIN}/events">Explore now →</a>`,
    },
    title: `New Ideathon: ${event.eventName}`,
    body: `"${event.eventName}" is now live. Submit your ideas before ${new Date(event.endDate).toDateString()}.`,
    link: `/events`,
  }),

  [NOTIFICATION_EVENT.IDEATHON_CLOSING_48H]: ({ event, participants }) => ({
    recipients: participants.map((u) => ({ userId: u._id, email: u.email, name: u.name })),
    emailTemplateKey: 'generic',
    emailData: {
      subject: `⏰ 48 hours left: ${event.eventName}`,
      body: `<p>The Ideathon <strong>"${event.eventName}"</strong> closes in 48 hours (${new Date(event.endDate).toDateString()}). Submit your ideas now!</p>`,
    },
    title: `48h remaining: ${event.eventName}`,
    body: `The Ideathon "${event.eventName}" closes in 48 hours. Submit your ideas now!`,
    link: `/events/${event._id}`,
  }),

  // FR-IE-03 — join confirmation to the registering employee.
  [NOTIFICATION_EVENT.IDEATHON_JOIN_CONFIRMED]: ({ event, user }) => ({
    recipients: [{ userId: user._id, email: user.email, name: user.name }],
    emailTemplateKey: 'generic',
    emailData: {
      subject: `✅ You're registered: ${event.eventName}`,
      body: `<p>You have successfully registered for <strong>"${event.eventName}"</strong>. The event runs until ${new Date(event.endDate).toDateString()}.</p><a href="${process.env.CLIENT_ORIGIN}/events/${event._id}">View event →</a>`,
    },
    title: `Registered: ${event.eventName}`,
    body: `Your registration for "${event.eventName}" is confirmed. It closes ${new Date(event.endDate).toDateString()}.`,
    link: `/events/${event._id}`,
  }),

  // FR-IE-07 — deadline extension notice to all registered participants.
  [NOTIFICATION_EVENT.IDEATHON_EXTENDED]: ({ event, participants }) => ({
    recipients: participants.map((u) => ({ userId: u._id, email: u.email, name: u.name })),
    emailTemplateKey: 'generic',
    emailData: {
      subject: `📅 Deadline extended: ${event.eventName}`,
      body: `<p>The deadline for <strong>"${event.eventName}"</strong> has been extended to ${new Date(event.endDate).toDateString()}. You now have more time to submit your ideas.</p><a href="${process.env.CLIENT_ORIGIN}/events/${event._id}">View event →</a>`,
    },
    title: `Deadline extended: ${event.eventName}`,
    body: `"${event.eventName}" now closes ${new Date(event.endDate).toDateString()}.`,
    link: `/events/${event._id}`,
  }),
};

// ---------------------------------------------------------------------------
// Core trigger function
// ---------------------------------------------------------------------------

/**
 * Trigger notifications for an event.
 * Fire-and-forget — errors are logged, never propagated to the HTTP response.
 *
 * @param {string} eventKey - One of NOTIFICATION_EVENT values
 * @param {object} payload  - Data required by the resolver for this event
 */
const trigger = async (eventKey, payload) => {
  try {
    const channels = NOTIFICATION_MATRIX[eventKey];
    if (!channels) {
      logger.warn(`notificationService: unknown event key "${eventKey}"`);
      return;
    }

    const resolver = resolvers[eventKey];
    if (!resolver) {
      logger.warn(`notificationService: no resolver for event key "${eventKey}"`);
      return;
    }

    const { recipients, emailTemplateKey, emailData, title, body, link } = resolver(payload);

    // Deduplicate recipients by userId
    const seen = new Set();
    const uniqueRecipients = recipients.filter((r) => {
      const key = r.userId.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Email ──
    if (channels.email && emailTemplateKey) {
      const emailAddresses = uniqueRecipients.map((r) => r.email).filter(Boolean);
      if (emailAddresses.length > 0) {
        // Fire and forget
        emailService.send({ to: emailAddresses, templateKey: emailTemplateKey, data: emailData });
      }
    }

    // ── In-App Notifications ──
    const inAppDocs = [];
    if (channels.inApp) {
      for (const recipient of uniqueRecipients) {
        inAppDocs.push({
          recipientId: recipient.userId,
          triggerEvent: eventKey,
          channel: NOTIFICATION_CHANNEL.IN_APP,
          title,
          body,
          link,
          isRead: false,
          sentAt: new Date(),
        });
      }
    }

    // ── Dashboard Alerts ──
    if (channels.dashboardAlert) {
      for (const recipient of uniqueRecipients) {
        inAppDocs.push({
          recipientId: recipient.userId,
          triggerEvent: eventKey,
          channel: NOTIFICATION_CHANNEL.DASHBOARD_ALERT,
          title,
          body,
          link,
          isRead: false,
          sentAt: new Date(),
        });
      }
    }

    if (inAppDocs.length > 0) {
      await Notification.insertMany(inAppDocs, { ordered: false });
    }
  } catch (err) {
    logger.error(`notificationService.trigger failed for event "${eventKey}"`, {
      err: err.message,
    });
  }
};

module.exports = { trigger };
