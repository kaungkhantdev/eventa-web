import type {
  ContactDraft,
  ContactField,
  ContactPatch,
  StoredContact,
} from './directory.types'

/**
 * What a contact save actually asks the API to change (US-REG-08).
 *
 * `PATCH /attendees/:attendeeId` takes only the fields that are moving, and
 * this is what decides which those are. It is a diff rather than the three
 * boxes posted as they stand because posting an untouched box back would write
 * a stale value over whatever somebody else corrected in the meantime, and the
 * API — which cannot tell a retyped value from an untouched one — would record
 * it as an edit.
 *
 * The version it was read at goes with it. The diff alone leaves any field two
 * organizers edit at once as last-write-wins: both read the same value, both
 * type a correction, and the second save replaces the first with nobody told.
 * Sent back, the API answers 409 and the panel shows "this attendee changed
 * while you had the form open" instead.
 */
export function contactPatchOf(draft: ContactDraft, stored: StoredContact): ContactPatch {
  const patch: ContactPatch = {}
  const name = draft.name.trim()
  const email = draft.email.trim()
  // An emptied box is "clear it", which the API spells as an empty string. A
  // stored `null` and a stored `''` are the same absence, so both compare equal
  // to an empty box and neither is sent.
  const phone = draft.phone.trim()

  if (name !== stored.name) patch.name = name
  // Compared as typed, not case-insensitively: `attendees.email` is `citext`,
  // so the API treats these as one address but stores what it is given, and
  // fixing the capitalisation is a change the organizer means.
  if (email !== stored.email) patch.email = email
  if (phone !== (stored.phone ?? '')) patch.phone = phone

  // Only alongside a change: `hasContactChanges` counts the keys to decide
  // whether to send anything at all, so a version on its own would turn a
  // form saved untouched into a request the API answers 400. And only when
  // there is one — `version` is optional on the API, so a row that did not
  // carry one saves exactly as it did before this guard existed, rather than
  // being refused for a field the organizer cannot see.
  const version = sendableVersion(stored.version)
  if (Object.keys(patch).length > 0 && version !== null) patch.version = version

  return patch
}

/**
 * Whether there is anything to send.
 *
 * An empty body is answered 400 ("Send a name, email or phone number to
 * change."), so a form saved untouched must not become a request at all — the
 * organizer would be shown a refusal for having done nothing wrong.
 */
export function hasContactChanges(patch: ContactPatch): boolean {
  return Object.keys(patch).length > 0
}

/**
 * The hidden twin of each box, carrying what the row said when the panel
 * opened.
 *
 * Derived rather than spelled out at both ends: the panel writes these names
 * and the action reads them back, and a mismatch would be silent — the stored
 * value would arrive as `''`, so an untouched box would look edited and get
 * posted over whatever is there now.
 */
export function storedInput(field: ContactField): string {
  return `stored-${field}`
}

/**
 * The hidden input carrying the row's version, named here so the panel that
 * writes it and the action that reads it cannot drift apart — the same reason
 * `storedInput` exists.
 */
export const VERSION_INPUT = 'stored-version'

/** The panel's submitted form, as the change it is asking for. */
export function contactPatchOfForm(form: FormData): ContactPatch {
  return contactPatchOf(draftOf(form), storedOf(form))
}

function draftOf(form: FormData): ContactDraft {
  return {
    name: text(form, 'name'),
    email: text(form, 'email'),
    phone: text(form, 'phone'),
  }
}

function storedOf(form: FormData): StoredContact {
  return {
    name: text(form, storedInput('name')),
    email: text(form, storedInput('email')),
    phone: text(form, storedInput('phone')),
    version: versionOf(form),
  }
}

function text(form: FormData, field: string): string {
  return String(form.get(field) ?? '')
}

/**
 * A version worth sending, or `null`.
 *
 * One rule, applied both where the form is read and where the patch is built,
 * because either boundary alone leaves the other able to send a value the API
 * refuses. Anything that is not a whole number above zero is no version: the
 * API's `@Min(1)` answers 400 for it, and a refusal is the wrong answer to
 * "this row did not tell us which version it was".
 */
function sendableVersion(version: number | null): number | null {
  return version !== null && Number.isInteger(version) && version > 0
    ? version
    : null
}

/** The hidden version, or `null` when the panel had none to write. */
function versionOf(form: FormData): number | null {
  // `Number('')` is 0 and `Number('x')` is NaN; both fall through the rule.
  return sendableVersion(Number(text(form, VERSION_INPUT)))
}
