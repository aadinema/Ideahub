/**
 * server/utils/businessDays.js
 * Utility to calculate business days between two dates, 
 * excluding weekends (Saturday/Sunday) and holidays.
 */
const HolidayCalendar = require('../models/HolidayCalendar');
const { getFYLabel } = require('../../shared/constants');

/**
 * Get all holiday dates for the current financial year.
 * Returns an array of date strings (YYYY-MM-DD).
 */
const getHolidays = async () => {
  const fy = getFYLabel();
  const calendar = await HolidayCalendar.findOne({ financialYear: fy }).lean();
  if (!calendar || !calendar.holidays) return [];
  
  return calendar.holidays.map(h => {
    const d = new Date(h.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
};

/**
 * Calculate the number of business days elapsed between startDate and endDate.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {Array<string>} holidays - Array of holiday date strings (YYYY-MM-DD)
 * @returns {number} elapsed business days
 */
const getElapsedBusinessDays = (startDate, endDate, holidays = []) => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0); // Start at midnight
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0); // End at midnight

  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    
    // Check if weekend (0 = Sunday, 6 = Saturday) or holiday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      count++;
    }
  }

  return count;
};

module.exports = {
  getHolidays,
  getElapsedBusinessDays
};
