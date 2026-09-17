import { describe, expect, it } from 'vitest'
import { relativeTime, toNotification } from './notifications.mapper'
import type { FeedItemWire } from './notifications.types'

/**
 * The feed's view model.
 *
 * The API deliberately sends no prose, so composing the sentence is this app's
 * job — and so is the "2 min ago" clock, which is Bangkok's rather than the
 * reader's.
 */

/** Thursday 16 July 2026, 18:00 Bangkok. */
const NOW = new Date('2026-07-16T11:00:00.000Z')

const item = (over: Partial<FeedItemWire> = {}): FeedItemWire => ({
  id: 'order:1',
  kind: 'registration',
  at: '2026-07-16T10:58:00.000Z',
  unread: true,
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  personName: 'Anong Pattana',
  amountSatang: null,
  seats: 1,
  reference: null,
  ...over,
})

const textOf = (wire: FeedItemWire) =>
  toNotification(wire, NOW)
    .body.map((segment) => segment.text)
    .join('')

describe('toNotification', () => {
  it('names a new registration and the event it is for', () => {
    const view = toNotification(item(), NOW)
    expect(view.title).toBe('New registration')
    expect(textOf(item())).toBe('Anong Pattana joined Tech Summit 2026')
  })

  it('emphasises the event name, not the whole sentence', () => {
    const bold = toNotification(item(), NOW).body.filter((segment) => segment.bold)
    expect(bold.map((segment) => segment.text)).toEqual(['Tech Summit 2026'])
  })

  it('reads a payment as money from a person', () => {
    const paid = item({ kind: 'payment', amountSatang: 125_000, personName: 'Ploy Srisai' })
    expect(toNotification(paid, NOW).title).toBe('Payment received')
    expect(textOf(paid)).toBe('฿1,250 from Ploy Srisai')
  })

  it('reads a declined payment as something to act on', () => {
    const failed = item({ kind: 'alert', personName: 'Mia Thompson' })
    expect(toNotification(failed, NOW).title).toBe('Payment declined')
    expect(textOf(failed)).toContain('Mia Thompson')
    expect(textOf(failed)).toContain('Tech Summit 2026')
  })

  it('reads a payout as money leaving, with nobody named', () => {
    const payout = item({
      kind: 'payout',
      amountSatang: 4_829_000,
      personName: null,
      eventName: null,
      reference: 'PO-2026-07',
    })
    expect(toNotification(payout, NOW).title).toBe('Payout completed')
    expect(textOf(payout)).toBe('฿48,290 was sent to your bank account')
  })

  it('still reads as a sentence when the API names nobody', () => {
    // `personName` is nullable on the wire; the row must not print "null joined".
    expect(textOf(item({ personName: null }))).toBe('Someone joined Tech Summit 2026')
  })

  it('gives each kind its own icon', () => {
    expect(toNotification(item(), NOW).icon).toBe('hgi-user-add-01')
    expect(toNotification(item({ kind: 'alert' }), NOW).icon).toBe('hgi-alert-circle')
  })

  it('carries the API’s own unread flag rather than deciding for itself', () => {
    expect(toNotification(item({ unread: false }), NOW).unread).toBe(false)
  })
})

describe('relativeTime', () => {
  const ago = (iso: string) => relativeTime(iso, NOW)

  it('reads the last minute as just now', () => {
    expect(ago('2026-07-16T10:59:30.000Z')).toBe('Just now')
  })

  it('counts minutes within the hour', () => {
    expect(ago('2026-07-16T10:42:00.000Z')).toBe('18 min ago')
  })

  it('counts hours within the day', () => {
    expect(ago('2026-07-16T08:00:00.000Z')).toBe('3 hr ago')
  })

  it('names yesterday rather than counting back to it', () => {
    expect(ago('2026-07-15T09:00:00.000Z')).toBe('Yesterday')
  })

  it('gives a date once it is older than that', () => {
    expect(ago('2026-07-10T09:00:00.000Z')).toBe('Jul 10')
  })

  it('counts the day in BANGKOK, not in UTC', () => {
    // 00:30 on the 16th in Bangkok is still the 15th in UTC. Counting in UTC
    // would call this morning's item "Yesterday".
    expect(ago('2026-07-15T17:30:00.000Z')).toBe('17 hr ago')
  })
})
