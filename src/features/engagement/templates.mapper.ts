import type {
  MessageChannel,
  MessageTemplateWire,
  TemplateWording,
} from './templates.types'

/**
 * One automated message, as a card (US-MSG-01).
 *
 * The API says what is true of a message; this decides what that reads like.
 * The one rule with teeth: a switch appears only where moving it changes
 * something. Everywhere else the card says what is actually happening instead.
 */

export interface ChannelBadge {
  label: string
  icon: string
}

export interface TemplateStanding {
  label: string
  hint: string
}

export interface ConfirmOff {
  title: string
  body: string
  confirmLabel: string
}

export interface TemplateCard {
  slug: string
  title: string
  description: string
  icon: string
  iconClass: string
  channels: ChannelBadge[]
  active: boolean
  /** Whether to draw a switch at all. */
  switchable: boolean
  /** What to say in the switch's place. Null when there IS a switch. */
  standing: TemplateStanding | null
  /** The question to ask before switching this off. Null when none is needed. */
  confirmOff: ConfirmOff | null
  /** Merge fields the editor may offer. Empty means no editor at all. */
  tags: string[]
  wording: TemplateWording
  /**
   * Whether this workspace has written its own wording. The editor says
   * "Eventa's wording" rather than showing empty boxes as if something failed
   * to load.
   */
  edited: boolean
}

/**
 * Card avatars, ported from the kit. Keyed by the API's slug: a new message can
 * appear in the catalog before this app knows its face, and a Hugeicons slug
 * that does not exist renders as CJK tofu — so an unknown message borrows the
 * plainest true icon rather than a guess assembled from its name.
 */
const LOOK: Record<string, { icon: string; iconClass: string }> = {
  'registration-confirmation': {
    icon: 'hgi-checkmark-badge-01',
    iconClass: 'bg-brand-soft text-brand',
  },
  'cancellation-notice': {
    icon: 'hgi-cancel-circle',
    iconClass: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
  },
  'payment-receipt': {
    icon: 'hgi-invoice-01',
    iconClass: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300',
  },
  'event-reminder': {
    icon: 'hgi-clock-01',
    iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300',
  },
  'waitlist-offer': {
    icon: 'hgi-user-check-01',
    iconClass: 'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300',
  },
  'post-event-thankyou': {
    icon: 'hgi-star',
    iconClass: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  },
}

const FALLBACK_LOOK = {
  icon: 'hgi-mail-01',
  iconClass: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

const CHANNEL_BADGE: Record<MessageChannel, ChannelBadge> = {
  email: { label: 'Email', icon: 'hgi-mail-01' },
  sms: { label: 'SMS', icon: 'hgi-smart-phone-01' },
}

const STANDING: Record<string, TemplateStanding> = {
  planned: {
    label: 'Not sent yet',
    hint: 'Eventa does not send this message yet, so there is nothing to switch.',
  },
}

export function toTemplateCard(wire: MessageTemplateWire): TemplateCard {
  const look = LOOK[wire.slug] ?? FALLBACK_LOOK
  const switchable = wire.delivery === 'controlled'
  return {
    slug: wire.slug,
    title: wire.title,
    description: wire.description,
    icon: look.icon,
    iconClass: look.iconClass,
    channels: wire.channels.map((channel) => CHANNEL_BADGE[channel]),
    active: wire.active,
    switchable,
    standing: switchable ? null : (STANDING[wire.delivery] ?? null),
    confirmOff: confirmOff(wire, switchable),
    tags: wire.tags,
    wording: wire.wording,
    edited: Object.values(wire.wording).some((value) => value !== null),
  }
}

/**
 * US-MSG-02: a message attendees legally expect is not switched off on one
 * click. Only ever asked on the way OFF — nobody needs protecting from a
 * message being sent.
 */
function confirmOff(
  wire: MessageTemplateWire,
  switchable: boolean,
): ConfirmOff | null {
  if (!switchable || !wire.expected || !wire.active) return null
  return {
    title: `Turn off “${wire.title}”?`,
    body: `Attendees are entitled to “${wire.title}”. While it is off, nobody receives it when its trigger fires — and messages already sent are unaffected.`,
    confirmLabel: 'Turn it off',
  }
}
