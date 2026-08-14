import { describe, expect, it } from 'vitest'
import { shouldReload } from './staleChunks'

const NOW = 1_786_700_000_000

describe('recovering from a chunk that is no longer on the server', () => {
  it('reloads the first time, when nothing has been tried', () => {
    expect(shouldReload(null, NOW)).toBe(true)
  })

  it('refuses a second reload straight after the first', () => {
    // A chunk that is genuinely gone — not merely stale — would otherwise spin
    // the tab in a reload loop, which is worse than the blank screen it is
    // trying to fix.
    expect(shouldReload(NOW - 1_000, NOW)).toBe(false)
  })

  it('allows another attempt once enough time has passed', () => {
    // A second failure long after the first is a second deploy, not a loop.
    expect(shouldReload(NOW - 60_000, NOW)).toBe(true)
  })

  it('treats the boundary as long enough', () => {
    expect(shouldReload(NOW - 10_000, NOW)).toBe(true)
  })
})
