export function localWallMinute(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/.test(value)
    || value.startsWith('0000-')) { return null; }
  // UTC supplies Gregorian wall-clock arithmetic only, not a business instant.
  const date = new Date(value + 'Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === value
    ? date.getTime() / 60_000 : null;
}
