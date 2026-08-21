import { describe, expect, it } from 'vitest'
import { toastKey, TOAST_DURATION_MS, type ToastTone } from './toast'

const TONES = ['success', 'error', 'warning', 'info'] as const satisfies readonly ToastTone[]

/**
 * Sonner owns the stacking, timing and animation, and is not this suite's to
 * test; `<Toast>` is markup, verified in the browser. What is ours is the
 * repeat rule — which two announcements sonner should treat as one — and how
 * long each kind is given to be read.
 */
describe('toast', () => {
  describe('what counts as the same news', () => {
    it('folds an identical message into the one already showing', () => {
      expect(toastKey('success', 'Organization saved.')).toBe(
        toastKey('success', 'Organization saved.'),
      )
    })

    // "Done" as a success and "Done" as a failure are not one message twice.
    it('treats the same words in a different tone as different news', () => {
      expect(toastKey('success', 'Done')).not.toBe(toastKey('error', 'Done'))
    })

    it('keeps different messages apart', () => {
      expect(toastKey('success', 'Profile saved.')).not.toBe(
        toastKey('success', 'Password changed.'),
      )
    })
  })

  describe('how long each kind stays', () => {
    /**
     * A failure needs reading, and it is often the only thing on screen that
     * says why an action did nothing.
     */
    it('leaves an error up longer than a success', () => {
      expect(TOAST_DURATION_MS.error).toBeGreaterThan(TOAST_DURATION_MS.success)
    })

    it.each(TONES)('gives %s a duration to be read in', (tone) => {
      expect(TOAST_DURATION_MS[tone]).toBeGreaterThan(0)
    })
  })
})
