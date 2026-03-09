const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(from: Date, to: Date): number {
  const msPerDay = 86400000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

/**
 * Safely parse a date string in either DD/MM/YYYY or YYYY-MM-DD format.
 * Returns a Date object with time set to midnight local.
 */
export function parseDate(dateString: string): Date {
  if (!dateString) return new Date();

  // DD/MM/YYYY format
  const slashParts = dateString.split('/');
  if (slashParts.length === 3 && slashParts[0].length <= 2) {
    const [dd, mm, yyyy] = slashParts;
    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10) - 1; // JS months are 0-indexed
    const y = parseInt(yyyy, 10);
    if (d > 0 && m >= 0 && y > 2000) {
      const date = new Date(y, m, d);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  // YYYY-MM-DD format — parse manually to avoid timezone issues
  const dashParts = dateString.split('-');
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    const y = parseInt(dashParts[0], 10);
    const m = parseInt(dashParts[1], 10) - 1;
    const d = parseInt(dashParts[2], 10);
    if (d > 0 && m >= 0 && y > 2000) {
      const date = new Date(y, m, d);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  // Fallback
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Convert any date string (DD/MM/YYYY or YYYY-MM-DD) to ISO YYYY-MM-DD format.
 */
export function toISODateString(dateString: string): string {
  const date = parseDate(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatRelativeDate(dateString: string): string {
  const today = new Date();
  const target = parseDate(dateString);
  const days = diffDays(today, target);

  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1 && days <= 6) return `in ${days} days`;
  if (days < -1 && days >= -6) return `${Math.abs(days)} days ago`;

  const dayName = DAY_NAMES[target.getDay()];
  const day = target.getDate();
  const month = MONTH_NAMES[target.getMonth()];
  return `${dayName} ${day} ${month}`;
}

export function formatCountdown(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `${days} days to go`;
}
