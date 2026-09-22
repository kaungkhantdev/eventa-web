import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import { Button, FieldError, Hint, Input, Label, Modal } from '@/components/ui'
import { toast } from '@/lib/toast'
import type { AnnouncementRow } from '../announcements.mapper'
import { unattachedError } from '../refusal'
import type { RowDialog } from '../useRowDialog'

const FORM_ID = 'reschedule-announcement'

/**
 * Moving a scheduled announcement to another time (US-MSG-05).
 *
 * The kit has no markup for this — it only ever showed a Scheduled badge — so
 * it is built from the kit's own primitives: the Modal, and the same date
 * field the composer schedules with.
 *
 * It stays open on a refusal: a time too soon is answered under the field, and
 * "it has already started sending" at the top, in the API's own words.
 */
export function RescheduleModal({ dialog }: { dialog: RowDialog<AnnouncementRow> }) {
  const { row, open, session, hide } = dialog
  // Keyed per opening, so a previous attempt's refusal or success never
  // belongs to the announcement now on screen.
  const move = useFetcher<ActionResult>({ key: `announcement-reschedule-${session}` })
  const refused = move.data?.ok === false ? move.data : null
  const banner = unattachedError(refused)
  const done = move.state === 'idle' && move.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Announcement rescheduled.')
    hide()
  }, [done, open, hide])

  return (
    <Modal
      open={open}
      onClose={hide}
      title="Move this announcement?"
      footer={
        <>
          <Button variant="soft" onClick={hide}>
            Keep the time
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={move.state !== 'idle'}>
            Save time
          </Button>
        </>
      }
    >
      {banner && (
        <p role="alert" className="mb-3 text-[13px] text-red-500">
          {banner}
        </p>
      )}
      <move.Form id={FORM_ID} method="post">
        <input type="hidden" name="intent" value="reschedule" />
        <input type="hidden" name="id" value={row?.id ?? ''} />
        <Label htmlFor="reschedule-send-at">Send date &amp; time</Label>
        <Input
          id="reschedule-send-at"
          // Remounted per opening, so it starts on the time this row now has.
          key={session}
          type="datetime-local"
          name="sendAt"
          defaultValue={row?.sendAtInput ?? ''}
          aria-describedby={
            refused?.fieldErrors?.sendAt ? 'reschedule-send-at-error' : 'reschedule-send-at-hint'
          }
        />
        <FieldError id="reschedule-send-at-error" message={refused?.fieldErrors?.sendAt} />
        <Hint id="reschedule-send-at-hint">
          Bangkok time. It currently goes out {row?.when ?? ''}; its audience is whoever is
          registered when it does.
        </Hint>
      </move.Form>
    </Modal>
  )
}
