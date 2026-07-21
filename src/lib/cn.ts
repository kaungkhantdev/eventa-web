/** Join class names, dropping falsy values. Deliberately tiny — the kit never
 *  needs Tailwind class-conflict resolution because variants are explicit. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
