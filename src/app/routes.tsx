import { createBrowserRouter, Navigate } from 'react-router'
import AdminShell from '@/layouts/AdminShell'
import NotFoundPage from '@/features/system/pages/NotFoundPage'

/* Route manifest. Admin screens are nested under the shell and each declares a
   `handle.page` id — the static kit's `data-page` — which drives sidebar
   highlighting. Every page is code-split so the initial bundle stays small. */

const adminChildren = [
  {
    path: 'home',
    lazy: async () => ({ Component: (await import('@/features/overview/pages/HomePage')).default }),
    handle: { page: 'home' },
  },
  {
    path: 'dashboard',
    lazy: async () => ({ Component: (await import('@/features/overview/pages/DashboardPage')).default }),
    handle: { page: 'dashboard' },
  },
  {
    path: 'events',
    lazy: async () => ({ Component: (await import('@/features/events/pages/EventsPage')).default }),
    handle: { page: 'events' },
  },
  {
    path: 'events-upcoming',
    lazy: async () => ({ Component: (await import('@/features/events/pages/UpcomingEventsPage')).default }),
    handle: { page: 'events-upcoming' },
  },
  {
    path: 'event-form',
    lazy: async () => ({ Component: (await import('@/features/events/pages/EventFormPage')).default }),
    // focused create wizard: keep the icon rail, hide the module sub-nav panel
    handle: { page: 'event-form', focused: true },
  },
  {
    path: 'event-detail',
    lazy: async () => ({ Component: (await import('@/features/events/pages/EventDetailPage')).default }),
    handle: { page: 'events' },
  },
  {
    path: 'event-categories',
    lazy: async () => ({ Component: (await import('@/features/events/pages/EventCategoriesPage')).default }),
    handle: { page: 'event-categories' },
  },
  {
    path: 'landing-pages',
    lazy: async () => ({ Component: (await import('@/features/events/pages/LandingPagesPage')).default }),
    handle: { page: 'landing-pages' },
  },
  {
    path: 'tickets',
    lazy: async () => ({ Component: (await import('@/features/ticketing/pages/TicketsPage')).default }),
    handle: { page: 'tickets' },
  },
  {
    path: 'discounts',
    lazy: async () => ({ Component: (await import('@/features/ticketing/pages/DiscountsPage')).default }),
    handle: { page: 'discounts' },
  },
  {
    path: 'agenda',
    lazy: async () => ({ Component: (await import('@/features/program/pages/AgendaPage')).default }),
    handle: { page: 'agenda' },
  },
  {
    path: 'speakers',
    lazy: async () => ({ Component: (await import('@/features/program/pages/SpeakersPage')).default }),
    handle: { page: 'speakers' },
  },
  {
    path: 'registrations',
    lazy: async () => ({ Component: (await import('@/features/attendees/pages/RegistrationsPage')).default }),
    handle: { page: 'registrations' },
  },
  {
    path: 'attendees',
    lazy: async () => ({ Component: (await import('@/features/attendees/pages/AttendeesPage')).default }),
    handle: { page: 'attendees' },
  },
  {
    path: 'check-in',
    lazy: async () => ({ Component: (await import('@/features/attendees/pages/CheckInPage')).default }),
    handle: { page: 'checkin' },
  },
  {
    path: 'check-in-tool',
    lazy: async () => ({ Component: (await import('@/features/checkin-tool/pages/CheckInToolPage')).default }),
    handle: { page: 'checkin-tool' },
  },
  {
    path: 'meetings',
    lazy: async () => ({ Component: (await import('@/features/meetings/pages/MeetingsPage')).default }),
    handle: { page: 'meetings' },
  },
  {
    path: 'payments',
    lazy: async () => ({ Component: (await import('@/features/finance/pages/PaymentsPage')).default }),
    handle: { page: 'payments' },
  },
  {
    path: 'payouts',
    lazy: async () => ({ Component: (await import('@/features/finance/pages/PayoutsPage')).default }),
    handle: { page: 'payouts' },
  },
  {
    path: 'invoices',
    lazy: async () => ({ Component: (await import('@/features/finance/pages/InvoicesPage')).default }),
    handle: { page: 'invoices' },
  },
  {
    path: 'taxes',
    lazy: async () => ({ Component: (await import('@/features/finance/pages/TaxesPage')).default }),
    handle: { page: 'taxes' },
  },
  {
    path: 'reports',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsOverviewPage')).default }),
    handle: { page: 'reports' },
  },
  {
    path: 'reports-income',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsIncomePage')).default }),
    handle: { page: 'reports-income' },
  },
  {
    path: 'reports-transactions',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsTransactionsPage')).default }),
    handle: { page: 'reports-transactions' },
  },
  {
    path: 'reports-payouts',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsPayoutsPage')).default }),
    handle: { page: 'reports-payouts' },
  },
  {
    path: 'reports-registrations',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsRegistrationsPage')).default }),
    handle: { page: 'reports-registrations' },
  },
  {
    path: 'reports-attendance',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsAttendancePage')).default }),
    handle: { page: 'reports-attendance' },
  },
  {
    path: 'reports-discounts',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsDiscountsPage')).default }),
    handle: { page: 'reports-discounts' },
  },
  {
    path: 'reports-events',
    lazy: async () => ({ Component: (await import('@/features/insights/pages/ReportsEventsPage')).default }),
    handle: { page: 'reports-events' },
  },
  {
    path: 'notifications',
    lazy: async () => ({ Component: (await import('@/features/engagement/pages/NotificationsPage')).default }),
    handle: { page: 'notifications' },
  },
  {
    path: 'messaging-templates',
    lazy: async () => ({ Component: (await import('@/features/engagement/pages/MessagingTemplatesPage')).default }),
    handle: { page: 'messaging-templates' },
  },
  {
    path: 'messaging-announcements',
    lazy: async () => ({ Component: (await import('@/features/engagement/pages/MessagingAnnouncementsPage')).default }),
    handle: { page: 'messaging-announcements' },
  },
  {
    path: 'messaging-log',
    lazy: async () => ({ Component: (await import('@/features/engagement/pages/MessagingLogPage')).default }),
    handle: { page: 'messaging-log' },
  },
  {
    path: 'feedback',
    lazy: async () => ({ Component: (await import('@/features/engagement/pages/FeedbackPage')).default }),
    handle: { page: 'feedback' },
  },
  {
    path: 'feedback-detail',
    lazy: async () => ({ Component: (await import('@/features/engagement/pages/FeedbackDetailPage')).default }),
    handle: { page: 'feedback' },
  },
  {
    path: 'settings-profile',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/SettingsProfilePage')).default }),
    handle: { page: 'settings-profile' },
  },
  {
    path: 'settings-security',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/SettingsSecurityPage')).default }),
    handle: { page: 'settings-security' },
  },
  {
    path: 'settings-notifications',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/SettingsNotificationsPage')).default }),
    handle: { page: 'settings-notifications' },
  },
  {
    path: 'settings-organization',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/SettingsOrganizationPage')).default }),
    handle: { page: 'settings-organization' },
  },
  {
    path: 'settings-payments',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/SettingsPaymentsPage')).default }),
    handle: { page: 'settings-payments' },
  },
  {
    path: 'users',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/UsersPage')).default }),
    handle: { page: 'users' },
  },
  {
    path: 'roles',
    lazy: async () => ({ Component: (await import('@/features/settings/pages/RolesPage')).default }),
    handle: { page: 'roles' },
  },
]

export const router = createBrowserRouter([
  {
    path: '/auth/login',
    lazy: async () => ({ Component: (await import('@/features/auth/pages/LoginPage')).default }),
  },
  {
    path: '/auth/register',
    lazy: async () => ({ Component: (await import('@/features/auth/pages/RegisterPage')).default }),
  },
  {
    path: '/auth/forgot-password',
    lazy: async () => ({ Component: (await import('@/features/auth/pages/ForgotPasswordPage')).default }),
  },
  {
    path: '/portal/login',
    lazy: async () => ({ Component: (await import('@/features/portal/pages/PortalLoginPage')).default }),
  },
  {
    path: '/portal/discover',
    lazy: async () => ({ Component: (await import('@/features/portal/pages/DiscoverPage')).default }),
  },
  {
    path: '/portal/my-events',
    lazy: async () => ({ Component: (await import('@/features/portal/pages/MyEventsPage')).default }),
  },
  {
    path: '/portal/register',
    lazy: async () => ({ Component: (await import('@/features/portal/pages/PortalRegisterPage')).default }),
  },
  {
    path: '/portal/survey',
    lazy: async () => ({ Component: (await import('@/features/portal/pages/SurveyPage')).default }),
  },
  {
    path: '/landing/atlas',
    lazy: async () => ({ Component: (await import('@/features/landing/pages/AtlasPage')).default }),
  },
  {
    path: '/landing/aurora',
    lazy: async () => ({ Component: (await import('@/features/landing/pages/AuroraPage')).default }),
  },
  {
    path: '/landing/minimal',
    lazy: async () => ({ Component: (await import('@/features/landing/pages/MinimalPage')).default }),
  },
  {
    path: '/landing/noir',
    lazy: async () => ({ Component: (await import('@/features/landing/pages/NoirPage')).default }),
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
])
