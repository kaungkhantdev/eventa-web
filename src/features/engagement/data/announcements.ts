/* Sent/scheduled broadcast announcements — ported verbatim from the markup in
   admin/messaging-announcements.html. */

export type AnnouncementChannel = 'email' | 'sms'
export type AnnouncementStatus = 'sent' | 'scheduled'

export type Announcement = {
  title: string
  event: string
  recipients: number
  date: string
  channels: AnnouncementChannel[]
  status: AnnouncementStatus
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    title: 'Venue change notice',
    event: 'Tech Summit 2026',
    recipients: 1340,
    date: 'Jul 5, 2026',
    channels: ['email', 'sms'],
    status: 'sent',
  },
  {
    title: 'Early bird ends tonight',
    event: 'Bangkok Jazz Night',
    recipients: 860,
    date: 'Jul 2, 2026',
    channels: ['email'],
    status: 'sent',
  },
  {
    title: 'Parking & directions',
    event: 'Sunrise Yoga Retreat',
    recipients: 240,
    date: 'Jun 28, 2026',
    channels: ['email', 'sms'],
    status: 'sent',
  },
  {
    title: 'Schedule update: keynote moved to Hall B',
    event: 'Tech Summit 2026',
    recipients: 1340,
    date: 'Jun 20, 2026',
    channels: ['email'],
    status: 'sent',
  },
  {
    title: 'Reminder: bring your ticket QR code',
    event: 'Thai Street Food Festival',
    recipients: 512,
    date: 'Jul 15, 2026',
    channels: ['email', 'sms'],
    status: 'scheduled',
  },
  {
    title: 'Thank you for attending!',
    event: 'UX Bangkok Meetup',
    recipients: 180,
    date: 'Jun 10, 2026',
    channels: ['email'],
    status: 'sent',
  },
]

/** Options in the "Audience" picker. */
export const ANNOUNCEMENT_AUDIENCES = ['All registrants', 'Checked-in attendees', 'Waitlist']
