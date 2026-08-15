import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import { api, type Query } from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import { intParam } from '@/lib/urlFilters'
import {
  toMemberRow,
  toNotificationRow,
  toPermissionOption,
  toRoleCard,
  toSessionRow,
} from './settings.mapper'
import type {
  LoginSessionWire,
  MemberRow,
  MemberWire,
  NotificationCategory,
  NotificationPrefWire,
  NotificationRow,
  PermissionOption,
  PermissionWire,
  RoleCard,
  RoleWire,
  SessionRow,
  TwoFactorWire,
} from './settings.types'

/** Users, roles, security and notification preferences. */

const settingsApi = {
  members: (query: Query) => api.list<MemberWire>('/members', { query }),
  invite: (body: { name: string; email: string; roleId: number }) =>
    api.post<unknown>('/members', body),
  setRole: (id: number, roleId: number) => api.patch<unknown>(`/members/${id}`, { roleId }),
  removeMember: (id: number) => api.delete<void>(`/members/${id}`),
  suspend: (id: number) => api.post<void>(`/members/${id}/suspend`),
  reactivate: (id: number) => api.post<void>(`/members/${id}/reactivate`),
  /** Send the invitation email again for somebody who has not accepted. */
  resend: (email: string) => api.post<unknown>('/invitations', { email }),

  roles: () => api.get<RoleWire[]>('/roles'),
  permissions: () => api.get<PermissionWire[]>('/permissions'),
  createRole: (body: { name: string; description: string; permissions: string[] }) =>
    api.post<RoleWire>('/roles', body),
  setPermissions: (id: number, permissions: string[]) =>
    api.put<RoleWire>(`/roles/${id}/permissions`, { permissions }),

  sessions: () => api.get<LoginSessionWire[]>('/me/sessions'),
  revokeSession: (id: string) => api.delete<void>(`/me/sessions/${id}`),
  revokeOthers: () => api.post<void>('/me/sessions/revoke-others'),
  twoFactor: () => api.get<TwoFactorWire>('/me/two-factor'),
  startTwoFactor: () => api.post<{ secret: string; otpauthUrl: string }>('/me/two-factor/start'),
  confirmTwoFactor: (code: string) => api.post<unknown>('/me/two-factor/confirm', { code }),
  disableTwoFactor: (code: string) => api.post<void>('/me/two-factor/disable', { code }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>('/auth/change-password', { currentPassword, newPassword }),

  notifications: () => api.get<NotificationPrefWire[]>('/me/notification-preferences'),
  setNotification: (
    category: NotificationCategory,
    body: { emailEnabled?: boolean; smsEnabled?: boolean },
  ) => api.patch<unknown>(`/me/notification-preferences/${category}`, body),
}

/* ── users ────────────────────────────────────────────────────────────── */

export interface UsersData {
  rows: MemberRow[]
  window: PageWindow
  roles: { id: number; name: string }[]
}

async function loadUsers({ request }: LoaderArgs): Promise<UsersData> {
  const params = queryOf(request)
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  const [page, roles] = await Promise.all([
    settingsApi.members({
      page: intParam(params, 'page', 1),
      limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
    }),
    settingsApi.roles(),
  ])

  return {
    rows: page.items.map(toMemberRow),
    window: pageWindow(page.meta),
    // The invite form and the role switcher both need every role, not the ones
    // that happen to be held by somebody on this page.
    roles: roles.map((role) => ({ id: role.id, name: role.name })),
  }
}

async function runUsersAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')
  const id = Number(form.get('memberId'))

  if (intent === 'invite') {
    await settingsApi.invite({
      name: String(form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      roleId: Number(form.get('roleId')),
    })
    return
  }
  if (intent === 'role') {
    await settingsApi.setRole(id, Number(form.get('roleId')))
    return
  }
  if (intent === 'suspend') {
    await settingsApi.suspend(id)
    return
  }
  if (intent === 'reactivate') {
    await settingsApi.reactivate(id)
    return
  }
  if (intent === 'resend') {
    await settingsApi.resend(String(form.get('email') ?? ''))
    return
  }
  await settingsApi.removeMember(id)
}

export const usersRoute = {
  loader: pageData(loadUsers),
  action: pageAction(runUsersAction),
}

/* ── roles ────────────────────────────────────────────────────────────── */

export interface RolesData {
  roles: RoleCard[]
  /** Every permission the API knows, grouped for the editor. */
  groups: { name: string; permissions: PermissionOption[] }[]
}

const GROUP_ORDER = ['Events', 'Registrations', 'Finance', 'Settings'] as const

async function loadRoles(): Promise<RolesData> {
  const [roles, permissions] = await Promise.all([settingsApi.roles(), settingsApi.permissions()])
  const options = permissions.map(toPermissionOption)

  return {
    roles: roles.map(toRoleCard),
    // Grouped in the API's own order rather than however the list arrived, so
    // the editor reads the same way every time.
    groups: GROUP_ORDER.map((name) => ({
      name,
      permissions: options.filter((option) => option.group === name),
    })).filter((group) => group.permissions.length > 0),
  }
}

async function runRolesAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const permissions = form.getAll('permissions').map(String)

  if (String(form.get('intent')) === 'create') {
    await settingsApi.createRole({
      name: String(form.get('name') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      permissions,
    })
    return
  }
  await settingsApi.setPermissions(Number(form.get('roleId')), permissions)
}

export const rolesRoute = {
  loader: pageData(loadRoles),
  action: pageAction(runRolesAction),
}

/* ── security ─────────────────────────────────────────────────────────── */

export interface SecurityData {
  sessions: SessionRow[]
  twoFactor: TwoFactorWire
}

async function loadSecurity(): Promise<SecurityData> {
  const [sessions, twoFactor] = await Promise.all([
    settingsApi.sessions(),
    settingsApi.twoFactor(),
  ])
  return { sessions: sessions.map(toSessionRow), twoFactor }
}

/**
 * Password, two-factor and sessions.
 *
 * Nothing here is logged, and nothing is kept: a password or a 2FA code is read
 * out of the form, handed to the API and forgotten. The secret behind a QR code
 * comes back from `start` and is never stored by this app.
 */
async function runSecurityAction({ request }: LoaderArgs): Promise<unknown> {
  const form = await request.formData()
  const intent = String(form.get('intent') ?? '')

  if (intent === 'password') {
    await settingsApi.changePassword(
      String(form.get('currentPassword') ?? ''),
      String(form.get('newPassword') ?? ''),
    )
    return null
  }
  if (intent === 'start-2fa') return settingsApi.startTwoFactor()
  if (intent === 'confirm-2fa') {
    await settingsApi.confirmTwoFactor(String(form.get('code') ?? ''))
    return null
  }
  if (intent === 'disable-2fa') {
    await settingsApi.disableTwoFactor(String(form.get('code') ?? ''))
    return null
  }
  if (intent === 'revoke-others') {
    await settingsApi.revokeOthers()
    return null
  }
  await settingsApi.revokeSession(String(form.get('sessionId') ?? ''))
  return null
}

export const securityRoute = {
  loader: pageData(loadSecurity),
  action: pageAction(runSecurityAction),
}

/* ── notifications ────────────────────────────────────────────────────── */

export interface NotificationsData {
  rows: NotificationRow[]
}

async function loadNotifications(): Promise<NotificationsData> {
  const preferences = await settingsApi.notifications()
  return { rows: preferences.map(toNotificationRow) }
}

/**
 * One switch at a time.
 *
 * The API takes a partial patch per category, so only the channel that changed
 * is sent — flipping email must not quietly re-assert an SMS setting somebody
 * changed in another tab.
 */
async function runNotificationsAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const channel = String(form.get('channel') ?? 'email')
  const enabled = form.get('enabled') === 'true'
  await settingsApi.setNotification(String(form.get('category') ?? '') as NotificationCategory, {
    [channel === 'sms' ? 'smsEnabled' : 'emailEnabled']: enabled,
  })
}

export const notificationsRoute = {
  loader: pageData(loadNotifications),
  action: pageAction(runNotificationsAction),
}
