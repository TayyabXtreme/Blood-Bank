import { ConvexError } from 'convex/values';

export function fail(code: string, message: string): never { throw new ConvexError({ code, message }); }
export function text(value: string, label: string, max = 120) {
  const clean = value.trim();
  if (clean.length < 2 || clean.length > max) fail('VALIDATION', `${label} must contain 2–${max} characters.`);
  return clean;
}
export function optionalText(value: string | undefined, label: string, max = 1000) {
  if (value === undefined || !value.trim()) return undefined;
  return text(value, label, max);
}
export function integer(value: number, label: string, minimum = 1, maximum = 100) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail('VALIDATION', `${label} must be a whole number between ${minimum} and ${maximum}.`);
  return value;
}
export function coordinates(latitude?: number, longitude?: number) {
  if (latitude === undefined && longitude === undefined) return;
  if (latitude === undefined || longitude === undefined || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) fail('VALIDATION', 'Provide a valid latitude and longitude together.');
}
export function timestamp(value: number, label: string, now: number, future: boolean) {
  if (!Number.isSafeInteger(value) || value <= 0 || (future ? value <= now : value > now)) fail('VALIDATION', `${label} must be a valid ${future ? 'future' : 'past or present'} date.`);
  return value;
}
export function phone(value?: string) {
  if (!value?.trim()) return undefined;
  const clean = value.trim(), digits = clean.replace(/\D/g, '');
  if (!/^\+?[\d\s().-]+$/.test(clean) || digits.length < 7 || digits.length > 15) fail('VALIDATION', 'Enter a valid phone number with 7–15 digits.');
  return clean;
}
export function limit(value?: number) { return integer(value ?? 30, 'Page size', 1, 100); }
