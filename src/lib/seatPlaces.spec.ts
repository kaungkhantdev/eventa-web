import { describe, expect, it } from 'vitest'
import {
  seatCountLabel,
  seatKeyLabelOf,
  seatsOfType,
  seatsWhereOf,
  seatsWherePhraseOf,
  type SeatRowTypes,
} from './seatPlaces'

/**
 * US-EVT-05, US-PAGE-05: where a ticket type's seats are on a reserved map,
 * said once — the wizard's key on Assign seats and the public page's tickets,
 * key and screen-reader summary all read it from here, so they never disagree.
 */

/** A map from each row's types, seat 1 first; rows are numbered 1..N as the API numbers them. */
const mapOf = (...rows: (string | null)[][]): SeatRowTypes[] =>
  rows.map((seats, i) => ({ label: String(i + 1), seats }))

const row = (seats: number, typeId: string | null): (string | null)[] => Array(seats).fill(typeId)

/** Row 7 split: seats 1–5 Free, 6–16 Normal. */
const splitRow = [...row(5, 'free'), ...row(11, 'normal')]

/** The owner's mock-up: rows 1–2 VIP, 3–6 Normal, row 7 seats 1–5 Free and 6–16 Normal. */
const theatre = mapOf(
  row(16, 'vip'),
  row(16, 'vip'),
  row(16, 'normal'),
  row(16, 'normal'),
  row(16, 'normal'),
  row(16, 'normal'),
  splitRow,
)

describe('seatsOfType — how many seats carry a type', () => {
  it('counts every seat of the type, whole rows and part rows alike', () => {
    expect(seatsOfType(theatre, 'vip')).toBe(32)
    expect(seatsOfType(theatre, 'normal')).toBe(75)
    expect(seatsOfType(theatre, 'free')).toBe(5)
  })

  it('counts the seats with no type when asked about none', () => {
    expect(seatsOfType(mapOf([null, 'vip', null]), null)).toBe(2)
  })

  it('is 0 for a type with no seats', () => {
    expect(seatsOfType(theatre, 'student')).toBe(0)
  })
})

describe('seatsWhereOf — where a type’s seats are', () => {
  describe('whole rows', () => {
    it('names a single row', () => {
      expect(seatsWhereOf(mapOf(row(4, 'vip'), row(4, 'free')), 'free')).toBe('Row 2')
    })

    it('collapses a run of rows into one range', () => {
      expect(seatsWhereOf(theatre, 'vip')).toBe('Rows 1–2')
    })

    it('lists rows split by another type’s as separate ranges', () => {
      const map = mapOf(row(4, 'vip'), row(4, 'normal'), row(4, 'vip'), row(4, 'vip'))
      expect(seatsWhereOf(map, 'vip')).toBe('Rows 1, 3–4')
    })
  })

  describe('part of a row', () => {
    it('names the row and the run of seats', () => {
      expect(seatsWhereOf(theatre, 'free')).toBe('Row 7 seats 1–5')
    })

    it('names a single seat', () => {
      expect(seatsWhereOf(mapOf(['vip', null, null]), 'vip')).toBe('Row 1 seat 1')
    })

    it('lists the seats of a row split by another type’s as separate ranges', () => {
      expect(seatsWhereOf(mapOf(['vip', 'vip', null, 'vip', null, 'vip']), 'vip')).toBe('Row 1 seats 1–2, 4, 6')
    })

    it('names each part row in row order', () => {
      const map = mapOf(['vip', null], [null, null], [null, 'vip'])
      expect(seatsWhereOf(map, 'vip')).toBe('Row 1 seat 1, row 3 seat 2')
    })
  })

  it('names the whole rows first, then each part row', () => {
    expect(seatsWhereOf(theatre, 'normal')).toBe('Rows 3–6, row 7 seats 6–16')
  })

  it('puts the whole rows first even when a part row comes before them', () => {
    const map = mapOf(['vip', null], row(2, 'vip'), row(2, 'vip'))
    expect(seatsWhereOf(map, 'vip')).toBe('Rows 2–3, row 1 seat 1')
  })

  it('reads the row numbers the map gives, not their place', () => {
    const map: SeatRowTypes[] = [
      { label: '10', seats: row(2, 'vip') },
      { label: '11', seats: row(2, 'vip') },
    ]
    expect(seatsWhereOf(map, 'vip')).toBe('Rows 10–11')
  })

  it('is null for a type with no seats', () => {
    expect(seatsWhereOf(theatre, 'student')).toBeNull()
    expect(seatsWhereOf([], 'vip')).toBeNull()
  })
})

describe('seatsWherePhraseOf — the same, mid-sentence', () => {
  it('starts in lower case', () => {
    expect(seatsWherePhraseOf(theatre, 'normal')).toBe('rows 3–6, row 7 seats 6–16')
    expect(seatsWherePhraseOf(theatre, 'free')).toBe('row 7 seats 1–5')
  })

  it('is null for a type with no seats', () => {
    expect(seatsWherePhraseOf(theatre, 'student')).toBeNull()
  })
})

describe('seatCountLabel', () => {
  it('counts one seat as a seat', () => {
    expect(seatCountLabel(1)).toBe('1 seat')
  })

  it('counts any other number as seats, grouped for reading', () => {
    expect(seatCountLabel(0)).toBe('0 seats')
    expect(seatCountLabel(10_000)).toBe('10,000 seats')
  })
})

describe('seatKeyLabelOf — a type’s entry in a seat map’s key', () => {
  it('names the type, where its seats are and how many', () => {
    expect(seatKeyLabelOf('Free', theatre, 'free')).toBe('Free · Row 7 seats 1–5 · 5 seats')
    expect(seatKeyLabelOf('Normal', theatre, 'normal')).toBe('Normal · Rows 3–6, row 7 seats 6–16 · 75 seats')
    expect(seatKeyLabelOf('VIP', theatre, 'vip')).toBe('VIP · Rows 1–2 · 32 seats')
  })

  it('counts a single seat as one seat', () => {
    expect(seatKeyLabelOf('Free', mapOf(['free', null]), 'free')).toBe('Free · Row 1 seat 1 · 1 seat')
  })

  it('leaves out where for a type with no seats', () => {
    expect(seatKeyLabelOf('Student', theatre, 'student')).toBe('Student · 0 seats')
  })
})
