/* Per-message delivery log — 24 rows ported verbatim from the inline <script>
   in admin/messaging-log.html. */

export type DeliveryChannel = 'email' | 'sms'
export type DeliveryStatus = 'delivered' | 'opened' | 'sent' | 'failed'

export type DeliveryRow = {
  initials: string
  name: string
  email: string
  type: string
  channel: DeliveryChannel
  status: DeliveryStatus
  time: string
}

/** [badge class, icon slug, label] — mirrors the CHAN map in the source. */
export const DELIVERY_CHANNEL: Record<DeliveryChannel, [string, string, string]> = {
  email: ['badge-blue', 'hgi-mail-01', 'Email'],
  sms: ['badge-green', 'hgi-smart-phone-01', 'SMS'],
}

/** [badge class, icon slug, label] — mirrors the STAT map in the source. */
export const DELIVERY_STATUS: Record<DeliveryStatus, [string, string, string]> = {
  delivered: ['badge-green', 'hgi-tick-02', 'Delivered'],
  opened: ['badge-purple', 'hgi-eye', 'Opened'],
  sent: ['badge-blue', 'hgi-mail-send-01', 'Sent'],
  failed: ['badge-red', 'hgi-alert-circle', 'Failed'],
}

export const DELIVERY_LOG: DeliveryRow[] = [
  { initials: 'AP', name: 'Anong P.', email: 'anong.p@gmail.com', type: 'Registration confirmation', channel: 'email', status: 'delivered', time: 'Jul 9 · 10:24' },
  { initials: 'ST', name: 'Somchai T.', email: 'somchai.t@hotmail.com', type: 'Payment receipt', channel: 'email', status: 'opened', time: 'Jul 9 · 10:03' },
  { initials: 'PS', name: 'Ploy S.', email: 'ploy.s@gmail.com', type: 'Event reminder (24h)', channel: 'sms', status: 'sent', time: 'Jul 9 · 09:47' },
  { initials: 'JW', name: 'James W.', email: 'james.wilson@gmail.com', type: 'Cancellation notice', channel: 'email', status: 'delivered', time: 'Jul 8 · 18:12' },
  { initials: 'ML', name: 'Mei L.', email: 'mei.lin@outlook.com', type: 'Waitlist offer', channel: 'email', status: 'opened', time: 'Jul 8 · 16:30' },
  { initials: 'NK', name: 'Nutcha K.', email: 'nutcha.k@gmail.com', type: 'Venue change notice', channel: 'sms', status: 'failed', time: 'Jul 8 · 14:05' },
  { initials: 'DC', name: 'David C.', email: 'david.chen@gmail.com', type: 'Registration confirmation', channel: 'email', status: 'delivered', time: 'Jul 8 · 11:22' },
  { initials: 'KR', name: 'Kanya R.', email: 'kanya.r@yahoo.com', type: 'Post-event thank-you', channel: 'email', status: 'sent', time: 'Jul 7 · 20:15' },
  { initials: 'AB', name: 'Arthit B.', email: 'arthit.b@gmail.com', type: 'Payment receipt', channel: 'email', status: 'delivered', time: 'Jul 7 · 15:48' },
  { initials: 'SM', name: 'Sofia M.', email: 'sofia.m@gmail.com', type: 'Event reminder (24h)', channel: 'sms', status: 'delivered', time: 'Jul 7 · 09:10' },
  { initials: 'WC', name: 'Wichai C.', email: 'wichai.c@gmail.com', type: 'Registration confirmation', channel: 'email', status: 'delivered', time: 'Jul 6 · 22:40' },
  { initials: 'GH', name: 'Grace H.', email: 'grace.harris@outlook.com', type: 'Waitlist offer', channel: 'email', status: 'opened', time: 'Jul 6 · 19:05' },
  { initials: 'NP', name: 'Nattapong P.', email: 'nattapong.p@gmail.com', type: 'Event reminder (24h)', channel: 'sms', status: 'delivered', time: 'Jul 6 · 17:33' },
  { initials: 'RK', name: 'Ravi K.', email: 'ravi.kumar@gmail.com', type: 'Payment receipt', channel: 'email', status: 'sent', time: 'Jul 6 · 12:18' },
  { initials: 'SB', name: 'Suda B.', email: 'suda.b@yahoo.com', type: 'Cancellation notice', channel: 'email', status: 'failed', time: 'Jul 5 · 21:50' },
  { initials: 'EM', name: 'Emma M.', email: 'emma.davies@gmail.com', type: 'Registration confirmation', channel: 'email', status: 'delivered', time: 'Jul 5 · 16:42' },
  { initials: 'KP', name: 'Kittisak P.', email: 'kittisak.p@hotmail.com', type: 'Post-event thank-you', channel: 'email', status: 'opened', time: 'Jul 5 · 14:09' },
  { initials: 'YN', name: 'Yuki N.', email: 'yuki.nakamura@outlook.com', type: 'Event reminder (24h)', channel: 'sms', status: 'delivered', time: 'Jul 5 · 08:55' },
  { initials: 'PC', name: 'Preeya C.', email: 'preeya.c@gmail.com', type: 'Venue change notice', channel: 'sms', status: 'sent', time: 'Jul 4 · 20:21' },
  { initials: 'OK', name: 'Omar K.', email: 'omar.k@gmail.com', type: 'Payment receipt', channel: 'email', status: 'delivered', time: 'Jul 4 · 15:37' },
  { initials: 'SW', name: 'Siriporn W.', email: 'siriporn.w@yahoo.com', type: 'Waitlist offer', channel: 'email', status: 'delivered', time: 'Jul 4 · 11:14' },
  { initials: 'LS', name: 'Lucas S.', email: 'lucas.silva@gmail.com', type: 'Registration confirmation', channel: 'email', status: 'opened', time: 'Jul 3 · 19:48' },
  { initials: 'MK', name: 'Malee K.', email: 'malee.k@gmail.com', type: 'Cancellation notice', channel: 'email', status: 'delivered', time: 'Jul 3 · 13:26' },
  { initials: 'DK', name: 'Daniel K.', email: 'daniel.kim@outlook.com', type: 'Event reminder (24h)', channel: 'sms', status: 'failed', time: 'Jul 3 · 09:02' },
]
