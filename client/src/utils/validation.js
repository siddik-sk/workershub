export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function isValidPhone(phone) {
  return /^[+0-9()\-\s]{7,25}$/.test(String(phone || '').trim());
}

export function passwordProblem(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password is too long';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  return '';
}

export function passwordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: 'Enter a password' };
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { score: 1, label: 'Weak' };
  if (score === 3) return { score: 2, label: 'Fair' };
  if (score === 4) return { score: 3, label: 'Good' };
  return { score: 4, label: 'Strong' };
}

export function validateRequired(fields) {
  const errors = {};
  Object.entries(fields).forEach(([key, value]) => {
    if (!String(value ?? '').trim()) errors[key] = 'This field is required';
  });
  return errors;
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  return error.message || fallback;
}

export function getFieldErrors(error) {
  const map = {};
  if (Array.isArray(error?.details)) {
    error.details.forEach((detail) => {
      if (detail.field && !map[detail.field]) map[detail.field] = detail.message;
    });
  }
  return map;
}
