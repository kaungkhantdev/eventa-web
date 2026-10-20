import type { BadgeTone } from '@/components/ui'
import { MASKED, bangkokDate } from '@/lib/format'
import type { CalendarConnectionStatus, CalendarConnectionWire } from './calendarConnection.api'

/** The rules behind Settings → Integrations and the Meetings header (US-MTG-08). */

/** Where an Admin connects, reconnects and disconnects Google Calendar. */
export const INTEGRATIONS_PATH = '/admin/settings-integrations'

/** The search parameter eventa-api's callback redirects back with. */
export const CALENDAR_RETURN_PARAM = 'calendar'

export interface CalendarConnectionCard {
  statusLabel: string
  statusTone: BadgeTone
  /** Why there is nothing to do — the server has no Google client. */
  note: string | null
  /** Why something must be done — Google stopped accepting the connection. */
  warning: string | null
  /** Whether the Account and Connected facts describe anything. */
  showFacts: boolean
  account: string
  connectedOn: string
  primary: 'connect' | 'reconnect' | null
  canDisconnect: boolean
  /** Said to someone who is shown the status but offered no button. */
  adminNote: string | null
}

interface StatusLook {
  label: string
  tone: BadgeTone
  note: string | null
  warning: string | null
  showFacts: boolean
  primary: CalendarConnectionCard['primary']
  canDisconnect: boolean
}

/**
 * One row per status, so a status the API gains needs a row here rather than
 * another branch threaded through the card.
 */
const STATUS_LOOK: Record<CalendarConnectionStatus, StatusLook> = {
  not_configured: {
    label: 'Not set up',
    tone: 'gray',
    note: "Google Calendar isn't set up on this server yet.",
    warning: null,
    showFacts: false,
    primary: null,
    canDisconnect: false,
  },
  disconnected: {
    label: 'Not connected',
    tone: 'gray',
    note: null,
    warning: null,
    showFacts: false,
    primary: 'connect',
    canDisconnect: false,
  },
  connected: {
    label: 'Connected',
    tone: 'green',
    note: null,
    warning: null,
    showFacts: true,
    primary: null,
    canDisconnect: true,
  },
  // Amber, and said in words: an expired connection sends no invites, and
  // from the Meetings page that looks the same as one that does.
  expired: {
    label: 'Reconnect needed',
    tone: 'amber',
    note: null,
    warning: 'Google stopped accepting this connection. Reconnect to keep sending invites.',
    showFacts: true,
    primary: 'reconnect',
    canDisconnect: true,
  },
}

const ADMIN_NOTE = 'Only an Admin can connect or disconnect Google Calendar.'

export function toCalendarConnectionCard(
  wire: CalendarConnectionWire,
  canManage: boolean,
): CalendarConnectionCard {
  const look = STATUS_LOOK[wire.status]
  return {
    statusLabel: look.label,
    statusTone: look.tone,
    note: look.note,
    warning: look.warning,
    showFacts: look.showFacts,
    // The API withholds the address from anyone who cannot change it
    // (NFR-PDPA-04); a dash says "not shown" where a blank would say "none".
    account: wire.accountEmail ?? MASKED,
    connectedOn: bangkokDate(wire.connectedAt),
    // Hiding the buttons only tidies the page — the API answers 403 anyway.
    primary: canManage ? look.primary : null,
    canDisconnect: canManage && look.canDisconnect,
    adminNote: canManage ? null : ADMIN_NOTE,
  }
}

/** What a link to the Integrations page says, from the state it would fix. */
export function connectLinkLabel(status: CalendarConnectionStatus): string {
  return status === 'expired' ? 'Reconnect Google Calendar' : 'Connect Google Calendar'
}

/** The Meetings header's calendar chip. */
export interface CalendarChip {
  icon: string
  iconClass: string
  label: string
  /** Set only for someone who can act on it — everyone else is told, not linked. */
  to: string | null
  title: string | null
}

const CHIP_ICON: Record<CalendarConnectionStatus, { icon: string; iconClass: string }> = {
  connected: { icon: 'hgi-checkmark-badge-01', iconClass: 'text-brand' },
  disconnected: { icon: 'hgi-calendar-03', iconClass: '' },
  not_configured: { icon: 'hgi-calendar-03', iconClass: '' },
  expired: { icon: 'hgi-alert-circle', iconClass: 'text-amber-500' },
}

/** What the chip tells someone who cannot connect it themselves. */
const VIEWER_CHIP_LABEL: Record<CalendarConnectionStatus, string> = {
  connected: 'Google Calendar',
  disconnected: 'Calendar not connected',
  not_configured: 'Calendar not connected',
  expired: 'Calendar needs reconnecting',
}

/**
 * The chip beside "Schedule meeting" (US-MTG-08 AC1, AC3). Connected, it is
 * the kit's own "Google Calendar" badge. Otherwise it says invites are not
 * going out — as a link for an Admin, who can fix it, and as plain words for
 * everyone else, who cannot.
 */
export function calendarChipOf(status: CalendarConnectionStatus, canManage: boolean): CalendarChip {
  if (status === 'connected') {
    return {
      ...CHIP_ICON.connected,
      label: VIEWER_CHIP_LABEL.connected,
      to: null,
      title: 'Meetings sync with your Google Calendar',
    }
  }
  return {
    ...CHIP_ICON[status],
    label: canManage ? connectLinkLabel(status) : VIEWER_CHIP_LABEL[status],
    to: canManage ? INTEGRATIONS_PATH : null,
    title: null,
  }
}

export interface ReturnToast {
  tone: 'success' | 'error'
  message: string
}

/** Keyed by the only three words eventa-api's callback ever redirects with. */
const RETURN_TOAST: Readonly<Record<string, ReturnToast>> = {
  connected: { tone: 'success', message: 'Google Calendar connected.' },
  denied: {
    tone: 'error',
    message: "Google Calendar wasn't connected — calendar access wasn't granted.",
  },
  failed: { tone: 'error', message: "Google Calendar couldn't be connected. Try again." },
}

/**
 * What to announce on landing back from Google. Anything other than the three
 * outcomes the API reports was typed by somebody, and is not announced.
 */
export function returnToastOf(param: string | null): ReturnToast | null {
  if (param === null || !Object.hasOwn(RETURN_TOAST, param)) return null
  return RETURN_TOAST[param]
}

const FOLLOWABLE_PROTOCOLS = new Set(['https:', 'http:'])

/**
 * The consent page the connect action answered with, if it is one the browser
 * may be sent to. Only a web address: `location.assign('javascript:…')` would
 * run in this console's origin, so anything else is refused here.
 *
 * Parsed with `new URL` in a try, not `URL.canParse`: the build still targets
 * Chrome 111 and Safari/iOS 16.4, which lack it, and this runs while
 * rendering, so a throw would replace the page with the route error screen.
 */
export function authorizeUrlOf(result: { ok: boolean; [field: string]: unknown } | undefined) {
  const url = result?.ok === true ? result.authorizeUrl : undefined
  if (typeof url !== 'string') return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  return FOLLOWABLE_PROTOCOLS.has(parsed.protocol) ? url : null
}
