/* Demo data for the Notification preferences page — ported from the static
   markup in admin/settings-notifications.html. The icon-chip colour is fixed
   per category (it does not follow the toggle state). */

export type NotifCategory = {
  id: string
  icon: string
  /** Fixed colour classes for the leading icon chip. */
  iconChip: string
  title: string
  desc: string
  email: boolean
  sms: boolean
}

export const NOTIF_CATEGORIES: NotifCategory[] = [
  {
    id: 'registrations',
    icon: 'hgi-user-add-01',
    iconChip: 'bg-brand-soft text-brand',
    title: 'Registrations',
    desc: 'New attendee sign-ups and cancellations',
    email: true,
    sms: true,
  },
  {
    id: 'payments',
    icon: 'hgi-wallet-01',
    iconChip: 'bg-brand-soft text-brand',
    title: 'Payments',
    desc: 'Successful charges, refunds and payouts',
    email: true,
    sms: false,
  },
  {
    id: 'reminders',
    icon: 'hgi-time-schedule',
    iconChip: 'bg-brand-soft text-brand',
    title: 'Reminders',
    desc: 'Upcoming event and agenda reminders',
    email: true,
    sms: true,
  },
  {
    id: 'updates',
    icon: 'hgi-megaphone-01',
    iconChip: 'bg-line text-muted',
    title: 'Product updates',
    desc: 'New features, tips and changelog highlights',
    email: false,
    sms: false,
  },
]
