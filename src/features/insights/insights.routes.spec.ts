import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventsApi } from '@/features/events/events.api'
import { api, ApiError } from '@/lib/api'
import { attendanceReportRoute, registrationsReportRoute } from './insights.routes'
import type {
  AttendanceReportWire,
  ChangeWire,
  RegistrationsReportWire,
} from './insights.types'

/*
 * The report loaders, against a stubbed API.
 *
 * What is worth proving here is which failures a page survives. The filter's
 * event list comes from `GET /events`, which needs `evCreate` — and Staff, who
 * the registrations and attendance reports are FOR (US-RPT-08 AC3, US-RPT-12
 * AC1), do not hold it. That 403 is an answer about a dropdown, not about the
 * report, and must not replace the report with an error page.
 */

const FLAT: ChangeWire = { direction: 'flat', percent: null, improved: null }
const PERIOD = { from: '2025-10-16', to: '2026-10-15', days: 365, trimmed: false }

const REGISTRATIONS: RegistrationsReportWire = {
  period: PERIOD,
  rows: [
    {
      eventId: 'e-1',
      eventName: 'Tech Summit 2026',
      startAt: '2026-11-02T02:00:00.000Z',
      confirmed: 3,
      pending: 1,
      waitlisted: 0,
      cancelled: 1,
      rejected: 0,
      total: 5,
    },
  ],
  matchedEvents: 1,
  totals: { confirmed: 3, pending: 1, waitlisted: 0, cancelled: 1, rejected: 0, total: 5 },
  changes: {
    confirmed: FLAT,
    pending: FLAT,
    waitlisted: FLAT,
    cancelled: FLAT,
    rejected: FLAT,
    total: FLAT,
  },
}

const ATTENDANCE: AttendanceReportWire = {
  period: PERIOD,
  rows: [],
  matchedEvents: 0,
  totals: { checkedIn: 0, noShows: null, attendanceRate: null, onTimeRate: null },
  changes: { checkedIn: FLAT, noShows: FLAT, attendanceRate: FLAT, onTimeRate: FLAT },
}

const REPORTS: Record<string, unknown> = {
  '/reports/registrations': REGISTRATIONS,
  '/reports/attendance': ATTENDANCE,
}

const forbidden = () =>
  new ApiError(403, { message: 'Missing required permission: evCreate.' })

const args = (path: string) => ({
  request: new Request(`http://localhost${path}`),
  params: {},
})

beforeEach(() => {
  // A minimal store rather than jsdom: `session` reads two keys, and the
  // loader's guard needs an organizer's session to let the load run.
  const store: Record<string, string> = {
    'eventa.persona': 'admin',
    'eventa.accessToken': 'stub',
  }
  vi.stubGlobal('window', {
    localStorage: { getItem: (key: string) => store[key] ?? null },
    location: { pathname: '/admin/reports', search: '' },
  })
  vi.spyOn(api, 'get').mockImplementation((path: string) =>
    Promise.resolve(REPORTS[path] as never),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe.each([
  ['registrations', registrationsReportRoute, '/admin/reports-registrations'],
  ['attendance', attendanceReportRoute, '/admin/reports-attendance'],
] as const)('the %s report, for a reader who may not list events', (_name, route, path) => {
  it('still loads, with no events to filter by', async () => {
    vi.spyOn(eventsApi, 'list').mockRejectedValue(forbidden())

    const data = await route.loader(args(path))

    expect(data.events).toEqual([])
    expect(data.period).toEqual(PERIOD)
  })

  it('still fails on anything that is not a refusal', async () => {
    // A 500 is the product being broken, not the reader lacking a permission.
    vi.spyOn(eventsApi, 'list').mockRejectedValue(new ApiError(500, {}))

    await expect(route.loader(args(path))).rejects.toMatchObject({ status: 500 })
  })
})

describe('the registrations report, for a reader who may list events', () => {
  it('offers them in the filter', async () => {
    vi.spyOn(eventsApi, 'list').mockResolvedValue({
      items: [
        {
          id: 'e-1',
          name: 'Tech Summit 2026',
          startAt: '2026-11-02T02:00:00.000Z',
          status: 'published',
        },
      ],
      meta: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    } as never)

    const data = await registrationsReportRoute.loader(args('/admin/reports-registrations'))

    expect(data.events.map((event) => event.id)).toEqual(['e-1'])
    expect(data.rows.map((row) => row.total)).toEqual(['5'])
  })
})
