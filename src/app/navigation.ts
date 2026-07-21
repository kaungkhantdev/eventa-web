/* ============================================================
   Admin navigation model — the single source of truth for the
   icon rail (modules) and the labeled panel (grouped sub-nav).

   Ported from the static kit's shell.js MODULES array. Routes
   replace the old .html hrefs 1:1, so `events-upcoming.html`
   becomes `/admin/events-upcoming`.
   ============================================================ */

export type NavLeaf = {
  label: string
  /** Stable page id — matches the static kit's `data-page`, used for active state. */
  page: string
  to: string
}

export type NavGroup = {
  label: string
  icon: string
  items: NavLeaf[]
}

export type NavModule = {
  id: string
  label: string
  icon: string
  to: string
  /** Pinned to the bottom of the rail (Settings). */
  bottom?: boolean
  groups?: NavGroup[]
}

export const MODULES: NavModule[] = [
  { id: 'home', label: 'Home', icon: 'hgi-home-01', to: '/admin/home' },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'hgi-dashboard-speed-02',
    to: '/admin/dashboard',
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'hgi-calendar-03',
    to: '/admin/events',
    groups: [
      {
        label: 'Manage',
        icon: 'hgi-calendar-03',
        items: [
          { label: 'All events', page: 'events', to: '/admin/events' },
          { label: 'Upcoming', page: 'events-upcoming', to: '/admin/events-upcoming' },
          { label: 'Create event', page: 'event-form', to: '/admin/event-form' },
        ],
      },
      {
        label: 'Ticketing',
        icon: 'hgi-ticket-01',
        items: [
          { label: 'Tickets', page: 'tickets', to: '/admin/tickets' },
          { label: 'Discounts', page: 'discounts', to: '/admin/discounts' },
        ],
      },
      {
        label: 'Program',
        icon: 'hgi-mic-01',
        items: [
          { label: 'Agenda', page: 'agenda', to: '/admin/agenda' },
          { label: 'Speakers', page: 'speakers', to: '/admin/speakers' },
        ],
      },
      {
        label: 'Content',
        icon: 'hgi-browser',
        items: [
          { label: 'Landing pages', page: 'landing-pages', to: '/admin/landing-pages' },
          { label: 'Categories', page: 'event-categories', to: '/admin/event-categories' },
        ],
      },
      {
        label: 'Attendees',
        icon: 'hgi-user-multiple',
        items: [
          { label: 'Registrations', page: 'registrations', to: '/admin/registrations' },
          { label: 'Attendees', page: 'attendees', to: '/admin/attendees' },
          { label: 'Check-in', page: 'checkin', to: '/admin/check-in' },
        ],
      },
    ],
  },
  {
    id: 'checkin-tool',
    label: 'Check-in tool',
    icon: 'hgi-qr-code-01',
    to: '/admin/check-in-tool',
  },
  { id: 'meetings', label: 'Meetings', icon: 'hgi-meeting-room', to: '/admin/meetings' },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'hgi-wallet-01',
    to: '/admin/payments',
    groups: [
      {
        label: 'Transactions',
        icon: 'hgi-wallet-01',
        items: [
          { label: 'Payments', page: 'payments', to: '/admin/payments' },
          { label: 'Payouts', page: 'payouts', to: '/admin/payouts' },
        ],
      },
      {
        label: 'Tax & invoicing',
        icon: 'hgi-invoice-01',
        items: [
          { label: 'Invoices', page: 'invoices', to: '/admin/invoices' },
          { label: 'Taxes', page: 'taxes', to: '/admin/taxes' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Insights',
    icon: 'hgi-analytics-up',
    to: '/admin/reports',
    groups: [
      {
        label: 'Summary',
        icon: 'hgi-analytics-up',
        items: [{ label: 'Overview', page: 'reports', to: '/admin/reports' }],
      },
      {
        label: 'Financial',
        icon: 'hgi-wallet-01',
        items: [
          { label: 'Income', page: 'reports-income', to: '/admin/reports-income' },
          {
            label: 'Transactions',
            page: 'reports-transactions',
            to: '/admin/reports-transactions',
          },
          { label: 'Payouts', page: 'reports-payouts', to: '/admin/reports-payouts' },
        ],
      },
      {
        label: 'Attendees',
        icon: 'hgi-user-multiple',
        items: [
          {
            label: 'Registrations',
            page: 'reports-registrations',
            to: '/admin/reports-registrations',
          },
          { label: 'Attendance', page: 'reports-attendance', to: '/admin/reports-attendance' },
        ],
      },
      {
        label: 'Marketing',
        icon: 'hgi-discount-tag-01',
        items: [{ label: 'Discounts', page: 'reports-discounts', to: '/admin/reports-discounts' }],
      },
      {
        label: 'Events',
        icon: 'hgi-calendar-03',
        items: [
          { label: 'Event performance', page: 'reports-events', to: '/admin/reports-events' },
        ],
      },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: 'hgi-megaphone-01',
    to: '/admin/notifications',
    groups: [
      {
        label: 'Activity',
        icon: 'hgi-notification-03',
        items: [{ label: 'Notifications', page: 'notifications', to: '/admin/notifications' }],
      },
      {
        label: 'Messaging',
        icon: 'hgi-mail-01',
        items: [
          { label: 'Templates', page: 'messaging-templates', to: '/admin/messaging-templates' },
          {
            label: 'Announcements',
            page: 'messaging-announcements',
            to: '/admin/messaging-announcements',
          },
          { label: 'Delivery log', page: 'messaging-log', to: '/admin/messaging-log' },
        ],
      },
      {
        label: 'Feedback',
        icon: 'hgi-comment-01',
        items: [{ label: 'Overview', page: 'feedback', to: '/admin/feedback' }],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'hgi-settings-01',
    to: '/admin/settings-profile',
    bottom: true,
    groups: [
      {
        label: 'Account',
        icon: 'hgi-user-circle',
        items: [
          { label: 'Profile', page: 'settings-profile', to: '/admin/settings-profile' },
          { label: 'Security', page: 'settings-security', to: '/admin/settings-security' },
          {
            label: 'Notification preferences',
            page: 'settings-notifications',
            to: '/admin/settings-notifications',
          },
        ],
      },
      {
        label: 'Workspace',
        icon: 'hgi-building-03',
        items: [
          {
            label: 'Organization',
            page: 'settings-organization',
            to: '/admin/settings-organization',
          },
          { label: 'Payments', page: 'settings-payments', to: '/admin/settings-payments' },
        ],
      },
      {
        label: 'Access',
        icon: 'hgi-shield-user',
        items: [
          { label: 'Users', page: 'users', to: '/admin/users' },
          { label: 'Roles', page: 'roles', to: '/admin/roles' },
        ],
      },
    ],
  },
]

/** Which rail module owns a page — mirrors shell.js `moduleOfPage`, including
 *  its fallback to 'dashboard' for pages that live outside the nav model. */
export function moduleOfPage(page: string): string {
  for (const m of MODULES) {
    if (m.id === page) return m.id
    for (const g of m.groups ?? []) {
      for (const it of g.items) if (it.page === page) return m.id
    }
  }
  return 'dashboard'
}
