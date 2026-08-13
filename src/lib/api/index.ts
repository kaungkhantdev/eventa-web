/**
 * The API layer. Import from `@/lib/api` — never reach into a file here.
 *
 *   const { items, meta } = await api.list<RegistrationRow>('/registrations', {
 *     query: { page, status },
 *   })
 */
export { api, type Query } from './client'
export { ApiError, NetworkError } from './ApiError'
export { session, type Tokens } from './session'
export {
  EMPTY_META,
  type FieldError,
  type Page,
  type PageMeta,
} from './envelope'
