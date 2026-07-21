/* Notifications feed — ported from admin/notifications.html's inline <script>.
   Notifications are grouped by recency; `recent` groups show by default and the
   older ones reveal via "Show older activity". Message bodies are stored as
   segments so the bold spans (`<b class="font-semibold text-ink">`) survive. */

export type NotificationKind =
  | 'registration'
  | 'payment'
  | 'sales'
  | 'feedback'
  | 'payout'
  | 'alert'
  | 'task'

/** A message fragment; `bold` fragments render inside `<b>`. */
export type BodySegment = { text: string; bold?: boolean }

export type Notification = {
  kind: NotificationKind
  icon: string
  title: string
  body: BodySegment[]
  time: string
  unread: boolean
}

export type NotificationGroup = {
  label: string
  /** recent groups show by default; older ones reveal via "Show older". */
  recent: boolean
  items: Notification[]
}

/** Icon tints per notification kind. */
export const TINT: Record<NotificationKind, string> = {
  registration: 'bg-brand-soft text-brand',
  payment: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  sales: 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
  feedback: 'bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-300',
  payout: 'bg-brand-soft text-brand',
  alert: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  task: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

export const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    label: 'Today',
    recent: true,
    items: [
      {
        kind: 'registration',
        icon: 'hgi-user-add-01',
        title: 'New registration',
        body: [{ text: 'Anong Pattana joined ' }, { text: 'Tech Summit 2026', bold: true }],
        time: '2 min ago',
        unread: true,
      },
      {
        kind: 'payment',
        icon: 'hgi-wallet-01',
        title: 'Payment received',
        body: [{ text: '฿1,250 from Ploy Srisai' }],
        time: '18 min ago',
        unread: true,
      },
      {
        kind: 'sales',
        icon: 'hgi-ticket-01',
        title: 'Almost sold out',
        body: [
          { text: 'VIP Access is ' },
          { text: '92% sold', bold: true },
          { text: ' for Tech Summit 2026' },
        ],
        time: '1 hr ago',
        unread: true,
      },
      {
        kind: 'task',
        icon: 'hgi-note-edit',
        title: 'Registration form needs approval',
        body: [{ text: '3 pending registrations for Tech Summit 2026' }],
        time: '2 hr ago',
        unread: false,
      },
      {
        kind: 'alert',
        icon: 'hgi-alert-circle',
        title: 'Payment declined',
        body: [{ text: "Mia Thompson's payment was declined for Bangkok Jazz Night" }],
        time: '3 hr ago',
        unread: false,
      },
    ],
  },
  {
    label: 'Yesterday',
    recent: true,
    items: [
      {
        kind: 'feedback',
        icon: 'hgi-star',
        title: 'New feedback',
        body: [{ text: 'Bangkok Jazz Night rated ' }, { text: '4.8★', bold: true }],
        time: 'Yesterday',
        unread: false,
      },
      {
        kind: 'alert',
        icon: 'hgi-alert-02',
        title: 'Speaker not confirmed',
        body: [{ text: 'Sunrise Yoga Retreat still has 1 unconfirmed speaker' }],
        time: 'Yesterday',
        unread: false,
      },
      {
        kind: 'task',
        icon: 'hgi-message-question',
        title: 'Vendor reply pending',
        body: [{ text: 'Awaiting catering quote for Tech Summit 2026' }],
        time: 'Yesterday',
        unread: false,
      },
    ],
  },
  {
    label: 'Earlier this week',
    recent: true,
    items: [
      {
        kind: 'payout',
        icon: 'hgi-dollar-circle',
        title: 'Payout completed',
        body: [{ text: '฿48,290 was sent to your bank account' }],
        time: 'Jul 15',
        unread: false,
      },
      {
        kind: 'registration',
        icon: 'hgi-user-add-01',
        title: '24 new registrations',
        body: [{ text: 'This week for ' }, { text: 'Thai Street Food Festival', bold: true }],
        time: 'Jul 14',
        unread: false,
      },
    ],
  },
  {
    label: 'Last week',
    recent: false,
    items: [
      {
        kind: 'payout',
        icon: 'hgi-dollar-circle',
        title: 'Payout completed',
        body: [{ text: '฿32,100 was sent to your bank account' }],
        time: 'Jul 11',
        unread: false,
      },
      {
        kind: 'registration',
        icon: 'hgi-user-add-01',
        title: '18 new registrations',
        body: [{ text: 'For ' }, { text: 'Bangkok Jazz Night', bold: true }],
        time: 'Jul 10',
        unread: false,
      },
      {
        kind: 'feedback',
        icon: 'hgi-star',
        title: 'New feedback',
        body: [{ text: 'UX Bangkok Meetup rated ' }, { text: '4.7★', bold: true }],
        time: 'Jul 9',
        unread: false,
      },
      {
        kind: 'alert',
        icon: 'hgi-alert-circle',
        title: 'Low ticket inventory',
        body: [{ text: 'Only 8 VIP tickets left for Thai Street Food Festival' }],
        time: 'Jul 8',
        unread: false,
      },
    ],
  },
]
