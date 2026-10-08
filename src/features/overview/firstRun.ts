import type { HomeData } from './overview.routes'

/**
 * Whether Home should show the guided start instead of its six panels.
 *
 * A brand-new workspace renders every panel as "No X", which reads as broken
 * rather than new (the kit answers this with admin/home-empty.html). So when
 * there is genuinely nothing yet, Home shows the ordered path to a first sale
 * instead — one screen with somewhere to go, not six with nothing to say.
 *
 * Emptiness has to be *proven*, never assumed. A panel that failed to load says
 * nothing about whether the organizer has events, and neither does one hidden by
 * permission: counting either as empty would greet a returning organizer with
 * "create your first event" during an outage, with their real events untouched
 * on the server. Both therefore read as not-first-run.
 */
export function isFirstRun(home: HomeData): boolean {
  const { today, alerts, meetings, upcoming, ring } = home

  // Hidden by permission (`null`) is not evidence of emptiness.
  if (today === null || today.count > 0) return false
  if (alerts.length > 0) return false

  // A failed panel is unknown, not empty.
  if (!meetings.ok || meetings.data.count > 0) return false
  if (!upcoming.ok || upcoming.data.length > 0) return false
  if (!ring.ok || ring.data.active > 0) return false

  return true
}
