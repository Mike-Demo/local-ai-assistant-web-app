export function speedLabel(tokensPerSecond: number | null | undefined): string | null {
  if (!tokensPerSecond) return null;
  if (tokensPerSecond >= 20) return 'Fast';
  if (tokensPerSecond >= 8) return 'Good';
  return 'Slow';
}
