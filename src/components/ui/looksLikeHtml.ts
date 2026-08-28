/**
 * Whether a stored description is markup or the plain text the editor saved
 * before it kept formatting.
 *
 * Its own module rather than a second export from `RichText.tsx`: fast refresh
 * only works when a component file exports components.
 */

/** A tag the editor could have written. Bare `<` in prose is not one. */
export function looksLikeHtml(value: string): boolean {
  return /<(p|br|strong|em|u|s|blockquote|ol|ul|li|h[1-3]|a)\b[^>]*>/i.test(value)
}
