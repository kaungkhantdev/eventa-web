import type { LandingEvent } from '@/features/landing/types'

/* Sample events shared by every landing-page template. Ported verbatim from
   assets/landing-data.js. getLandingEvent() picks one by ?event=<slug> (falling
   back to the first), then lets a handful of query params override text fields
   so the create-event form can pass live-typed content into a preview. */

export const LANDING_EVENTS: Record<string, LandingEvent> = {
  'tech-summit-2026': {
    slug: 'tech-summit-2026',
    title: 'Tech Summit 2026',
    kicker: 'The future, built in Bangkok',
    tagline:
      'Two days of keynotes, workshops and deep networking with the people shaping Southeast Asia’s tech.',
    category: 'Conference',
    dateText: 'Sat–Sun, July 18–19, 2026',
    timeText: '09:00 – 18:00 · GMT+7',
    venue: 'BITEC',
    city: 'Bangkok, Thailand',
    address: '88 Bangna-Trad Rd, Bang Na, Bangkok',
    priceFrom: '฿1,250',
    seating: 'reserved',
    seatsLeft: 88,
    capacity: 400,
    attendeesText: '1,500+ attendees',
    accent: '#1ba770',
    organizer: 'Eventa Co.',
    contactEmail: 'hello@eventa.co',
    registerUrl: '../portal/register.html?event=tech-summit-2026',
    socials: { instagram: '#', website: '#' },
    about:
      'Tech Summit 2026 brings together founders, engineers and product leaders from across Southeast Asia for two days of keynotes, hands-on workshops and a startup showcase — with plenty of Thai coffee and networking in between.',
    highlights: [
      { icon: 'hgi-mic-01', label: '20+ speakers' },
      { icon: 'hgi-headphones', label: 'Hands-on workshops' },
      { icon: 'hgi-sparkles', label: 'Startup showcase' },
      { icon: 'hgi-user-multiple', label: 'Networking lounge' },
    ],
    agendaTitle: 'Schedule',
    agenda: [
      { time: '09:00', title: 'Doors & coffee', desc: 'Registration, badges and morning espresso.' },
      { time: '10:00', title: 'Opening keynote', desc: 'The state of AI in Southeast Asia.' },
      { time: '13:00', title: 'Workshop tracks', desc: 'Cloud, AI and product deep-dives.' },
      { time: '16:30', title: 'Startup showcase', desc: '12 startups pitch live on the main stage.' },
      { time: '18:00', title: 'Rooftop mixer', desc: 'Drinks and networking as the sun sets.' },
    ],
    speakersTitle: 'Speakers',
    speakers: [
      { name: 'Dr. Anna Wong', role: 'Head of AI, Nimbus', initials: 'AW' },
      { name: 'Raj Patel', role: 'CTO, Fintech Labs', initials: 'RP' },
      { name: 'Mei Lin', role: 'VP Product, Skylark', initials: 'ML' },
      { name: 'Tom Becker', role: 'Founder, DevHouse', initials: 'TB' },
    ],
    ticketsTitle: 'Tickets',
    tickets: [
      {
        name: 'Early Bird',
        price: '฿1,250',
        note: 'Limited',
        featured: false,
        features: ['Full 2-day access', 'Workshop tracks', 'Lunch & coffee'],
      },
      {
        name: 'Standard',
        price: '฿1,900',
        note: 'Most popular',
        featured: true,
        features: ['Everything in Early Bird', 'Reserved seating', 'Rooftop mixer'],
      },
      {
        name: 'VIP',
        price: '฿3,500',
        note: 'Best value',
        featured: false,
        features: ['Everything in Standard', 'Speaker dinner', 'Front-row + swag'],
      },
    ],
    faqs: [
      { q: 'Where is it held?', a: 'BITEC, Bangkok — easy BTS access at Bang Na.' },
      { q: 'Can I get a refund?', a: 'Full refunds up to 14 days before the event.' },
      { q: 'Is lunch included?', a: 'Yes — lunch and all-day coffee come with every ticket.' },
    ],
  },

  'emma-liam-wedding': {
    slug: 'emma-liam-wedding',
    title: 'Emma & Liam’s Wedding',
    kicker: 'Together with their families',
    tagline:
      'We’re getting married — and we’d be honoured to have you celebrate with us by the sea.',
    category: 'Wedding',
    dateText: 'Wednesday, August 20, 2026',
    timeText: '4:00 PM · Ceremony & Reception',
    venue: 'Seaside Cliffs Resort',
    city: 'Malibu, California',
    address: '27400 Pacific Coast Hwy, Malibu, CA',
    priceFrom: 'Free',
    seating: 'ga',
    seatsLeft: 40,
    capacity: 180,
    attendeesText: '180 guests',
    accent: '#b76e79',
    organizer: 'Emma & Liam',
    contactEmail: 'emma.liam@example.com',
    registerUrl: '../portal/register.html?event=emma-liam-wedding',
    socials: { instagram: '#', website: '#' },
    about:
      'Emma and Liam met eight summers ago on a windswept pier and have been inseparable since. This August, surrounded by the people they love most, they’ll say “I do” on the cliffs above the Pacific.',
    highlights: [
      { icon: 'hgi-favourite', label: 'Ceremony at 4 PM' },
      { icon: 'hgi-new-releases', label: 'Cocktail hour' },
      { icon: 'hgi-music-note-01', label: 'Live band & dancing' },
      { icon: 'hgi-camera-01', label: 'Photo booth' },
    ],
    agendaTitle: 'Order of the day',
    agenda: [
      { time: '4:00 PM', title: 'Ceremony', desc: 'On the cliffside lawn overlooking the Pacific.' },
      { time: '5:00 PM', title: 'Cocktail hour', desc: 'Canapés and drinks on the terrace.' },
      { time: '6:30 PM', title: 'Dinner', desc: 'A seated dinner in the Grand Hall.' },
      { time: '8:00 PM', title: 'Dancing', desc: 'First dance — then the floor is yours.' },
    ],
    speakersTitle: 'The wedding party',
    speakers: [
      { name: 'Emma Hart', role: 'The Bride', initials: 'EH' },
      { name: 'Liam Cole', role: 'The Groom', initials: 'LC' },
      { name: 'Sophia Reyes', role: 'Maid of Honour', initials: 'SR' },
      { name: 'Noah Grant', role: 'Best Man', initials: 'NG' },
    ],
    ticketsTitle: 'RSVP',
    tickets: [
      {
        name: 'Joyfully attending',
        price: 'RSVP',
        note: '',
        featured: true,
        features: ['Ceremony', 'Cocktail hour', 'Dinner & dancing'],
      },
      {
        name: 'Ceremony only',
        price: 'RSVP',
        note: '',
        featured: false,
        features: ['Ceremony', 'Cocktail hour'],
      },
      {
        name: 'Sending love',
        price: '—',
        note: '',
        featured: false,
        features: ['Can’t make it', 'We’ll miss you'],
      },
    ],
    faqs: [
      { q: 'What should I wear?', a: 'Beach formal — bring a layer, it’s breezy after sunset.' },
      { q: 'Is there parking?', a: 'Valet parking is available at the resort entrance.' },
      { q: 'Can I bring a plus-one?', a: 'Plus-ones are named on your invitation and RSVP.' },
    ],
  },

  'bangkok-jazz-night': {
    slug: 'bangkok-jazz-night',
    title: 'Bangkok Jazz Night',
    kicker: 'One night. Live jazz.',
    tagline: 'An intimate evening of live jazz under the stars on the Sala Daeng rooftop.',
    category: 'Concert',
    dateText: 'Sunday, July 12, 2026',
    timeText: '7:30 PM – 11:00 PM',
    venue: 'Sala Daeng Rooftop',
    city: 'Bangkok, Thailand',
    address: 'Sala Daeng, Silom, Bangkok',
    priceFrom: '฿480',
    seating: 'reserved',
    seatsLeft: 36,
    capacity: 240,
    attendeesText: '240 seats',
    accent: '#6d5cf5',
    organizer: 'Eventa Live',
    contactEmail: 'live@eventa.co',
    registerUrl: '../portal/register.html?event=bangkok-jazz-night',
    socials: { instagram: '#', website: '#' },
    about:
      'A curated evening of live jazz on an open-air rooftop — five acts, craft cocktails and skyline views, closing out with a late-night vinyl afterparty.',
    highlights: [
      { icon: 'hgi-music-note-01', label: '5 live acts' },
      { icon: 'hgi-headphones', label: 'Vinyl afterparty' },
      { icon: 'hgi-star', label: 'Rooftop views' },
      { icon: 'hgi-star', label: 'Craft cocktails' },
    ],
    agendaTitle: 'Set times',
    agenda: [
      { time: '7:30 PM', title: 'Doors open', desc: 'A welcome drink on arrival.' },
      { time: '8:00 PM', title: 'Opening set', desc: 'The Nomad Quartet.' },
      { time: '9:15 PM', title: 'Headline', desc: 'Mala Reef, live.' },
      { time: '10:30 PM', title: 'Vinyl afterparty', desc: 'DJ sets till late.' },
    ],
    speakersTitle: 'Line-up',
    speakers: [
      { name: 'Mala Reef', role: 'Headline', initials: 'MR' },
      { name: 'The Nomad Quartet', role: 'Opening', initials: 'NQ' },
      { name: 'DJ Sunset', role: 'Afterparty', initials: 'DS' },
    ],
    ticketsTitle: 'Tickets',
    tickets: [
      {
        name: 'General',
        price: '฿480',
        note: '',
        featured: false,
        features: ['Standing area', 'Welcome drink'],
      },
      {
        name: 'Reserved',
        price: '฿890',
        note: 'Popular',
        featured: true,
        features: ['Reserved table', 'Welcome drink', 'Priority entry'],
      },
      {
        name: 'VIP Booth',
        price: '฿1,800',
        note: '',
        featured: false,
        features: ['Private booth', 'Bottle service', 'Meet the band'],
      },
    ],
    faqs: [
      { q: 'Is it seated?', a: 'Reserved and VIP are seated; General is standing.' },
      { q: 'Age limit?', a: '20+ with valid ID.' },
      { q: 'What if it rains?', a: 'The rooftop is covered — the show goes on.' },
    ],
  },

  'sunrise-yoga-retreat': {
    slug: 'sunrise-yoga-retreat',
    title: 'Sunrise Yoga Retreat',
    kicker: 'Breathe with the morning',
    tagline:
      'A calm sunrise flow and guided breathwork in the heart of Lumphini Park — mats down before the city wakes.',
    category: 'Sports & Wellness',
    dateText: 'Saturday, October 3, 2026',
    timeText: '05:45 – 08:00 · GMT+7',
    venue: 'Lumphini Park',
    city: 'Bangkok, Thailand',
    address: 'Rama IV Rd, Lumphini, Pathum Wan, Bangkok',
    priceFrom: '฿800',
    seating: 'ga',
    seatsLeft: 34,
    capacity: 120,
    attendeesText: '120 mat spots',
    organizer: 'Eventa Co.',
    about:
      'Sunrise Yoga Retreat is a gentle open-air morning of Vinyasa flow and guided breathwork on the lawns of Lumphini Park. Led by certified teachers as the sun comes up over the lake, it welcomes every level — arrive still, leave grounded, then linger for herbal tea and fresh fruit.',
    highlights: [
      { icon: 'hgi-sparkles', label: 'Sunrise flow' },
      { icon: 'hgi-star', label: 'Certified teachers' },
      { icon: 'hgi-user-multiple', label: 'All levels welcome' },
      { icon: 'hgi-gift', label: 'Tea & fruit after' },
    ],
    agenda: [
      {
        time: '05:45',
        title: 'Arrival & check-in',
        desc: 'Roll out your mat on the lawn as the sky softens.',
      },
      { time: '06:15', title: 'Breathwork warm-up', desc: 'Guided pranayama to settle the mind.' },
      {
        time: '06:45',
        title: 'Sunrise Vinyasa',
        desc: 'A gentle all-levels flow with the sun on the lake.',
      },
      { time: '07:30', title: 'Guided meditation', desc: 'Stillness and a closing sound bath.' },
      { time: '07:50', title: 'Tea & fruit', desc: 'Herbal tea and fresh fruit as we wind down.' },
    ],
    speakers: [
      { name: 'Nari Suksai', role: 'Lead Yoga Teacher', initials: 'NS' },
      { name: 'Krit Wattana', role: 'Breathwork Coach', initials: 'KW' },
      { name: 'Lena Fischer', role: 'Meditation Guide', initials: 'LF' },
    ],
    tickets: [
      {
        name: 'Mat Pass',
        price: '฿800',
        note: 'Bring your own mat',
        featured: false,
        features: ['Sunrise flow & breathwork', 'Guided meditation', 'Tea & fruit'],
      },
      {
        name: 'Sunrise Kit',
        price: '฿1,100',
        note: 'Most popular',
        featured: true,
        features: ['Everything in Mat Pass', 'Eventa yoga mat to keep', 'Reusable water bottle'],
      },
      {
        name: 'Duo Pass',
        price: '฿1,500',
        note: 'For two',
        featured: false,
        features: ['Two Mat Passes', 'Side-by-side spots', 'Shared tea & fruit'],
      },
    ],
    faqs: [
      {
        q: 'Do I need to bring a mat?',
        a: 'Bring your own with the Mat Pass, or grab a Sunrise Kit and take an Eventa mat home.',
      },
      {
        q: 'Is it suitable for beginners?',
        a: 'Absolutely — the flow is gentle and every pose has an easier option.',
      },
      {
        q: 'What happens if it rains?',
        a: 'Light rain still flows under the pavilion; heavy rain moves us to the next Saturday, same time.',
      },
    ],
    agendaTitle: 'Schedule',
    speakersTitle: 'Speakers',
    ticketsTitle: 'Tickets',
    accent: '#1ba770',
    registerUrl: '../portal/register.html?event=sunrise-yoga-retreat',
    contactEmail: 'hello@eventa.co',
    socials: { instagram: '#', website: '#' },
  },

  'thai-street-food-festival': {
    slug: 'thai-street-food-festival',
    title: 'Thai Street Food Festival',
    kicker: "Bangkok's biggest open-air feast",
    tagline:
      'Two days of sizzling woks, regional street classics and live music under the open sky — free to enter, easy to love.',
    category: 'Food & Drink',
    dateText: 'Sat–Sun, November 14–15, 2026',
    timeText: '11:00 – 22:00 · GMT+7',
    venue: 'Benjakitti Forest Park',
    city: 'Bangkok, Thailand',
    address: 'Ratchadaphisek Rd, Khlong Toei, Bangkok',
    priceFrom: 'Free',
    seating: 'ga',
    seatsLeft: 2340,
    capacity: 8000,
    attendeesText: '10,000+ expected',
    organizer: 'Bangkok Street Food Collective',
    about:
      "A free-entry, open-air celebration of Thailand's street food from every region — pad krapow to khao soi, grilled skewers to mango sticky rice. Wander 80+ stalls, catch live chef demos, and settle in for evening music across three stages. Come hungry, bring friends, and pay only for what you eat.",
    highlights: [
      { icon: 'hgi-ticket-01', label: 'Free entry, all ages' },
      { icon: 'hgi-sparkles', label: '80+ food stalls' },
      { icon: 'hgi-music-note-01', label: '3 live music stages' },
      { icon: 'hgi-user-multiple', label: 'Family & pet friendly' },
    ],
    agenda: [
      {
        time: '11:00',
        title: 'Gates open',
        desc: 'Stalls fire up the woks and grills — beat the crowds and graze early.',
      },
      {
        time: '13:00',
        title: 'Live cooking demo',
        desc: 'Watch top chefs plate signature dishes and share their home-kitchen tricks.',
      },
      {
        time: '16:00',
        title: 'Street chef showdown',
        desc: "Four regional cooks battle the clock for the crowd's vote and the golden ladle.",
      },
      {
        time: '18:00',
        title: 'Live music begins',
        desc: 'Bands and DJs take over the main stage as the sun goes down.',
      },
      {
        time: '21:00',
        title: 'Headline set',
        desc: 'The night peaks with our headline act and one last round of late-night bites.',
      },
    ],
    speakers: [
      { name: 'Chef Ploy Traisuk', role: 'Street food chef, Raan Ploy', initials: 'PT' },
      { name: 'Chef Anan Wattana', role: 'Bib Gourmand, Baan Krua', initials: 'AW' },
      { name: 'Chef Nok Chaiyaphum', role: 'Isaan grill master', initials: 'NC' },
      { name: 'Malee Sound System', role: 'Headline live band', initials: 'MS' },
    ],
    tickets: [
      {
        name: 'General Entry',
        price: 'Free',
        note: 'Walk in any time',
        featured: false,
        features: ['Free access both days', 'Open seating & lawn areas', 'Pay per dish at each stall'],
      },
      {
        name: 'Foodie Pass',
        price: '฿450',
        note: 'Most popular',
        featured: true,
        features: ['10 tasting tokens', 'Skip-the-line stall lane', 'Festival tote & map'],
      },
      {
        name: 'VIP Lounge',
        price: '฿1,200',
        note: 'Limited',
        featured: false,
        features: [
          'Shaded riverside lounge',
          '20 tasting tokens',
          'Front-stage viewing deck',
          'Welcome drink',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is entry really free?',
        a: 'Yes — general admission is completely free both days. You only pay for the food and drinks you buy from stalls, or upgrade to a Foodie Pass or VIP Lounge for extras.',
      },
      {
        q: 'Can I bring my kids and pets?',
        a: "Absolutely. It's a family-friendly, leashed-pet-welcome outdoor event with plenty of open lawn, kid-safe dishes and shaded seating.",
      },
      {
        q: 'How do I pay at the stalls?',
        a: 'Most stalls take cash, PromptPay and cards. There are ATMs and top-up booths on site, and Foodie/VIP tokens are accepted at participating vendors.',
      },
    ],
    agendaTitle: 'Schedule',
    speakersTitle: 'Speakers',
    ticketsTitle: 'Tickets',
    accent: '#1ba770',
    registerUrl: '../portal/register.html?event=thai-street-food-festival',
    contactEmail: 'hello@eventa.co',
    socials: { instagram: '#', website: '#' },
  },

  'ux-bangkok-meetup': {
    slug: 'ux-bangkok-meetup',
    title: 'UX Bangkok Meetup',
    kicker: "Where Bangkok's designers meet",
    tagline:
      "An evening of lightning talks and easy networking for the people designing Bangkok's products.",
    category: 'Meetup',
    dateText: 'Thursday, September 24, 2026',
    timeText: '18:30 – 21:30 · GMT+7',
    venue: 'True Digital Park',
    city: 'Bangkok, Thailand',
    address: '101 Sukhumvit Rd, Phra Khanong Tai, Bangkok',
    priceFrom: 'Free',
    seating: 'ga',
    seatsLeft: 42,
    capacity: 150,
    attendeesText: '150 designers',
    organizer: 'Bangkok Design Community',
    about:
      'UX Bangkok Meetup is a free, community-run evening for product designers, researchers and curious builders. Expect six punchy lightning talks, an open portfolio jam, and plenty of time to trade ideas over pizza and drinks — no pitches, no pressure.',
    highlights: [
      { icon: 'hgi-mic-01', label: '6 lightning talks' },
      { icon: 'hgi-user-multiple', label: 'Open networking' },
      { icon: 'hgi-sparkles', label: 'Portfolio jam' },
      { icon: 'hgi-gift', label: 'Free pizza & drinks' },
    ],
    agenda: [
      { time: '18:30', title: 'Doors & drinks', desc: 'Grab a name tag, a slice and a seat.' },
      { time: '19:00', title: 'Lightning talks', desc: 'Six 7-minute talks on real design work.' },
      { time: '20:00', title: 'Portfolio jam', desc: 'Small-group feedback on works in progress.' },
      { time: '20:30', title: 'Open networking', desc: 'Meet designers from across the city.' },
      { time: '21:30', title: 'Wrap up', desc: 'Swap contacts and head out together.' },
    ],
    speakers: [
      { name: 'Ploy Srisai', role: 'Lead Product Designer, Grab', initials: 'PS' },
      { name: 'Nathan Cole', role: 'UX Researcher, LINE MAN', initials: 'NC' },
      { name: 'Wanida Chan', role: 'Design Manager, SCB', initials: 'WC' },
      { name: 'Arun Mehta', role: 'Founder, Studio North', initials: 'AM' },
    ],
    tickets: [
      {
        name: 'General Admission',
        price: 'Free',
        note: 'Register to reserve',
        featured: true,
        features: ['Entry to all talks', 'Portfolio jam access', 'Pizza & drinks'],
      },
      {
        name: 'Supporter',
        price: '฿300',
        note: 'Help cover costs',
        featured: false,
        features: ['Everything in General', 'Reserved front seats', 'Community sticker pack'],
      },
    ],
    faqs: [
      {
        q: 'Where is it held?',
        a: 'True Digital Park, Bangkok — a short walk from BTS Punnawithi.',
      },
      {
        q: 'Is it really free?',
        a: 'Yes. General Admission is free — just register so we know how much pizza to order.',
      },
      {
        q: 'Can I give a lightning talk?',
        a: "Absolutely. Reply to your confirmation email and we'll slot you in at the next meetup.",
      },
    ],
    agendaTitle: 'Schedule',
    speakersTitle: 'Speakers',
    ticketsTitle: 'Tickets',
    accent: '#1ba770',
    registerUrl: '../portal/register.html?event=ux-bangkok-meetup',
    contactEmail: 'hello@eventa.co',
    socials: { instagram: '#', website: '#' },
  },

  'startup-pitch-night': {
    slug: 'startup-pitch-night',
    title: 'Startup Pitch Night',
    kicker: 'Eight founders, one room of investors',
    tagline:
      "Watch eight vetted startups pitch live to Bangkok's top angels and VCs, then keep the momentum going over drinks.",
    category: 'Networking',
    dateText: 'Thursday, September 24, 2026',
    timeText: '18:00 – 22:00 · GMT+7',
    venue: 'True Digital Park',
    city: 'Bangkok, Thailand',
    address: '101 Sukhumvit Rd, Bang Chak, Phra Khanong, Bangkok',
    priceFrom: '฿350',
    seating: 'reserved',
    seatsLeft: 42,
    capacity: 200,
    attendeesText: '200 seats · founders & investors',
    organizer: 'Eventa Co.',
    about:
      'Startup Pitch Night brings eight hand-picked early-stage teams on stage for five-minute pitches and live investor Q&A. Expect sharp ideas, honest feedback, and a room full of the people who can fund your next round. When the pitches wrap, the bar opens and the real conversations begin.',
    highlights: [
      { icon: 'hgi-rocket-01', label: '8 startups pitching' },
      { icon: 'hgi-user-multiple', label: '30+ active investors' },
      { icon: 'hgi-champion', label: 'Audience choice award' },
      { icon: 'hgi-headphones', label: 'Drinks & networking' },
    ],
    agenda: [
      {
        time: '18:00',
        title: 'Check-in & welcome drink',
        desc: 'Grab your badge, a drink, and mingle before the pitches begin.',
      },
      {
        time: '18:45',
        title: 'Opening remarks',
        desc: "A quick welcome and how tonight's judging and voting work.",
      },
      {
        time: '19:00',
        title: 'The pitches',
        desc: 'Eight startups, five minutes each, followed by rapid-fire investor Q&A.',
      },
      {
        time: '20:30',
        title: 'Awards & audience vote',
        desc: 'Judges share picks and the room votes for its favorite founder.',
      },
      {
        time: '21:00',
        title: 'Drinks & networking',
        desc: 'Meet the founders and investors over drinks until close.',
      },
    ],
    speakers: [
      { name: 'Pim Sirisant', role: 'Partner, Mekong Ventures', initials: 'PS' },
      { name: 'Daniel Tan', role: 'Angel Investor & Founder, Loop', initials: 'DT' },
      { name: 'Nutcha Wong', role: 'Principal, 500 TukTuks', initials: 'NW' },
      { name: 'Arjun Mehta', role: 'Head of Startups, SEA Growth', initials: 'AM' },
    ],
    tickets: [
      {
        name: 'General Admission',
        price: '฿350',
        note: 'Reserved seat + welcome drink',
        featured: false,
        features: ['Reserved seat for all pitches', 'One welcome drink', 'Access to networking hour'],
      },
      {
        name: 'Investor Pass',
        price: '฿650',
        note: 'Front rows + founder intros',
        featured: true,
        features: [
          'Priority front-row seating',
          'Two drink vouchers',
          'Curated intros to pitching founders',
          'Access to investor lounge',
        ],
      },
      {
        name: 'Founder Table',
        price: '฿1,200',
        note: 'For teams · seats 2',
        featured: false,
        features: [
          'Two reserved seats',
          'Demo spot at networking hour',
          'Four drink vouchers',
          'Founder directory listing',
        ],
      },
    ],
    faqs: [
      {
        q: 'Where is it held?',
        a: "At True Digital Park on Sukhumvit Rd, Phra Khanong, Bangkok. It's a short walk from BTS Punnawithi.",
      },
      {
        q: 'Can I pitch my startup?',
        a: 'The eight pitching teams are selected in advance, but a Founder Table gets you a demo spot during the networking hour. Email us to join the next cohort.',
      },
      {
        q: 'Is there an age or dress requirement?',
        a: 'Attendees must be 20 or older as drinks are served. Smart casual is perfect, no suit required.',
      },
    ],
    agendaTitle: 'Schedule',
    speakersTitle: 'Speakers',
    ticketsTitle: 'Tickets',
    accent: '#1ba770',
    registerUrl: '../portal/register.html?event=startup-pitch-night',
    contactEmail: 'hello@eventa.co',
    socials: { instagram: '#', website: '#' },
  },

  'bangkok-art-fair': {
    slug: 'bangkok-art-fair',
    title: 'Bangkok Art Fair',
    kicker: 'Contemporary art, across the city',
    tagline:
      "A weekend where Bangkok's galleries open their walls together — more than fifty rooms of contemporary work, live talks and curator-led tours under one roof.",
    category: 'Exhibition',
    dateText: 'Sat–Sun, November 14–15, 2026',
    timeText: '11:00 – 20:00 · GMT+7',
    venue: 'River City Bangkok',
    city: 'Bangkok, Thailand',
    address: '23 Trok Rong Nam Khaeng, Charoen Krung Rd, Bangkok',
    priceFrom: '฿250',
    seating: 'ga',
    seatsLeft: 214,
    capacity: 800,
    attendeesText: '3,000+ visitors',
    organizer: 'Eventa Arts',
    about:
      'Bangkok Art Fair turns River City into a two-day home for contemporary art, with more than 50 galleries, live talks and curator-led tours spread across every floor. Discover emerging Thai voices alongside established names from around the region — and take a piece of it home.',
    highlights: [
      { icon: 'hgi-sparkles', label: '50+ galleries' },
      { icon: 'hgi-mic-01', label: 'Artist talks' },
      { icon: 'hgi-user-multiple', label: 'Curator-led tours' },
      { icon: 'hgi-camera-01', label: 'Photography wing' },
    ],
    agenda: [
      {
        time: '11:00',
        title: 'Doors open',
        desc: 'Collect your map and get a first look at the ground-floor galleries.',
      },
      {
        time: '13:00',
        title: 'Curator walkthrough',
        desc: "A guided tour through this year's highlighted works.",
      },
      {
        time: '15:00',
        title: 'Artist talk',
        desc: 'Contemporary Thai voices on identity and the city.',
      },
      {
        time: '17:30',
        title: 'Live drawing session',
        desc: 'Watch new work take shape in the atrium.',
      },
      {
        time: '19:00',
        title: 'Closing reception',
        desc: 'Wine, music and a final loop of the halls.',
      },
    ],
    speakers: [
      { name: 'Araya Chaipong', role: 'Contemporary Artist', initials: 'AC' },
      { name: 'Somchai Rojana', role: 'Curator, River Gallery', initials: 'SR' },
      { name: 'Lena Fischer', role: 'Director, Frame Collective', initials: 'LF' },
      { name: 'Nadia Suksan', role: 'Sculptor', initials: 'NS' },
    ],
    tickets: [
      {
        name: 'Day Pass',
        price: '฿250',
        note: 'General entry',
        featured: false,
        features: ['One-day access', 'Fair map & guide', 'All gallery halls'],
      },
      {
        name: 'Weekend Pass',
        price: '฿420',
        note: 'Best value',
        featured: true,
        features: ['Both days', 'Curator-led tour', 'Full talks programme'],
      },
      {
        name: 'Collector',
        price: '฿1,200',
        note: 'Limited',
        featured: false,
        features: ['Both days', 'Preview-night access', 'Catalogue & tote'],
      },
    ],
    faqs: [
      {
        q: 'Where is it held?',
        a: 'River City Bangkok on Charoen Krung — a short walk from Si Phraya pier.',
      },
      {
        q: 'Can I buy the artwork?',
        a: 'Yes — most works are for sale directly through the exhibiting galleries.',
      },
      {
        q: 'Is re-entry allowed?',
        a: 'Your day pass lets you come and go throughout the same day.',
      },
    ],
    agendaTitle: 'Schedule',
    speakersTitle: 'Speakers',
    ticketsTitle: 'Tickets',
    accent: '#1ba770',
    registerUrl: '../portal/register.html?event=bangkok-art-fair',
    contactEmail: 'hello@eventa.co',
    socials: { instagram: '#', website: '#' },
  },

  'marathon-for-mangroves': {
    slug: 'marathon-for-mangroves',
    title: 'Marathon for Mangroves',
    kicker: 'Run the coast, replant the coast',
    tagline:
      "A charity 10K and half-marathon along Bangkok's waterfront — every finisher puts new mangroves in the ground.",
    category: 'Sports & Wellness',
    dateText: 'Sunday, September 20, 2026',
    timeText: '05:30 – 10:00 · GMT+7',
    venue: 'Benjakitti Forest Park',
    city: 'Bangkok, Thailand',
    address: 'Ratchadaphisek Rd, Khlong Toei, Bangkok',
    priceFrom: '฿600',
    seating: 'ga',
    seatsLeft: 340,
    capacity: 1500,
    attendeesText: '1,500+ runners',
    organizer: 'Eventa Green Foundation',
    about:
      "Marathon for Mangroves is a sunrise charity run through Benjakitti Forest Park's restored wetlands, with chip-timed 10K and half-marathon routes for every pace. Entry fees fund coastal mangrove reforestation, and every runner sponsors at least one seedling — so the finish line is really a new stretch of shoreline.",
    highlights: [
      { icon: 'hgi-champion', label: 'Finisher medal' },
      { icon: 'hgi-user-multiple', label: '10K & 21K routes' },
      { icon: 'hgi-gift', label: 'A tree per runner' },
      { icon: 'hgi-sparkles', label: 'Sunrise waterfront route' },
    ],
    agenda: [
      {
        time: '05:00',
        title: 'Bib pickup & warm-up',
        desc: 'Collect your race pack and stretch with the pace team.',
      },
      {
        time: '05:45',
        title: 'Half-marathon start',
        desc: '21K runners set off along the wetland loop at first light.',
      },
      {
        time: '06:15',
        title: '10K start',
        desc: 'The shorter route flags off through the forest park.',
      },
      {
        time: '08:30',
        title: 'Tree-planting ceremony',
        desc: 'Finishers plant the first mangroves of the day together.',
      },
      {
        time: '09:30',
        title: 'Awards & recovery zone',
        desc: 'Podium prizes, stretching, fruit and cold towels.',
      },
    ],
    speakers: [
      { name: 'Nok Sasithorn', role: 'Olympic runner & race ambassador', initials: 'NS' },
      { name: 'Dr. Pim Charoen', role: 'Marine biologist, Mangrove Trust', initials: 'PC' },
      { name: 'Coach Aran Yindee', role: 'Lead pacer, half-marathon', initials: 'AY' },
      { name: 'Lisa Tan', role: 'Founder, Eventa Green Foundation', initials: 'LT' },
    ],
    tickets: [
      {
        name: '10K Run',
        price: '฿600',
        note: 'Charity entry',
        featured: false,
        features: ['Chip-timed 10K', 'Finisher medal', 'Race tee + bib', 'One mangrove planted'],
      },
      {
        name: 'Half Marathon',
        price: '฿900',
        note: 'Most popular',
        featured: true,
        features: [
          'Chip-timed 21K',
          'Finisher medal + tee',
          'Recovery zone access',
          'Two mangroves planted',
        ],
      },
      {
        name: 'Green Champion',
        price: '฿1,800',
        note: 'Gives the most back',
        featured: false,
        features: [
          'Half-marathon entry',
          'Premium finisher pack',
          'Ten mangroves planted',
          'Post-race brunch',
        ],
      },
    ],
    faqs: [
      {
        q: 'Where does the run start?',
        a: 'Benjakitti Forest Park, Khlong Toei — a short walk from Queen Sirikit MRT.',
      },
      {
        q: 'Where does my entry fee go?',
        a: 'All proceeds fund coastal mangrove reforestation, and every runner sponsors at least one seedling.',
      },
      {
        q: 'Can beginners join the 10K?',
        a: 'Absolutely — the 10K is flat, chip-timed and welcomes first-timers and walkers.',
      },
    ],
    agendaTitle: 'Schedule',
    speakersTitle: 'Speakers',
    ticketsTitle: 'Tickets',
    accent: '#1ba770',
    registerUrl: '../portal/register.html?event=marathon-for-mangroves',
    contactEmail: 'hello@eventa.co',
    socials: { instagram: '#', website: '#' },
  },
}

/** Text fields the create-event preview can override via query string. */
const OVERRIDABLE = [
  'title',
  'kicker',
  'tagline',
  'category',
  'dateText',
  'timeText',
  'venue',
  'city',
  'address',
  'priceFrom',
  'accent',
  'organizer',
] as const

/** Pick the event to render: ?event=<slug> (falling back to the first), then
 *  apply any overridable text-field query params. Mirrors EVENTA_getEvent(). */
export function getLandingEvent(params: URLSearchParams): LandingEvent {
  const slug = params.get('event')
  const src = (slug && LANDING_EVENTS[slug]) || Object.values(LANDING_EVENTS)[0]!
  const ev: LandingEvent = { ...src }
  for (const key of OVERRIDABLE) {
    const value = params.get(key)
    if (value != null && value !== '') ev[key] = value
  }
  return ev
}

/** Highlights can be overridden inline via ?hl=icon:label|icon:label. */
export function getLandingHighlights(
  params: URLSearchParams,
  fallback: LandingEvent['highlights'],
): LandingEvent['highlights'] {
  const q = params.get('hl')
  if (!q) return fallback
  return q.split('|').map((s) => {
    const i = s.indexOf(':')
    return { icon: s.slice(0, i), label: s.slice(i + 1) }
  })
}
