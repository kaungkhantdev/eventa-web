/* Payments & refunds ledger for the Reports · Transactions sub-page.
   Ported verbatim from the inline script in admin/reports-transactions.html.
   Mock data. */

export type TransactionType = 'Payment' | 'Refund'
export type TransactionStatus = 'Succeeded' | 'Refunded' | 'Failed'

export type Transaction = {
  ref: string
  date: string
  attendee: string
  event: string
  method: string
  amount: number
  type: TransactionType
  status: TransactionStatus
}

export const TRANSACTIONS: Transaction[] = [
  { ref: 'TXN-8842', date: 'Jul 16, 2026', attendee: 'Somchai Jaidee', event: 'Tech Summit 2026', method: 'Visa', amount: 2500, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8841', date: 'Jul 16, 2026', attendee: 'Nattaya Wongsawat', event: 'Bangkok Jazz Night', method: 'PromptPay', amount: 1200, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8840', date: 'Jul 15, 2026', attendee: 'Kittisak Boonmee', event: 'Sunrise Yoga Retreat', method: 'Mastercard', amount: 1250, type: 'Refund', status: 'Refunded' },
  { ref: 'TXN-8839', date: 'Jul 15, 2026', attendee: 'Ploychompoo Srisai', event: 'Thai Street Food Festival', method: 'PayPal', amount: 680, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8838', date: 'Jul 15, 2026', attendee: 'Anucha Phromma', event: 'UX Bangkok Meetup', method: 'Visa', amount: 480, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8837', date: 'Jul 14, 2026', attendee: 'Warunee Chaiyo', event: 'Tech Summit 2026', method: 'Mastercard', amount: 2500, type: 'Payment', status: 'Failed' },
  { ref: 'TXN-8836', date: 'Jul 14, 2026', attendee: 'Thanawat Rattana', event: 'Bangkok Jazz Night', method: 'PromptPay', amount: 1500, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8835', date: 'Jul 14, 2026', attendee: 'Siriporn Kaewkla', event: 'Sunrise Yoga Retreat', method: 'Visa', amount: 950, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8834', date: 'Jul 13, 2026', attendee: 'Chalermchai Pattanakul', event: 'Thai Street Food Festival', method: 'PromptPay', amount: 720, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8833', date: 'Jul 13, 2026', attendee: 'Kanya Suksawat', event: 'Tech Summit 2026', method: 'Visa', amount: 2800, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8832', date: 'Jul 12, 2026', attendee: 'Peerapong Intira', event: 'UX Bangkok Meetup', method: 'PayPal', amount: 480, type: 'Refund', status: 'Refunded' },
  { ref: 'TXN-8831', date: 'Jul 12, 2026', attendee: 'Malee Thongdee', event: 'Bangkok Jazz Night', method: 'Mastercard', amount: 1350, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8830', date: 'Jul 12, 2026', attendee: 'Wichai Sombat', event: 'Sunrise Yoga Retreat', method: 'PromptPay', amount: 1250, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8829', date: 'Jul 11, 2026', attendee: 'Napaporn Chaidet', event: 'Thai Street Food Festival', method: 'Visa', amount: 640, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8828', date: 'Jul 11, 2026', attendee: 'Anong Rungrueang', event: 'Tech Summit 2026', method: 'PromptPay', amount: 2500, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8827', date: 'Jul 10, 2026', attendee: 'Prasert Wattana', event: 'Bangkok Jazz Night', method: 'Visa', amount: 1200, type: 'Payment', status: 'Failed' },
  { ref: 'TXN-8826', date: 'Jul 10, 2026', attendee: 'Suchada Maneerat', event: 'UX Bangkok Meetup', method: 'Mastercard', amount: 560, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8825', date: 'Jul 09, 2026', attendee: 'Teerapat Boonrueng', event: 'Sunrise Yoga Retreat', method: 'Visa', amount: 950, type: 'Refund', status: 'Refunded' },
  { ref: 'TXN-8824', date: 'Jul 09, 2026', attendee: 'Jiraporn Saetang', event: 'Thai Street Food Festival', method: 'PromptPay', amount: 700, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8823', date: 'Jul 08, 2026', attendee: 'Ekachai Phumipat', event: 'Tech Summit 2026', method: 'PayPal', amount: 2650, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8822', date: 'Jul 08, 2026', attendee: 'Rungnapa Kittikorn', event: 'Bangkok Jazz Night', method: 'PromptPay', amount: 1500, type: 'Payment', status: 'Succeeded' },
  { ref: 'TXN-8821', date: 'Jul 07, 2026', attendee: 'Somsak Wongchai', event: 'UX Bangkok Meetup', method: 'Visa', amount: 520, type: 'Payment', status: 'Succeeded' },
]

/** Badge class for a transaction type, matching the static kit's typeBadge(). */
export const TXN_TYPE_BADGE: Record<TransactionType, string> = {
  Payment: 'badge-green',
  Refund: 'badge-amber',
}

/** Badge class for a transaction status, matching the static kit's statusBadge(). */
export const TXN_STATUS_BADGE: Record<TransactionStatus, string> = {
  Succeeded: 'badge-green',
  Refunded: 'badge-gray',
  Failed: 'badge-red',
}
