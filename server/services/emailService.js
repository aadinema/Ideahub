/**
 * server/services/emailService.js
 * Email delivery via Nodemailer (SMTP).
 * Swappable provider: change SMTP env vars to switch Exchange, SendGrid, SES.
 * See INTEGRATIONS.md for extension point documentation.
 *
 * All emails are fire-and-forget from controllers (do not block HTTP response).
 * FRD §11 (Notification Framework), FR-02-08
 */
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Create transporter (singleton — reused across requests)
// ---------------------------------------------------------------------------
let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for port 465 (SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Increase timeouts for slow SMTP relays
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  return transporter;
};

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------
const TEMPLATES = {
  idea_submitted: ({ idea, user }) => ({
    subject: `✅ Idea Submitted: ${idea.title} [${idea.ideaId}]`,
    html: `
      <h2>Your idea has been submitted successfully!</h2>
      <p>Hi ${user.name},</p>
      <p>Your idea <strong>"${idea.title}"</strong> has been received with ID: <strong>${idea.ideaId}</strong>.</p>
      <p>It has been routed to your supervisor for review. You will be notified at each stage of the process.</p>
      <p><a href="${process.env.CLIENT_ORIGIN}/ideas/${idea._id}">Track your idea</a></p>
      <hr/>
      <p style="color:#666;font-size:12px">IdeaHub — MPOnline Innovation Platform</p>
    `,
  }),

  assigned_for_supervisor_review: ({ idea, supervisor }) => ({
    subject: `📋 Action Required: Review idea "${idea.title}" [${idea.ideaId}]`,
    html: `
      <h2>A new idea requires your review</h2>
      <p>Hi ${supervisor.name},</p>
      <p>Idea <strong>"${idea.title}"</strong> submitted by your team member has been routed to you for validation.</p>
      <p><strong>SLA: 3 business days</strong></p>
      <p><a href="${process.env.CLIENT_ORIGIN}/supervisor/queue">Review now →</a></p>
      <hr/>
      <p style="color:#666;font-size:12px">IdeaHub — MPOnline Innovation Platform</p>
    `,
  }),

  approved_by_supervisor: ({ idea, user }) => ({
    subject: `🎉 Idea Approved by Supervisor: ${idea.title} [${idea.ideaId}]`,
    html: `
      <h2>Your idea has been approved!</h2>
      <p>Hi ${user.name},</p>
      <p>Your idea <strong>"${idea.title}"</strong> has been approved by your supervisor and is now under Department Innovation Team evaluation.</p>
      <p><a href="${process.env.CLIENT_ORIGIN}/ideas/${idea._id}">Track status →</a></p>
    `,
  }),

  returned_for_clarification: ({ idea, user, comment }) => ({
    subject: `🔄 Idea Returned for Clarification: ${idea.title} [${idea.ideaId}]`,
    html: `
      <h2>Your idea has been returned for clarification</h2>
      <p>Hi ${user.name},</p>
      <p>Your idea <strong>"${idea.title}"</strong> has been returned by your supervisor with the following feedback:</p>
      <blockquote style="border-left:3px solid #e8c020;padding-left:12px;color:#555">${comment}</blockquote>
      <p>Please revise and resubmit from your Ideas dashboard.</p>
      <p><a href="${process.env.CLIENT_ORIGIN}/ideas/${idea._id}/edit">Revise idea →</a></p>
    `,
  }),

  idea_rejected: ({ idea, user, comment }) => ({
    subject: `❌ Idea Decision: ${idea.title} [${idea.ideaId}]`,
    html: `
      <h2>Your idea has been reviewed</h2>
      <p>Hi ${user.name},</p>
      <p>After careful review, your idea <strong>"${idea.title}"</strong> has not been approved at this stage.</p>
      ${comment ? `<p>Feedback: <em>${comment}</em></p>` : ''}
      <p>You are encouraged to refine and resubmit in future Ideathon events.</p>
    `,
  }),

  published_to_gallery: ({ idea, user }) => ({
    subject: `🌟 Your Idea is Now Published: ${idea.title}`,
    html: `
      <h2>Congratulations! Your idea is live in the Innovation Gallery</h2>
      <p>Hi ${user.name},</p>
      <p>Your idea <strong>"${idea.title}"</strong> has been approved and published to the organization-wide Innovation Gallery!</p>
      <p><a href="${process.env.CLIENT_ORIGIN}/gallery">View in Gallery →</a></p>
    `,
  }),

  generic: ({ subject: subj, body }) => ({
    subject: subj,
    html: `<div style="font-family:sans-serif">${body}</div>`,
  }),
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an email notification.
 * Fire-and-forget — errors are logged but never thrown.
 *
 * @param {object} params
 * @param {string|string[]} params.to         - Recipient email(s)
 * @param {string}          params.templateKey - Key in TEMPLATES (or 'generic')
 * @param {object}          params.data        - Template data object
 */
const send = async ({ to, templateKey, data }) => {
  try {
    const template = TEMPLATES[templateKey] || TEMPLATES.generic;
    const { subject, html } = template(data);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'IdeaHub'}" <${process.env.EMAIL_FROM || 'noreply@ideahub.local'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    };

    await getTransporter().sendMail(mailOptions);
    logger.info(`emailService: sent "${templateKey}" → ${mailOptions.to}`);
  } catch (err) {
    // Never crash the main request — email is best-effort
    logger.error(`emailService: failed to send "${templateKey}"`, {
      err: err.message,
      to,
    });
  }
};

module.exports = { send };
