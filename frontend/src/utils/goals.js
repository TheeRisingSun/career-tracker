// Ideal hours from Routine: Weekdays 4.25, Saturday 10, Sunday 8. Weekly ~40 hrs.
export const WEEKLY_GOAL_HOURS = 40;
export const WEEKDAY_GOAL_HOURS = 4.25;
export const SATURDAY_GOAL_HOURS = 10;
export const SUNDAY_GOAL_HOURS = 8;

/**
 * @param {number} dayOfWeek 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export function getDailyGoalHours(dayOfWeek) {
  if (dayOfWeek === 0) return SUNDAY_GOAL_HOURS;
  if (dayOfWeek === 6) return SATURDAY_GOAL_HOURS;
  return WEEKDAY_GOAL_HOURS;
}

/** Get goal for a given date */
export function getGoalForDate(date) {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date(date);
  return getDailyGoalHours(d.getDay());
}

export const GOALS_SUMMARY = {
  weekly: WEEKLY_GOAL_HOURS,
  weekday: WEEKDAY_GOAL_HOURS,
  saturday: SATURDAY_GOAL_HOURS,
  sunday: SUNDAY_GOAL_HOURS,
};
