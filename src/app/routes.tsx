import type { ComponentType } from 'react'
import {
  createBrowserRouter,
  Navigate,
  type ActionFunction,
  type LoaderFunction,
} from 'react-router'
import AdminShell from '@/layouts/AdminShell'
import RootLayout, { RootFallback } from '@/layouts/RootLayout'
import NotFoundPage from '@/features/system/pages/NotFoundPage'
import { RouteError } from '@/features/system/components/RouteError'
import { ADMIN_ROUTE_ID, adminShellLoader } from '@/app/loaders'
import { guestOnly } from '@/features/auth/guestOnly'

/* Route manifest. Admin screens are nested under the shell and each declares a
   `handle.page` id — the static kit's `data-page` — which drives sidebar
   highlighting. Every page is code-split so the initial bundle stays small.

   Each page also gets a loading skeleton; those are declared separately in
   `pageSkeletons.tsx`, keyed by path. Add a route here, add its skeleton
   there. */

/**
 * Simulated per-page fetch latency, in milliseconds.
 *
 * Applies only to pages NOT YET wired to the API. Those still read from their
 * feature's `data/` module, so they have nothing to wait for and their
 * skeletons would flash past in the handful of milliseconds a chunk takes.
 * A migrated page passes its own loader to `page()` and waits on the real
 * request instead — see `@/app/loaders`.
 *
 * When the last page is migrated this constant and `pageLoader` go with it.
 */
export const PAGE_LOAD_MS = 350

/** Stand-in for the data fetch a not-yet-migrated page will eventually do. */
const pageLoader = async (): Promise<null> => {
  if (PAGE_LOAD_MS > 0) await new Promise((resolve) => setTimeout(resolve, PAGE_LOAD_MS))
  return null
}

/**
 * Declares a code-split page: the lazy component plus the loader above.
 *
 * The loader is what makes the skeleton visible — React Router reports
 * `navigation.state === 'loading'` for the whole time the chunk is being
 * fetched and the loader is running, and the layouts render a placeholder for
 * that window. Unlike `lazy` (which resolves once and is then cached), the
 * loader runs on every visit, so revisiting a page still shows its skeleton.
 */
const page = (
  load: () => Promise<{ default: ComponentType }>,
  /** A migrated page passes its real loader; the rest get the stand-in. */
  loader: LoaderFunction = pageLoader,
) => ({
  loader,
  errorElement: ERROR_ELEMENT,
  lazy: async () => ({ Component: (await load()).default }),
})

/**
 * The unhappy path, given to every page by the two helpers below.
 *
 * Declared once here rather than per route because the alternative is a route
 * that silently has none — and a page without an error element does not fail
 * quietly, it prints React Router's developer screen and a stack trace at
 * whoever is using the product. Attached to the *page*, not to the shell, so an
 * admin failure renders inside the outlet and the rail stays usable.
 */
const ERROR_ELEMENT = <RouteError />

/** A page's data functions, defined beside the feature they belong to. */
interface RouteData {
  loader: LoaderFunction
  action?: ActionFunction
}

/**
 * A page wired to the API.
 *
 * Its loader and action are fetched with the component rather than declared
 * here, so neither the feature's API client nor its mappers are pulled into
 * the initial bundle — `routes.tsx` stays a manifest, and each screen still
 * arrives as one chunk.
 */
const livePage = (
  load: () => Promise<{ default: ComponentType }>,
  route: () => Promise<RouteData>,
) => ({
  errorElement: ERROR_ELEMENT,
  lazy: async () => {
    const [{ default: Component }, data] = await Promise.all([load(), route()])
    return { Component, ...data }
  },
})

const adminChildren = [
  {
    path: 'home',
    ...livePage(
      () => import('@/features/overview/pages/HomePage'),
      () => import('@/features/overview/overview.routes').then((m) => m.homeRoute),
    ),
    handle: { page: 'home' },
  },
  {
    path: 'dashboard',
    ...livePage(
      () => import('@/features/overview/pages/DashboardPage'),
      () => import('@/features/overview/dashboard.routes').then((m) => m.dashboardRoute),
    ),
    handle: { page: 'dashboard' },
  },
  {
    path: 'events',
    ...livePage(
      () => import('@/features/events/pages/EventsPage'),
      () => import('@/features/events/events.routes').then((m) => m.eventsRoute),
    ),
    handle: { page: 'events' },
  },
  {
    path: 'events-upcoming',
    ...livePage(
      () => import('@/features/events/pages/UpcomingEventsPage'),
      () => import('@/features/events/events.routes').then((m) => m.upcomingRoute),
    ),
    handle: { page: 'events-upcoming' },
  },
  {
    path: 'event-form',
    ...livePage(
      () => import('@/features/events/pages/EventFormPage'),
      () => import('@/features/events/eventForm.routes').then((m) => m.eventFormRoute),
    ),
    // focused create wizard: keep the icon rail, hide the module sub-nav panel
    handle: { page: 'event-form', focused: true },
  },
  {
    path: 'event-detail',
    ...livePage(
      () => import('@/features/events/pages/EventDetailPage'),
      () => import('@/features/events/eventDetail.routes').then((m) => m.eventDetailRoute),
    ),
    handle: { page: 'events' },
  },
  {
    path: 'event-categories',
    ...livePage(
      () => import('@/features/events/pages/EventCategoriesPage'),
      () => import('@/features/events/events.routes').then((m) => m.categoriesRoute),
    ),
    handle: { page: 'event-categories' },
  },
  {
    path: 'landing-pages',
    ...livePage(
      () => import('@/features/events/pages/LandingPagesPage'),
      () => import('@/features/events/events.routes').then((m) => m.landingPagesRoute),
    ),
    handle: { page: 'landing-pages' },
  },
  {
    path: 'tickets',
    ...livePage(
      () => import('@/features/ticketing/pages/TicketsPage'),
      () => import('@/features/ticketing/tickets.routes').then((m) => m.ticketsRoute),
    ),
    handle: { page: 'tickets' },
  },
  {
    // A resource route: the share link and QR for ONE tier, fetched when the
    // modal opens. Loading ten of them with the ten cards would be ten requests
    // to answer a question nobody asked.
    path: 'tickets/share',
    lazy: async () => ({
      loader: (await import('@/features/ticketing/tickets.routes')).ticketShareRoute.loader,
    }),
  },
  {
    // A resource route: the station's manual search, asked only once somebody
    // types into it.
    path: 'check-in/search',
    lazy: async () => ({
      loader: (await import('@/features/checkin-tool/door.routes')).checkInSearchRoute.loader,
    }),
  },
  {
    path: 'discounts',
    ...livePage(
      () => import('@/features/ticketing/pages/DiscountsPage'),
      () => import('@/features/ticketing/discounts.routes').then((m) => m.discountsRoute),
    ),
    handle: { page: 'discounts' },
  },
  {
    path: 'agenda',
    ...livePage(
      () => import('@/features/program/pages/AgendaPage'),
      () => import('@/features/program/program.routes').then((m) => m.agendaRoute),
    ),
    handle: { page: 'agenda' },
  },
  {
    path: 'speakers',
    ...livePage(
      () => import('@/features/program/pages/SpeakersPage'),
      () => import('@/features/program/program.routes').then((m) => m.speakersRoute),
    ),
    handle: { page: 'speakers' },
  },
  {
    path: 'registrations',
    ...livePage(
      () => import('@/features/attendees/pages/RegistrationsPage'),
      () => import('@/features/attendees/registrations.routes').then((m) => m.registrationsRoute),
    ),
    handle: { page: 'registrations' },
  },
  {
    path: 'attendees',
    ...livePage(
      () => import('@/features/attendees/pages/AttendeesPage'),
      () => import('@/features/attendees/directory.routes').then((m) => m.directoryRoute),
    ),
    handle: { page: 'attendees' },
  },
  {
    path: 'check-in',
    ...livePage(
      () => import('@/features/checkin-tool/pages/CheckInPage'),
      () => import('@/features/checkin-tool/door.routes').then((m) => m.checkInQueueRoute),
    ),
    handle: { page: 'checkin' },
  },
  {
    path: 'check-in-tool',
    ...livePage(
      () => import('@/features/checkin-tool/pages/CheckInToolPage'),
      () => import('@/features/checkin-tool/door.routes').then((m) => m.checkInStationRoute),
    ),
    handle: { page: 'checkin-tool' },
  },
  {
    path: 'meetings',
    ...livePage(
      () => import('@/features/meetings/pages/MeetingsPage'),
      () => import('@/features/meetings/meetings.routes').then((m) => m.meetingsRoute),
    ),
    handle: { page: 'meetings' },
  },
  {
    path: 'payments',
    ...livePage(
      () => import('@/features/finance/pages/PaymentsPage'),
      () => import('@/features/finance/payments.routes').then((m) => m.paymentsRoute),
    ),
    handle: { page: 'payments' },
  },
  {
    path: 'payouts',
    ...livePage(
      () => import('@/features/finance/pages/PayoutsPage'),
      () => import('@/features/finance/finance.routes').then((m) => m.payoutsRoute),
    ),
    handle: { page: 'payouts' },
  },
  {
    path: 'invoices',
    ...livePage(
      () => import('@/features/finance/pages/InvoicesPage'),
      () => import('@/features/finance/finance.routes').then((m) => m.invoicesRoute),
    ),
    handle: { page: 'invoices' },
  },
  {
    path: 'taxes',
    ...livePage(
      () => import('@/features/finance/pages/TaxesPage'),
      () => import('@/features/finance/finance.routes').then((m) => m.taxesRoute),
    ),
    handle: { page: 'taxes' },
  },
  {
    path: 'reports',
    ...livePage(
      () => import('@/features/insights/pages/ReportsOverviewPage'),
      () => import('@/features/insights/insights.routes').then((m) => m.overviewReportRoute),
    ),
    handle: { page: 'reports' },
  },
  {
    path: 'reports-income',
    ...livePage(
      () => import('@/features/insights/pages/ReportsIncomePage'),
      () => import('@/features/insights/insights.routes').then((m) => m.incomeReportRoute),
    ),
    handle: { page: 'reports-income' },
  },
  {
    path: 'reports-transactions',
    ...livePage(
      () => import('@/features/insights/pages/ReportsTransactionsPage'),
      () =>
        import('@/features/insights/insights.routes').then((m) => m.transactionsReportRoute),
    ),
    handle: { page: 'reports-transactions' },
  },
  {
    path: 'reports-payouts',
    ...page(() => import('@/features/insights/pages/ReportsPayoutsPage')),
    handle: { page: 'reports-payouts' },
  },
  {
    path: 'reports-registrations',
    ...livePage(
      () => import('@/features/insights/pages/ReportsRegistrationsPage'),
      () =>
        import('@/features/insights/insights.routes').then((m) => m.registrationsReportRoute),
    ),
    handle: { page: 'reports-registrations' },
  },
  {
    path: 'reports-attendance',
    ...livePage(
      () => import('@/features/insights/pages/ReportsAttendancePage'),
      () => import('@/features/insights/insights.routes').then((m) => m.attendanceReportRoute),
    ),
    handle: { page: 'reports-attendance' },
  },
  {
    path: 'reports-discounts',
    ...livePage(
      () => import('@/features/insights/pages/ReportsDiscountsPage'),
      () => import('@/features/insights/insights.routes').then((m) => m.discountsReportRoute),
    ),
    handle: { page: 'reports-discounts' },
  },
  {
    path: 'reports-events',
    ...livePage(
      () => import('@/features/insights/pages/ReportsEventsPage'),
      () => import('@/features/insights/insights.routes').then((m) => m.eventsReportRoute),
    ),
    handle: { page: 'reports-events' },
  },
  {
    path: 'notifications',
    ...livePage(
      () => import('@/features/engagement/pages/NotificationsPage'),
      () => import('@/features/engagement/notifications.routes').then((m) => m.notificationsRoute),
    ),
    handle: { page: 'notifications' },
  },
  {
    path: 'messaging-templates',
    ...livePage(
      () => import('@/features/engagement/pages/MessagingTemplatesPage'),
      async () => (await import('@/features/engagement/templates.routes')).messageTemplatesRoute,
    ),
    handle: { page: 'messaging-templates' },
  },
  {
    path: 'messaging-announcements',
    ...livePage(
      () => import('@/features/engagement/pages/MessagingAnnouncementsPage'),
      async () =>
        (await import('@/features/engagement/announcements.routes')).announcementsRoute,
    ),
    handle: { page: 'messaging-announcements' },
  },
  {
    path: 'messaging-log',
    ...livePage(
      () => import('@/features/engagement/pages/MessagingLogPage'),
      async () => (await import('@/features/engagement/deliveries.routes')).deliveriesRoute,
    ),
    handle: { page: 'messaging-log' },
  },
  {
    path: 'feedback',
    ...livePage(
      () => import('@/features/engagement/pages/FeedbackPage'),
      async () => (await import('@/features/engagement/surveys.routes')).feedbackRoute,
    ),
    handle: { page: 'feedback' },
  },
  {
    path: 'feedback-detail',
    ...livePage(
      () => import('@/features/engagement/pages/FeedbackDetailPage'),
      async () =>
        (await import('@/features/engagement/surveys.routes')).feedbackDetailRoute,
    ),
    handle: { page: 'feedback' },
  },
  {
    path: 'settings-profile',
    ...livePage(
      () => import('@/features/settings/pages/SettingsProfilePage'),
      () => import('@/features/settings/settings.routes').then((m) => m.profileRoute),
    ),
    handle: { page: 'settings-profile' },
  },
  {
    path: 'settings-security',
    ...livePage(
      () => import('@/features/settings/pages/SettingsSecurityPage'),
      () => import('@/features/settings/settings.routes').then((m) => m.securityRoute),
    ),
    handle: { page: 'settings-security' },
  },
  {
    path: 'settings-notifications',
    ...livePage(
      () => import('@/features/settings/pages/SettingsNotificationsPage'),
      () => import('@/features/settings/settings.routes').then((m) => m.notificationsRoute),
    ),
    handle: { page: 'settings-notifications' },
  },
  {
    path: 'settings-organization',
    ...livePage(
      () => import('@/features/settings/pages/SettingsOrganizationPage'),
      () => import('@/features/settings/settings.routes').then((m) => m.organizationRoute),
    ),
    handle: { page: 'settings-organization' },
  },
  {
    path: 'settings-payments',
    ...livePage(
      () => import('@/features/settings/pages/SettingsPaymentsPage'),
      () => import('@/features/settings/settings.routes').then((m) => m.paymentsRoute),
    ),
    handle: { page: 'settings-payments' },
  },
  {
    path: 'users',
    ...livePage(
      () => import('@/features/settings/pages/UsersPage'),
      () => import('@/features/settings/settings.routes').then((m) => m.usersRoute),
    ),
    handle: { page: 'users' },
  },
  {
    path: 'roles',
    ...livePage(
      () => import('@/features/settings/pages/RolesPage'),
      () => import('@/features/settings/settings.routes').then((m) => m.rolesRoute),
    ),
    handle: { page: 'roles' },
  },
]

export const router = createBrowserRouter([
  {
    // Pathless layout around every route: it owns the whole-screen skeleton
    // for first paint and for navigations that swap the entire page.
    Component: RootLayout,
    HydrateFallback: RootFallback,
    // The last catch: a failure with no nearer boundary — including one thrown
    // by a route that has no page of its own.
    errorElement: ERROR_ELEMENT,
    children: [
      {
        // `guestOnly` on the four sign-in and sign-up screens: with a session
        // already in hand these are a dead end that only offers ways to damage
        // it. It sends home only a visitor of the SAME persona, so switching
        // audiences still works — see `guestOnly.ts`.
        path: '/auth/login',
        ...page(() => import('@/features/auth/pages/LoginPage'), guestOnly('admin')),
      },
      {
        path: '/auth/register',
        ...page(() => import('@/features/auth/pages/RegisterPage'), guestOnly('admin')),
      },
      {
        path: '/auth/register/check-email',
        ...page(() => import('@/features/auth/pages/CheckEmailPage')),
      },
      {
        path: '/auth/forgot-password',
        ...page(() => import('@/features/auth/pages/ForgotPasswordPage')),
      },
      {
        // Where every sign-up email's confirmation link lands — the API builds
        // it as `${PUBLIC_WEB_URL}/verify-email?token=…`, so this path is fixed
        // by that and is not under /auth. Serves both personas.
        path: '/verify-email',
        ...livePage(
          () => import('@/features/auth/pages/VerifyEmailPage'),
          () => import('@/features/auth/verifyEmail.routes').then((m) => m.verifyEmailRoute),
        ),
      },
      {
        path: '/portal/login',
        ...page(() => import('@/features/portal/pages/PortalLoginPage'), guestOnly('attendee')),
      },
      {
        // One route for the four designs: `/landing/aurora?event=<slug>` shows
        // a real event, and the create-event wizard opens it with no slug to
        // preview a draft it has not saved yet.
        path: '/landing/:template',
        ...livePage(
          () => import('@/features/landing/pages/PublicEventPage'),
          () => import('@/features/landing/landing.routes').then((m) => m.templatePreviewRoute),
        ),
      },
      {
        // The buyer's own copy of their order — no account, the id is the
        // capability. Matches the link ticket-links.ts puts in the email.
        path: '/my/tickets/orders/:orderId',
        ...livePage(
          () => import('@/features/portal/pages/GuestOrderPage'),
          () => import('@/features/portal/guestOrder.routes').then((m) => m.guestOrderRoute),
        ),
      },
      {
        path: '/portal/discover',
        ...livePage(
          () => import('@/features/portal/pages/DiscoverPage'),
          () => import('@/features/portal/discover.routes').then((m) => m.discoverRoute),
        ),
      },
      {
        path: '/portal/my-events',
        // The one portal route that needs an account. Browsing and registering
        // for an event deliberately do not.
        ...livePage(
          () => import('@/features/portal/pages/MyEventsPage'),
          () => import('@/features/portal/myEvents.routes').then((m) => m.myEventsRoute),
        ),
      },
      {
        // Buying tickets — named for what it does. It was `/portal/register`,
        // which collided with registering an ACCOUNT next door; "register" now
        // means one thing in this app.
        path: '/portal/checkout',
        ...livePage(
          () => import('@/features/portal/pages/PortalCheckoutPage'),
          () => import('@/features/portal/checkout.routes').then((m) => m.checkoutRoute),
        ),
      },
      {
        // The attendee's own sign-up, paired with /portal/login. Separate from
        // the organizer's at /auth/register for the same reason the logins are
        // separate: different audience, different copy, different realm.
        path: '/portal/register',
        ...page(
          () => import('@/features/portal/pages/PortalRegisterPage'),
          guestOnly('attendee'),
        ),
      },
      {
        path: '/portal/register/check-email',
        ...page(() => import('@/features/portal/pages/PortalCheckEmailPage')),
      },
      {
        path: '/portal/survey',
        ...livePage(
          () => import('@/features/portal/pages/SurveyPage'),
          async () => (await import('@/features/portal/survey.routes')).portalSurveyRoute,
        ),
      },
      {
        // A published event at its own public URL — the canonical shape the
        // API already builds into every share link and the workspace's
        // "Copy link". The /landing/* routes below stay previews.
        path: '/e/:slug',
        ...livePage(
          () => import('@/features/landing/pages/PublicEventPage'),
          () => import('@/features/landing/landing.routes').then((m) => m.publicEventRoute),
        ),
      },
      // Root → the public event-discovery page (browsing needs no account).
      // Attendees sign in for "My tickets"; organizers at /auth/login → admin.
      { path: '/', element: <Navigate to="/portal/discover" replace /> },
      {
        path: '/admin',
        id: ADMIN_ROUTE_ID,
        Component: AdminShell,
        // Everything below the shell needs a signed-in organizer. Checked once,
        // here, rather than in 40 page loaders — and before any of them fetch,
        // so an expired session redirects instead of firing a wall of 401s.
        // The loader also carries `me`, which the chrome reads by route id.
        loader: adminShellLoader,
        // The shell's OWN loader failing (`/auth/me` refused for a reason the
        // refresh could not fix) leaves no chrome to render the error inside,
        // so this one legitimately replaces the whole screen. A page below
        // failing is caught by that page's own boundary instead.
        errorElement: ERROR_ELEMENT,
        children: [{ index: true, element: <Navigate to="/admin/home" replace /> }, ...adminChildren],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
