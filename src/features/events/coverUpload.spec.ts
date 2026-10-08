import { describe, expect, it } from 'vitest'
import { MAX_COVER_BYTES, rejectionOf } from './coverUpload'

/**
 * A courtesy check, not the control. The API verifies the content type, reads
 * the magic bytes and signs the exact length into the upload URL — a file that
 * slips past this is still refused there.
 *
 * It exists so somebody who picked a 40MB RAW file is told at once, instead of
 * watching an upload crawl and then fail.
 */
describe('rejectionOf', () => {
  const file = (over: Partial<{ type: string; size: number }> = {}) => ({
    type: 'image/jpeg',
    size: 240_000,
    ...over,
  })

  it('accepts the image types the API accepts', () => {
    expect(rejectionOf(file({ type: 'image/jpeg' }))).toBeNull()
    expect(rejectionOf(file({ type: 'image/png' }))).toBeNull()
  })

  it('refuses a file that is not one of those, naming what is allowed', () => {
    const refusal = rejectionOf(file({ type: 'application/pdf' }))
    expect(refusal).toMatch(/PNG|JPG/i)
  })

  /** A browser that volunteers no type is not evidence the file is fine. */
  it('refuses a file whose type the browser could not identify', () => {
    expect(rejectionOf(file({ type: '' }))).toBeTruthy()
  })

  it('refuses one over the size ceiling, and says the ceiling', () => {
    const refusal = rejectionOf(file({ size: MAX_COVER_BYTES + 1 }))
    expect(refusal).toContain('5MB')
  })

  it('accepts one exactly at the ceiling', () => {
    // The API signs `byteSize` into the URL and allows up to the max, so a file
    // of exactly that size uploads. Refusing it here would be stricter than the
    // rule it is meant to preview.
    expect(rejectionOf(file({ size: MAX_COVER_BYTES }))).toBeNull()
  })

  /** An empty file is not a picture, and the API's `@Min(1)` refuses it too. */
  it('refuses an empty file', () => {
    expect(rejectionOf(file({ size: 0 }))).toBeTruthy()
  })
})
