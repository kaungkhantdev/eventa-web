/* Registrations demo data — ported verbatim from admin/registrations.html.
   30 rows, Thai Baht amounts, four statuses. */

export type RegistrationStatus = 'Confirmed' | 'Pending' | 'Waitlisted' | 'Cancelled'

export type Registration = {
  initials: string
  name: string
  email: string
  event: string
  ticket: string
  date: string
  amount: string
  status: RegistrationStatus
}

export const REGISTRATIONS: Registration[] = [
  { initials: 'AP', name: 'Anong P.', email: 'anong.p@gmail.com', event: 'Tech Summit 2026', ticket: 'VIP', date: 'Jul 8, 2026', amount: '฿2,400', status: 'Confirmed' },
  { initials: 'ST', name: 'Somchai T.', email: 'somchai.t@hotmail.com', event: 'Bangkok Jazz Night', ticket: 'General Admission', date: 'Jul 8, 2026', amount: '฿480', status: 'Confirmed' },
  { initials: 'JW', name: 'James W.', email: 'james.wilson@gmail.com', event: 'UX Bangkok Meetup', ticket: 'Free', date: 'Jul 7, 2026', amount: 'Free', status: 'Confirmed' },
  { initials: 'PS', name: 'Ploy S.', email: 'ploy.s@outlook.com', event: 'Tech Summit 2026', ticket: 'Early Bird', date: 'Jul 7, 2026', amount: '฿950', status: 'Pending' },
  { initials: 'ML', name: 'Mei L.', email: 'mei.lin@company.io', event: 'Thai Street Food Festival', ticket: 'General Admission', date: 'Jul 6, 2026', amount: '฿250', status: 'Waitlisted' },
  { initials: 'NK', name: 'Nattapong K.', email: 'nattapong.k@gmail.com', event: 'Sunrise Yoga Retreat', ticket: 'Student', date: 'Jul 6, 2026', amount: '฿390', status: 'Confirmed' },
  { initials: 'SC', name: 'Sarah C.', email: 'sarah.chen@gmail.com', event: 'Tech Summit 2026', ticket: 'VIP', date: 'Jul 5, 2026', amount: '฿2,400', status: 'Cancelled' },
  { initials: 'KR', name: 'Kanya R.', email: 'kanya.r@gmail.com', event: 'Bangkok Jazz Night', ticket: 'General Admission', date: 'Jul 5, 2026', amount: '฿480', status: 'Pending' },
  { initials: 'DL', name: 'David L.', email: 'david.lee@gmail.com', event: 'Thai Street Food Festival', ticket: 'Early Bird', date: 'Jul 4, 2026', amount: '฿180', status: 'Waitlisted' },
  { initials: 'GH', name: 'Grace H.', email: 'grace.h@gmail.com', event: 'UX Bangkok Meetup', ticket: 'Free', date: 'Jul 4, 2026', amount: 'Free', status: 'Confirmed' },
  { initials: 'JP', name: 'Jun P.', email: 'jun.park@outlook.com', event: 'Tech Summit 2026', ticket: 'General Admission', date: 'Jul 3, 2026', amount: '฿1,200', status: 'Confirmed' },
  { initials: 'RM', name: 'Ravi M.', email: 'ravi.menon@corpmail.com', event: 'Bangkok Jazz Night', ticket: 'VIP', date: 'Jul 3, 2026', amount: '฿1,600', status: 'Confirmed' },
  { initials: 'SA', name: 'Siriporn A.', email: 'siriporn.a@yahoo.com', event: 'Sunrise Yoga Retreat', ticket: 'Early Bird', date: 'Jul 3, 2026', amount: '฿590', status: 'Pending' },
  { initials: 'AW', name: 'Arthit W.', email: 'arthit.w@outlook.com', event: 'Thai Street Food Festival', ticket: 'General Admission', date: 'Jul 2, 2026', amount: '฿250', status: 'Waitlisted' },
  { initials: 'SK', name: 'Suda K.', email: 'suda.k@yahoo.com', event: 'Tech Summit 2026', ticket: 'Student', date: 'Jul 2, 2026', amount: '฿1,100', status: 'Confirmed' },
  { initials: 'LT', name: 'Lily T.', email: 'lily.tan@gmail.com', event: 'Bangkok Jazz Night', ticket: 'General Admission', date: 'Jul 2, 2026', amount: '฿480', status: 'Confirmed' },
  { initials: 'KO', name: 'Kevin O.', email: 'kevin.oduya@corpmail.com', event: 'UX Bangkok Meetup', ticket: 'Free', date: 'Jul 1, 2026', amount: 'Free', status: 'Confirmed' },
  { initials: 'PN', name: 'Preeya N.', email: 'preeya.n@outlook.com', event: 'Sunrise Yoga Retreat', ticket: 'Student', date: 'Jul 1, 2026', amount: '฿390', status: 'Cancelled' },
  { initials: 'NS', name: 'Nattapong S.', email: 'nattapong.s@gmail.com', event: 'Tech Summit 2026', ticket: 'VIP', date: 'Jul 1, 2026', amount: '฿2,400', status: 'Confirmed' },
  { initials: 'RD', name: 'Rachel D.', email: 'rachel.davies@gmail.com', event: 'Thai Street Food Festival', ticket: 'Early Bird', date: 'Jun 30, 2026', amount: '฿180', status: 'Pending' },
  { initials: 'WP', name: 'Wichai P.', email: 'wichai.p@hotmail.com', event: 'Bangkok Jazz Night', ticket: 'General Admission', date: 'Jun 30, 2026', amount: '฿480', status: 'Confirmed' },
  { initials: 'MR', name: 'Malee R.', email: 'malee.r@gmail.com', event: 'Sunrise Yoga Retreat', ticket: 'Early Bird', date: 'Jun 29, 2026', amount: '฿590', status: 'Waitlisted' },
  { initials: 'TB', name: 'Tom B.', email: 'tom.bradley@gmail.com', event: 'Tech Summit 2026', ticket: 'General Admission', date: 'Jun 29, 2026', amount: '฿1,200', status: 'Confirmed' },
  { initials: 'CL', name: 'Chai L.', email: 'chai.l@outlook.com', event: 'Thai Street Food Festival', ticket: 'Student', date: 'Jun 28, 2026', amount: '฿150', status: 'Confirmed' },
  { initials: 'DO', name: 'David O.', email: 'd.okafor@corpmail.com', event: 'UX Bangkok Meetup', ticket: 'Free', date: 'Jun 28, 2026', amount: 'Free', status: 'Cancelled' },
  { initials: 'AN', name: 'Anong N.', email: 'anong.n@gmail.com', event: 'Bangkok Jazz Night', ticket: 'VIP', date: 'Jun 27, 2026', amount: '฿1,600', status: 'Pending' },
  { initials: 'PT', name: 'Prasert T.', email: 'prasert.t@yahoo.com', event: 'Sunrise Yoga Retreat', ticket: 'Student', date: 'Jun 27, 2026', amount: '฿390', status: 'Confirmed' },
  { initials: 'MC', name: 'Mai C.', email: 'mai.chen@company.io', event: 'Tech Summit 2026', ticket: 'Early Bird', date: 'Jun 26, 2026', amount: '฿950', status: 'Waitlisted' },
  { initials: 'JR', name: 'Jira W.', email: 'jira.w@gmail.com', event: 'Thai Street Food Festival', ticket: 'General Admission', date: 'Jun 26, 2026', amount: '฿250', status: 'Confirmed' },
  { initials: 'BK', name: 'Bua K.', email: 'bua.k@outlook.com', event: 'Bangkok Jazz Night', ticket: 'General Admission', date: 'Jun 25, 2026', amount: '฿480', status: 'Cancelled' },
]

/** Badge class + icon per status, from the source STATUS_BADGE map. */
export const REG_STATUS_BADGE: Record<RegistrationStatus, { cls: string; icon: string }> = {
  Confirmed: { cls: 'badge-green', icon: 'hgi-checkmark-badge-01' },
  Pending: { cls: 'badge-amber', icon: 'hgi-clock-01' },
  Waitlisted: { cls: 'badge-blue', icon: 'hgi-time-schedule' },
  Cancelled: { cls: 'badge-gray', icon: 'hgi-cancel-circle' },
}

export type RegTab = 'all' | 'pending' | 'waitlist' | 'cancelled'

/** Maps the non-"all" pill tabs to the status they filter by. */
export const REG_TAB_STATUS: Record<Exclude<RegTab, 'all'>, RegistrationStatus> = {
  pending: 'Pending',
  waitlist: 'Waitlisted',
  cancelled: 'Cancelled',
}

export const REG_EVENTS = [
  'Tech Summit 2026',
  'Bangkok Jazz Night',
  'Sunrise Yoga Retreat',
  'Thai Street Food Festival',
  'UX Bangkok Meetup',
] as const

export const REG_TICKETS = ['General Admission', 'VIP', 'Early Bird', 'Student', 'Free'] as const
