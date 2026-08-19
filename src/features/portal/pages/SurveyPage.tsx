import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Icon } from '@/components/ui'
import { useTheme } from '@/lib/useTheme'
import { cn } from '@/lib/cn'

/* Attendee feedback survey (portal/survey.html). Standalone page — reads
   ?event= for the event name/banner, drives a required star rating with hover
   preview, and swaps to a thank-you card on submit. */

const EVENT_NAMES: Record<string, string> = {
  'tech-summit-2026': 'Tech Summit 2026',
  'bangkok-jazz-night': 'Bangkok Jazz Night',
  'sunrise-yoga-retreat': 'Sunrise Yoga Retreat',
  'ux-bangkok-meetup': 'UX Bangkok Meetup',
  'thai-street-food-festival': 'Thai Street Food Festival',
  'startup-pitch-night': 'Startup Pitch Night',
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
}

function titleize(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const HEAR_OPTIONS = [
  { value: 'social', label: 'Social media' },
  { value: 'friend', label: 'Friend or colleague' },
  { value: 'email', label: 'Email newsletter' },
  { value: 'search', label: 'Search engine' },
]

const RECOMMEND_OPTIONS = [
  { value: 'yes', icon: 'hgi-thumbs-up', iconClass: 'text-brand', label: 'Definitely' },
  { value: 'maybe', icon: 'hgi-help-circle', iconClass: 'text-amber-500', label: 'Maybe' },
  { value: 'no', icon: 'hgi-thumbs-down', iconClass: 'text-red-500', label: 'No' },
]

export default function SurveyPage() {
  const { dark, toggle } = useTheme()
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('event') || 'tech-summit-2026'
  const name = EVENT_NAMES[slug] || titleize(slug)

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [error, setError] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    document.title = 'Eventa · Feedback for ' + name
  }, [name])

  const paint = hover || rating

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError(true)
      document
        .getElementById('star-rating')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <button
        type="button"
        onClick={toggle}
        className="btn-icon fixed right-4 top-4 z-10 bg-surface"
        title="Toggle theme"
      >
        <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
      </button>

      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        {/* brand */}
        <Link to="/portal/discover" className="mx-auto mb-6 flex w-fit items-center gap-2.5">
          <span className="brand-logo text-brand h-[17px] w-[31px]" />
          <span className="text-[15px] font-extrabold tracking-tight">Eventa</span>
        </Link>

        {/* ============ Survey ============ */}
        {!submitted && (
          <div className="card overflow-hidden">
            {/* event banner */}
            <div className="relative h-28 bg-gradient-to-br from-brand to-emerald-500">
              <img
                src={`https://picsum.photos/seed/${slug}/720/240`}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                  You attended
                </p>
                <h1 className="text-[18px] font-bold tracking-tight text-white">{name}</h1>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <h2 className="text-[17px] font-bold tracking-tight">How was it?</h2>
              <p className="mt-1 text-[13px] text-muted">
                Your feedback helps us make future events even better. Takes about a minute.
              </p>

              <form className="mt-6 space-y-7" noValidate onSubmit={onSubmit}>
                {/* Q1 · Rating (required) */}
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink">
                    Overall, how would you rate the event? <span className="text-red-500">*</span>
                  </label>
                  <div
                    id="star-rating"
                    className="mt-2.5 flex flex-wrap items-center gap-1"
                    onMouseLeave={() => setHover(0)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="star-btn flex p-0.5 transition hover:scale-110"
                        aria-label={n === 1 ? '1 star' : `${n} stars`}
                        onMouseEnter={() => setHover(n)}
                        onClick={() => {
                          setRating(n)
                          setError(false)
                        }}
                      >
                        <i
                          className={cn(
                            'hgi-stroke hgi-star text-[30px] transition-colors',
                            n <= paint ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600',
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-[13px] font-semibold text-muted">
                      {rating > 0 ? `${rating} · ${RATING_LABELS[rating]}` : ''}
                    </span>
                  </div>
                  {error && (
                    <p className="mt-1.5 text-[12px] font-medium text-red-500">
                      Please pick a rating to continue.
                    </p>
                  )}
                </div>

                {/* Q2 · Text */}
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink">
                    What did you enjoy most?
                  </label>
                  <textarea
                    className="textarea mt-2"
                    rows={3}
                    placeholder="Tell us what stood out…"
                  />
                </div>

                {/* Q3 · Multiple choice */}
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink">
                    How did you hear about this event?
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {HEAR_OPTIONS.map((o) => (
                      <label key={o.value} className="block cursor-pointer">
                        <input type="radio" name="hear" value={o.value} className="peer sr-only" />
                        <span className="block rounded-lg border border-hair px-3.5 py-3 text-[13px] font-medium text-ink transition hover:bg-line/60 peer-checked:border-brand peer-checked:bg-brand-soft/50 peer-checked:font-semibold peer-checked:text-brand">
                          {o.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q4 · Recommend */}
                <div>
                  <label className="block text-[13.5px] font-semibold text-ink">
                    Would you recommend Eventa events to a friend?
                  </label>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {RECOMMEND_OPTIONS.map((o) => (
                      <label key={o.value} className="block cursor-pointer">
                        <input
                          type="radio"
                          name="recommend"
                          value={o.value}
                          className="peer sr-only"
                        />
                        <span className="flex flex-col items-center gap-1.5 rounded-lg border border-hair py-3 text-center transition hover:bg-line/60 peer-checked:border-brand peer-checked:bg-brand-soft/50">
                          <i className={cn('hgi-stroke text-[20px]', o.icon, o.iconClass)} />
                          <span className="text-[12.5px] font-semibold text-ink">{o.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  <Icon name="hgi-sent" size={16} />
                  Submit feedback
                </button>
                <p className="text-center text-[11px] text-muted/80">
                  Your response is anonymous to other attendees.
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ============ Thank-you ============ */}
        {submitted && (
          <div className="card p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon name="hgi-checkmark-badge-01" size={30} />
            </span>
            <h2 className="mt-4 text-[19px] font-bold tracking-tight">Thank you!</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted">
              Your feedback for <b className="text-ink">{name}</b> has been recorded — it helps us
              make future events even better.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/portal/my-events" className="btn btn-soft btn-sm">
                <Icon name="hgi-ticket-02" size={15} />
                Back to my events
              </Link>
              <Link to="/portal/discover" className="btn btn-soft btn-sm">
                <Icon name="hgi-search-01" size={15} />
                Discover events
              </Link>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-muted/70">
          Eventa · Event registration system · React, Tailwind CSS &amp; Hugeicons
        </p>
      </main>
    </div>
  )
}
