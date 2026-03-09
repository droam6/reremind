export function capitalizeName(name: string): string {
  if (!name) return name;
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
