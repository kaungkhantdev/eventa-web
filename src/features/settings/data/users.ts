/* Workspace users demo data — ported verbatim from admin/users.html.
   24 rows, four roles, three statuses; the "Last active" dash means the invite
   is still pending. */

import type { RoleName } from './roles'

export type UserStatus = 'Active' | 'Invited' | 'Suspended'

export type WorkspaceUser = {
  name: string
  email: string
  initials: string
  role: RoleName
  status: UserStatus
  lastActive: string
}

export const USERS: WorkspaceUser[] = [
  { name: 'Harper Nelson', email: 'harper.nelson@eventa.io', initials: 'HN', role: 'Admin', status: 'Active', lastActive: 'Jul 18, 2026' },
  { name: 'Anong Praditsarn', email: 'anong.p@gmail.com', initials: 'AP', role: 'Organizer', status: 'Active', lastActive: 'Jul 17, 2026' },
  { name: 'Somchai Tanakit', email: 'somchai.t@outlook.com', initials: 'ST', role: 'Organizer', status: 'Active', lastActive: 'Jul 16, 2026' },
  { name: 'Ploy Suwannarat', email: 'ploy.suwan@yahoo.com', initials: 'PS', role: 'Staff', status: 'Active', lastActive: 'Jul 15, 2026' },
  { name: 'James Whitfield', email: 'james.whitfield@gmail.com', initials: 'JW', role: 'Staff', status: 'Invited', lastActive: '—' },
  { name: 'Mei Lin', email: 'mei.lin88@gmail.com', initials: 'ML', role: 'Staff', status: 'Active', lastActive: 'Jul 12, 2026' },
  { name: 'Natthaphong Charoen', email: 'nat.charoen@hotmail.com', initials: 'NC', role: 'Attendee', status: 'Active', lastActive: 'Jul 5, 2026' },
  { name: 'David Okafor', email: 'd.okafor@corpmail.com', initials: 'DO', role: 'Organizer', status: 'Suspended', lastActive: 'Jun 20, 2026' },
  { name: 'Grace Hoffman', email: 'grace.hoffman@eventa.io', initials: 'GH', role: 'Admin', status: 'Active', lastActive: 'Jul 18, 2026' },
  { name: 'Jun Park', email: 'jun.park@gmail.com', initials: 'JP', role: 'Admin', status: 'Active', lastActive: 'Jul 3, 2026' },
  { name: 'Kanya Rattanakosin', email: 'kanya.r@gmail.com', initials: 'KR', role: 'Organizer', status: 'Active', lastActive: 'Jul 14, 2026' },
  { name: 'Ravi Menon', email: 'ravi.menon@corpmail.com', initials: 'RM', role: 'Organizer', status: 'Active', lastActive: 'Jul 9, 2026' },
  { name: 'Siriporn Adisai', email: 'siriporn.a@yahoo.com', initials: 'SA', role: 'Organizer', status: 'Active', lastActive: 'Jul 7, 2026' },
  { name: 'Arthit Wongsawat', email: 'arthit.w@outlook.com', initials: 'AW', role: 'Organizer', status: 'Invited', lastActive: '—' },
  { name: 'Suda Kittisak', email: 'suda.k@yahoo.com', initials: 'SK', role: 'Staff', status: 'Active', lastActive: 'Jul 13, 2026' },
  { name: 'Lily Tan', email: 'lily.tan@gmail.com', initials: 'LT', role: 'Staff', status: 'Active', lastActive: 'Jul 11, 2026' },
  { name: 'Kevin Oduya', email: 'kevin.oduya@corpmail.com', initials: 'KO', role: 'Staff', status: 'Active', lastActive: 'Jul 6, 2026' },
  { name: 'Preeya Nakamura', email: 'preeya.n@outlook.com', initials: 'PN', role: 'Staff', status: 'Invited', lastActive: '—' },
  { name: 'Nattapong Sirichai', email: 'nattapong.s@gmail.com', initials: 'NS', role: 'Staff', status: 'Suspended', lastActive: 'Jun 28, 2026' },
  { name: 'Rachel Davies', email: 'rachel.davies@gmail.com', initials: 'RD', role: 'Attendee', status: 'Active', lastActive: 'Jul 10, 2026' },
  { name: 'Wichai Phumipat', email: 'wichai.p@hotmail.com', initials: 'WP', role: 'Attendee', status: 'Active', lastActive: 'Jul 8, 2026' },
  { name: 'Malee Rojana', email: 'malee.r@gmail.com', initials: 'MR', role: 'Attendee', status: 'Active', lastActive: 'Jul 4, 2026' },
  { name: 'Tom Bradley', email: 'tom.bradley@gmail.com', initials: 'TB', role: 'Attendee', status: 'Suspended', lastActive: 'Jun 15, 2026' },
  { name: 'Chai Leelawat', email: 'chai.l@outlook.com', initials: 'CL', role: 'Attendee', status: 'Invited', lastActive: '—' },
]

/** Badge class + icon per role (source `ROLE_BADGE`). */
export const USER_ROLE_BADGE: Record<RoleName, { cls: string; icon: string }> = {
  Admin: { cls: 'badge-purple', icon: 'hgi-shield-key' },
  Organizer: { cls: 'badge-green', icon: 'hgi-shield-user' },
  Staff: { cls: 'badge-blue', icon: 'hgi-user-check-01' },
  Attendee: { cls: 'badge-gray', icon: 'hgi-user-multiple' },
}

/** Badge class + icon per status (source `STATUS_BADGE`). */
export const USER_STATUS_BADGE: Record<UserStatus, { cls: string; icon: string }> = {
  Active: { cls: 'badge-green', icon: 'hgi-checkmark-badge-01' },
  Invited: { cls: 'badge-amber', icon: 'hgi-mail-01' },
  Suspended: { cls: 'badge-red', icon: 'hgi-cancel-circle' },
}

export type UserTab = 'all' | 'active' | 'invited' | 'suspended'

/** Pill-tab value → the status it filters on (source `TAB_STATUS`). */
export const USER_TAB_STATUS: Record<Exclude<UserTab, 'all'>, UserStatus> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
}

/** Role dropdown options (below the "All roles" default). */
export const USER_ROLE_FILTERS: RoleName[] = ['Admin', 'Organizer', 'Staff', 'Attendee']
