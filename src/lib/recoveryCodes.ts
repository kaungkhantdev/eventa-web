/**
 * The recovery codes as text, shared by both personas.
 *
 * In `@/lib` rather than a feature because the organizer console enrols a
 * second factor over the same route the attendee portal does, and the codes
 * are shown exactly once in both.
 */
/**
 * The codes as a file somebody can actually keep (criterion 5).
 *
 * Shown once and never again, so "read them off the screen" is not a plan: the
 * modal offers this text to copy and to save. It names the account because a
 * file of ten unlabelled strings in a downloads folder is unusable a year
 * later, and it says what they are for — each code signs in once, in place of
 * the authenticator.
 */
export function recoveryCodesText(codes: readonly string[], email: string): string {
  return [
    'Eventa recovery codes',
    `Account: ${email}`,
    'Each code signs you in once if you lose your authenticator. Keep them somewhere safe.',
    '',
    ...codes,
    '',
  ].join('\n')
}
