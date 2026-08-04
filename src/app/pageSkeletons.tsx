import type { ReactNode } from 'react'
import { isAdminPath } from '@/app/navigation'
import { Skeleton, SkeletonScreen } from '@/components/ui'
import {
  AdminShellSkeleton,
  AgendaSkeleton,
  AnnouncementsSkeleton,
  AuthSkeleton,
  CardGridPageSkeleton,
  CheckInSkeleton,
  CheckInToolSkeleton,
  DashboardSkeleton,
  EventDetailSkeleton,
  EventFormSkeleton,
  EventsSkeleton,
  FeedbackDetailSkeleton,
  FeedbackSkeleton,
  HomeSkeleton,
  LandingPagesSkeleton,
  LandingSkeleton,
  ListPageSkeleton,
  MeetingsSkeleton,
  NotFoundSkeleton,
  NotificationsSkeleton,
  PayoutsSkeleton,
  PortalDiscoverSkeleton,
  PortalMyEventsSkeleton,
  PortalRegisterSkeleton,
  PortalSurveySkeleton,
  ReportSubPageSkeleton,
  ReportsOverviewSkeleton,
  RolesSkeleton,
  SettingsNotificationsSkeleton,
  SettingsPaymentsSkeleton,
  SettingsProfileSkeleton,
  SettingsSecuritySkeleton,
} from '@/components/skeletons'

/* Which skeleton stands in for which route.
 *
 * The layouts render one of these while a page is on its way in, so each entry
 * should mirror the real page's top-level shape — same tiles, same tab count,
 * same table columns. Add a route in `routes.tsx`, add its skeleton here; an
 * unmapped path falls back to a plain list page rather than a blank screen.
 */

/** Keyed by the slug after `/admin/`. */
const ADMIN: Record<string, () => ReactNode> = {
  home: () => <HomeSkeleton />,
  dashboard: () => <DashboardSkeleton />,

  /* Events */
  events: () => <EventsSkeleton />,
  'events-upcoming': () => (
    <CardGridPageSkeleton
      lead={
        <div className="mb-3 flex items-center justify-between gap-3">
          <Skeleton className="h-2.5 w-56 max-w-full" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      }
      count={6}
      grid="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      cardClassName="overflow-hidden rounded-2xl bg-surface p-4"
      media
    />
  ),
  'event-form': () => <EventFormSkeleton />,
  'event-detail': () => <EventDetailSkeleton />,
  'event-categories': () => (
    <CardGridPageSkeleton search selects={['sm:w-52']} toggle countLine count={8} />
  ),
  'landing-pages': () => <LandingPagesSkeleton />,

  /* Ticketing */
  tickets: () => <CardGridPageSkeleton tabs={5} search selects={['sm:w-56']} count={9} />,
  discounts: () => (
    <ListPageSkeleton
      tabs={5}
      selects={['sm:w-56']}
      cols={7}
      minWidth="min-w-[860px]"
      avatar={false}
    />
  ),

  /* Program */
  agenda: () => <AgendaSkeleton />,
  speakers: () => (
    <CardGridPageSkeleton
      search
      selects={['sm:w-56']}
      toggle
      countLine
      count={10}
      grid="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      paginator
    />
  ),

  /* Attendees */
  registrations: () => (
    <ListPageSkeleton
      actions={2}
      tabs={4}
      selects={['sm:w-52', 'sm:w-44']}
      cols={7}
      minWidth="min-w-[820px]"
    />
  ),
  attendees: () => (
    <ListPageSkeleton
      actions={2}
      tabs={4}
      selects={['sm:w-44', 'sm:w-52']}
      cols={7}
      minWidth="min-w-[860px]"
    />
  ),
  checkin: () => <CheckInSkeleton />,
  'checkin-tool': () => <CheckInToolSkeleton />,
  meetings: () => <MeetingsSkeleton />,

  /* Finance */
  payments: () => (
    <ListPageSkeleton actions={2} tabs={5} selects={['sm:w-48']} cols={8} minWidth="min-w-[900px]" />
  ),
  payouts: () => <PayoutsSkeleton />,
  invoices: () => (
    <ListPageSkeleton
      actions={2}
      tabs={5}
      selects={['sm:w-52']}
      cols={7}
      minWidth="min-w-[860px]"
      avatar={false}
    />
  ),
  taxes: () => (
    <ListPageSkeleton
      stats={{ count: 4 }}
      tabs={4}
      search={false}
      selects={['sm:w-40']}
      inlineFilters
      cols={6}
      minWidth="min-w-[820px]"
      avatar={false}
    />
  ),

  /* Insights */
  reports: () => <ReportsOverviewSkeleton />,
  'reports-income': () => <ReportSubPageSkeleton cols={5} />,
  'reports-transactions': () => <ReportSubPageSkeleton cols={8} minWidth="min-w-[880px]" />,
  'reports-payouts': () => <ReportSubPageSkeleton cols={6} minWidth="min-w-[760px]" />,
  'reports-registrations': () => <ReportSubPageSkeleton cols={6} />,
  'reports-attendance': () => <ReportSubPageSkeleton cols={5} />,
  'reports-discounts': () => <ReportSubPageSkeleton cols={6} />,
  'reports-events': () => (
    <ListPageSkeleton
      actions={0}
      back
      selects={['sm:w-52']}
      cols={5}
      minWidth="min-w-[720px]"
      avatar={false}
    />
  ),

  /* Engagement */
  notifications: () => <NotificationsSkeleton />,
  'messaging-templates': () => <CardGridPageSkeleton count={6} />,
  'messaging-announcements': () => <AnnouncementsSkeleton />,
  'messaging-log': () => (
    <ListPageSkeleton search={false} cols={5} minWidth="min-w-[820px]" tableHeading />
  ),
  feedback: () => <FeedbackSkeleton />,
  'feedback-detail': () => <FeedbackDetailSkeleton />,

  /* Settings */
  'settings-profile': () => <SettingsProfileSkeleton fields={6} />,
  'settings-security': () => <SettingsSecuritySkeleton />,
  'settings-notifications': () => <SettingsNotificationsSkeleton />,
  'settings-organization': () => <SettingsProfileSkeleton fields={5} />,
  'settings-payments': () => <SettingsPaymentsSkeleton />,
  users: () => (
    <ListPageSkeleton tabs={4} selects={['sm:w-52']} cols={5} minWidth="min-w-[820px]" />
  ),
  roles: () => <RolesSkeleton />,
}

/* Route paths that are neither admin routes nor the sidebar's page ids. Routes
   whose page ids differ from their URL slug (`check-in` → page id `checkin`)
   are normalised in `adminSkeleton` below. */
const PUBLIC: Record<string, () => ReactNode> = {
  '/auth/login': () => <AuthSkeleton />,
  '/auth/register': () => <AuthSkeleton fields={4} social={1} />,
  '/auth/forgot-password': () => <AuthSkeleton fields={1} social={0} divider={false} />,
  '/portal/login': () => <AuthSkeleton />,
  '/portal/discover': () => <PortalDiscoverSkeleton />,
  '/portal/my-events': () => <PortalMyEventsSkeleton />,
  '/portal/register': () => <PortalRegisterSkeleton />,
  '/portal/survey': () => <PortalSurveySkeleton />,
  '/landing/atlas': () => <LandingSkeleton variant="atlas" />,
  '/landing/aurora': () => <LandingSkeleton variant="aurora" />,
  '/landing/minimal': () => <LandingSkeleton variant="minimal" />,
  '/landing/noir': () => <LandingSkeleton variant="noir" />,
  // `/` redirects straight to discover, so show discover's shape.
  '/': () => <PortalDiscoverSkeleton />,
}

/** The URL slugs that don't match their route's `handle.page` id. */
const SLUG_ALIASES: Record<string, string> = {
  'check-in': 'checkin',
  'check-in-tool': 'checkin-tool',
}

/**
 * The body of an admin page, without the shell around it. AdminShell renders
 * this into its own `<main>` so the rail and sub-nav stay put.
 */
export function AdminPageSkeleton({ path }: { path: string }) {
  return <SkeletonScreen>{adminSkeleton(path)}</SkeletonScreen>
}

function adminSkeleton(path: string): ReactNode {
  const slug = path.replace(/^\/admin\/?/, '').split('/')[0] ?? ''
  const key = SLUG_ALIASES[slug] ?? slug
  // `/admin` redirects to `/admin/home`.
  const render = ADMIN[key] ?? (slug === '' ? ADMIN.home : undefined)
  return render ? render() : <ListPageSkeleton />
}

/**
 * A whole screen's worth of skeleton, including page chrome. Used on first
 * paint and whenever a navigation replaces the entire page — including moving
 * into the admin console from outside it, where the shell is not mounted yet.
 */
export function RouteSkeleton({ path }: { path: string }) {
  if (isAdminPath(path)) {
    return (
      <SkeletonScreen>
        <AdminShellSkeleton>{adminSkeleton(path)}</AdminShellSkeleton>
      </SkeletonScreen>
    )
  }

  const render = PUBLIC[path]
  return <SkeletonScreen>{render ? render() : <NotFoundSkeleton />}</SkeletonScreen>
}
