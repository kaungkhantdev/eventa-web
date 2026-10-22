import { DIGIT, MIN_PASSWORD_LENGTH, STRONG_LENGTH, SYMBOL } from '@/lib/constants/auth.constants'
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
 * 0–3, where 0 means the API would refuse it outright.
 *
 * +1 for meeting the rule (the minimum length, a number and a symbol), +1 for
 * mixing case with that digit, +1 for a comfortable length.
 */
export function scorePassword(value: string): 0 | 1 | 2 | 3 {
  if (!meetsPasswordRule(value)) return 0
  let score = 1
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++
  if (value.length >= STRONG_LENGTH) score++
  return score as 1 | 2 | 3
}

function meetsPasswordRule(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH && DIGIT.test(value) && SYMBOL.test(value)
}
