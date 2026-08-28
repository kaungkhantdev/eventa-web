import { describe, expect, it } from 'vitest'
import { finalLabel, headerSaveLabel, summaryCapacity } from './eventForm.presentation'

/**
 * The wizard's summary rail showed `0` for an event whose capacity was never
 * set, which reads as "nobody may come" — the opposite of what an empty field
 * means. `null` is not `0`, the same rule that makes a masked amount render as
 * "—" rather than ฿0.
 */
describe('summaryCapacity', () => {
  it('shows the number, grouped', () => {
    expect(summaryCapacity('1200')).toBe('1,200')
  })

  it('shows a dash when no capacity has been set', () => {
    expect(summaryCapacity('')).toBe('—')
    expect(summaryCapacity('   ')).toBe('—')
  })

  it('shows a dash rather than a figure that cannot be a capacity', () => {
    expect(summaryCapacity('0')).toBe('—')
    expect(summaryCapacity('-40')).toBe('—')
    expect(summaryCapacity('abc')).toBe('—')
  })
})

/**
 * The wizard is one flow for two jobs. It used to offer "Publish event" on the
 * last step whatever the event was, and disable it for anything already
 * published — so an organizer editing a live event was shown a single action
 * they could not take, on a step with nothing else to press.
 */
describe('finalLabel', () => {
  it('publishes a draft', () => {
    expect(finalLabel(true, false)).toBe('Publish event')
    expect(finalLabel(true, true)).toBe('Publishing…')
  })

  it('saves an event that is already live', () => {
    expect(finalLabel(false, false)).toBe('Save changes')
    expect(finalLabel(false, true)).toBe('Saving…')
  })
})

describe('headerSaveLabel', () => {
  it('offers a draft only for an event that does not exist yet', () => {
    expect(headerSaveLabel(false, false)).toBe('Save as draft')
  })

  /**
   * The bug this names: on an existing event the same button saves the open
   * step and changes no status, but "Save as draft" read as an offer to
   * unpublish a live event, so it went unused.
   */
  it('saves changes on an event that already exists', () => {
    expect(headerSaveLabel(true, false)).toBe('Save changes')
    expect(headerSaveLabel(true, false)).not.toContain('draft')
  })

  it('reports the write in progress either way', () => {
    expect(headerSaveLabel(true, true)).toBe('Saving…')
    expect(headerSaveLabel(false, true)).toBe('Saving…')
  })
})
