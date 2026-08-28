import { describe, expect, it } from 'vitest'
import { looksLikeHtml } from './looksLikeHtml'

/**
 * Which descriptions are markup and which are the plain text the editor used to
 * save. Getting it wrong loses an organizer's paragraph breaks — every
 * pre-formatting description is plain text with real newlines, and HTML
 * collapses those to single spaces.
 */
describe('looksLikeHtml', () => {
  it('recognises what the editor writes', () => {
    expect(looksLikeHtml('<p>Two days of talks.</p>')).toBe(true)
    expect(looksLikeHtml('<ol><li>Introductions</li></ol>')).toBe(true)
    expect(looksLikeHtml('<h2>Agenda</h2>')).toBe(true)
    expect(looksLikeHtml('line<br />break')).toBe(true)
  })

  it('treats an old plain-text description as text', () => {
    expect(looksLikeHtml('Two days of talks.\n\nDoors at 08:30.')).toBe(false)
  })

  /** Prose about capacity is not markup. */
  it('is not fooled by a bare angle bracket', () => {
    expect(looksLikeHtml('Seats < 50 remaining')).toBe(false)
    expect(looksLikeHtml('a < b and b > c')).toBe(false)
  })
})
