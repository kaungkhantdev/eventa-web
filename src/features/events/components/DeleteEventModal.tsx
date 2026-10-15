import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { toast } from '@/lib/toast'
import { ConfirmDeleteModal } from '@/features/ticketing/components/ConfirmDeleteModal'
import { offersCancel } from '../events.presentation'
import type { EventDialog } from '../types'

/**
 * Deleting an event from the list (US-EVT-08).
 *
 * Nothing is deleted until Delete here is pressed — the row menu only opens
 * this. The API still decides: a published event, or one with registrations or
 * payments, is refused with a sentence written for the organizer, shown in
 * place of the warning, and Cancel is offered in its stead.
 */
export function DeleteEventModal({
  dialog,
  onClose,
  onCancelInstead,
}: {
  dialog: EventDialog
  onClose: () => void
  /** Offered when the API refuses the delete and says to cancel instead. */
  onCancelInstead: () => void
}) {
  const { row, open, attempt } = dialog
  // Keyed per opening, so an earlier refusal never greets the next one.
  const fetcher = useFetcher<ActionResult>({ key: `delete-event-${attempt}` })
  const refused = fetcher.data?.ok === false ? (fetcher.data.error ?? null) : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Event deleted.')
    onClose()
  }, [done, open, onClose])

  const deleteEvent = () =>
    row &&
    fetcher.submit(
      { intent: 'delete', id: row.id, version: String(row.version), confirm: 'true' },
      { method: 'post' },
    )

  // Once the API has said to cancel instead, pressing Delete again would only
  // be refused again — the button becomes the offer it made.
  if (row && offersCancel(refused)) {
    return (
      <ConfirmDeleteModal
        open={open}
        onClose={onClose}
        title={`Delete ${row.name}?`}
        message={refused}
        tone="error"
        confirmLabel="Cancel event instead"
        onConfirm={onCancelInstead}
      />
    )
  }

  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      title={`Delete ${row?.name ?? 'this event'}?`}
      message={refused ?? 'This permanently removes the draft and can’t be undone.'}
      tone={refused ? 'error' : 'default'}
      confirmLabel={fetcher.state === 'idle' ? 'Delete' : 'Deleting…'}
      onConfirm={deleteEvent}
    />
  )
}
