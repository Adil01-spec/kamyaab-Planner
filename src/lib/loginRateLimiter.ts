/**
 * Client-side login rate limiter.
 * Tracks failed attempts per email in localStorage and enforces
 * escalating lockout durations to deter brute-force attacks.
 *
 * Lockout schedule (consecutive failures):
 *   5 → 2 min, 8 → 5 min, 12 → 15 min, 15+ → 30 min
 */

const STORAGE_KEY = 'login_attempts';

interface AttemptRecord {
  count: number;
  lockedUntil: number | null; // epoch ms
}

function getRecords(): Record<string, AttemptRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveRecords(records: Record<string, AttemptRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function lockoutMinutes(failures: number): number {
  if (failures >= 15) return 30;
  if (failures >= 12) return 15;
  if (failures >= 8) return 5;
  if (failures >= 5) return 2;
  return 0;
}

/** Returns seconds remaining if locked, or 0 if allowed. */
export function getLoginLockoutSeconds(email: string): number {
  const key = email.trim().toLowerCase();
  const records = getRecords();
  const rec = records[key];
  if (!rec?.lockedUntil) return 0;
  const remaining = Math.ceil((rec.lockedUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    // Lockout expired – keep count so next failure escalates
    rec.lockedUntil = null;
    saveRecords(records);
    return 0;
  }
  return remaining;
}

/** Call after a failed login attempt. Returns lockout seconds (0 = no lock yet). */
export function recordFailedLogin(email: string): number {
  const key = email.trim().toLowerCase();
  const records = getRecords();
  const rec = records[key] || { count: 0, lockedUntil: null };
  rec.count += 1;

  const mins = lockoutMinutes(rec.count);
  if (mins > 0) {
    rec.lockedUntil = Date.now() + mins * 60_000;
  }
  records[key] = rec;
  saveRecords(records);
  return mins > 0 ? mins * 60 : 0;
}

/** Call after a successful login to reset the counter. */
export function clearLoginAttempts(email: string) {
  const key = email.trim().toLowerCase();
  const records = getRecords();
  delete records[key];
  saveRecords(records);
}

/** Remaining failure count before lockout triggers. */
export function attemptsBeforeLockout(email: string): number {
  const key = email.trim().toLowerCase();
  const rec = getRecords()[key];
  const count = rec?.count || 0;
  // Next lockout threshold
  const thresholds = [5, 8, 12, 15];
  for (const t of thresholds) {
    if (count < t) return t - count;
  }
  return 1; // already past all thresholds, locks on every attempt
}
