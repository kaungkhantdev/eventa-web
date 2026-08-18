/**
 * The strength meter on the sign-up and reset-password forms.
 *
 * Ported from auth/register.html's inline script, with one correction: the kit
 * scored and advertised a different floor from the one the API enforced. A
 * meter that calls a password acceptable and then watches the API reject it is
 * worse than no meter, so the floor is stated once here and shown in the copy.
 *
 * This only tidies the form. The API enforces the rule, and its refusal is
 * what counts.
 */

/**
 * Must equal `PASSWORD_MIN_LENGTH` in eventa-api's `auth-password.policy.ts`,
 * which is what `RegisterDto`, `ResetPasswordDto` and `ChangePasswordDto` all
 * enforce. Two repos, one number — change both together or the meter starts
 * lying again.
 */
export const MIN_PASSWORD_LENGTH = 6

/** A comfortable length, above which a symbol earns the last point. */
const STRONG_LENGTH = 12

export const STRENGTH_COLORS: Record<1 | 2 | 3, string> = {
  1: '#ef4444',
  2: '#d97706',
  3: '#1ba770',
}

export const STRENGTH_TEXTS: Record<0 | 1 | 2 | 3, string> = {
  0: `Use ${MIN_PASSWORD_LENGTH}+ characters`,
  1: 'Weak password',
  2: 'Fair password',
  3: 'Strong password',
}

/**
 * 0–3, where 0 means the API would refuse it outright.
 *
 * +1 for reaching the minimum, +1 for mixing case with a digit, +1 for a
 * symbol at a comfortable length.
 */
export function scorePassword(value: string): 0 | 1 | 2 | 3 {
  if (value.length < MIN_PASSWORD_LENGTH) return 0
  let score = 1
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++
  if (value.length >= STRONG_LENGTH && /[^A-Za-z0-9]/.test(value)) score++
  return score as 1 | 2 | 3
}
