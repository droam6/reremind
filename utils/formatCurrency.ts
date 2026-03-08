export function formatCurrency(amount: number): string {
  const clamped = Math.max(0, amount);
  const hasDecimal = clamped % 1 !== 0;

  if (hasDecimal) {
    return '$' + clamped.toLocaleString('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return '$' + clamped.toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
