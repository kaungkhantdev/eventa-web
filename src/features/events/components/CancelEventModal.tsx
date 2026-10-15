import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { Button, Hint, Label, Modal, Textarea } from '@/components/ui'
import { toast } from '@/lib/toast'
import { CANCELLED_MESSAGE, CANCEL_REASON_MAX, cancelReasonGiven } from '../events.presentation'
import type { EventDialog } from '../types'

/**
 * Cancelling an event that cannot be deleted (US-EVT-08).
 *
 * A reason is required — it is what the attendees are told — and nothing
 * happens until Cancel event is pressed. Built from the kit's Modal, which has
 * no markup for this; a refusal from the API is shown above the field, verbatim.
 */
export function CancelEventModal({
  dialog,
  onClose,
}: {
  dialog: EventDialog
  onClose: () => void
}) {
  const { row, open, attempt } = dialog
  // Keyed per opening, so an earlier refusal never greets the next one.
  const fetcher = useFetcher<ActionResult>({ key: `cancel-event-${attempt}` })
  const [reason, setReason] = useState('')
  // A new opening starts with an empty reason, not the last event's.
  const [seen, setSeen] = useState(attempt)
  if (seen !== attempt) {
    setSeen(attempt)
    setReason('')
  }
  const refused = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true
  const busy = fetcher.state !== 'idle'

  useEffect(() => {
    if (!done || !open) return
    toast.success(CANCELLED_MESSAGE)
    onClose()
  }, [done, open, onClose])

  const cancelEvent = () =>
    row &&
    fetcher.submit(
      { intent: 'cancel', id: row.id, version: String(row.version), reason },
      { method: 'post' },
    )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cancel ${row?.name ?? 'this event'}?`}
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Keep event
          </Button>
          <Button
            variant="danger"
            disabled={busy || !cancelReasonGiven(reason)}
            onClick={cancelEvent}
          >
            {busy ? 'Cancelling…' : 'Cancel event'}
          </Button>
        </>
      }
    >
      <p>
        Registrations close and the event moves out of your active list. This can&apos;t be undone.
      </p>
      {refused && (
        <p role="alert" className="mt-3 text-red-500">
          {refused}
        </p>
      )}
      <div className="mt-3">
        <Label htmlFor="cancel-reason">Reason</Label>
        <Textarea
          id="cancel-reason"
          rows={3}
          required
          maxLength={CANCEL_REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. The venue is no longer available"
        />
        <Hint>Required. Attendees are shown this reason.</Hint>
      </div>
    </Modal>
  )
}
