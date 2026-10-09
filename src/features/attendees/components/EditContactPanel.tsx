import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Button, FieldError, Hint, Input, Label, Panel } from '@/components/ui'
import type { ActionResult } from '@/app/loaders'
import { toast } from '@/lib/toast'
import { storedInput } from '../contact.changes'
import { contactRefusalOf, type ContactRefusal } from '../contact.refusal'
import { CONTACT_INTENT } from '../directory.routes'
import type { AttendeeRow } from '../directory.types'

/**
 * Correcting an attendee's contact details (US-REG-08).
 *
 * The kit draws no form for this — `attendees.html` has an "Edit" button in the
 * profile panel's footer and nothing behind it — so the panel is composed from
 * the kit's own pieces: the slide-over, the three-field layout its invite panel
 * uses, and the Cancel/primary footer pair. Shaped after the roles editor,
 * which is this console's other server-written form.
 *
 * It holds no copy of the row. What was typed is submitted beside what the row
 * said when the panel opened, the route action sends only the difference, and
 * the fetcher revalidates the directory afterwards — so the row and the segment
 * counts are re-read rather than patched by hand.
 */

const FORM_ID = 'attendee-contact-form'

/** The DTO's own limits — past them the API answers 400 (`@MaxLength`). */
const MAX_NAME = 120
const MAX_EMAIL = 254
const MAX_PHONE = 24

export function EditContactPanel({
  row,
  open,
  onClose,
}: {
  /** Kept while the panel closes, so it still reads correctly as it slides out. */
  row: AttendeeRow | null
  open: boolean
  onClose: () => void
}) {
  const session = useOpenings(open)
  // Keyed per opening: the fetcher outlives the close, and an unkeyed one would
  // still be holding the last save — closing the next attendee's panel on its
  // `ok` before a box could be read, and showing one person's refusal over
  // another person's details.
  const fetcher = useFetcher<ActionResult>({ key: `attendee-contact-${session}` })
  const refusal = contactRefusalOf(fetcher.data)
  const saving = fetcher.state !== 'idle'
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!saved || !open) return
    toast.success('Contact details updated.')
    onClose()
  }, [saved, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Edit contact details"
      subtitle={row?.name}
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            form={FORM_ID}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      {/* Keyed so every opening re-seeds the boxes from the row on screen —
          they are form state, and form state does not reset on its own. */}
      <ContactForm key={session} Form={fetcher.Form} row={row} refusal={refusal} />
    </Panel>
  )
}

/**
 * How many times the panel has been opened.
 *
 * Counted per open rather than per attendee, because the panel's element stays
 * mounted while closed: keying on the row's id alone would hold on to an
 * abandoned edit, so typing, cancelling and reopening the same person would
 * show what was given up on rather than what is stored.
 */
function useOpenings(open: boolean): number {
  const [wasOpen, setWasOpen] = useState(open)
  const [openings, setOpenings] = useState(0)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setOpenings((n) => n + 1)
  }
  return openings
}

function ContactForm({
  Form,
  row,
  refusal,
}: {
  Form: ReturnType<typeof useFetcher<ActionResult>>['Form']
  row: AttendeeRow | null
  refusal: ContactRefusal
}) {
  const stored = row?.contact
  return (
    // `noValidate` on purpose: the API decides what counts as a name and an
    // address, and its refusals land under the box with `role="alert"` (AC4).
    // The browser's own bubble is neither inline nor announced, and blocking
    // the submit would mean a blank name never gets the API's own sentence.
    // `required` stays, for what it tells a screen reader.
    <Form id={FORM_ID} method="post" className="space-y-4" noValidate>
      <div hidden>
        <input type="hidden" name="intent" value={CONTACT_INTENT} />
        <input type="hidden" name="attendeeId" value={row?.id ?? ''} />
        {/* What the row said when this opened. Only the difference is sent, so
            a detail somebody else corrects meanwhile is not overwritten. */}
        <input type="hidden" name={storedInput('name')} value={stored?.name ?? ''} />
        <input type="hidden" name={storedInput('email')} value={stored?.email ?? ''} />
        <input type="hidden" name={storedInput('phone')} value={stored?.phone ?? ''} />
      </div>

      {/* A refusal with no box to belong to — the merge prompt (AC3), a row
          somebody else changed, a permission the API refused, a dropped
          connection. Shown in the API's own words: it wrote them for the
          organizer, and the remedy is in the sentence. */}
      {refusal.banner && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
        >
          {refusal.banner}
        </p>
      )}

      <div>
        <Label htmlFor="attendee-name">Full name</Label>
        <Input
          id="attendee-name"
          name="name"
          type="text"
          required
          maxLength={MAX_NAME}
          defaultValue={stored?.name ?? ''}
          placeholder="e.g. Somchai Tanakit"
          aria-describedby={refusal.fields.name ? 'attendee-name-error' : undefined}
        />
        <FieldError id="attendee-name-error" message={refusal.fields.name} />
      </div>

      <div>
        <Label htmlFor="attendee-email">Email address</Label>
        <Input
          id="attendee-email"
          name="email"
          type="email"
          required
          maxLength={MAX_EMAIL}
          defaultValue={stored?.email ?? ''}
          placeholder="name@example.com"
          aria-describedby={
            refusal.fields.email ? 'attendee-email-error' : 'attendee-email-hint'
          }
        />
        <FieldError id="attendee-email-error" message={refusal.fields.email} />
        <Hint id="attendee-email-hint">
          Where their tickets and confirmations are sent. An address another attendee already
          holds is refused rather than taken.
        </Hint>
      </div>

      <div>
        <Label htmlFor="attendee-phone">Phone number</Label>
        <Input
          id="attendee-phone"
          name="phone"
          type="tel"
          maxLength={MAX_PHONE}
          defaultValue={stored?.phone ?? ''}
          placeholder="+66 81 234 5678"
          aria-describedby={
            refusal.fields.phone ? 'attendee-phone-error' : 'attendee-phone-hint'
          }
        />
        <FieldError id="attendee-phone-error" message={refusal.fields.phone} />
        <Hint id="attendee-phone-hint">
          Reminders and SMS go to this number from now on. Leave it empty to remove it.
        </Hint>
      </div>
    </Form>
  )
}
