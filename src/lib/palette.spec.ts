import { describe, expect, it } from 'vitest'
import { hashIndex } from './palette'

describe('hashIndex', () => {
  it('gives the same key the same slot every time', () => {
    expect(hashIndex('tech-summit-2026', 4)).toBe(hashIndex('tech-summit-2026', 4))
  })

  it('stays inside the palette', () => {
    const keys = ['a', 'bangkok-jazz-night', 'Ploy Srisai', '', 'ยูเอ็กซ์']

    for (const key of keys) {
      const index = hashIndex(key, 3)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(3)
    }
  })

  it('spreads neighbouring keys apart rather than clustering them', () => {
    const slots = ['Anong P', 'Somchai T', 'Ploy S', 'James W'].map((n) => hashIndex(n, 4))

    expect(new Set(slots).size).toBeGreaterThan(1)
  })
})
