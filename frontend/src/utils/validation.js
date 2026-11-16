// Shared checks for public forms. The server applies the same rules.

// name@domain.tld — no spaces, one @, and a real-looking ending like .com or .in
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/
export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim())
}

// Numbers only, with an optional + for the country code: 10 digits, or 7–15 with a country code.
export function isValidPhone(value) {
  const phone = String(value || '').trim()
  return /^\+?\d{7,15}$/.test(phone) && phone.replace('+', '').length >= 10
}
