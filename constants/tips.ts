export const TIPS: string[] = [
  'Afterpay charges late fees between $8 and $68 on overdue payments.',
  'Setting up direct debit for bills can avoid late payment fees.',
  'The average Australian has 2.5 BNPL accounts. How many do you have?',
  'Switching energy providers could save you $200-500 per year.',
  'Most subscription services offer annual plans that save 15-20% over monthly.',
  'A $5 daily coffee habit costs $1,825 per year.',
  'Late credit card payments can affect your credit score for up to 5 years.',
  'You can negotiate lower rates on insurance by calling and asking.',
  "Centrelink's advance payment option can help in emergencies.",
  "Medicare covers most GP visits — you don't always need private health extras.",
  'Paying rent on time can now help build your credit score with some services.',
  'The minimum credit card repayment barely covers interest — try to pay more.',
  "If you're on a variable rate loan, even $20 extra per month makes a difference.",
  'Free financial counselling is available through the National Debt Helpline (1800 007 007).',
  'Zip Pay charges $7.95/month if you have an outstanding balance.',
  'Most banks will waive overdraft fees if you call and ask — especially the first time.',
  'Setting a weekly spending limit is easier to stick to than a monthly budget.',
  'Grocery prices vary up to 30% between supermarkets — compare before your big shop.',
  'Your phone plan might be costing you more than you need. Check for better deals yearly.',
  'Saving even $10 per pay cycle adds up to $260 a year on fortnightly pay.',
  'Unused gym memberships cost Australians over $1.8 billion per year combined.',
  'Energy comparison sites like Energy Made Easy are free and government-run.',
];

export function getTodaysTip(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return TIPS[dayOfYear % TIPS.length];
}
