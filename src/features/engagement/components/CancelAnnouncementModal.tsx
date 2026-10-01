import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { Button, Icon, Modal } from '@/components/ui'
import { toast } from '@/lib/toast'
import type { AnnouncementRow } from '../announcements.mapper'
import type { RowDialog } from '../useRowDialog'

/**
 * Calling off an announcement before it goes (US-MSG-05).
 *
 * Built from the kit's Modal, which has no markup for this. The refusal takes
 * the place of the warning when there is one — "it has already started
 * sending" is the answer to the question, not an error beside it.
 */
export function CancelAnnouncementModal({ dialog }: { dialog: RowDialog<AnnouncementRow> }) {
  const { row, open, session, hide } = dialog
  // Keyed per opening: the last refusal belongs to the row it was about.
  const call = useFetcher<ActionResult>({ key: `announcement-cancel-${session}` })
  const refused = call.data?.ok === false ? call.data.error : null
  const done = call.state === 'idle' && call.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Announcement cancelled.')
    hide()
  }, [done, open, hide])

  return (
    <Modal
      open={open}
      onClose={hide}
      title="Cancel this announcement?"
      footer={
        <>
          <Button variant="soft" onClick={hide}>
            Keep it scheduled
          </Button>
          <Button
            variant="danger"
            disabled={call.state !== 'idle'}
            onClick={() => row && call.submit({ intent: 'cancel', id: row.id }, { method: 'post' })}
          >
            Cancel it
          </Button>
        </>
      }
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
        <Icon name="hgi-alert-01" size={18} />
      </span>
      <p className={refused ? 'mt-3 text-red-500' : 'mt-3'} role={refused ? 'alert' : undefined}>
        {refused ??
          `“${row?.subject ?? ''}” will not be sent ${row?.when ?? ''}. Nobody is emailed, and it stays in the history as cancelled.`}
      </p>
    </Modal>
  )
}
