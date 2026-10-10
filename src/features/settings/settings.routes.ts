import { pageAction, pageData, queryOf, type LoaderArgs } from '@/app/loaders'
import {
  api,
  meAccountApi,
  meProfileApi,
  type NotificationPreferencePatch,
  type Query,
} from '@/lib/api'
import { DEFAULT_PAGE_SIZE, isPageSize, pageWindow, type PageWindow } from '@/lib/paging'
import type { IssuedUpload } from '@/lib/signedUpload'
import { intParam } from '@/lib/urlFilters'
import {
  toOrganizationForm,
  toPaymentSettingsCard,
  toProfileCard,
} from './account.mapper'
import {
  toAuditRow,
  toMemberRow,
  toNotificationRow,
  toPermissionOption,
  toRoleCard,
  toSessionRow,
} from './settings.mapper'
import type {
  AuditEntryWire,
  AuditRow,
  MemberRow,
  MemberWire,
  NotificationCategory,
  NotificationRow,
  PermissionOption,
  PermissionWire,
  RoleCard,
  RoleWire,
  OrganizationForm,
  OrganizationSummaryWire,
  OrganizationWire,
  PaymentSettingsCard,
  PaymentMethodRow,
  PaymentMethodWire,
  PaymentSettingsWire,
  StoredKeysWire,
  ProfileCard,
  SessionRow,
  TwoFactorWire,
} from './settings.types'

/** Users, roles, security and notification preferences. */

const settingsApi = {
  members: (query: Query) => api.list<MemberWire>('/members', { query }),
  /** The tab counts. Its own call: the list is one page, these describe all. */
  memberCounts: (query: Query) => api.get<MemberCounts>('/members/counts', { query }),
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

  // The account routes are the attendee portal's too, so they live in
  // `@/lib/api`. Re-typing them here is what declared `otpauthUrl` for
  // `otpauthUri` (the QR encoded `undefined`), typed a nullable `ipAddress`
  // as `string`, and threw away the recovery codes by typing the confirm
  // response `unknown`.
  sessions: meAccountApi.sessions,
  revokeSession: meAccountApi.revokeSession,
  revokeOthers: meAccountApi.revokeOtherSessions,
  twoFactor: meAccountApi.twoFactor,
  startTwoFactor: meAccountApi.startTwoFactor,
  confirmTwoFactor: meAccountApi.confirmTwoFactor,
  disableTwoFactor: meAccountApi.disableTwoFactor,
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>('/auth/change-password', { currentPassword, newPassword }),

  /**
   * The audit trail behind the security screen's panel. Read-only, and capped:
   * the panel shows recent activity, not the whole history — the export is
   * there for anyone who needs all of it.
   */
  audit: () => api.list<AuditEntryWire>('/audit', { query: { limit: AUDIT_PAGE_SIZE } }),

  notifications: () => meAccountApi.notifications<NotificationCategory>(),
  setNotification: (
    category: NotificationCategory,
    body: NotificationPreferencePatch,
  ) => meAccountApi.setNotification(category, body),
}

/* ── users ────────────────────────────────────────────────────────────── */

export interface MemberCounts {
  all: number
  active: number
  invited: number
  suspended: number
}

export interface UsersData {
  rows: MemberRow[]
  window: PageWindow
  roles: { id: number; name: string }[]
  counts: MemberCounts
  /** Echoed back so the controls show what the URL actually asked for. */
  filters: { search: string; status: string; roleId: string }
}

async function loadUsers({ request }: LoaderArgs): Promise<UsersData> {
  const params = queryOf(request)
  const limit = intParam(params, 'limit', DEFAULT_PAGE_SIZE)
  // Filters live in the URL, not component state: the API pages server-side, so
  // the URL is the single source of truth and the back button works.
  const filters = {
    search: params.get('q') ?? '',
    status: params.get('status') ?? '',
    roleId: params.get('roleId') ?? '',
  }
  const narrowing = {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.roleId ? { roleId: Number(filters.roleId) } : {}),
  }

  const [page, roles, counts] = await Promise.all([
    settingsApi.members({
      page: intParam(params, 'page', 1),
      limit: isPageSize(limit) ? limit : DEFAULT_PAGE_SIZE,
      ...narrowing,
    }),
    settingsApi.roles(),
    // Status is left off deliberately — a tab shows its own total even while a
    // different one is selected. Search and role narrow them.
    settingsApi.memberCounts({
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.roleId ? { roleId: Number(filters.roleId) } : {}),
    }),
  ])

  return {
    rows: page.items.map(toMemberRow),
    window: pageWindow(page.meta),
    // The invite form and the role switcher both need every role, not the ones
    // that happen to be held by somebody on this page.
    roles: roles.map((role) => ({ id: role.id, name: role.name })),
    counts,
    filters,
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

/**
 * The permission keys a save asks for.
 *
 * `getAll`, not `get`: the editor's switches are React state and reach the
 * action as one hidden field per key that is on, so reading a single value
 * would send the first switch and drop every other permission the role holds.
 *
 * A key the role has never been offered arrives in that same field, which is
 * what makes answering one an ordinary grant — the marker on its row is a
 * label, and the `PUT` that replaces the whole set never sees it.
 */
export function permissionsOf(form: FormData): string[] {
  return form.getAll('permissions').map(String)
}

async function runRolesAction({ request }: LoaderArgs): Promise<void> {
  const form = await request.formData()
  const permissions = permissionsOf(form)

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

/** How much recent activity the audit panel shows before deferring to export. */
const AUDIT_PAGE_SIZE = 20

export interface SecurityData {
  sessions: SessionRow[]
  twoFactor: TwoFactorWire
  audit: AuditRow[]
}

async function loadSecurity(): Promise<SecurityData> {
  const [sessions, twoFactor, audit] = await Promise.all([
    settingsApi.sessions(),
    settingsApi.twoFactor(),
    settingsApi.audit(),
  ])
  return {
    sessions: sessions.map(toSessionRow),
    twoFactor,
    audit: audit.items.map(toAuditRow),
  }
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
    // Returned, not awaited and dropped. The API mints the recovery codes
    // here and stores only their hashes, so this response is the single
    // moment they exist anywhere the organizer can see them. Discarding it
    // left this console counting codes ("3 recovery codes left") that it had
    // never once shown — and an organizer who loses their authenticator with
    // no codes is locked out of their own workspace.
    return settingsApi.confirmTwoFactor(String(form.get('code') ?? ''))
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

/* ── profile, organization and payments ───────────────────────────────── */

export interface ProfileData {
  profile: ProfileCard
}

export const profileRoute = {
  loader: pageData(async (): Promise<ProfileData> => ({
    profile: toProfileCard(await accountApi.profile()),
  })),

  action: pageAction(async ({ request }: LoaderArgs) => {
    const form = await request.formData()
    if (form.get('intent') === 'email') {
      return accountApi.changeEmail(field(form, 'email'))
    }
    return accountApi.saveProfile({
      name: field(form, 'name'),
      // NO `phone` — see `ProfilePatch`. The key is refused outright, so
      // including it failed every save on this form with a 400 about a field
      // the organizer cannot see.
      city: nullable(form, 'city'),
      timezone: nullable(form, 'timezone'),
      locale: field(form, 'locale') === 'th' ? 'th' : 'en',
      bio: nullable(form, 'bio'),
    })
  }),
}

export interface OrganizationData {
  organization: OrganizationForm
  summary: OrganizationSummaryWire
}

export const organizationRoute = {
  loader: pageData(async (): Promise<OrganizationData> => {
    const [organization, summary] = await Promise.all([
      accountApi.organization(),
      accountApi.organizationSummary(),
    ])
    return { organization: toOrganizationForm(organization), summary }
  }),

  action: pageAction(async ({ request }: LoaderArgs) => {
    const form = await request.formData()
    return accountApi.saveOrganization({
      name: field(form, 'name'),
      address: nullable(form, 'address'),
      website: nullable(form, 'website'),
      taxId: nullable(form, 'taxId'),
      timezone: field(form, 'timezone'),
      statementDescriptor: nullable(form, 'statementDescriptor'),
      // Sent back untouched so the API can refuse a form that was opened
      // before somebody else's edit, rather than let it overwrite theirs.
      version: Number(form.get('version') ?? 0),
    })
  }),
}

export interface PaymentsData {
  payments: PaymentSettingsCard
  methods: PaymentMethodRow[]
  /** Which mode's keys are on screen — from `?mode=`, not component state. */
  viewing: 'test' | 'live'
}

export const paymentsRoute = {
  loader: pageData(async ({ request }): Promise<PaymentsData> => {
    const settings = await accountApi.paymentSettings()
    // The Test/Live toggle is a URL parameter, so flipping it re-runs this
    // loader and the boxes below show THAT mode's stored keys. As component
    // state it only relabelled the form: the fields kept showing whatever the
    // active mode had, and the toggle looked like a viewer that never viewed.
    const asked = queryOf(request).get('mode')
    const viewing = asked === 'live' || asked === 'test' ? asked : settings.mode
    const [keys, methods] = await Promise.all([
      accountApi.storedPaymentKeys(viewing),
      accountApi.paymentMethods(),
    ])
    return {
      payments: toPaymentSettingsCard(settings, keys),
      methods: methods.map((m) => ({ method: m.method, enabled: m.enabled })),
      viewing,
    }
  }),

  action: pageAction(async ({ request }: LoaderArgs) => {
    const form = await request.formData()
    const intent = form.get('intent')
    if (intent === 'disconnect') return accountApi.disconnectPayments()
    if (intent === 'test') return accountApi.testPayments()
    if (intent === 'keys') {
      const webhookSecret = field(form, 'webhookSecret')
      return accountApi.savePaymentKeys({
        mode: field(form, 'mode') === 'live' ? 'live' : 'test',
        publishableKey: field(form, 'publishableKey'),
        secretKey: field(form, 'secretKey'),
        // Omitted, not blanked: it comes from a different page in Stripe, so
        // re-saving API keys says nothing about it.
        ...(webhookSecret ? { webhookSecret } : {}),
      })
    }
    if (intent === 'method') {
      return accountApi.setPaymentMethod(field(form, 'method'), form.get('enabled') === 'true')
    }
    return accountApi.savePaymentPreferences({
      statementDescriptor: nullable(form, 'statementDescriptor'),
      saveCards: form.get('saveCards') === 'true',
      emailReceipts: form.get('emailReceipts') === 'true',
    })
  }),
}

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim()
}

/** An emptied optional field means "clear it", which the API spells `null`. */
function nullable(form: FormData, name: string): string | null {
  return field(form, name) || null
}

/**
 * The account screens' own calls.
 *
 * PCI SAQ-A: none of these carries a card. Connecting a provider hands over an
 * account reference the provider issued; the card details never reach this app.
 */
export const accountApi = {
  // Shared with the attendee portal's Profile tab — same row, same three
  // routes. `saveProfile` was typed `Record<string, unknown>` here, so a
  // misspelled or stale field name reached the API with nothing to catch it.
  profile: meProfileApi.profile,
  saveProfile: meProfileApi.saveProfile,
  /** Confirms at the new address before it replaces the old one. */
  changeEmail: meProfileApi.changeEmail,

  organization: () => api.get<OrganizationWire>('/organization'),
  /** Events hosted and team members. Its own call: `/organization` is the form. */
  organizationSummary: () =>
    api.get<OrganizationSummaryWire>('/organization/summary'),
  saveOrganization: (body: Record<string, unknown>) =>
    api.patch<OrganizationWire>('/organization', body),

  /**
   * The logo, in the API's two steps: ask where to PUT, send the bytes
   * straight to storage, then confirm. The file never passes through this app
   * or the API — only the browser and the bucket ever hold it.
   */
  logoUploadUrl: (contentType: string, byteSize: number) =>
    api.post<IssuedUpload>('/organization/logo/upload-url', {
      contentType,
      byteSize,
    }),
  confirmLogo: (key: string) =>
    api.post<{ logoUrl: string }>('/organization/logo', { key }),
  removeLogo: () => api.delete<unknown>('/organization/logo'),

  paymentSettings: () => api.get<PaymentSettingsWire>('/payment-settings'),
  savePaymentPreferences: (body: Record<string, unknown>) =>
    api.patch<PaymentSettingsWire>('/payment-settings', body),
  paymentMethods: () => api.get<PaymentMethodWire[]>('/payment-settings/methods'),
  setPaymentMethod: (method: string, enabled: boolean) =>
    api.patch<unknown>(`/payment-settings/methods/${method}`, { enabled }),
  /**
   * The workspace's own Stripe keys. The secret goes up once and never comes
   * back: the response carries a masked tail, which is all the screen needs to
   * say WHICH key is saved.
   */
  savePaymentKeys: (body: {
    mode: 'test' | 'live'
    publishableKey: string
    secretKey: string
    webhookSecret?: string
  }) => api.post<StoredKeysWire>('/payment-settings/keys', body),
  storedPaymentKeys: (mode: 'test' | 'live') =>
    api.get<StoredKeysWire>(`/payment-settings/keys/${mode}`),
  testPayments: () => api.post<unknown>('/payment-settings/test'),
  disconnectPayments: () => api.post<unknown>('/payment-settings/disconnect'),
}
