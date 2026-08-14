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
import { ADMIN_ROUTE_ID, adminShellLoader } from '@/app/loaders'

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
  lazy: async () => ({ Component: (await load()).default }),
})

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
  lazy: async () => {
    const [{ default: Component }, data] = await Promise.all([load(), route()])
    return { Component, ...data }
  },
})

const adminChildren = [
  {
    path: 'home',
    ...page(() => import('@/features/overview/pages/HomePage')),
    handle: { page: 'home' },
  },
  {
    path: 'dashboard',
    ...page(() => import('@/features/overview/pages/DashboardPage')),
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
    ...page(() => import('@/features/ticketing/pages/TicketsPage')),
    handle: { page: 'tickets' },
  },
  {
    path: 'discounts',
    ...page(() => import('@/features/ticketing/pages/DiscountsPage')),
    handle: { page: 'discounts' },
  },
  {
    path: 'agenda',
    ...page(() => import('@/features/program/pages/AgendaPage')),
    handle: { page: 'agenda' },
  },
  {
    path: 'speakers',
    ...page(() => import('@/features/program/pages/SpeakersPage')),
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
    ...page(() => import('@/features/attendees/pages/AttendeesPage')),
    handle: { page: 'attendees' },
  },
  {
    path: 'check-in',
    ...page(() => import('@/features/attendees/pages/CheckInPage')),
    handle: { page: 'checkin' },
  },
  {
    path: 'check-in-tool',
    ...page(() => import('@/features/checkin-tool/pages/CheckInToolPage')),
    handle: { page: 'checkin-tool' },
  },
  {
    path: 'meetings',
    ...page(() => import('@/features/meetings/pages/MeetingsPage')),
    handle: { page: 'meetings' },
  },
  {
    path: 'payments',
    ...page(() => import('@/features/finance/pages/PaymentsPage')),
    handle: { page: 'payments' },
  },
  {
    path: 'payouts',
    ...page(() => import('@/features/finance/pages/PayoutsPage')),
    handle: { page: 'payouts' },
  },
  {
    path: 'invoices',
    ...page(() => import('@/features/finance/pages/InvoicesPage')),
    handle: { page: 'invoices' },
  },
  {
    path: 'taxes',
    ...page(() => import('@/features/finance/pages/TaxesPage')),
    handle: { page: 'taxes' },
  },
  {
    path: 'reports',
    ...page(() => import('@/features/insights/pages/ReportsOverviewPage')),
    handle: { page: 'reports' },
  },
  {
    path: 'reports-income',
    ...page(() => import('@/features/insights/pages/ReportsIncomePage')),
    handle: { page: 'reports-income' },
  },
  {
    path: 'reports-transactions',
    ...page(() => import('@/features/insights/pages/ReportsTransactionsPage')),
    handle: { page: 'reports-transactions' },
  },
  {
    path: 'reports-payouts',
    ...page(() => import('@/features/insights/pages/ReportsPayoutsPage')),
    handle: { page: 'reports-payouts' },
  },
  {
    path: 'reports-registrations',
    ...page(() => import('@/features/insights/pages/ReportsRegistrationsPage')),
    handle: { page: 'reports-registrations' },
  },
  {
    path: 'reports-attendance',
    ...page(() => import('@/features/insights/pages/ReportsAttendancePage')),
    handle: { page: 'reports-attendance' },
  },
  {
    path: 'reports-discounts',
    ...page(() => import('@/features/insights/pages/ReportsDiscountsPage')),
    handle: { page: 'reports-discounts' },
  },
  {
    path: 'reports-events',
    ...page(() => import('@/features/insights/pages/ReportsEventsPage')),
    handle: { page: 'reports-events' },
  },
  {
    path: 'notifications',
    ...page(() => import('@/features/engagement/pages/NotificationsPage')),
    handle: { page: 'notifications' },
  },
  {
    path: 'messaging-templates',
    ...page(() => import('@/features/engagement/pages/MessagingTemplatesPage')),
    handle: { page: 'messaging-templates' },
  },
  {
    path: 'messaging-announcements',
    ...page(() => import('@/features/engagement/pages/MessagingAnnouncementsPage')),
    handle: { page: 'messaging-announcements' },
  },
  {
    path: 'messaging-log',
    ...page(() => import('@/features/engagement/pages/MessagingLogPage')),
    handle: { page: 'messaging-log' },
  },
  {
    path: 'feedback',
    ...page(() => import('@/features/engagement/pages/FeedbackPage')),
    handle: { page: 'feedback' },
  },
  {
    path: 'feedback-detail',
    ...page(() => import('@/features/engagement/pages/FeedbackDetailPage')),
    handle: { page: 'feedback' },
  },
  {
    path: 'settings-profile',
    ...page(() => import('@/features/settings/pages/SettingsProfilePage')),
    handle: { page: 'settings-profile' },
  },
  {
    path: 'settings-security',
    ...page(() => import('@/features/settings/pages/SettingsSecurityPage')),
    handle: { page: 'settings-security' },
  },
  {
    path: 'settings-notifications',
    ...page(() => import('@/features/settings/pages/SettingsNotificationsPage')),
    handle: { page: 'settings-notifications' },
  },
  {
    path: 'settings-organization',
    ...page(() => import('@/features/settings/pages/SettingsOrganizationPage')),
    handle: { page: 'settings-organization' },
  },
  {
    path: 'settings-payments',
    ...page(() => import('@/features/settings/pages/SettingsPaymentsPage')),
    handle: { page: 'settings-payments' },
  },
  {
    path: 'users',
    ...page(() => import('@/features/settings/pages/UsersPage')),
    handle: { page: 'users' },
  },
  {
    path: 'roles',
    ...page(() => import('@/features/settings/pages/RolesPage')),
    handle: { page: 'roles' },
  },
]

export const router = createBrowserRouter([
  {
    // Pathless layout around every route: it owns the whole-screen skeleton
    // for first paint and for navigations that swap the entire page.
    Component: RootLayout,
    HydrateFallback: RootFallback,
    children: [
      {
        path: '/auth/login',
        ...page(() => import('@/features/auth/pages/LoginPage')),
      },
      {
        path: '/auth/register',
        ...page(() => import('@/features/auth/pages/RegisterPage')),
      },
      {
        path: '/auth/forgot-password',
        ...page(() => import('@/features/auth/pages/ForgotPasswordPage')),
      },
      {
        path: '/portal/login',
        ...page(() => import('@/features/portal/pages/PortalLoginPage')),
      },
      {
        path: '/portal/discover',
        ...page(() => import('@/features/portal/pages/DiscoverPage')),
      },
      {
        path: '/portal/my-events',
        ...page(() => import('@/features/portal/pages/MyEventsPage')),
      },
      {
        path: '/portal/register',
        ...page(() => import('@/features/portal/pages/PortalRegisterPage')),
      },
      {
        path: '/portal/survey',
        ...page(() => import('@/features/portal/pages/SurveyPage')),
      },
      {
        path: '/landing/atlas',
        ...page(() => import('@/features/landing/pages/AtlasPage')),
      },
      {
        path: '/landing/aurora',
        ...page(() => import('@/features/landing/pages/AuroraPage')),
      },
      {
        path: '/landing/minimal',
        ...page(() => import('@/features/landing/pages/MinimalPage')),
      },
      {
        path: '/landing/noir',
        ...page(() => import('@/features/landing/pages/NoirPage')),
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
        children: [{ index: true, element: <Navigate to="/admin/home" replace /> }, ...adminChildren],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
