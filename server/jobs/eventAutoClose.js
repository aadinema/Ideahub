/**
 * server/jobs/eventAutoClose.js
 * Ideathon lifecycle cron job:
 *   - FR-IE-06: auto-closes active events whose end date has passed.
 *   - FRD §11: sends the "closing in 48 hours" reminder to registered
 *     participants (email + in-app + dashboard alert per the notification matrix).
 *
 * Runs daily at 00:01. Safe to run repeatedly — the reminder is guarded by
 * `closingReminderSent` so participants are notified at most once per event.
 */
const cron = require('node-cron');
const IdeathonEvent = require('../models/IdeathonEvent');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { EVENT_STATUS, NOTIFICATION_EVENT } = require('../../shared/constants');

const autoCloseEvents = async () => {
  logger.info('Running event auto-close check...');

  try {
    const now = new Date();

    // Find events that are active but past their end date
    const expiredEvents = await IdeathonEvent.find({
      status: EVENT_STATUS.ACTIVE,
      endDate: { $lt: now }
    });

    for (const event of expiredEvents) {
      event.status = EVENT_STATUS.CLOSED;
      await event.save();
      logger.info(`Auto-closed event ${event._id} (${event.eventName}) as deadline passed.`);
    }
  } catch (error) {
    logger.error('Error running event auto-close check', error);
  }
};

/**
 * FRD §11 — notify registered participants when their event closes within 48h.
 */
const sendClosingReminders = async () => {
  logger.info('Running Ideathon 48h closing-reminder check...');

  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const closingSoon = await IdeathonEvent.find({
      status: { $in: [EVENT_STATUS.ACTIVE, EVENT_STATUS.EXTENDED] },
      endDate: { $gt: now, $lte: in48h },
      closingReminderSent: { $ne: true },
    });

    for (const event of closingSoon) {
      const participants = await User.find({ _id: { $in: event.participants } })
        .select('_id name email')
        .lean();

      if (participants.length > 0) {
        notificationService.trigger(NOTIFICATION_EVENT.IDEATHON_CLOSING_48H, {
          event,
          participants,
        });
        logger.info(`Sent 48h closing reminder for "${event.eventName}" to ${participants.length} participant(s).`);
      }

      event.closingReminderSent = true;
      await event.save();
    }
  } catch (error) {
    logger.error('Error running Ideathon closing-reminder check', error);
  }
};

// Start the cron job (runs at 00:01 daily — reminders first, then auto-close)
const startJob = () => {
  cron.schedule('1 0 * * *', async () => {
    await sendClosingReminders();
    await autoCloseEvents();
  });
  logger.info('Event lifecycle cron job scheduled (daily: 48h reminders + auto-close).');
};

module.exports = { startJob, autoCloseEvents, sendClosingReminders };
