import { describe, expect, it } from 'vitest'
import { toCategoryCard } from './categories.mapper'
import type { CategoryWire } from './types'

const category = (over: Partial<CategoryWire> = {}): CategoryWire => ({
  id: 10,
  name: 'Conference',
  description: 'Summits, seminars and professional talks.',
  icon: 'hgi-presentation-bar-chart-01',
  color: 'amber',
  eventCount: 24,
  createdAt: '2026-01-04T03:00:00Z',
  version: 1,
  ...over,
})

describe('a category as the grid shows it', () => {
  it('carries the name, colour and count through', () => {
    const card = toCategoryCard(category())
    expect(card.name).toBe('Conference')
    expect(card.color).toBe('amber')
    expect(card.eventCount).toBe(24)
  })

  it('renders a missing description as nothing, not as "null"', () => {
    expect(toCategoryCard(category({ description: null })).description).toBe('')
  })

  it('keeps an icon slug the picker already produced', () => {
    expect(toCategoryCard(category()).icon).toBe('hgi-presentation-bar-chart-01')
  })

  it('prefixes a bare slug stored without the icon set’s namespace', () => {
    // The API only requires a non-empty string, and its own examples are bare
    // ("presentation-01"). An unprefixed class renders as CJK tofu, so the one
    // place that can fix it is here.
    expect(toCategoryCard(category({ icon: 'presentation-01' })).icon).toBe(
      'hgi-presentation-01',
    )
  })

  it('falls back to a folder icon when none was stored', () => {
    expect(toCategoryCard(category({ icon: '' })).icon).toBe('hgi-folder-01')
  })

  it('falls back to the brand colour for one the design system lacks', () => {
    // A colour added to the API's enum before this app knows it must not
    // produce an empty tile — `bg-undefined` is not a class.
    expect(toCategoryCard(category({ color: 'chartreuse' })).color).toBe('brand')
  })

  it('carries the id and version an edit or delete needs', () => {
    const card = toCategoryCard(category({ id: 7, version: 3 }))
    expect(card.id).toBe(7)
    expect(card.version).toBe(3)
  })
})
