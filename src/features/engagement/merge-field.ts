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

/** The part of an `<input>` or `<textarea>` that says where its caret is. */
export interface Caret {
  selectionStart: number | null
  selectionEnd: number | null
}

/**
 * {@link insertAt} at a field's cursor, but only one the organizer put there.
 * A field nobody has focused still reports a caret (0 in Chromium, for a
 * textarea that opens with wording in it), and honouring that would put the
 * field before the first word, so until a field is focused it goes at the end.
 */
export function insertAtCursor(
  text: string,
  tag: string,
  field: Caret | null,
  focused: boolean,
): Inserted {
  const cursor = focused ? field : null
  return insertAt(text, tag, cursor?.selectionStart ?? null, cursor?.selectionEnd ?? null)
}

function within(text: string, index: number): number {
  return Math.min(Math.max(index, 0), text.length)
}
