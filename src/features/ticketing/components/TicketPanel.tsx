import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Button, Hint, Input, Label, Panel, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import type { ActionResult } from '@/app/loaders'
import type { EventOption } from '../tickets.routes'
import type { TicketCard } from '../tickets.types'

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
  /** The tier being edited, or null for a new one. */
  editing: TicketCard | null
  events: EventOption[]
}

/** One order may hold at most this many seats — the API's own ceiling. */
const MAX_PER_ORDER = 8
const FORM_ID = 'ticket-form'

export function TicketPanel({ open, onClose, editing, events }: TicketPanelProps) {
  const fetcher = useFetcher<ActionResult>()
  const [isFree, setIsFree] = useState(false)
  const saving = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  // Reset the paid/free choice to whatever is being edited each time it opens,
  // so a previous edit's answer is not inherited by the next one. Adjusted
  // during render rather than in an effect, so the toggle is already right on
  // the paint that opens the panel instead of correcting itself afterwards.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setIsFree(editing?.isFree ?? false)
  }

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
      <fetcher.Form id={FORM_ID} method="post" className="space-y-4">
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        <input type="hidden" name="type" value={isFree ? 'free' : 'paid'} />
        {editing && <input type="hidden" name="ticketId" value={editing.id} />}

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
          <Select
            id="ticket-event"
            name="eventId"
            required
            defaultValue={editing?.eventId ?? ''}
            disabled={Boolean(editing)}
          >
            <option value="" disabled>
              Choose an event
            </option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
          {editing && (
            <>
              <Hint>A tier belongs to its event and cannot be moved.</Hint>
              {/* A disabled select is not submitted, so the id travels beside it. */}
              <input type="hidden" name="eventId" value={editing.eventId} />
            </>
          )}
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
            <Input
              id="ticket-price"
              name="price"
              type="number"
              min={0}
              step={1}
              placeholder="1250"
            />
            <Hint>VAT-inclusive, as the attendee pays it.</Hint>
          </div>
        )}

        <div>
          <Label htmlFor="ticket-total">Quantity available</Label>
          <Input id="ticket-total" name="total" type="number" min={0} step={1} placeholder="250" />
          <Hint>0 means unlimited.</Hint>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sales-start">Sales start</Label>
            <Input id="sales-start" name="salesStartAt" type="date" />
          </div>
          <div>
            <Label htmlFor="sales-end">Sales end</Label>
            <Input id="sales-end" name="salesEndAt" type="date" />
          </div>
        </div>

        <div>
          <Label htmlFor="per-order">Per-order limit</Label>
          <Input
            id="per-order"
            name="maxPerOrder"
            type="number"
            min={1}
            max={MAX_PER_ORDER}
            step={1}
            placeholder="4"
          />
          <Hint>Maximum tickets a single order can include (up to {MAX_PER_ORDER}).</Hint>
        </div>
      </fetcher.Form>
    </Panel>
  )
}
