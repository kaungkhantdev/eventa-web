import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarConnectionStatus, CalendarConnectionWire } from './calendarConnection.api'
import { authorizeUrlOf, calendarChipOf, connectLinkLabel, returnToastOf, toCalendarConnectionCard } from './calendarConnection.mapper'
import { INTEGRATIONS_PATH } from '@/lib/constants/settings.constants'

const wire = (over: Partial<CalendarConnectionWire> = {}): CalendarConnectionWire => ({
  provider: 'google',
  status: 'connected',
  accountEmail: 'calendar@acme.test',
  connectedAt: '2026-10-19T18:30:00.000Z',
  ...over,
})

/**
 * Every status eventa-api's `CalendarConnectionDto` can send, written out
 * rather than taken from the union so a status added there has to be given
 * words here before this file compiles.
 */
const API_STATUSES = [
  'not_configured',
  'disconnected',
  'connected',
  'expired',
] as const satisfies readonly CalendarConnectionStatus[]

const ADMIN = true
const VIEWER = false

const ADMIN_NOTE = 'Only an Admin can connect or disconnect Google Calendar.'

/*
 * US-MTG-08: Settings → Integrations is where an Admin connects, reconnects
 * and disconnects the workspace's Google Calendar, and where everyone else
 * can see whether invites are going out.
 */
describe('toCalendarConnectionCard', () => {
  it('says the server has no Google client yet, and offers nothing to press', () => {
    const card = toCalendarConnectionCard(wire({ status: 'not_configured' }), ADMIN)

    expect(card.statusLabel).toBe('Not set up')
    expect(card.statusTone).toBe('gray')
    expect(card.note).toBe("Google Calendar isn't set up on this server yet.")
    expect(card.primary).toBeNull()
    expect(card.canDisconnect).toBe(false)
    expect(card.showFacts).toBe(false)
  })

  it('offers to connect a workspace that is not connected', () => {
    const card = toCalendarConnectionCard(
      wire({ status: 'disconnected', accountEmail: null, connectedAt: null }),
      ADMIN,
    )

    expect(card.statusLabel).toBe('Not connected')
    expect(card.statusTone).toBe('gray')
    expect(card.primary).toBe('connect')
    expect(card.canDisconnect).toBe(false)
    expect(card.note).toBeNull()
    expect(card.warning).toBeNull()
    expect(card.showFacts).toBe(false)
  })

  it('shows which account is connected, and since when, with a way to disconnect', () => {
    const card = toCalendarConnectionCard(wire(), ADMIN)

    expect(card.statusLabel).toBe('Connected')
    expect(card.statusTone).toBe('green')
    expect(card.showFacts).toBe(true)
    expect(card.account).toBe('calendar@acme.test')
    // 01:30 on the 20th in Bangkok, still the 19th in UTC: the day is Thai.
    expect(card.connectedOn).toBe('Oct 20, 2026')
    expect(card.primary).toBeNull()
    expect(card.canDisconnect).toBe(true)
    expect(card.warning).toBeNull()
  })

  // Google stopped accepting the token — the worker marked it. Invites have
  // stopped, which looks exactly like working unless it is said.
  it('warns that an expired connection needs reconnecting, and offers both ways out', () => {
    const card = toCalendarConnectionCard(wire({ status: 'expired' }), ADMIN)

    expect(card.statusLabel).toBe('Reconnect needed')
    expect(card.statusTone).toBe('amber')
    expect(card.warning).toBe(
      'Google stopped accepting this connection. Reconnect to keep sending invites.',
    )
    expect(card.showFacts).toBe(true)
    expect(card.account).toBe('calendar@acme.test')
    expect(card.primary).toBe('reconnect')
    expect(card.canDisconnect).toBe(true)
  })

  it('has no Admin note for someone who can change it', () => {
    for (const status of API_STATUSES) {
      expect(toCalendarConnectionCard(wire({ status }), ADMIN).adminNote).toBeNull()
    }
  })

  // Hiding the buttons only tidies the page — the API answers 403 regardless.
  it.each(API_STATUSES)(
    'offers no button to someone who cannot manage integrations (%s), and says who can',
    (status) => {
      const card = toCalendarConnectionCard(wire({ status, accountEmail: null }), VIEWER)

      expect(card.primary).toBeNull()
      expect(card.canDisconnect).toBe(false)
      expect(card.adminNote).toBe(ADMIN_NOTE)
    },
  )

  // The API withholds the address from anyone without setIntegrations
  // (NFR-PDPA-04), so the fact still renders — as a dash, not a blank.
  it('shows a dash where the API withheld the account', () => {
    const card = toCalendarConnectionCard(wire({ accountEmail: null }), VIEWER)

    expect(card.showFacts).toBe(true)
    expect(card.account).toBe('—')
  })

  it('shows a dash for a missing connection date', () => {
    expect(toCalendarConnectionCard(wire({ connectedAt: null }), ADMIN).connectedOn).toBe('—')
  })
})

describe('connectLinkLabel', () => {
  it('asks to reconnect a connection Google stopped accepting', () => {
    expect(connectLinkLabel('expired')).toBe('Reconnect Google Calendar')
  })

  it.each(['disconnected', 'not_configured', 'connected'] as const)(
    'asks to connect otherwise (%s)',
    (status) => {
      expect(connectLinkLabel(status)).toBe('Connect Google Calendar')
    },
  )
})

/*
 * US-MTG-08 AC1/AC3: the Meetings header says whether invites are going out,
 * and sends an Admin to the page that fixes it. Everyone else is told, not
 * linked to buttons they would not be offered.
 */
describe('calendarChipOf', () => {
  it.each([ADMIN, VIEWER])('names Google Calendar once connected (admin: %s)', (canManage) => {
    expect(calendarChipOf('connected', canManage)).toEqual({
      icon: 'hgi-checkmark-badge-01',
      iconClass: 'text-brand',
      label: 'Google Calendar',
      to: null,
      title: 'Meetings sync with your Google Calendar',
    })
  })

  it.each(['disconnected', 'not_configured'] as const)(
    'links an Admin to connect it when %s',
    (status) => {
      expect(calendarChipOf(status, ADMIN)).toEqual({
        icon: 'hgi-calendar-03',
        iconClass: '',
        label: 'Connect Google Calendar',
        to: INTEGRATIONS_PATH,
        title: null,
      })
    },
  )

  it.each(['disconnected', 'not_configured'] as const)(
    'tells everyone else it is not connected when %s',
    (status) => {
      expect(calendarChipOf(status, VIEWER)).toEqual({
        icon: 'hgi-calendar-03',
        iconClass: '',
        label: 'Calendar not connected',
        to: null,
        title: null,
      })
    },
  )

  it('links an Admin to reconnect an expired connection', () => {
    expect(calendarChipOf('expired', ADMIN)).toEqual({
      icon: 'hgi-alert-circle',
      iconClass: 'text-amber-500',
      label: 'Reconnect Google Calendar',
      to: INTEGRATIONS_PATH,
      title: null,
    })
  })

  it('tells everyone else an expired connection needs reconnecting', () => {
    expect(calendarChipOf('expired', VIEWER)).toEqual({
      icon: 'hgi-alert-circle',
      iconClass: 'text-amber-500',
      label: 'Calendar needs reconnecting',
      to: null,
      title: null,
    })
  })

  it('links to the Integrations settings page', () => {
    expect(INTEGRATIONS_PATH).toBe('/admin/settings-integrations')
  })
})

/*
 * Google sends the browser back to eventa-api, which redirects to
 * `?calendar=<outcome>` here. The word is all that comes back — never a code,
 * an address or a reason — so it is all the toast can be built from.
 */
describe('returnToastOf', () => {
  it('confirms a connection', () => {
    expect(returnToastOf('connected')).toEqual({
      tone: 'success',
      message: 'Google Calendar connected.',
    })
  })

  it('says calendar access was not granted when the Admin declined it', () => {
    expect(returnToastOf('denied')).toEqual({
      tone: 'error',
      message: "Google Calendar wasn't connected — calendar access wasn't granted.",
    })
  })

  it('says the connection failed, and to try again', () => {
    expect(returnToastOf('failed')).toEqual({
      tone: 'error',
      message: "Google Calendar couldn't be connected. Try again.",
    })
  })

  // Anything else in the URL was typed or pasted by somebody; it is not an
  // outcome the API reported, so nothing is announced.
  it.each(['', 'CONNECTED', 'ok', '<script>'])('announces nothing for %j', (param) => {
    expect(returnToastOf(param)).toBeNull()
  })

  it('announces nothing without the parameter', () => {
    expect(returnToastOf(null)).toBeNull()
  })
})

/*
 * The connect action answers with the Google consent page's address, and the
 * page sends the browser there. Only a web address is followed: anything else
 * handed to `location.assign` — a `javascript:` URL — would run in this
 * console's origin.
 */
describe('authorizeUrlOf', () => {
  it('follows the address the API answered with', () => {
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=1.abc'

    expect(authorizeUrlOf({ ok: true, authorizeUrl: url })).toBe(url)
  })

  // The fake provider points straight back at the API's callback on localhost.
  it('follows a plain http address too', () => {
    const url = 'http://localhost:3190/api/v1/public/calendar-connection/google/callback?code=x'

    expect(authorizeUrlOf({ ok: true, authorizeUrl: url })).toBe(url)
  })

  it('follows nothing when the action failed', () => {
    expect(authorizeUrlOf({ ok: false, error: 'No.' })).toBeNull()
  })

  it.each([undefined, 42, '', 'not a url', 'javascript:alert(1)', 'data:text/html,hi'])(
    'follows nothing for %j',
    (authorizeUrl) => {
      expect(authorizeUrlOf({ ok: true, authorizeUrl })).toBeNull()
    },
  )

  it('follows nothing before the action has answered', () => {
    expect(authorizeUrlOf(undefined)).toBeNull()
  })

  /*
   * The build still targets Chrome 111 and Safari/iOS 16.4 (Vite's default,
   * and Tailwind 4's floor), which have no `URL.canParse` — it arrived in
   * Chrome 120 and Safari 17. ConnectButton calls this while rendering, so a
   * throw there would swap Settings → Integrations for the error screen and
   * the Admin would never reach Google. Node has `canParse`; take it away.
   */
  describe('on a browser without URL.canParse', () => {
    beforeEach(() => {
      class UrlBeforeCanParse extends URL {}
      Object.defineProperty(UrlBeforeCanParse, 'canParse', { value: undefined })
      vi.stubGlobal('URL', UrlBeforeCanParse)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('still follows the address the API answered with', () => {
      const url = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=1.abc'

      expect(authorizeUrlOf({ ok: true, authorizeUrl: url })).toBe(url)
    })

    it('still follows a plain http address', () => {
      const url = 'http://localhost:3190/api/v1/public/calendar-connection/google/callback?code=x'

      expect(authorizeUrlOf({ ok: true, authorizeUrl: url })).toBe(url)
    })

    it.each(['', 'not a url', 'javascript:alert(1)', 'data:text/html,hi'])(
      'still follows nothing for %j',
      (authorizeUrl) => {
        expect(authorizeUrlOf({ ok: true, authorizeUrl })).toBeNull()
      },
    )
  })
})
