/**
 * server/jobs/eventAutoClose.js
 * Ideathon Auto-Close cron job (FR-IE-06)
 * Runs daily at midnight. Finds active events whose endDate is in the past,
 * and automatically transitions them to 'closed'.
 */
const cron = require('node-cron');
const IdeathonEvent = require('../models/IdeathonEvent');
const logger = require('../utils/logger');
const { EVENT_STATUS } = require('../../shared/constants');

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

// Start the cron job (runs at 00:01 daily)
const startJob = () => {
  cron.schedule('1 0 * * *', autoCloseEvents);
  logger.info('Event Auto-Close cron job scheduled (runs daily).');
};

module.exports = { startJob, autoCloseEvents };
