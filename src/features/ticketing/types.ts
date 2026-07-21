/** Shared status/type unions for the ticketing feature (tickets + discounts). */

export type TicketStatus = 'onsale' | 'scheduled' | 'paused' | 'soldout'

export type DiscountStatus = 'active' | 'scheduled' | 'expired' | 'disabled'

export type DiscountType = 'percent' | 'fixed'
