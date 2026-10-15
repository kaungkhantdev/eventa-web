export interface Inserted {
  text: string
  /** Where the caret belongs afterwards: just after the inserted field. */
  caret: number
}

/**
 * Place a merge field where the cursor was (US-MSG-02), replacing any selected
 * text. `start`/`end` are the field's `selectionStart`/`selectionEnd`; with
 * neither to read, the field goes at the end.
 */
export function insertAt(
  text: string,
  tag: string,
  start: number | null,
  end: number | null,
): Inserted {
  const from = within(text, start ?? text.length)
  const to = Math.max(from, within(text, end ?? from))
  return { text: text.slice(0, from) + tag + text.slice(to), caret: from + tag.length }
}

function within(text: string, index: number): number {
  return Math.min(Math.max(index, 0), text.length)
}
