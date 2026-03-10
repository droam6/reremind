export function formatCategoryName(category: string): string {
  if (category === 'bnpl') return 'BNPL';
  // Capitalize first letter of all other categories
  return category.charAt(0).toUpperCase() + category.slice(1);
}
