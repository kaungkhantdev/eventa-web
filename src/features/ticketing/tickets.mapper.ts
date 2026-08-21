import type { BadgeTone } from '@/components/ui'
import { baht, num } from '@/lib/format'
import { hashIndex } from '@/lib/palette'
import type { TicketCard, TicketWire } from './tickets.types'
import type { TicketStatus } from './types'

/** The rules behind the ticket inventory (US-TKT-03/04). */

const SATANG_PER_BAHT = 100
const FULL = 100
const FREE = 'Free'

/** Badge tone, icon and wording per status — the kit's own map. */
const STATUS_META: Record<TicketStatus, { tone: BadgeTone; icon: string; label: string }> = {
  onsale: { tone: 'green', icon: 'hgi-tick-02', label: 'On sale' },
  scheduled: { tone: 'blue', icon: 'hgi-time-schedule', label: 'Scheduled' },
  paused: { tone: 'gray', icon: 'hgi-time-quarter-pass', label: 'Paused' },
  soldout: { tone: 'amber', icon: 'hgi-alert-circle', label: 'Sold out' },
}

/**
 * The kit hand-tinted each card's icon square. Real inventory has whatever the
 * workspace sells, so the tint comes from the tier's own id — stable, so a card
 * does not change colour when the list is refiltered.
 */
const ICON_TINTS: readonly string[] = [
  'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
  'bg-brand-soft text-brand',
  'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300',
]

export function toTicketCard(wire: TicketWire): TicketCard {
  const meta = STATUS_META[wire.status]
  return {
    id: wire.id,
    eventId: wire.eventId,
    name: wire.name,
    event: wire.eventName,
    price: wire.isFree ? FREE : baht(Math.round(wire.priceSatang / SATANG_PER_BAHT)),
    isFree: wire.isFree,
    status: wire.status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusIcon: meta.icon,
    soldLabel: soldLabel(wire.sold, wire.total),
    percent: sharePercent(wire.sold, wire.total),
    iconTint: ICON_TINTS[hashIndex(wire.id, ICON_TINTS.length)],
  }
}

/**
 * An allocation of `0` is the API's "unlimited", not "sold out".
 *
 * Both readings print the same two characters, so the difference has to be made
 * here: an unlimited tier reports what it has sold and no share, because there
 * is no denominator to take a share of.
 */
function soldLabel(sold: number, total: number): string {
  return total === 0 ? `${num(sold)} sold` : `${num(sold)} / ${num(total)} sold`
}

function sharePercent(sold: number, total: number): number | null {
  if (total === 0) return null
  return Math.min(FULL, Math.round((sold / total) * FULL))
}
