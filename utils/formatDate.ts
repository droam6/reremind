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

export function formatRelativeDate(dateString: string): string {
  const today = new Date();
  const target = new Date(dateString);
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
