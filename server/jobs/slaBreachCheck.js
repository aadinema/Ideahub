/**
 * server/jobs/slaBreachCheck.js
 * SLA Breach cron job (FR-03-04)
 * Runs hourly, identifies ideas that have exceeded their SLA based on business days.
 * 
 * SLAs:
 * - Supervisor Review: 3 Business Days
 * - Department Evaluation: 5 Business Days
 * - Committee Review: 7 Business Days
 * 
 * If a breach is found, triggers an escalation notification via notificationService.
 * (Note: only sends notification once per state to avoid spamming).
 */
const cron = require('node-cron');
const Idea = require('../models/Idea');
const User = require('../models/User');
const { getHolidays, getElapsedBusinessDays } = require('../utils/businessDays');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { IDEA_STATUS, NOTIFICATION_EVENT } = require('../../shared/constants');

// For tracking already notified breaches per idea status (in memory for demo, normally persistent)
// Using ideaId_status string as key
const notifiedBreaches = new Set();

const SLA_LIMITS = {
  [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW]: 3,
  [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION]: 5,
  [IDEA_STATUS.UNDER_COMMITTEE_REVIEW]: 7,
};

const checkSLABreaches = async () => {
  logger.info('Running SLA breach check...');
  
  try {
    const holidays = await getHolidays();
    const now = new Date();
    
    // Get all ideas currently in one of the review stages
    const ideas = await Idea.find({
      status: { $in: Object.keys(SLA_LIMITS) }
    }).populate('supervisorId').lean();

    for (const idea of ideas) {
      // Find when the idea entered the current status
      const historyEntry = [...idea.statusHistory]
        .reverse()
        .find(h => h.status === idea.status);
        
      if (!historyEntry) continue;
      
      const enteredAt = historyEntry.timestamp;
      const elapsedDays = getElapsedBusinessDays(enteredAt, now, holidays);
      const limit = SLA_LIMITS[idea.status];
      
      if (elapsedDays > limit) {
        const breachKey = `${idea._id.toString()}_${idea.status}`;
        
        // If not already notified
        if (!notifiedBreaches.has(breachKey)) {
          logger.warn(`SLA Breach detected on idea ${idea.ideaId} (${idea.status}) - ${elapsedDays} days elapsed (Limit: ${limit})`);
          
          if (idea.status === IDEA_STATUS.UNDER_SUPERVISOR_REVIEW && idea.supervisorId) {
            // Find manager's manager for escalation
            let manager = null;
            if (idea.supervisorId.managerId) {
              manager = await User.findById(idea.supervisorId.managerId).lean();
            }
            
            notificationService.trigger(NOTIFICATION_EVENT.SUPERVISOR_SLA_BREACH, {
              idea,
              supervisor: idea.supervisorId,
              manager
            });
          }
          // Note: for other statuses, specific events can be added (e.g. DEPT_SLA_BREACH).
          // Sticking to supervisor breach as per plan.
          
          notifiedBreaches.add(breachKey);
        }
      }
    }
  } catch (error) {
    logger.error('Error running SLA breach check', error);
  }
};

// Start the cron job (runs every hour on the hour)
const startJob = () => {
  cron.schedule('0 * * * *', checkSLABreaches);
  logger.info('SLA Breach Check cron job scheduled (runs hourly).');
};

module.exports = { startJob, checkSLABreaches };
