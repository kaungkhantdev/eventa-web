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
 * boxes posted as they stand for one reason: `GET /attendees` carries no
 * `version`, so the panel cannot tell the API which row it was opened on.
 * Posting an untouched box back would write a stale value over whatever
 * somebody else corrected in the meantime, and the API — which cannot tell a
 * retyped value from an untouched one — would record it as an edit.
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
  }
}

function text(form: FormData, field: string): string {
  return String(form.get(field) ?? '')
}
