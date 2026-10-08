import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Button, EventPicker, Hint, Icon, Input, Label, Panel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import type { ActionResult } from '@/app/loaders'
import type { EventOption } from '../tickets.routes'
import type { DiscountType } from '../types'

/**
 * Create or edit a promo code (US-TKT-07/08).
 *
 * "Generate" fills in a code the API suggested and has checked nobody is
 * already using — the page used to invent one from a word list and two random
 * digits, which could collide with a code already printed on a flyer.
 */

interface DiscountPanelProps {
  open: boolean
  onClose: () => void
  events: EventOption[]
  /** An unused code from the loader, offered by the Generate button. */
  suggestion: string
}

const FORM_ID = 'discount-form'
const MAX_PERCENT = 100
const ALL_EVENTS = 'All events'

export function DiscountPanel({ open, onClose, events, suggestion }: DiscountPanelProps) {
  const fetcher = useFetcher<ActionResult>()
  const [type, setType] = useState<DiscountType>('percent')
  const [code, setCode] = useState('')
  const [eventId, setEventId] = useState('')
  const saving = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  // Adjusted during render rather than in an effect: the panel should already
  // show an empty form on the paint that opens it, not fill in and then clear.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setType('percent')
      setCode('')
      setEventId('')
    }
  }

  useEffect(() => {
    if (!saved || !open) return
    toast.success('Discount code saved.')
    onClose()
  }, [saved, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="New discount code"
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
            {saving ? 'Saving…' : 'Save code'}
          </Button>
        </>
      }
    >
      <fetcher.Form id={FORM_ID} method="post" className="space-y-4">
        <input type="hidden" name="intent" value="create" />
        <input type="hidden" name="type" value={type} />

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="discount-code">Code</Label>
          <div className="flex items-center gap-2">
            <Input
              id="discount-code"
              name="code"
              type="text"
              required
              className="font-mono uppercase"
              placeholder="e.g. SUMMER25"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              variant="soft"
              size="sm"
              className="shrink-0"
              type="button"
              onClick={() => setCode(suggestion)}
            >
              <Icon name="hgi-refresh" size={14} />
              Generate
            </Button>
          </div>
        </div>

        <div>
          <Label>Type</Label>
          <div className="segmented w-full">
            <button
              type="button"
              className={cn('flex-1', type === 'percent' && 'active')}
              onClick={() => setType('percent')}
              aria-pressed={type === 'percent'}
            >
              Percent
            </button>
            <button
              type="button"
              className={cn('flex-1', type === 'fixed' && 'active')}
              onClick={() => setType('fixed')}
              aria-pressed={type === 'fixed'}
            >
              Fixed ฿
            </button>
          </div>
        </div>

        {type === 'percent' ? (
          <div>
            <Label htmlFor="discount-value">Percentage off</Label>
            <div className="relative">
              <Input
                id="discount-value"
                name="value"
                type="number"
                min={1}
                max={MAX_PERCENT}
                step={1}
                required
                className="pr-8"
                placeholder="25"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                %
              </span>
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="discount-value">Amount off</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                ฿
              </span>
              <Input
                id="discount-value"
                name="value"
                type="number"
                min={1}
                step={1}
                required
                className="pl-8"
                placeholder="200"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="discount-event">Applies to</Label>
          <EventPicker
            id="discount-event"
            name="eventId"
            value={eventId}
            onChange={setEventId}
            options={events}
            allLabel={ALL_EVENTS}
            allValue=""
            placeholder={ALL_EVENTS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="redemption-limit">Usage limit</Label>
            <Input
              id="redemption-limit"
              name="redemptionLimit"
              type="number"
              min={0}
              step={1}
              placeholder="500"
            />
            <Hint>0 means unlimited.</Hint>
          </div>
          <div>
            <Label htmlFor="per-person">Per-user limit</Label>
            <Input
              id="per-person"
              name="perPersonLimit"
              type="number"
              min={0}
              step={1}
              placeholder="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="valid-from">Start date</Label>
            <Input id="valid-from" name="validFrom" type="date" />
          </div>
          <div>
            <Label htmlFor="valid-until">End date</Label>
            <Input id="valid-until" name="validUntil" type="date" />
          </div>
        </div>
      </fetcher.Form>
    </Panel>
  )
}
