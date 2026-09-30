import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Button, EventPicker, Hint, Input, Label, Panel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import type { ActionResult } from '@/app/loaders'
import type { EventOption } from '../tickets.routes'
import type { TicketDraft } from '../tickets.types'

/**
 * Create or edit a ticket type (US-TKT-01/02).
 *
 * The form carries only the fields `POST /events/:id/tickets` accepts. The
 * kit's "Description" and "Transferable" controls are not among them, and a
 * control that silently changes nothing is worse than one that is absent.
 */

interface TicketPanelProps {
  open: boolean
  onClose: () => void
  /** The tier being edited, as the form holds it, or null for a new one. */
  editing: TicketDraft | null
  events: EventOption[]
}

/** One order may hold at most this many seats — the API's own ceiling. */
const MAX_PER_ORDER = 8
const FORM_ID = 'ticket-form'

export function TicketPanel({ open, onClose, editing, events }: TicketPanelProps) {
  const [isFree, setIsFree] = useState(false)
  const [eventId, setEventId] = useState('')
  const [price, setPrice] = useState('')

  // Everything the panel holds is re-read from `editing` each time it opens, so
  // a previous edit's answers are not inherited by the next one. Adjusted during
  // render rather than in an effect, so the fields are already right on the paint
  // that opens the panel instead of correcting themselves afterwards.
  //
  // The counter rebuilds the form's DOM on every open. `defaultValue` alone is
  // not enough: the browser marks a field the organizer has typed into as dirty
  // and from then on ignores the attribute, so the next tier would open showing
  // its own values in the untouched boxes and the previous tier's typing in the
  // rest. Keying on the tier's id instead would leave that typing in place when
  // the same tier is opened, cancelled and opened again.
  const [wasOpen, setWasOpen] = useState(open)
  const [session, setSession] = useState(0)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setIsFree(editing?.isFree ?? false)
      setEventId(editing?.eventId ?? '')
      setPrice(editing ? String(editing.price) : '')
      setSession((n) => n + 1)
    }
  }

  // Keyed by the same counter, so each opening starts on an empty fetcher. The
  // panel stays mounted while closed and an unkeyed one would still be holding
  // the last save: its `ok` would close the next tier's panel the instant it
  // opened, and its refusal would greet a tier that was never refused.
  const fetcher = useFetcher<ActionResult>({ key: `ticket-panel-${session}` })
  const saving = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  // The save succeeded and the loader has already revalidated; close.
  useEffect(() => {
    if (!saved || !open) return
    toast.success('Ticket type saved.')
    onClose()
  }, [saved, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={editing ? 'Edit ticket type' : 'New ticket type'}
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
            {saving ? 'Saving…' : 'Save ticket type'}
          </Button>
        </>
      }
    >
      <fetcher.Form key={session} id={FORM_ID} method="post" className="space-y-4">
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        <input type="hidden" name="type" value={isFree ? 'free' : 'paid'} />
        {editing && <input type="hidden" name="ticketId" value={editing.id} />}
        {/* Sent on update only; a create has nothing to be concurrent with, and
            the API refuses a version on one. Without this the token never left
            the browser and every edit was an unguarded last-write-wins. */}
        {editing && <input type="hidden" name="version" value={editing.version} />}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="ticket-name">Ticket name</Label>
          <Input
            id="ticket-name"
            name="name"
            type="text"
            required
            maxLength={60}
            defaultValue={editing?.name ?? ''}
            placeholder="e.g. VIP Access"
          />
        </div>

        <div>
          <Label htmlFor="ticket-event">Event</Label>
          <EventPicker
            id="ticket-event"
            name="eventId"
            value={eventId}
            onChange={setEventId}
            options={events}
            allLabel={false}
            placeholder="Choose an event"
            disabled={Boolean(editing)}
          />
          {editing && <Hint>A tier belongs to its event and cannot be moved.</Hint>}
        </div>

        <div>
          <Label>Type</Label>
          <div className="segmented w-full">
            <button
              type="button"
              className={cn('flex-1', !isFree && 'active')}
              onClick={() => setIsFree(false)}
              aria-pressed={!isFree}
            >
              Paid
            </button>
            <button
              type="button"
              className={cn('flex-1', isFree && 'active')}
              onClick={() => setIsFree(true)}
              aria-pressed={isFree}
            >
              Free
            </button>
          </div>
        </div>

        {!isFree && (
          <div>
            <Label htmlFor="ticket-price">Price (฿)</Label>
            {/* Whole baht, which is the API's own rule — it refuses a price
                with stray satang on create and on update alike. Stepping by 1
                says so inline, before a round trip spends itself on a 400.

                Held in state rather than by `defaultValue`, because the box is
                unmounted while Free is selected: a value the attribute restored
                on the way back from Free would be the stored price, quietly
                replacing whatever the organizer had typed. */}
            <Input
              id="ticket-price"
              name="price"
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1250"
            />
            <Hint>VAT-inclusive, as the attendee pays it.</Hint>
          </div>
        )}

        <div>
          <Label htmlFor="ticket-total">Quantity available</Label>
          <Input
            id="ticket-total"
            name="total"
            type="number"
            min={0}
            step={1}
            defaultValue={editing?.total ?? ''}
            placeholder="250"
          />
          <Hint>0 means unlimited.</Hint>
        </div>

        {/* The instant behind each box travels with it, hidden, so a save that
            touched neither returns the window exactly as it stood — a date box
            shows a day, and a window set to any other time of day would
            otherwise be dragged back to Bangkok midnight. A box that opened
            with a date is `required`: an emptied one submits no key, which the
            API reads as "unchanged", so allowing it would look like removing a
            window the tier silently kept. */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sales-start">Sales start</Label>
              <Input
                id="sales-start"
                name="salesStartAt"
                type="date"
                required={Boolean(editing?.salesStartAt)}
                defaultValue={editing?.salesStartDay ?? ''}
              />
              <input type="hidden" name="salesStartWas" value={editing?.salesStartAt ?? ''} />
            </div>
            <div>
              <Label htmlFor="sales-end">Sales end</Label>
              <Input
                id="sales-end"
                name="salesEndAt"
                type="date"
                required={Boolean(editing?.salesEndAt)}
                defaultValue={editing?.salesEndDay ?? ''}
              />
              <input type="hidden" name="salesEndWas" value={editing?.salesEndAt ?? ''} />
            </div>
          </div>
          {hasWindow(editing) && <Hint>A sales window can be moved here, but not removed.</Hint>}
        </div>

        {/* Prefilled from the tier's own setting, now that `TicketInventoryDto`
            projects `maxPerOrder`. It has to be: the box is no longer blank on
            open, so leaving it unprefilled would show the organizer a limit of
            4 for a tier set to 2 and save that guess the moment they touched
            anything else. */}
        <div>
          <Label htmlFor="per-order">Per-order limit</Label>
          <Input
            id="per-order"
            name="maxPerOrder"
            type="number"
            min={1}
            max={MAX_PER_ORDER}
            step={1}
            defaultValue={editing?.maxPerOrder ?? ''}
            placeholder="4"
          />
          <Hint>Maximum tickets a single order can include (up to {MAX_PER_ORDER}).</Hint>
        </div>
      </fetcher.Form>
    </Panel>
  )
}

/** A tier opened with a window, so at least one date box cannot be emptied. */
function hasWindow(editing: TicketDraft | null): boolean {
  return Boolean(editing?.salesStartAt || editing?.salesEndAt)
}
