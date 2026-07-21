/* Payment history for the portal "My Account" page. 6 original rows (verbatim)
   + 8 older transactions = 14, exactly as in my-events.html. */

export type Transaction = {
  event: string
  inv: string
  date: string
  icon: string
  method: string
  amount: number
  refunded: boolean
}

export const TRANSACTIONS: Transaction[] = [
  { event: 'Tech Summit 2026', inv: 'INV-2026-0482', date: 'Jul 2, 2026', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 3500, refunded: false },
  { event: 'Bangkok Jazz Night', inv: 'INV-2026-0455', date: 'Jun 28, 2026', icon: 'hgi-qr-code-01', method: 'PromptPay', amount: 1200, refunded: false },
  { event: 'Sunrise Yoga Retreat', inv: 'INV-2026-0431', date: 'Jun 25, 2026', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 800, refunded: false },
  { event: 'UX Bangkok Meetup', inv: 'INV-2026-0198', date: 'Jun 10, 2026', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 450, refunded: false },
  { event: 'Thai Street Food Festival', inv: 'INV-2026-0087', date: 'May 12, 2026', icon: 'hgi-credit-card', method: 'Mastercard ·· 8830', amount: 350, refunded: false },
  { event: 'Startup Pitch Night', inv: 'INV-2026-0041', date: 'Apr 1, 2026', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 600, refunded: true },
  { event: 'UX Writing Workshop', inv: 'INV-2026-0025', date: 'Mar 22, 2026', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 550, refunded: false },
  { event: 'Bangkok Coffee Fest', inv: 'INV-2026-0012', date: 'Mar 8, 2026', icon: 'hgi-qr-code-01', method: 'PromptPay', amount: 250, refunded: false },
  { event: 'Product Management Bootcamp', inv: 'INV-2026-0004', date: 'Feb 15, 2026', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 1500, refunded: false },
  { event: 'Night Market Live', inv: 'INV-2025-0388', date: 'Jan 30, 2026', icon: 'hgi-qr-code-01', method: 'PromptPay', amount: 180, refunded: false },
  { event: 'New Year Countdown', inv: 'INV-2025-0341', date: 'Dec 28, 2025', icon: 'hgi-credit-card', method: 'Mastercard ·· 8830', amount: 750, refunded: false },
  { event: 'Winter Art Fair', inv: 'INV-2025-0299', date: 'Dec 12, 2025', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 400, refunded: true },
  { event: 'Data Science Meetup', inv: 'INV-2025-0256', date: 'Nov 24, 2025', icon: 'hgi-qr-code-01', method: 'PromptPay', amount: 320, refunded: false },
  { event: 'Autumn Wine Tasting', inv: 'INV-2025-0210', date: 'Nov 8, 2025', icon: 'hgi-credit-card', method: 'Visa ·· 4291', amount: 680, refunded: false },
]
