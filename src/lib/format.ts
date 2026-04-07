export function formatNumber(value: number): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: 0 });
}

export function formatCompact(value: number): string {
  if (value >= 1e6) return (value / 1e6).toFixed(1) + ' Mio €';
  if (value >= 1e3) return Math.round(value / 1e3) + 'k €';
  return Math.round(value) + ' €';
}
