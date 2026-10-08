import { bangkokTime, initials, num } from '@/lib/format'
import { ALERT_LOOK, SHARE_COLORS, avatarTint, cardLook, meetingTint } from './overview.presentation'
import type {
  ActiveEventWire,
  AlertRow,
  AlertWire,
  FeedItemWire,
  Language,
  MeetingRow,
  MeetingWire,
  RegistrationRow,
  ShareSlice,
  TodayRegistrations,
  TodayWire,
  UpcomingCard,
  UpcomingEventWire,
} from './overview.types'

/** The rules behind the home screen (US-DASH-01..07). */

/** Where this app mounts the modules the API's alert links name. */
const CONSOLE = '/admin'

const SEPARATOR = ' · '

export function toRegistrationRow(wire: FeedItemWire): RegistrationRow {
  return {
    id: wire.orderId,
    name: wire.attendeeName,
    initials: initials(wire.attendeeName),
    detail: [wire.eventName, wire.ticketTypeName].filter(Boolean).join(SEPARATOR),
    time: bangkokTime(wire.registeredAt),
    tint: avatarTint(wire.attendeeName),
  }
}

/**
 * The Today's Registrations panel (US-DASH-02).
 *
 * `count` and `recent` answer different questions — how many came in today, and
 * who the newest sign-ups are, whenever they happened — so whether the panel is
 * "empty" is the API's call, carried through in `emptyMessage`.
 */
export function toTodayRegistrations(wire: TodayWire): TodayRegistrations {
  return {
    count: wire.count,
    rows: wire.recent.map(toRegistrationRow),
    emptyMessage: wire.emptyMessage,
  }
}

export function toAlertRow(wire: AlertWire, language: Language): AlertRow {
  return {
    id: wire.kind,
    ...ALERT_LOOK[wire.severity],
    text: wire.message[language],
    to: consoleHref(wire.href),
  }
}

/**
 * `/registrations?status=pending` → `/admin/registrations?status=pending`.
 *
 * The API names the module that owns the fix, not this app's route table. It
 * already answers some links with the mount point included, so prefixing
 * blindly would produce `/admin/admin/tickets` and a 404 on the one screen
 * whose whole job is to link out.
 */
function consoleHref(href: string): string {
  return href.startsWith(`${CONSOLE}/`) ? href : CONSOLE + href
}

export function toUpcomingCard(wire: UpcomingEventWire): UpcomingCard {
  return {
    id: wire.id,
    slug: wire.slug,
    title: wire.name,
    daysLabel: daysLabel(wire.daysLeft),
    progress: wire.fillPercent,
    attendees: `+${num(wire.sold)}`,
    initials: initials(wire.name),
    look: cardLook(wire.slug),
  }
}

const TODAY = 'Today'

/**
 * A countdown never runs backwards on this panel: the list is "upcoming", so
 * anything at or past its start reads as happening today rather than "-1 days
 * left", which would look like a bug to the person whose event it is.
 */
function daysLabel(daysLeft: number): string {
  if (daysLeft <= 0) return TODAY
  return daysLeft === 1 ? '1 day left' : `${daysLeft} days left`
}

const WHOLE_RING = 100

/**
 * Each active event's share of the sign-ups across them (US-DASH-05).
 *
 * Percentages are whole numbers so the legend reads cleanly, and the largest
 * slice absorbs the rounding remainder — a ring is a whole, and three even
 * thirds must not leave a 1% gap in it.
 */
export function toShareSlices(events: readonly ActiveEventWire[]): ShareSlice[] {
  const total = events.reduce((sum, e) => sum + e.registrations, 0)
  const slices = events.map((event, i) => ({
    name: event.name,
    percent: total === 0 ? 0 : Math.round((event.registrations / total) * WHOLE_RING),
    color: SHARE_COLORS[i % SHARE_COLORS.length],
  }))

  return total === 0 ? slices : absorbRemainder(slices)
}

function absorbRemainder(slices: ShareSlice[]): ShareSlice[] {
  const drawn = slices.reduce((sum, s) => sum + s.percent, 0)
  const largest = slices.reduce((a, b) => (b.percent > a.percent ? b : a))
  largest.percent += WHOLE_RING - drawn
  return slices
}

export function toMeetingRow(wire: MeetingWire): MeetingRow {
  return {
    id: wire.id,
    title: wire.title,
    time: timeSpan(wire.timeLabel),
    who: [wire.role ?? wire.type, wire.person].join(SEPARATOR),
    tint: meetingTint(wire.id),
  }
}

/**
 * `Today · 10:00 – 10:30` → `10:00 – 10:30`.
 *
 * The API prefixes today's meetings with the day because its list mixes
 * buckets. This panel shows nothing but today, so the prefix is dead weight in
 * a row that has three lines to fit.
 */
function timeSpan(timeLabel: string): string {
  const [, span] = timeLabel.split(SEPARATOR)
  return span ?? timeLabel
}
