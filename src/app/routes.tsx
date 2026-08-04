import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import AdminShell from '@/layouts/AdminShell'
import RootLayout, { RootFallback } from '@/layouts/RootLayout'
import NotFoundPage from '@/features/system/pages/NotFoundPage'

/* Route manifest. Admin screens are nested under the shell and each declares a
   `handle.page` id — the static kit's `data-page` — which drives sidebar
   highlighting. Every page is code-split so the initial bundle stays small.

   Each page also gets a loading skeleton; those are declared separately in
   `pageSkeletons.tsx`, keyed by path. Add a route here, add its skeleton
   there. */

/**
 * Simulated per-page fetch latency, in milliseconds.
 *
 * The prototype keeps every row in memory, so a page has nothing to wait for
 * and the skeletons would flash past in the handful of milliseconds a local
 * chunk takes to load. This delay stands in for the request each page will
 * make once there is a backend.
 *
 * Set it to 0 to remove the artificial wait entirely — skeletons then appear
 * only for as long as a page genuinely takes to arrive, which is the behaviour
 * you want in production.
 */
export const PAGE_LOAD_MS = 350

/** Stand-in for the data fetch each page will eventually do. */
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
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  loader: pageLoader,
  lazy: async () => ({ Component: (await load()).default }),
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
    ...page(() => import('@/features/events/pages/EventsPage')),
    handle: { page: 'events' },
  },
  {
    path: 'events-upcoming',
    ...page(() => import('@/features/events/pages/UpcomingEventsPage')),
    handle: { page: 'events-upcoming' },
  },
  {
    path: 'event-form',
    ...page(() => import('@/features/events/pages/EventFormPage')),
    // focused create wizard: keep the icon rail, hide the module sub-nav panel
    handle: { page: 'event-form', focused: true },
  },
  {
    path: 'event-detail',
    ...page(() => import('@/features/events/pages/EventDetailPage')),
    handle: { page: 'events' },
  },
  {
    path: 'event-categories',
    ...page(() => import('@/features/events/pages/EventCategoriesPage')),
    handle: { page: 'event-categories' },
  },
  {
    path: 'landing-pages',
    ...page(() => import('@/features/events/pages/LandingPagesPage')),
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
    ...page(() => import('@/features/attendees/pages/RegistrationsPage')),
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
        Component: AdminShell,
        children: [{ index: true, element: <Navigate to="/admin/home" replace /> }, ...adminChildren],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
