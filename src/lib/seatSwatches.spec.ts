import { describe, expect, it } from 'vitest'
import { ROW_TYPE_SWATCHES, swatchClassOf, swatchOf } from './seatSwatches'

/**
 * US-EVT-05 / US-PAGE-05: one order decides a ticket type's seat colour, so
 * the organizer's preview and the public page colour a type alike.
 */
describe('swatchOf — which colour a ticket type’s rows take', () => {
  const byCreation = ['vip', 'normal', 'free']

  it('is the type’s place in the order the types were created', () => {
    expect(byCreation.map((id) => swatchOf(id, byCreation))).toEqual([0, 1, 2])
  })

  // A type with no rows is still one of the event's types: the types after it
  // keep the colours the wizard, which lists every type, gives them.
  it('counts a type that sells no rows in the order', () => {
    expect(swatchOf('free', ['vip', 'parking', 'free'])).toBe(2)
  })

  it('is none — the neutral seat — for a row with no type', () => {
    expect(swatchOf(null, byCreation)).toBeNull()
  })

  it('is none for a type that is not among the event’s', () => {
    expect(swatchOf('staff-only', byCreation)).toBeNull()
  })
})

/**
 * A type's place → its seat colour, on the wizard's preview and the public
 * page alike (US-EVT-05, US-PAGE-05), so two types of one event never share a
 * colour until there are more types than colours.
 */
describe('swatchClassOf — the colour a place in the order takes', () => {
  it('gives each type its own colour, in order', () => {
    expect(swatchClassOf(0)).toBe(ROW_TYPE_SWATCHES[0])
    expect(swatchClassOf(1)).toBe(ROW_TYPE_SWATCHES[1])
    expect(swatchClassOf(0)).not.toBe(swatchClassOf(1))
  })

  it('starts the colours again past the last one', () => {
    expect(swatchClassOf(ROW_TYPE_SWATCHES.length)).toBe(ROW_TYPE_SWATCHES[0])
  })

  it('leaves a row with no type its plain, neutral seat', () => {
    expect(swatchClassOf(null)).toBe('')
  })
})
