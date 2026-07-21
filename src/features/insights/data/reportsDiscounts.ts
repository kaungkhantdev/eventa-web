/* Discount codes ledger for the Reports · Discounts sub-page.
   Ported verbatim from the inline script in admin/reports-discounts.html.
   Mock data. */

export type DiscountStatus = 'Active' | 'Scheduled' | 'Expired'

export type DiscountCode = {
  code: string
  type: string
  event: string
  redemptions: number
  discount: number
  revenue: number
  status: DiscountStatus
}

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: 'SUMMER25', type: '25% off', event: 'All events', redemptions: 68, discount: 62000, revenue: 248000, status: 'Active' },
  { code: 'EARLYBIRD', type: '฿200 off', event: 'Tech Summit 2026', redemptions: 142, discount: 28400, revenue: 512000, status: 'Active' },
  { code: 'JAZZ15', type: '15% off', event: 'Bangkok Jazz Night', redemptions: 39, discount: 11700, revenue: 78000, status: 'Active' },
  { code: 'YOGA30', type: '30% off', event: 'Sunrise Yoga Retreat', redemptions: 24, discount: 14400, revenue: 33600, status: 'Active' },
  { code: 'STUDENT10', type: '10% off', event: 'All events', redemptions: 87, discount: 8700, revenue: 78300, status: 'Active' },
  { code: 'VIP500', type: '฿500 off', event: 'Tech Summit 2026', redemptions: 12, discount: 6000, revenue: 96000, status: 'Active' },
  { code: 'FOODFEST', type: '20% off', event: 'Thai Street Food Festival', redemptions: 56, discount: 5600, revenue: 22400, status: 'Active' },
  { code: 'UXMEET', type: '฿150 off', event: 'UX Bangkok Meetup', redemptions: 31, discount: 4650, revenue: 46500, status: 'Active' },
  { code: 'FLASH50', type: '50% off', event: 'Bangkok Jazz Night', redemptions: 8, discount: 4000, revenue: 4000, status: 'Expired' },
  { code: 'LAUNCH20', type: '20% off', event: 'Tech Summit 2026', redemptions: 45, discount: 9000, revenue: 36000, status: 'Expired' },
  { code: 'WELCOME', type: '฿100 off', event: 'All events', redemptions: 63, discount: 6300, revenue: 63000, status: 'Active' },
  { code: 'GROUP4', type: '25% off', event: 'Sunrise Yoga Retreat', redemptions: 19, discount: 9500, revenue: 28500, status: 'Scheduled' },
  { code: 'AUTUMN15', type: '15% off', event: 'All events', redemptions: 0, discount: 0, revenue: 0, status: 'Scheduled' },
  { code: 'PARTNER', type: '฿300 off', event: 'Tech Summit 2026', redemptions: 27, discount: 8100, revenue: 81000, status: 'Active' },
  { code: 'WEEKEND', type: '10% off', event: 'Thai Street Food Festival', redemptions: 52, discount: 5200, revenue: 46800, status: 'Expired' },
  { code: 'LOYAL5', type: '฿250 off', event: 'UX Bangkok Meetup', redemptions: 22, discount: 5500, revenue: 55000, status: 'Active' },
  { code: 'NEWYEAR', type: '30% off', event: 'Bangkok Jazz Night', redemptions: 0, discount: 0, revenue: 0, status: 'Scheduled' },
  { code: 'BUNDLE', type: '฿200 off', event: 'All events', redemptions: 41, discount: 8200, revenue: 82000, status: 'Active' },
]

/** Badge class for a discount status, matching the static kit's BADGE map. */
export const DISCOUNT_STATUS_BADGE: Record<DiscountStatus, string> = {
  Active: 'badge-green',
  Scheduled: 'badge-blue',
  Expired: 'badge-gray',
}
