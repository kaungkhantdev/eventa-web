/* Password-strength scoring, ported verbatim from auth/register.html's inline
   script. `score` is 0–3; 0 means "empty / too short". The colour and label
   maps are keyed by that score. */

export const STRENGTH_COLORS: Record<1 | 2 | 3, string> = {
  1: '#ef4444',
  2: '#d97706',
  3: '#1ba770',
}

export const STRENGTH_TEXTS: Record<0 | 1 | 2 | 3, string> = {
  0: 'Use 8+ characters',
  1: 'Weak password',
  2: 'Fair password',
  3: 'Strong password',
}

/** Mirrors the source scoring: +1 for length ≥ 8, +1 for an uppercase letter
 *  and a digit, +1 for length ≥ 10 with a symbol. Empty string scores 0. */
export function scorePassword(value: string): 0 | 1 | 2 | 3 {
  if (value.length === 0) return 0
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++
  if (value.length >= 10 && /[^A-Za-z0-9]/.test(value)) score++
  return score as 0 | 1 | 2 | 3
}
