/* Automated message templates — ported verbatim from the inline <script> in
   admin/messaging-templates.html. Each card doubles as the editor's data. */

export type TemplateChannel = 'email' | 'sms'

export type MessageTemplate = {
  /** data-tpl slug from the source. */
  id: string
  title: string
  /** Card description == editor trigger line. */
  description: string
  /** Hugeicons slug for the card avatar. */
  icon: string
  /** Card avatar container colour classes. */
  iconClass: string
  /** Channels shown as badges on the card. */
  channels: TemplateChannel[]
  active: boolean
  /** Merge tags offered in the editor. */
  tags: string[]
  email: { subject: string; body: string }
  /** Present only for templates that also send an SMS. */
  sms?: { body: string }
}

/** Default merge tags used for a brand-new template. */
export const COMMON_TAGS = ['{{first_name}}', '{{event_name}}', '{{organizer_name}}']

/** Fallback trigger copy shown for a brand-new template. */
export const NEW_TEMPLATE_TRIGGER =
  'This message will be sent automatically based on the trigger you choose.'

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'registration-confirmation',
    title: 'Registration confirmation',
    description: 'Sent instantly when a registrant completes checkout for an event.',
    icon: 'hgi-checkmark-badge-01',
    iconClass: 'bg-brand-soft text-brand',
    channels: ['email', 'sms'],
    active: true,
    tags: [
      '{{first_name}}',
      '{{event_name}}',
      '{{event_date}}',
      '{{event_venue}}',
      '{{ticket_type}}',
      '{{ticket_url}}',
      '{{organizer_name}}',
    ],
    email: {
      subject: "You're registered for {{event_name}} 🎟",
      body: "Hi {{first_name}},\n\nThanks for registering for {{event_name}} — your {{ticket_type}} ticket is confirmed.\n\n📅 {{event_date}}\n📍 {{event_venue}}\n\nYour QR code is attached. Show it at the door for a fast check-in.\n\nSee you there!\nThe {{organizer_name}} team",
    },
    sms: {
      body: "{{first_name}}, you're registered for {{event_name}} on {{event_date}}. Your {{ticket_type}} ticket + QR: {{ticket_url}}",
    },
  },
  {
    id: 'payment-receipt',
    title: 'Payment receipt',
    description: 'Sent after a successful payment with an itemized ticket breakdown.',
    icon: 'hgi-invoice-01',
    iconClass: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
    channels: ['email'],
    active: true,
    tags: [
      '{{first_name}}',
      '{{event_name}}',
      '{{order_id}}',
      '{{ticket_type}}',
      '{{quantity}}',
      '{{amount}}',
      '{{payment_method}}',
      '{{payment_date}}',
      '{{organizer_name}}',
    ],
    email: {
      subject: 'Your receipt for {{event_name}} — {{amount}}',
      body: "Hi {{first_name}},\n\nWe've received your payment. Here's your receipt.\n\nOrder {{order_id}}\n{{ticket_type}} × {{quantity}} — {{amount}}\n(7% VAT included)\n\nPaid with {{payment_method}} on {{payment_date}}.\n\nNeed a full tax invoice? Just reply to this email.\n\nThanks,\n{{organizer_name}}",
    },
  },
  {
    id: 'event-reminder',
    title: 'Event reminder (24h)',
    description: 'Sent 24 hours before an event starts to help reduce no-shows.',
    icon: 'hgi-clock-01',
    iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
    channels: ['email', 'sms'],
    active: true,
    tags: [
      '{{first_name}}',
      '{{event_name}}',
      '{{event_time}}',
      '{{event_venue}}',
      '{{ticket_url}}',
      '{{organizer_name}}',
    ],
    email: {
      subject: '{{event_name}} is tomorrow — see you there!',
      body: "Hi {{first_name}},\n\nA quick reminder that {{event_name}} starts tomorrow at {{event_time}}.\n\n📍 {{event_venue}}\n\nDon't forget your QR code for a fast check-in.\n\nSee you soon!\n{{organizer_name}}",
    },
    sms: {
      body: 'Reminder: {{event_name}} is tomorrow at {{event_time}}, {{event_venue}}. Bring your QR: {{ticket_url}}',
    },
  },
  {
    id: 'waitlist-offer',
    title: 'Waitlist offer',
    description: 'Sent automatically when a spot opens up for someone on the waitlist.',
    icon: 'hgi-user-check-01',
    iconClass: 'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300',
    channels: ['email', 'sms'],
    active: true,
    tags: [
      '{{first_name}}',
      '{{event_name}}',
      '{{ticket_type}}',
      '{{claim_window}}',
      '{{claim_url}}',
      '{{organizer_name}}',
    ],
    email: {
      subject: 'A spot just opened for {{event_name}} 🎉',
      body: "Hi {{first_name}},\n\nGood news — a {{ticket_type}} spot just opened up for {{event_name}}.\n\nYou have {{claim_window}} to claim it before it's offered to the next person on the waitlist.\n\nClaim your spot: {{claim_url}}\n\n{{organizer_name}}",
    },
    sms: {
      body: '{{first_name}}, a spot opened for {{event_name}}! Claim it within {{claim_window}}: {{claim_url}}',
    },
  },
  {
    id: 'cancellation-notice',
    title: 'Cancellation notice',
    description: 'Sent when an event is cancelled or a registration is refunded.',
    icon: 'hgi-cancel-circle',
    iconClass: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
    channels: ['email'],
    active: true,
    tags: [
      '{{first_name}}',
      '{{event_name}}',
      '{{event_date}}',
      '{{amount}}',
      '{{organizer_name}}',
    ],
    email: {
      subject: 'Important: {{event_name}} has been cancelled',
      body: "Hi {{first_name}},\n\nWe're sorry to let you know that {{event_name}} on {{event_date}} has been cancelled.\n\nA full refund of {{amount}} has been issued to your original payment method and should appear within 5–10 business days.\n\nWe sincerely apologise for the inconvenience.\n\n{{organizer_name}}",
    },
  },
  {
    id: 'post-event-thankyou',
    title: 'Post-event thank-you',
    description: 'Sent the day after an event with a short feedback survey link.',
    icon: 'hgi-star',
    iconClass: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
    channels: ['email'],
    active: false,
    tags: ['{{first_name}}', '{{event_name}}', '{{survey_url}}', '{{organizer_name}}'],
    email: {
      subject: 'Thanks for coming to {{event_name}} 💚',
      body: "Hi {{first_name}},\n\nThank you for attending {{event_name}} — we hope you had a great time!\n\nWe'd love your feedback. It takes 2 minutes: {{survey_url}}\n\nUntil next time,\n{{organizer_name}}",
    },
  },
]
