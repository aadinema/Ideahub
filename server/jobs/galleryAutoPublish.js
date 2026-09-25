/**
 * server/jobs/galleryAutoPublish.js
 * Polls for ideas in 'approved_for_publishing' state every 5 minutes
 * and transitions them to 'published' state.
 */
const cron = require('node-cron');
const Idea = require('../models/Idea');
const User = require('../models/User');
const logger = require('../utils/logger');
const workflowService = require('../services/workflowService');
const notificationService = require('../services/notificationService');
const { IDEA_STATUS, NOTIFICATION_EVENT } = require('../../shared/constants');

const autoPublishIdeas = async () => {
  logger.info('Running gallery auto-publish check...');

  try {
    const ideasToPublish = await Idea.find({
      status: IDEA_STATUS.APPROVED_FOR_PUBLISHING,
    });

    for (const idea of ideasToPublish) {
      // Route through workflowService: writes statusHistory (with a valid system
      // actor + correct `comment` field), sets publishedAt, and logs to AuditLog.
      const systemActor = { _id: idea.submittedBy, roles: ['system'] };
      await workflowService.transition({
        idea,
        toStatus: IDEA_STATUS.PUBLISHED,
        actor: systemActor,
        comment: 'Auto-published by system cron job',
      });
      logger.info(`Auto-published idea ${idea.ideaId}`);

      // Notify submitter their idea is live.
      const submitter = await User.findById(idea.submittedBy).lean();
      if (submitter) {
        notificationService.trigger(NOTIFICATION_EVENT.PUBLISHED_TO_GALLERY, { idea, submitter });
      }
    }
  } catch (error) {
    logger.error('Error running gallery auto-publish check', error);
  }
};

const startJob = () => {
  cron.schedule('*/5 * * * *', autoPublishIdeas);
  logger.info('Gallery Auto-Publish cron job scheduled (runs every 5 mins).');
};

module.exports = { startJob, autoPublishIdeas };
