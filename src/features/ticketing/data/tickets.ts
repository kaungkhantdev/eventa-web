import type { BadgeTone } from '@/components/ui'
import type { TicketStatus } from '../types'

export interface Ticket {
  id: string
  name: string
  event: string
  /** Free tickets show a "Free" badge in place of a price. */
  free: boolean
  price: number
  status: TicketStatus
  sold: number
  total: number
  /** Tailwind tint classes for the rounded ticket-icon square. */
  iconClass: string
}

const AMBER = 'bg-amber-50 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300'
const BRAND = 'bg-brand-soft text-brand'
const RED = 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300'
const BLUE = 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300'
const PURPLE = 'bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-300'
const GRAY = 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'

export const TICKETS: Ticket[] = [
  { id: 't1', name: 'VIP Access', event: 'Tech Summit 2026', free: false, price: 2900, status: 'onsale', sold: 210, total: 250, iconClass: AMBER },
  { id: 't2', name: 'General Admission', event: 'Tech Summit 2026', free: false, price: 1250, status: 'onsale', sold: 640, total: 800, iconClass: BRAND },
  { id: 't3', name: 'Early Bird', event: 'Bangkok Jazz Night', free: false, price: 480, status: 'soldout', sold: 300, total: 300, iconClass: RED },
  { id: 't4', name: 'Student', event: 'UX Bangkok Meetup', free: true, price: 0, status: 'onsale', sold: 120, total: 150, iconClass: BLUE },
  { id: 't5', name: 'Premium Front Row', event: 'Bangkok Jazz Night', free: false, price: 1900, status: 'scheduled', sold: 45, total: 60, iconClass: PURPLE },
  { id: 't6', name: 'General Admission', event: 'Thai Street Food Festival', free: false, price: 350, status: 'onsale', sold: 890, total: 1000, iconClass: BRAND },
  { id: 't7', name: 'Retreat Package', event: 'Sunrise Yoga Retreat', free: false, price: 3200, status: 'soldout', sold: 40, total: 40, iconClass: AMBER },
  { id: 't8', name: 'Speaker Pass', event: 'Tech Summit 2026', free: true, price: 0, status: 'soldout', sold: 30, total: 30, iconClass: GRAY },
  { id: 't9', name: 'Group Pass (5)', event: 'UX Bangkok Meetup', free: false, price: 1000, status: 'paused', sold: 0, total: 50, iconClass: GRAY },
]

/** Badge tone + Hugeicons slug + label per ticket status. */
export const TICKET_STATUS_META: Record<TicketStatus, { tone: BadgeTone; icon: string; label: string }> = {
  onsale: { tone: 'green', icon: 'hgi-tick-02', label: 'On sale' },
  scheduled: { tone: 'blue', icon: 'hgi-time-schedule', label: 'Scheduled' },
  paused: { tone: 'gray', icon: 'hgi-time-quarter-pass', label: 'Paused' },
  soldout: { tone: 'amber', icon: 'hgi-alert-circle', label: 'Sold out' },
}
