/** One option in a searchable picker, and the rule that narrows a list of them. */
export interface ComboOption {
  value: string
  label: string
  /** Extra text worth matching but not part of the label — a date, a code. */
  keywords?: string
}

/**
 * The options still worth offering once somebody has typed.
 *
 * Every whitespace-separated word has to appear somewhere in the label or the
 * keywords, in any order. Order-independence is the point: somebody typing what
 * they half-remember about a role or an event rarely types it in the stored
 * order, and a plain substring match answers "nothing matches" to a search that
 * plainly does.
 *
 * Nothing typed means nothing filtered — the full list, in the order it was
 * given, because that order carries meaning the search box does not know about.
 */
export function filterOptions<T extends ComboOption>(
  options: readonly T[],
  term: string,
): T[] {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...options]
  return options.filter((option) => {
    const haystack = `${option.label} ${option.keywords ?? ''}`.toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}
