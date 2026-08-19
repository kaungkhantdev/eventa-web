import type { DashboardData } from './dashboard.routes'

/**
 * Whether the dashboard should show one guided block instead of its charts.
 *
 * A brand-new workspace draws five zeroed cards, a flat line on an empty axis
 * and a donut with no ring. That reads as a broken page rather than a new one,
 * so the kit (admin/dashboard.html) replaces the whole thing with a single card
 * that says what will fill it — the same trade Home makes in `firstRun.ts`.
 *
 * Emptiness has to be *proven*, and the block asks for two separate proofs,
 * because it says two things: that nothing has sold, and that there is no event
 * to sell for. Sales alone would not carry it — an organizer who publishes two
 * events and looks at the dashboard before the first ticket goes has an empty
 * feed, an empty mix, an empty selling-fast list and a flat line, and telling
 * them to create their first event would contradict the very card the block
 * hides. So the upcoming-events count has to be zero too, the same evidence
 * Home leans on in `firstRun.ts`.
 *
 * Of the sales figures, the recent-registrations feed is the strong one: it is
 * the newest sign-ups regardless of the selected period, so an empty feed means
 * the workspace has never taken a registration — not merely that this week was
 * quiet. The selling-fast list is period-independent too. The tier mix and the
 * revenue trend are scoped to the chosen range, so they are read only as
 * *dis*qualifiers: either one having something in it settles the question, but
 * neither being empty says anything on its own.
 *
 * Absences are not evidence:
 *
 * - Without `regView` the API sends the same empty feed it sends a workspace
 *   with nothing in it. That is masking, and mistaking it for emptiness would
 *   greet a returning organizer with "create your first event" purely because
 *   of their own role. Hence the caller passes what it may see.
 * - A withheld upcoming-events count (`null`) is unknown, not zero, so it
 *   leaves the claim unproven rather than confirming it.
 * - Without finance access the revenue trend is `null`. That one is safe to
 *   pass over, because it is redundant: there is no revenue without a
 *   registration, and the registration feed is still readable.
 */
export function isDashboardFirstRun(data: DashboardData, canSeeRegistrations: boolean): boolean {
  // Hidden by permission is not evidence of emptiness.
  if (!canSeeRegistrations) return false

  // An event already on the calendar disqualifies "create your first event" —
  // and so does not knowing how many there are.
  if (data.upcomingEvents === null || data.upcomingEvents > 0) return false

  if (data.recent.length > 0) return false
  if (data.sellingFast.length > 0) return false
  if (data.tiers.length > 0) return false
  if (data.revenue !== null && data.revenue.values.some((point) => point > 0)) return false

  return true
}
