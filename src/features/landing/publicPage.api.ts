import { api } from '@/lib/api'
import type { PublicPageWire } from './publicPage.types'

/**
 * The one call the public event page makes.
 *
 * `GET /public/events/:slug` is `@Public` on the API — a shared link has to
 * work with no account. `@/lib/api` will still attach a token if the browser
 * happens to hold one, which the server ignores.
 */
export const publicPageApi = {
  page: (slug: string) => api.get<PublicPageWire>(`/public/events/${encodeURIComponent(slug)}`),
}
