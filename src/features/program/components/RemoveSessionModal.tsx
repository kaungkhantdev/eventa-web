import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { toast } from '@/lib/toast'
import { ConfirmDeleteModal } from '@/features/ticketing/components/ConfirmDeleteModal'
import { SESSION_REMOVAL_WARNING } from '../program.presentation'

/**
 * Removing a session (US-PROG-04), from the agenda or the event workspace.
 *
 * The warning comes first, and only Remove here posts the confirmation the API
 * requires — cancelling posts nothing. Each page's action names the removal
 * differently, so the page passes the fields its own action reads.
 */
export function RemoveSessionModal({
  sessionId,
  onClose,
  fields,
}: {
  /** The session being removed, or null while none is. */
  sessionId: string | null
  onClose: () => void
  /** What the page's action needs besides the session and the confirmation. */
  fields: Record<string, string>
}) {
  // Keyed by session, so one session's refusal never greets the next.
  const fetcher = useFetcher<ActionResult>({ key: `remove-session-${sessionId ?? ''}` })
  const refused = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true
  const open = sessionId !== null

  useEffect(() => {
    if (!done || !open) return
    toast.success('Session removed.')
    onClose()
  }, [done, open, onClose])

  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      title="Remove session?"
      message={refused ?? SESSION_REMOVAL_WARNING}
      tone={refused ? 'error' : 'default'}
      confirmLabel={fetcher.state === 'idle' ? 'Remove' : 'Removing…'}
      onConfirm={() =>
        sessionId &&
        fetcher.submit({ ...fields, sessionId, confirm: 'true' }, { method: 'post' })
      }
    />
  )
}
