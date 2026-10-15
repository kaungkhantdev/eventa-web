import { afterEach, describe, expect, it, vi } from 'vitest'
import { activityQueryOf, directoryRoute, profileIdOf, type DirectoryData } from './directory.routes'
import type { AttendeeWire } from './directory.types'

const url = (query: string) => new URLSearchParams(query)

describe('whose profile the URL has open', () => {
  it('is nobody when the parameter is absent', () => {
    expect(profileIdOf(url('segment=vip'))).toBeNull()
  })

  it('reads the attendee the row opened', () => {
    expect(profileIdOf(url('profile=42'))).toBe(42)
  })

  /**
   * `subjectId` is validated `@IsInt() @Min(1)` behind a `forbidNonWhitelisted`
   * pipe, so a hand-typed parameter the API would refuse must never become a
   * request: a 400 under the panel would be reported as a failed timeline when
   * nothing is wrong with the attendee's history.
   */
  it.each(['profile=0', 'profile=-3', 'profile=1.5', 'profile=abc', 'profile='])(
    'refuses %s here rather than letting the API 400 it',
    (query) => {
      expect(profileIdOf(url(query))).toBeNull()
    },
  )
})

describe('one attendee’s history, as a request to GET /audit', () => {
  // The DTO refuses half a subject ("Send subjectType and subjectId together"),
  // so the pair is built in one place and cannot be sent apart.
  it('sends both halves of the subject, and caps what the panel shows', () => {
    expect(activityQueryOf(42)).toEqual({
      subjectType: 'attendee',
      subjectId: 42,
      limit: 20,
    })
  })
})

/**
 * The loader as Staff meet it (US-SET-12 AC3, US-REG-05).
 *
 * Staff hold `regView`, which is all `GET /attendees` asks, so the directory
 * is theirs to read — the door looks people up in it. The invite panel's event
 * list comes from `GET /events`, which needs `evCreate`, and Staff do not hold
 * that. Fetched bare inside the loader's `Promise.all`, that one 403 rejected
 * the whole loader and Staff got the error screen instead of the directory.
 */
describe('the directory loader, for someone who may not list events', () => {
  const attendee: AttendeeWire = {
    id: 3425,
    name: 'Anong Pattana',
    email: 'anong.p@example.com',
    phone: null,
    company: null,
    tag: null,
    firstSeenAt: '2026-07-01T02:00:00.000Z',
    lastActivityAt: '2026-07-08T17:30:00.000Z',
    eventCount: 1,
    ticketCount: 1,
    checkedInCount: 0,
    version: 1,
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  function signedInAsStaff() {
    // The session guard reads the persona and token from `localStorage`; the
    // same minimal store `loaders.spec.ts` uses rather than a whole jsdom.
    const store: Record<string, string> = {
      'eventa.persona': 'admin',
      'eventa.accessToken': 'stub',
    }
    vi.stubGlobal('window', {
      localStorage: { getItem: (k: string) => store[k] ?? null },
      location: { pathname: '/admin/attendees', search: '' },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/events')) {
          return json(403, {
            success: false,
            statusCode: 403,
            code: 'FORBIDDEN',
            message: 'You do not have permission to do that.',
          })
        }
        return json(200, {
          success: true,
          statusCode: 200,
          message: '',
          data: [attendee],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            counts: { all: 1, new: 1, checkedIn: 0, vip: 0 },
          },
        })
      }),
    )
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('still returns the attendees, with no events to invite to', async () => {
    signedInAsStaff()

    const data = (await directoryRoute.loader({
      request: new Request('http://x/admin/attendees'),
      params: {},
    })) as DirectoryData

    expect(data.rows.map((row) => row.id)).toEqual([3425])
    expect(data.events).toEqual([])
  })
})
