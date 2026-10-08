import type { BadgeTone } from '@/components/ui'
import { baht, bangkokDate, num } from '@/lib/format'
import type { DiscountRow, DiscountWire } from './discounts.types'
import type { DiscountStatus } from './types'

/** The rules behind the discount codes table (US-TKT-07..10). */

const SATANG_PER_BAHT = 100
const FULL = 100
const BANGKOK = 'Asia/Bangkok'
const RANGE_DASH = ' – '

const STATUS_META: Record<DiscountStatus, { tone: BadgeTone; icon: string; label: string }> = {
  active: { tone: 'green', icon: 'hgi-tick-02', label: 'Active' },
  scheduled: { tone: 'blue', icon: 'hgi-time-schedule', label: 'Scheduled' },
  expired: { tone: 'gray', icon: 'hgi-clock-01', label: 'Expired' },
  disabled: { tone: 'amber', icon: 'hgi-alert-circle', label: 'Disabled' },
}

export function toDiscountRow(wire: DiscountWire): DiscountRow {
  const meta = STATUS_META[wire.status]
  return {
    id: wire.id,
    code: wire.code,
    offer: offerOf(wire),
    offerTone: wire.type === 'fixed' ? 'blue' : 'purple',
    appliesTo: wire.scopeLabel,
    usedLabel: usedLabel(wire.used, wire.redemptionLimit),
    percent: sharePercent(wire.used, wire.redemptionLimit),
    valid: validRange(wire.validFrom, wire.validUntil),
    status: wire.status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusIcon: meta.icon,
  }
}

/**
 * What the code takes off.
 *
 * A percentage is a percentage; a fixed discount arrives in satang like every
 * other amount on this wire, and printing it unconverted would advertise ฿200
 * off as ฿20,000.
 */
function offerOf(wire: DiscountWire): string {
  if (wire.type === 'fixed') return `${baht(Math.round(wire.value / SATANG_PER_BAHT))} off`
  return `${wire.value}% off`
}

/** A redemption limit of `0` is the API's "unlimited", not "none allowed". */
function usedLabel(used: number, limit: number): string {
  return limit === 0 ? `${num(used)} used` : `${num(used)} / ${num(limit)}`
}

function sharePercent(used: number, limit: number): number | null {
  if (limit === 0) return null
  return Math.min(FULL, Math.round((used / limit) * FULL))
}

/**
 * `Jun 1 – Jul 31, 2026`, on the Bangkok calendar.
 *
 * The year is stated once when both ends share it, because a validity window is
 * read as one span rather than as two dates — and it is stated twice when they
 * do not, because "Dec 20 – Jan 5, 2026" hides which December.
 */
function validRange(from: string, until: string): string {
  const start = new Date(from)
  const end = new Date(until)
  if (bangkokYear(start) !== bangkokYear(end)) {
    return bangkokDate(from) + RANGE_DASH + bangkokDate(until)
  }
  return monthDay(start) + RANGE_DASH + bangkokDate(until)
}

function monthDay(instant: Date): string {
  return instant.toLocaleDateString('en-US', {
    timeZone: BANGKOK,
    month: 'short',
    day: 'numeric',
  })
}

function bangkokYear(instant: Date): string {
  return instant.toLocaleDateString('en-US', { timeZone: BANGKOK, year: 'numeric' })
}
