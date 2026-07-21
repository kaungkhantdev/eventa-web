/* Role & permission demo data — ported verbatim from admin/roles.html and the
   shared role-panel logic in admin/users.html. Four built-in roles, each with a
   preset of twelve permissions grouped into Events / Registrations / Finance /
   Settings. */

export type RoleName = 'Admin' | 'Organizer' | 'Staff' | 'Attendee'

export type PermKey =
  | 'evCreate'
  | 'evPublish'
  | 'evSpeakers'
  | 'regView'
  | 'regCheckin'
  | 'regExport'
  | 'finView'
  | 'finRefund'
  | 'finDiscount'
  | 'setUsers'
  | 'setSettings'
  | 'setIntegrations'

export type PermState = Record<PermKey, boolean>

/** Preset permission map per role (source `ROLE_PERMS`, 1/0 → boolean). */
export const ROLE_PERMS: Record<RoleName, PermState> = {
  Admin: {
    evCreate: true, evPublish: true, evSpeakers: true,
    regView: true, regCheckin: true, regExport: true,
    finView: true, finRefund: true, finDiscount: true,
    setUsers: true, setSettings: true, setIntegrations: true,
  },
  Organizer: {
    evCreate: true, evPublish: true, evSpeakers: true,
    regView: true, regCheckin: true, regExport: true,
    finView: true, finRefund: false, finDiscount: true,
    setUsers: false, setSettings: false, setIntegrations: false,
  },
  Staff: {
    evCreate: false, evPublish: false, evSpeakers: false,
    regView: true, regCheckin: true, regExport: false,
    finView: false, finRefund: false, finDiscount: false,
    setUsers: false, setSettings: false, setIntegrations: false,
  },
  Attendee: {
    evCreate: false, evPublish: false, evSpeakers: false,
    regView: false, regCheckin: false, regExport: false,
    finView: false, finRefund: false, finDiscount: false,
    setUsers: false, setSettings: false, setIntegrations: false,
  },
}

/** One-line description shown under the role-name input (source `ROLE_DESC`). */
export const ROLE_DESC: Record<RoleName, string> = {
  Admin: 'Full access to every workspace feature, including billing and security settings.',
  Organizer: 'Creates and manages events, tickets, discounts and attendee communications.',
  Staff: 'Handles day-to-day check-in and attendee support at events.',
  Attendee: 'Registered guest with self-service access to their own tickets and profile only.',
}

/** Bullet summary shown in the Invite-user permissions preview (source `ROLE_BULLETS`). */
export const ROLE_BULLETS: Record<RoleName, string[]> = {
  Admin: ['Manage users & roles', 'Manage payments & payouts', 'Configure workspace settings'],
  Organizer: ['Create & edit events', 'Manage tickets & discounts', 'View registrations & reports'],
  Staff: ['Check-in attendees', 'Scan & validate tickets', 'View registrations'],
  Attendee: ['View own tickets', 'Update own profile'],
}

/** Roles in menu order — drives the invite/role selects. */
export const ROLE_NAMES: RoleName[] = ['Admin', 'Organizer', 'Staff', 'Attendee']

export type PermGroup = {
  label: string
  icon: string
  perms: { key: PermKey; label: string }[]
}

/** The grouped permission rows rendered inside the Edit-role slide-over. */
export const PERM_GROUPS: PermGroup[] = [
  {
    label: 'Events',
    icon: 'hgi-calendar-03',
    perms: [
      { key: 'evCreate', label: 'Create & edit events' },
      { key: 'evPublish', label: 'Publish & cancel events' },
      { key: 'evSpeakers', label: 'Manage speakers & agenda' },
    ],
  },
  {
    label: 'Registrations',
    icon: 'hgi-user-add-01',
    perms: [
      { key: 'regView', label: 'View registrations & attendees' },
      { key: 'regCheckin', label: 'Check attendees in' },
      { key: 'regExport', label: 'Export attendee data' },
    ],
  },
  {
    label: 'Finance',
    icon: 'hgi-wallet-01',
    perms: [
      { key: 'finView', label: 'View payments & payouts' },
      { key: 'finRefund', label: 'Issue refunds' },
      { key: 'finDiscount', label: 'Manage discounts & pricing' },
    ],
  },
  {
    label: 'Settings',
    icon: 'hgi-settings-01',
    perms: [
      { key: 'setUsers', label: 'Manage users & roles' },
      { key: 'setSettings', label: 'Edit workspace settings' },
      { key: 'setIntegrations', label: 'Manage integrations & API keys' },
    ],
  },
]

export type RoleCard = {
  name: RoleName
  members: string
  icon: string
  /** Tailwind classes for the coloured icon chip. */
  iconWrap: string
  desc: string
  bullets: string[]
}

/** The four role cards on the Roles page (source `#role-grid`). */
export const ROLE_CARDS: RoleCard[] = [
  {
    name: 'Admin',
    members: '4 members',
    icon: 'hgi-shield-key',
    iconWrap: 'bg-purple-50 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300',
    desc: 'Full access to every workspace feature, including billing and security settings.',
    bullets: ['Manage users & roles', 'Manage payments & payouts', 'Configure workspace settings'],
  },
  {
    name: 'Organizer',
    members: '7 members',
    icon: 'hgi-shield-user',
    iconWrap: 'bg-brand-soft text-brand',
    desc: 'Creates and manages events, tickets, discounts and attendee communications.',
    bullets: ['Create & edit events', 'Manage tickets & discounts', 'View registrations & reports'],
  },
  {
    name: 'Staff',
    members: '12 members',
    icon: 'hgi-user-check-01',
    iconWrap: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    desc: 'Handles day-to-day check-in and attendee support at events.',
    bullets: ['Check-in attendees', 'Scan & validate tickets', 'View registrations'],
  },
  {
    name: 'Attendee',
    members: '2,847 members',
    icon: 'hgi-user-circle',
    iconWrap: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
    desc: 'Registered guests with self-service access to their own tickets and profile only.',
    bullets: ['View own tickets', 'Update own profile', 'No workspace admin access'],
  },
]
