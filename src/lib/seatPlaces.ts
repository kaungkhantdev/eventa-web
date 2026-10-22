import { num } from './format'

/**
 * Where a ticket type's seats are on a reserved seat map (US-EVT-05), in
 * words: `Rows 3–6, row 7 seats 6–16`. The wizard's key on Assign seats and
 * the public event page's tickets, key and screen-reader summary (US-PAGE-05)
 * all say it this way, from this one rule.
 *
 * Whole rows come first, as one item — `Row 7`, `Rows 1–2`, `Rows 1, 3–4` —
 * then each row the type holds only part of, in row order: `row 7 seats 1–5`.
 * Items are joined by ", " and only the first is capitalised.
 */

/** One row of a seat map: its number as the venue prints it, and each seat's type, seat 1 first. */
export interface SeatRowTypes {
  label: string
  seats: readonly (string | null)[]
}

/** How many seats carry this type — or, for null, carry none. */
export function seatsOfType(map: readonly SeatRowTypes[], typeId: string | null): number {
  return map.reduce((seats, row) => seats + row.seats.filter((seat) => seat === typeId).length, 0)
}

/** `Rows 3–6, row 7 seats 6–16`; null for a type with no seats. */
export function seatsWhereOf(map: readonly SeatRowTypes[], typeId: string | null): string | null {
  const phrase = seatsWherePhraseOf(map, typeId)
  return phrase === null ? null : phrase.charAt(0).toUpperCase() + phrase.slice(1)
}

/** The same mid-sentence: `rows 3–6, row 7 seats 6–16`. */
export function seatsWherePhraseOf(map: readonly SeatRowTypes[], typeId: string | null): string | null {
  const wholeRows: string[] = []
  const partRows: string[] = []
  for (const row of map) {
    const seats = seatNumbersOf(row, typeId)
    if (seats.length === 0) continue
    if (seats.length === row.seats.length) wholeRows.push(row.label)
    else partRows.push(`row ${row.label} ${seats.length === 1 ? 'seat' : 'seats'} ${rangesOf(seats)}`)
  }
  const items = wholeRows.length === 0 ? partRows : [wholeRowsPhraseOf(wholeRows), ...partRows]
  return items.length === 0 ? null : items.join(', ')
}

/** `1 seat`, `16 seats`, `10,000 seats`. */
export function seatCountLabel(seats: number): string {
  return `${num(seats)} ${seats === 1 ? 'seat' : 'seats'}`
}

/** A type's entry in a map's key: `Normal · Rows 3–6, row 7 seats 6–16 · 75 seats`, or `Student · 0 seats`. */
export function seatKeyLabelOf(name: string, map: readonly SeatRowTypes[], typeId: string): string {
  const where = seatsWhereOf(map, typeId)
  const count = seatCountLabel(seatsOfType(map, typeId))
  return where === null ? `${name} · ${count}` : `${name} · ${where} · ${count}`
}

/** The numbers of a row's seats that carry this type, seat 1 first. */
function seatNumbersOf(row: SeatRowTypes, typeId: string | null): string[] {
  return row.seats.flatMap((seat, i) => (seat === typeId ? [String(i + 1)] : []))
}

/** `rows 1, 3–4`, `row 7`. */
function wholeRowsPhraseOf(rows: readonly string[]): string {
  return `${rows.length === 1 ? 'row' : 'rows'} ${rangesOf(rows)}`
}

/** `1, 2, 4` → `1–2, 4`: consecutive numbers collapse into a range. */
function rangesOf(numbers: readonly string[]): string {
  const runs: string[][] = []
  for (const n of numbers) {
    const run = runs.at(-1)
    if (run && Number(run.at(-1)) + 1 === Number(n)) run.push(n)
    else runs.push([n])
  }
  return runs.map((run) => (run.length === 1 ? run[0] : `${run[0]}–${run.at(-1)}`)).join(', ')
}
