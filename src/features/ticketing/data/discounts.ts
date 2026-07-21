import type { BadgeTone } from '@/components/ui'
import type { DiscountStatus, DiscountType } from '../types'

export interface Discount {
  code: string
  type: DiscountType
  value: number
  event: string
  used: number
  limit: number
  valid: string
  status: DiscountStatus
}

export const DISCOUNTS: Discount[] = [
  { code: 'EARLYBIRD25', type: 'percent', value: 25, event: 'Tech Summit 2026', used: 342, limit: 500, valid: 'Jun 1 – Jul 31, 2026', status: 'active' },
  { code: 'JAZZ200', type: 'fixed', value: 200, event: 'Bangkok Jazz Night', used: 89, limit: 150, valid: 'Jun 15 – Jul 12, 2026', status: 'active' },
  { code: 'YOGA10', type: 'percent', value: 10, event: 'Sunrise Yoga Retreat', used: 54, limit: 100, valid: 'Jul 1 – Jul 20, 2026', status: 'active' },
  { code: 'FOODFEST50', type: 'fixed', value: 50, event: 'Thai Street Food Festival', used: 210, limit: 400, valid: 'Jul 5 – Aug 3, 2026', status: 'active' },
  { code: 'UXBKK20', type: 'percent', value: 20, event: 'UX Bangkok Meetup', used: 0, limit: 60, valid: 'Aug 1 – Aug 15, 2026', status: 'scheduled' },
  { code: 'WELCOME100', type: 'fixed', value: 100, event: 'All events', used: 980, limit: 1000, valid: 'Jan 1 – Dec 31, 2026', status: 'active' },
  { code: 'VIPACCESS30', type: 'percent', value: 30, event: 'Tech Summit 2026', used: 500, limit: 500, valid: 'May 1 – Jun 30, 2026', status: 'expired' },
  { code: 'STAFFONLY', type: 'fixed', value: 500, event: 'All events', used: 12, limit: 20, valid: 'Jul 1 – Jul 31, 2026', status: 'disabled' },
  { code: 'SUMMERSALE', type: 'percent', value: 15, event: 'Thai Street Food Festival', used: 120, limit: 300, valid: 'Jun 10 – Aug 10, 2026', status: 'active' },
  { code: 'FLASH500', type: 'fixed', value: 500, event: 'Tech Summit 2026', used: 45, limit: 50, valid: 'Jul 8 – Jul 15, 2026', status: 'active' },
  { code: 'STUDENT15', type: 'percent', value: 15, event: 'UX Bangkok Meetup', used: 76, limit: 200, valid: 'Jun 1 – Aug 31, 2026', status: 'active' },
  { code: 'GROUP150', type: 'fixed', value: 150, event: 'Bangkok Jazz Night', used: 30, limit: 80, valid: 'Jul 1 – Jul 31, 2026', status: 'active' },
  { code: 'LOYALTY20', type: 'percent', value: 20, event: 'All events', used: 410, limit: 600, valid: 'Jan 1 – Dec 31, 2026', status: 'active' },
  { code: 'NEWYEAR40', type: 'percent', value: 40, event: 'Tech Summit 2026', used: 300, limit: 300, valid: 'Jan 1 – Feb 28, 2026', status: 'expired' },
  { code: 'AUTUMN25', type: 'percent', value: 25, event: 'Sunrise Yoga Retreat', used: 0, limit: 120, valid: 'Sep 1 – Sep 30, 2026', status: 'scheduled' },
  { code: 'WEEKEND100', type: 'fixed', value: 100, event: 'Thai Street Food Festival', used: 55, limit: 150, valid: 'Jul 10 – Jul 20, 2026', status: 'active' },
  { code: 'PARTNER50', type: 'percent', value: 50, event: 'All events', used: 8, limit: 25, valid: 'Jul 1 – Dec 31, 2026', status: 'active' },
  { code: 'TECHFAN250', type: 'fixed', value: 250, event: 'Tech Summit 2026', used: 130, limit: 250, valid: 'Jun 20 – Jul 31, 2026', status: 'active' },
  { code: 'RETREATVIP', type: 'percent', value: 35, event: 'Sunrise Yoga Retreat', used: 40, limit: 40, valid: 'Apr 1 – May 31, 2026', status: 'expired' },
  { code: 'PRESALE300', type: 'fixed', value: 300, event: 'UX Bangkok Meetup', used: 0, limit: 100, valid: 'Aug 5 – Aug 20, 2026', status: 'scheduled' },
  { code: 'JAZZLOVER', type: 'percent', value: 12, event: 'Bangkok Jazz Night', used: 22, limit: 90, valid: 'Jul 3 – Jul 12, 2026', status: 'active' },
  { code: 'HOLIDAY75', type: 'fixed', value: 75, event: 'Thai Street Food Festival', used: 90, limit: 200, valid: 'Jul 1 – Jul 31, 2026', status: 'disabled' },
]

/** Badge tone + Hugeicons slug + label per discount status. */
export const DISCOUNT_STATUS_META: Record<DiscountStatus, { tone: BadgeTone; icon: string; label: string }> = {
  active: { tone: 'green', icon: 'hgi-tick-02', label: 'Active' },
  scheduled: { tone: 'blue', icon: 'hgi-time-schedule', label: 'Scheduled' },
  expired: { tone: 'gray', icon: 'hgi-clock-01', label: 'Expired' },
  disabled: { tone: 'amber', icon: 'hgi-alert-circle', label: 'Disabled' },
}
