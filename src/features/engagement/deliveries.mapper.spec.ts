import { describe, expect, it } from 'vitest'
import { kindLabel, toDeliveryRow } from './deliveries.mapper'
import type { DeliveryWire } from './deliveries.types'

const wire = (over: Partial<DeliveryWire> = {}): DeliveryWire => ({
  id: '1',
  kind: 'registration-confirmation',
  channel: 'email',
  recipientEmail: 'anong.p@gmail.com',
  recipientName: 'Anong Pattana',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  status: 'sent',
  error: null,
  sentAt: '2026-07-09T03:24:00.000Z',
  ...over,
})

describe('who it went to', () => {
  it('names the person and keeps the address underneath', () => {
    const row = toDeliveryRow(wire())
    expect(row.name).toBe('Anong Pattana')
    expect(row.email).toBe('anong.p@gmail.com')
    expect(row.initials).toBe('AP')
  })

  it('falls back to the address when nobody was named', () => {
    // A send can have only an address to go on. Showing an empty name and a
    // blank avatar would read as a broken row.
    const row = toDeliveryRow(wire({ recipientName: null }))
    expect(row.name).toBe('anong.p@gmail.com')
    expect(row.initials).toBe('A')
  })

  it('does not print the address twice when it is standing in as the name', () => {
    expect(toDeliveryRow(wire({ recipientName: null })).email).toBeNull()
    expect(toDeliveryRow(wire()).email).toBe('anong.p@gmail.com')
  })
})

describe('what became of it', () => {
  it('shows a send as sent — never as delivered', () => {
    // The transport accepted it. Whether it landed is not something this
    // product can know.
    const row = toDeliveryRow(wire())
    expect(row.status.label).toBe('Sent')
    expect(row.status.tone).toBe('blue')
  })

  it('marks a failure and carries its reason', () => {
    const row = toDeliveryRow(wire({ status: 'failed', error: 'smtp 550' }))
    expect(row.status.label).toBe('Failed')
    expect(row.status.tone).toBe('red')
    expect(row.error).toBe('smtp 550')
  })

  it('has no reason to show on a successful send', () => {
    expect(toDeliveryRow(wire()).error).toBeNull()
  })
})

describe('what it was', () => {
  it('reads a catalog slug as its own name', () => {
    expect(kindLabel('registration-confirmation')).toBe('Registration confirmation')
    expect(kindLabel('cancellation-notice')).toBe('Cancellation notice')
  })

  it('names a broadcast after the announcement it was', () => {
    expect(kindLabel('announcement')).toBe('Announcement')
  })

  it('makes a slug this app has not met readable rather than raw', () => {
    // A kind is free text from the worker, so a new message type reaches this
    // column before this app has a name for it. It must not show up as
    // `survey-invite` in the middle of a sentence-cased table.
    expect(kindLabel('survey-invite')).toBe('Survey invite')
  })

  it('says which event it was about, when it was about one', () => {
    expect(toDeliveryRow(wire()).event).toBe('Tech Summit 2026')
    expect(toDeliveryRow(wire({ eventName: null, eventId: null })).event).toBeNull()
  })
})

describe('when', () => {
  it('stamps it in Bangkok, not the reader’s timezone', () => {
    // 03:24 UTC is 10:24 the same morning in Bangkok.
    expect(toDeliveryRow(wire()).sentAt).toBe('Jul 9 · 10:24')
  })
})
