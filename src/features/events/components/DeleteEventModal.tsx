import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { toast } from '@/lib/toast'
import { ConfirmDeleteModal } from '@/features/ticketing/components/ConfirmDeleteModal'
import type { EventRow } from '../types'

/**
 * Deleting an event from the list (US-EVT-08).
 *
 * Nothing is deleted until Delete here is pressed — the row menu only opens
 * this. The API still decides: a published event, or one with registrations or
 * payments, is refused with a sentence written for the organizer, shown in
 * place of the warning.
 */
export function DeleteEventModal({
  row,
  open,
  onClose,
}: {
  /** Kept after closing, so the dialog still reads correctly as it fades out. */
  row: EventRow | null
  open: boolean
  onClose: () => void
}) {
  // Keyed by event, so one event's refusal never greets the next.
  const fetcher = useFetcher<ActionResult>({ key: `delete-event-${row?.id ?? ''}` })
  const refused = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Event deleted.')
    onClose()
  }, [done, open, onClose])

  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      title={`Delete ${row?.name ?? 'this event'}?`}
      message={refused ?? 'This permanently removes the draft and can’t be undone.'}
      tone={refused ? 'error' : 'default'}
      confirmLabel={fetcher.state === 'idle' ? 'Delete' : 'Deleting…'}
      onConfirm={() =>
        row &&
        fetcher.submit(
          { intent: 'delete', id: row.id, version: String(row.version), confirm: 'true' },
          { method: 'post' },
        )
      }
    />
  )
}
