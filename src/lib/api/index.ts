/**
 * The API layer. Import from `@/lib/api` — never reach into a file here.
 *
 *   const { items, meta } = await api.list<RegistrationRow>('/registrations', {
 *     query: { page, status },
 *   })
 */
export { api, type Query, type ReadOptions } from './client'
export { ApiError, NetworkError } from './ApiError'
export { messageOf } from './messageOf'
export {
  meAccountApi,
  type LoginSessionWire,
  type NotificationPreferencePatch,
  type NotificationPreferenceWire,
  type RecoveryCodesWire,
  type TwoFactorStartWire,
  type TwoFactorWire,
} from './meAccount'
export {
  meProfileApi,
  type ProfilePatch,
  type ProfileWire,
} from './meProfile'
export { session, type Tokens } from './session'
export {
  EMPTY_META,
  type FieldError,
  type Page,
  type PageMeta,
} from './envelope'
