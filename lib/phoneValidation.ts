/** E.164-style international phone: + followed by 7–15 digits. */
export function isValidInternationalPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return false;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  if (digits[0] === '0') return false;

  return true;
}

export const INTERNATIONAL_PHONE_HINT = 'Include country code, e.g. +1 417 869 1500';

export const INTERNATIONAL_PHONE_ERROR =
  'Enter a valid international phone number starting with + and country code.';
