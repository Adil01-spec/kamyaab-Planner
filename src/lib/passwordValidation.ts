/**
 * Password strength validation.
 * Requirements:
 * - Minimum 8 characters
 * - At least one letter (a-z or A-Z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*…)
 */

export interface PasswordCheck {
  valid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function validatePassword(password: string): PasswordCheck {
  const checks = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push('At least 8 characters');
  if (!checks.hasLetter) errors.push('At least one letter');
  if (!checks.hasNumber) errors.push('At least one number');
  if (!checks.hasSpecial) errors.push('At least one special character');

  return {
    valid: errors.length === 0,
    errors,
    checks,
  };
}
