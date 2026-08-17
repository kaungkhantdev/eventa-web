import { api } from '@/lib/api'
import type { LoaderArgs } from '@/app/loaders'
import { toGuestOrder } from './guestOrder.mapper'
import type { GuestOrder, GuestOrderWire } from './guestOrder.types'

/**
 * The buyer's own copy of their order (US-DISC-06/07).
 *
 * No guard, deliberately. Registration never required an account, so seeing
 * what you bought must not either — the order's id in the URL is the
 * capability, and it is what the confirmation email links to. A wrong id 404s
 * through the route's `errorElement` like any other missing thing.
 */
export const guestOrderRoute = {
  loader: async ({ params }: LoaderArgs): Promise<{ order: GuestOrder }> => {
    const wire = await api.get<GuestOrderWire>(`/public/orders/${params.orderId}`)
    return { order: toGuestOrder(wire) }
  },
}
