import { describe, expect, it } from 'vitest'
import {
  MASKED,
  bangkokDate,
  bangkokDateRange,
  bangkokDayKey,
  bangkokInstant,
  bangkokInstantOfLocal,
  bangkokLocalInput,
  bangkokLongDate,
  bangkokMonthKey,
  bangkokTime,
  satang,
} from './format'

describe('a Bangkok date → the instant the API stores', () => {
  it('reads a date as Bangkok midnight, not the browser’s', () => {
    expect(bangkokInstant('2026-08-20')).toBe('2026-08-19T17:00:00.000Z')
  })

  it('takes a wall time when one was given', () => {
    expect(bangkokInstant('2026-08-20', '09:30')).toBe('2026-08-20T02:30:00.000Z')
  })

  // A deadline nobody filled in is not midnight today.
  it('is null when there is no date', () => {
    expect(bangkokInstant('')).toBeNull()
  })
})

describe('a Bangkok date-and-time field ↔ the instant the API stores', () => {
  // A `datetime-local` value carries no zone. The organizer picks it on the
  // Bangkok clock, wherever their laptop thinks it is.
  it('reads the field on the Bangkok clock', () => {
    expect(bangkokInstantOfLocal('2026-08-05T10:00')).toBe('2026-08-05T03:00:00.000Z')
  })

  it('crosses midnight the right way', () => {
    expect(bangkokInstantOfLocal('2026-08-06T03:00')).toBe('2026-08-05T20:00:00.000Z')
  })

  // An empty field is not "now".
  it('is null when nothing was picked', () => {
    expect(bangkokInstantOfLocal('')).toBeNull()
  })

  it('fills the field with the Bangkok wall time of an instant', () => {
    expect(bangkokLocalInput('2026-08-06T08:00:00.000Z')).toBe('2026-08-06T15:00')
  })

  it('fills it with the Bangkok day, not the UTC one', () => {
    expect(bangkokLocalInput('2026-08-05T20:00:00.000Z')).toBe('2026-08-06T03:00')
  })

  it('round-trips', () => {
    expect(bangkokInstantOfLocal(bangkokLocalInput('2026-12-31T17:30:00.000Z'))).toBe(
      '2026-12-31T17:30:00.000Z',
    )
  })
})

describe('satang → what the organizer reads', () => {
  it('formats a price in baht', () => {
    expect(satang(188_000)).toBe('฿1,880')
  })

  it('calls zero "Free" rather than ฿0', () => {
    // The kit's own word — a free ticket is not a price of nothing.
    expect(satang(0)).toBe('Free')
  })

  it('renders a MASKED figure as a dash, never as zero', () => {
    // The API sends null when the caller lacks finance access. Showing ฿0
    // would state a fact — "it was free" — that we do not know to be true.
    expect(satang(null)).toBe(MASKED)
    expect(satang(null)).not.toBe('฿0')
    expect(satang(null)).not.toBe('Free')
  })

  it('keeps satang out of the display — 1 baht is 100 satang', () => {
    expect(satang(100)).toBe('฿1')
  })

  it('rounds a half-baht amount rather than showing a fraction', () => {
    expect(satang(150)).toBe('฿2')
  })

  it('groups thousands', () => {
    expect(satang(1_234_567_00)).toBe('฿1,234,567')
  })
})

describe('UTC instants shown in Bangkok', () => {
  it('formats a date the way the kit does', () => {
    expect(bangkokDate('2026-07-08T03:00:00Z')).toBe('Jul 8, 2026')
  })

  it('uses the BANGKOK day, not the UTC one', () => {
    // 18:00 UTC on the 7th is 01:00 on the 8th in Bangkok. A viewer anywhere
    // must see the day the event's own city was on.
    expect(bangkokDate('2026-07-07T18:00:00Z')).toBe('Jul 8, 2026')
  })

  it('does not roll the day early — 16:59 UTC is still the 7th there', () => {
    expect(bangkokDate('2026-07-07T16:59:00Z')).toBe('Jul 7, 2026')
  })

  it('shows a 24-hour Bangkok wall clock', () => {
    expect(bangkokTime('2026-07-08T03:24:00Z')).toBe('10:24')
  })

  it('pads the hour so times line up in a column', () => {
    expect(bangkokTime('2026-07-08T01:05:00Z')).toBe('08:05')
  })

  it('returns the dash for a missing instant', () => {
    expect(bangkokDate(null)).toBe(MASKED)
    expect(bangkokTime(null)).toBe(MASKED)
  })
})

describe('the long date the events table uses', () => {
  it('spells the month out, as the kit does', () => {
    expect(bangkokLongDate('2025-08-27T02:00:00Z')).toBe('August 27, 2025')
  })

  it('is the Bangkok day too — 17:00 UTC is already tomorrow there', () => {
    expect(bangkokLongDate('2025-08-26T17:00:00Z')).toBe('August 27, 2025')
  })

  it('returns the dash rather than an "Invalid Date" for a missing instant', () => {
    expect(bangkokLongDate(null)).toBe(MASKED)
  })
})

describe('Bangkok day and month keys', () => {
  it('keys a day as YYYY-MM-DD', () => {
    expect(bangkokDayKey('2026-09-04T05:30:00Z')).toBe('2026-09-04')
  })

  it('keys the day the event is on in Bangkok, not in UTC', () => {
    // 20:00 UTC on the 4th is 03:00 on the 5th in Bangkok. Grouping calendar
    // cells by the UTC day would file this event under the wrong square.
    expect(bangkokDayKey('2026-09-04T20:00:00Z')).toBe('2026-09-05')
  })

  it('pads single-digit months and days so the keys sort', () => {
    expect(bangkokDayKey('2026-01-02T04:00:00Z')).toBe('2026-01-02')
  })

  it('keys a month as YYYY-MM', () => {
    expect(bangkokMonthKey('2026-09-04T05:30:00Z')).toBe('2026-09')
  })

  it('rolls the month over on the Bangkok calendar', () => {
    // 18:00 UTC on Aug 31 is already September 1st in Bangkok.
    expect(bangkokMonthKey('2026-08-31T18:00:00Z')).toBe('2026-09')
  })

  it('accepts a Date as well as an instant string', () => {
    expect(bangkokMonthKey(new Date('2026-09-04T05:30:00Z'))).toBe('2026-09')
  })
})

describe('an event shown in its own timezone, not the reader’s', () => {
  // A public event page is read from anywhere. The organizer's schedule is the
  // fact; the viewer's location is not.
  const evening = '2026-11-13T23:00:00.000Z'

  it('formats the date in the timezone it is given', () => {
    // 23:00 UTC on the 13th is already 06:00 on the 14th in Bangkok.
    expect(bangkokDate(evening, 'Asia/Bangkok')).toBe('Nov 14, 2026')
    expect(bangkokDate(evening, 'America/New_York')).toBe('Nov 13, 2026')
  })

  it('formats the clock time in the timezone it is given', () => {
    expect(bangkokTime(evening, 'Asia/Bangkok')).toBe('06:00')
    expect(bangkokTime(evening, 'Asia/Singapore')).toBe('07:00')
  })

  it('still means Bangkok when no timezone is named', () => {
    // Every existing caller passes nothing and must not change behaviour.
    expect(bangkokDate(evening)).toBe(bangkokDate(evening, 'Asia/Bangkok'))
    expect(bangkokTime(evening)).toBe(bangkokTime(evening, 'Asia/Bangkok'))
  })

  it('falls back to Bangkok rather than throwing on an unusable timezone', () => {
    // `events.timezone` is free text on the API. Intl throws a RangeError on a
    // value it cannot use, which would take the whole public page down.
    expect(bangkokDate(evening, 'Mars/Olympus')).toBe('Nov 14, 2026')
    expect(bangkokTime(evening, 'not a zone')).toBe('06:00')
    expect(bangkokLongDate(evening, '')).toBe('November 14, 2026')
  })
})

describe('bangkokDateRange', () => {
  const day = '2026-07-18T02:00:00.000Z'

  it('spells a single day when there is no end', () => {
    expect(bangkokDateRange(day, null, 'Asia/Bangkok')).toBe('Sat, Jul 18, 2026')
  })

  it('collapses a range inside one month', () => {
    expect(bangkokDateRange(day, '2026-07-19T11:00:00.000Z', 'Asia/Bangkok')).toBe(
      'Sat\u2013Sun, Jul 18\u201319, 2026',
    )
  })

  it('spells both months when the event crosses one', () => {
    expect(
      bangkokDateRange('2026-07-30T02:00:00.000Z', '2026-08-02T02:00:00.000Z', 'Asia/Bangkok'),
    ).toBe('Jul 30 \u2013 Aug 2, 2026')
  })

  // 20:00 UTC is already tomorrow in Bangkok.
  it('reads the calendar day in the zone it is given', () => {
    expect(bangkokDateRange('2026-07-18T20:00:00.000Z', null, 'Asia/Bangkok')).toBe(
      'Sun, Jul 19, 2026',
    )
  })

  it('treats an end on the same day as a single day', () => {
    expect(bangkokDateRange(day, '2026-07-18T11:00:00.000Z', 'Asia/Bangkok')).toBe(
      'Sat, Jul 18, 2026',
    )
  })

  // `events.timezone` is free text; Intl throws on a value it cannot use, and
  // one bad row must not take a public page down.
  it('falls back to Bangkok rather than throwing on an unusable timezone', () => {
    expect(bangkokDateRange(day, null, 'Mars/Olympus')).toBe('Sat, Jul 18, 2026')
  })
})
