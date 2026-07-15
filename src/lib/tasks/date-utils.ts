/**
 * Calculates a due date by adding a day offset to a start date.
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param dueDayOffset - number of days to add
 * @returns ISO date string (YYYY-MM-DD)
 */
export function addDays(startDate: string, dueDayOffset: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dueDayOffset);
  return date.toISOString().split('T')[0];
}
