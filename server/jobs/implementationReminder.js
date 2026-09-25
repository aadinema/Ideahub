/**
 * server/jobs/implementationReminder.js
 * Implementation deadline reminder job (FR-07-03).
 * Runs daily at 09:00 AM.
 */
const cron = require('node-cron');
const Implementation = require('../models/Implementation');
const Idea = require('../models/Idea');
const User = require('../models/User');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');
const { NOTIFICATION_EVENT } = require('../../shared/constants');

const checkImplementationReminders = async () => {
  logger.info('Running implementation reminder check...');

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find active implementations due within 3 days where reminder hasn't been sent
    const pendingReminders = await Implementation.find({
      progressPercent: { $lt: 100 },
      targetCompletionDate: { $lte: threeDaysFromNow },
      completionReminderSent: false,
    })
      .populate('ideaId', 'title ideaId')
      .populate('ownerId', 'name email managerId');

    for (const impl of pendingReminders) {
      impl.completionReminderSent = true;
      await impl.save();
      logger.info(`Sent completion reminder for implementation ${impl._id} (Idea: ${impl.ideaId?._id})`);

      const owner = impl.ownerId;
      const idea = impl.ideaId;
      if (!owner || !idea) continue;

      // Escalate to the owner's manager as well, when present.
      let supervisor = null;
      if (owner.managerId) {
        supervisor = await User.findById(owner.managerId).lean();
      }

      // Reuse the MILESTONE_OVERDUE channel: the overall completion deadline is
      // modeled as a synthetic milestone for notification purposes.
      notificationService.trigger(NOTIFICATION_EVENT.MILESTONE_OVERDUE, {
        idea,
        milestone: { title: 'Implementation completion', targetDate: impl.targetCompletionDate },
        owner,
        supervisor,
      });
    }
  } catch (error) {
    logger.error('Error running implementation reminder check', error);
  }
};

const startJob = () => {
  cron.schedule('0 9 * * *', checkImplementationReminders);
  logger.info('Implementation Reminder cron job scheduled (runs daily at 9am).');
};

module.exports = { startJob, checkImplementationReminders };
