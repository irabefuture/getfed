/**
 * Week and date utilities for meal planning
 */

/**
 * Get the Monday of the week containing the given date
 * @param {Date} date - Any date
 * @returns {Date} - Monday of that week (00:00:00)
 */
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  // Sunday is 0, Monday is 1, etc.
  // If Sunday (0), go back 6 days. Otherwise go back (day - 1) days
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get the Sunday of the week containing the given date
 * @param {Date} date - Any date
 * @returns {Date} - Sunday of that week (23:59:59)
 */
export function getWeekEnd(date = new Date()) {
  const monday = getWeekStart(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

/**
 * Get array of dates for the week (Mon-Sun)
 * @param {Date} weekStart - Monday of the week
 * @returns {Date[]} - Array of 7 dates
 */
export function getWeekDates(weekStart) {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    dates.push(date)
  }
  return dates
}

/**
 * Format date as "Mon 2" for day tabs
 * @param {Date} date 
 * @returns {string}
 */
export function formatDayTab(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[date.getDay()]} ${date.getDate()}`
}

/**
 * Format date as "Thursday 5 December" for day header
 * @param {Date} date 
 * @returns {string}
 */
export function formatDayHeader(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}

/**
 * Format week range as "Dec 2-8" for header
 * @param {Date} weekStart - Monday of the week
 * @returns {string}
 */
export function formatWeekRange(weekStart) {
  const weekEnd = getWeekEnd(weekStart)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const startMonth = months[weekStart.getMonth()]
  const endMonth = months[weekEnd.getMonth()]
  
  // Same month: "Dec 2-8"
  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()}-${weekEnd.getDate()}`
  }
  // Different months: "Nov 25 - Dec 1"
  return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`
}

/**
 * Check if two dates are the same day
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

/**
 * Format date as ISO string for database (YYYY-MM-DD)
 * Uses local timezone to avoid date shifting
 * @param {Date} date 
 * @returns {string}
 */
export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse ISO date string to Date object
 * @param {string} isoDate - "YYYY-MM-DD"
 * @returns {Date}
 */
export function fromISODate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get array of consecutive dates starting from a date
 * @param {Date} startDate - First date
 * @param {number} count - Number of days to include
 * @returns {Date[]} - Array of dates
 */
export function getDatesFromStart(startDate, count = 14) {
  const dates = []
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }
  return dates
}

/**
 * Format date range as "Dec 5-18" or "Dec 28 - Jan 10"
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const startMonth = months[startDate.getMonth()]
  const endMonth = months[endDate.getMonth()]
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`
}
