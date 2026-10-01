export const cityRules = {
  required: 'Enter your city.',
  validate: (value: string) => value.trim().length >= 2 || 'Enter at least 2 characters for your city.',
  maxLength: { value: 80, message: 'Use a city name of 80 characters or fewer.' },
};

export function validatePhone(value: string) {
  if (!value.trim()) return true;
  if (!/^\+?[\d\s().-]+$/.test(value.trim())) return 'Enter a valid phone number or leave this blank.';
  const digits = value.replace(/\D/g, '');
  return (digits.length >= 7 && digits.length <= 15) || 'Use a phone number with 7–15 digits.';
}

export function validateDonationDate(value: string) {
  const match = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(value.trim());
  if (!match) return 'Enter the date as DD / MM / YYYY.';
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText), month = Number(monthText), year = Number(yearText);
  const date = new Date(year, month - 1, day);
  if (year < 1900 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return 'Enter a valid donation date.';
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today || 'Your last donation date cannot be in the future.';
}
