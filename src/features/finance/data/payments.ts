/* Payments demo data — ported verbatim from admin/payments.html.
   28 rows, VAT-inclusive Thai Baht amounts, four statuses, three methods. */

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed'
export type PaymentMethod = 'Card' | 'PromptPay' | 'Bank transfer'

export type Payment = {
  txn: string
  ini: string
  name: string
  ev: string
  method: PaymentMethod
  amt: number
  st: PaymentStatus
  date: string
  time: string
}

export const PAYMENTS: Payment[] = [
  { txn: '#TXN-10492', ini: 'AP', name: 'Anong P.', ev: 'Tech Summit 2026', method: 'Card', amt: 1250, st: 'Paid', date: 'Jul 18, 2026', time: '10:24' },
  { txn: '#TXN-10491', ini: 'ST', name: 'Somchai T.', ev: 'Bangkok Jazz Night', method: 'PromptPay', amt: 480, st: 'Paid', date: 'Jul 18, 2026', time: '10:02' },
  { txn: '#TXN-10490', ini: 'WI', name: 'Walk-in', ev: 'Sunrise Yoga Retreat', method: 'Bank transfer', amt: 890, st: 'Pending', date: 'Jul 18, 2026', time: '09:47' },
  { txn: '#TXN-10489', ini: 'PS', name: 'Ploy S.', ev: 'Tech Summit 2026', method: 'Card', amt: 1250, st: 'Paid', date: 'Jul 17, 2026', time: '16:12' },
  { txn: '#TXN-10488', ini: 'JW', name: 'James W.', ev: 'Bangkok Jazz Night', method: 'PromptPay', amt: 480, st: 'Refunded', date: 'Jul 17, 2026', time: '14:03' },
  { txn: '#TXN-10487', ini: 'ML', name: 'Mei L.', ev: 'Thai Street Food Festival', method: 'Card', amt: 650, st: 'Paid', date: 'Jul 17, 2026', time: '11:45' },
  { txn: '#TXN-10486', ini: 'KR', name: 'Kittipong R.', ev: 'UX Bangkok Meetup', method: 'Bank transfer', amt: 320, st: 'Failed', date: 'Jul 16, 2026', time: '09:20' },
  { txn: '#TXN-10485', ini: 'SK', name: 'Suda K.', ev: 'Tech Summit 2026', method: 'Card', amt: 1250, st: 'Paid', date: 'Jul 16, 2026', time: '08:58' },
  { txn: '#TXN-10484', ini: 'DC', name: 'David C.', ev: 'Sunrise Yoga Retreat', method: 'PromptPay', amt: 890, st: 'Paid', date: 'Jul 15, 2026', time: '19:32' },
  { txn: '#TXN-10483', ini: 'NW', name: 'Nutcha W.', ev: 'Bangkok Jazz Night', method: 'Card', amt: 480, st: 'Pending', date: 'Jul 15, 2026', time: '17:10' },
  { txn: '#TXN-10482', ini: 'RH', name: 'Rachel H.', ev: 'Thai Street Food Festival', method: 'Card', amt: 650, st: 'Paid', date: 'Jul 15, 2026', time: '13:41' },
  { txn: '#TXN-10481', ini: 'WC', name: 'Wichai C.', ev: 'Tech Summit 2026', method: 'PromptPay', amt: 1250, st: 'Paid', date: 'Jul 15, 2026', time: '11:08' },
  { txn: '#TXN-10480', ini: 'GH', name: 'Grace H.', ev: 'UX Bangkok Meetup', method: 'Card', amt: 320, st: 'Paid', date: 'Jul 14, 2026', time: '18:55' },
  { txn: '#TXN-10479', ini: 'PB', name: 'Preeya B.', ev: 'Sunrise Yoga Retreat', method: 'Bank transfer', amt: 890, st: 'Refunded', date: 'Jul 14, 2026', time: '16:20' },
  { txn: '#TXN-10478', ini: 'KC', name: 'Kevin C.', ev: 'Bangkok Jazz Night', method: 'PromptPay', amt: 480, st: 'Paid', date: 'Jul 14, 2026', time: '12:33' },
  { txn: '#TXN-10477', ini: 'SW', name: 'Siriporn W.', ev: 'Tech Summit 2026', method: 'Card', amt: 1250, st: 'Paid', date: 'Jul 14, 2026', time: '09:14' },
  { txn: '#TXN-10476', ini: 'EK', name: 'Emma K.', ev: 'Thai Street Food Festival', method: 'PromptPay', amt: 650, st: 'Pending', date: 'Jul 13, 2026', time: '20:02' },
  { txn: '#TXN-10475', ini: 'NR', name: 'Narong R.', ev: 'UX Bangkok Meetup', method: 'Bank transfer', amt: 320, st: 'Failed', date: 'Jul 13, 2026', time: '15:47' },
  { txn: '#TXN-10474', ini: 'TS', name: 'Tom S.', ev: 'Sunrise Yoga Retreat', method: 'Card', amt: 890, st: 'Paid', date: 'Jul 13, 2026', time: '11:29' },
  { txn: '#TXN-10473', ini: 'MP', name: 'Malee P.', ev: 'Bangkok Jazz Night', method: 'PromptPay', amt: 480, st: 'Paid', date: 'Jul 12, 2026', time: '19:18' },
  { txn: '#TXN-10472', ini: 'RK', name: 'Ravi K.', ev: 'Tech Summit 2026', method: 'Card', amt: 1250, st: 'Paid', date: 'Jul 12, 2026', time: '14:56' },
  { txn: '#TXN-10471', ini: 'KI', name: 'Kanya I.', ev: 'Thai Street Food Festival', method: 'Bank transfer', amt: 650, st: 'Paid', date: 'Jul 12, 2026', time: '10:41' },
  { txn: '#TXN-10470', ini: 'LS', name: 'Lily S.', ev: 'UX Bangkok Meetup', method: 'PromptPay', amt: 320, st: 'Refunded', date: 'Jul 11, 2026', time: '17:33' },
  { txn: '#TXN-10469', ini: 'AT', name: 'Arthit T.', ev: 'Sunrise Yoga Retreat', method: 'Card', amt: 890, st: 'Pending', date: 'Jul 11, 2026', time: '13:07' },
  { txn: '#TXN-10468', ini: 'JN', name: 'Jun N.', ev: 'Tech Summit 2026', method: 'PromptPay', amt: 1250, st: 'Paid', date: 'Jul 11, 2026', time: '09:52' },
  { txn: '#TXN-10467', ini: 'SP', name: 'Sofia P.', ev: 'Bangkok Jazz Night', method: 'Card', amt: 480, st: 'Paid', date: 'Jul 10, 2026', time: '18:44' },
  { txn: '#TXN-10466', ini: 'CM', name: 'Chalerm M.', ev: 'Thai Street Food Festival', method: 'Bank transfer', amt: 650, st: 'Failed', date: 'Jul 10, 2026', time: '15:26' },
  { txn: '#TXN-10465', ini: 'OW', name: 'Orawan W.', ev: 'UX Bangkok Meetup', method: 'Card', amt: 320, st: 'Paid', date: 'Jul 10, 2026', time: '11:03' },
]

/** Badge class + icon per status, from the source `badgeStatus` map. */
export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, { cls: string; icon: string }> = {
  Paid: { cls: 'badge badge-green', icon: 'hgi-tick-02' },
  Pending: { cls: 'badge badge-amber', icon: 'hgi-clock-01' },
  Refunded: { cls: 'badge badge-gray', icon: 'hgi-delivery-return-01' },
  Failed: { cls: 'badge badge-red', icon: 'hgi-cancel-01' },
}

/** Badge class + icon per method, from the source `badgeMethod` map. */
export const PAYMENT_METHOD_BADGE: Record<PaymentMethod, { cls: string; icon: string }> = {
  Card: { cls: 'badge badge-blue', icon: 'hgi-credit-card' },
  PromptPay: { cls: 'badge badge-green', icon: 'hgi-qr-code-01' },
  'Bank transfer': { cls: 'badge badge-gray', icon: 'hgi-bank' },
}

export type PaymentTab = 'all' | 'paid' | 'pending' | 'refunded' | 'failed'

/** Pill-tab value -> the status it filters on. */
export const PAYMENT_TAB_STATUS: Record<Exclude<PaymentTab, 'all'>, PaymentStatus> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
  failed: 'Failed',
}

/** Method dropdown options (below the "All methods" default). */
export const PAYMENT_METHODS: PaymentMethod[] = ['Card', 'PromptPay', 'Bank transfer']
