import { Link } from 'react-router'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { SetupWire } from '../overview.types'
import { stepStatesOf, type StepState } from '../setupSteps'
import { TemplateShortcuts } from './TemplateShortcuts'

/**
 * What Home shows a workspace that has nothing in it yet (the kit's
 * admin/home-empty.html).
 *
 * The six panels are deliberately not rendered — a grid of "No X" cards reads
 * as broken, and none of them can be acted on. This replaces them with the one
 * thing a new organizer needs: the ordered path to a first paid registration.
 *
 * The steps are in dependency order, which is also the backlog's epic order:
 * an event cannot be sold before the organization has tax details and a
 * connected payment account, and nothing can be discovered before it is
 * published.
 *
 * Progress comes from the API (`GET /dashboard/setup`), never from anything
 * this screen infers. Each step is a fact owned by the module that owns the
 * decision, so a tick means the server said so. A step the caller may not be
 * told about, or that failed to load, is drawn plainly: not ticked, and not
 * pointed at either — see `stepStatesOf`.
 */

interface Step {
  /** The API fact that decides whether this step is done. */
  fact: keyof SetupWire
  icon: string
  title: string
  detail: string
  to: string
  cta: string
  minutes: string
}

const STEPS: Step[] = [
  {
    icon: 'hgi-building-03',
    fact: 'organizationConfigured',
    title: 'Set up your organization',
    detail: 'Name, tax details and branding — these appear on every ticket and invoice.',
    to: '/admin/settings-organization',
    cta: 'Set up',
    minutes: '2 min',
  },
  {
    icon: 'hgi-wallet-01',
    fact: 'paymentsConnected',
    title: 'Connect payments',
    detail: 'Card and PromptPay via Stripe — required before you can charge for a ticket.',
    to: '/admin/settings-payments',
    cta: 'Connect',
    minutes: '3 min',
  },
  {
    icon: 'hgi-calendar-add-01',
    fact: 'eventCreated',
    title: 'Create your first event',
    detail: 'Title, date, venue and seating — save as a draft and finish it later.',
    to: '/admin/event-form',
    cta: 'Create',
    minutes: '4 min',
  },
  {
    icon: 'hgi-ticket-01',
    fact: 'ticketTypeAdded',
    title: 'Add ticket types',
    detail: 'Free or paid, with capacity and a sales window. Add at least one to publish.',
    to: '/admin/tickets',
    cta: 'Add',
    minutes: '2 min',
  },
  {
    icon: 'hgi-browser',
    fact: 'eventPublished',
    title: 'Publish your event page',
    detail: 'Pick a design, then share the link — this is where registrations come from.',
    to: '/admin/landing-pages',
    cta: 'Publish',
    minutes: '1 min',
  },
]

/** Per state: the row, the number badge, the icon tile and the call to action. */
const LOOKS: Record<StepState, { row: string; badge: string; tile: string; cta: string }> = {
  current: {
    row: 'border-brand/40 bg-brand-soft/50 ring-1 ring-brand/20',
    badge: 'border-hair bg-surface text-muted',
    tile: 'bg-surface text-brand',
    cta: 'btn-primary',
  },
  done: {
    row: 'border-hair hover:bg-line/40',
    badge: 'border-brand/30 bg-brand-soft text-brand',
    tile: 'bg-brand-soft text-brand',
    cta: 'btn-ghost',
  },
  todo: {
    row: 'border-hair hover:bg-line/40',
    badge: 'border-hair bg-surface text-muted',
    tile: 'bg-canvas text-muted',
    cta: 'btn-soft',
  },
  // Nothing asserted either way: drawn exactly like a step still to do, but
  // never pointed at, because we have no grounds to advise it.
  unknown: {
    row: 'border-hair hover:bg-line/40',
    badge: 'border-hair bg-surface text-muted',
    tile: 'bg-canvas text-muted',
    cta: 'btn-soft',
  },
}

export function FirstRunHome({ setup }: { setup: SetupWire }) {
  const states = stepStatesOf(STEPS.map((step) => setup[step.fact]))

  return (
    <>
      <section className="rounded-2xl bg-surface p-5 lg:p-6">
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon name="hgi-rocket-01" size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">Set up your workspace</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Work through these and you can take your first paid registration. You can stop at any
              point and pick it up later.
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-2.5">
          {STEPS.map((step, i) => {
            const state = states[i]
            const look = LOOKS[state]
            const done = state === 'done'
            return (
            <li
              key={step.to}
              className={cn(
                'flex items-center gap-3.5 rounded-xl border px-3.5 py-3 transition',
                look.row,
              )}
            >
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[12px] font-bold tnum',
                  look.badge,
                )}
              >
                {done ? <Icon name="hgi-tick-02" size={15} /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden h-9 w-9 shrink-0 place-items-center rounded-lg sm:grid',
                  look.tile,
                )}
              >
                <Icon name={step.icon} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">
                  {step.title}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted">{step.detail}</span>
              </span>
              <span className="hidden shrink-0 text-[11px] text-muted tnum sm:block">
                {step.minutes}
              </span>
              <Link to={step.to} className={cn('btn btn-sm shrink-0', look.cta)}>
                {done ? 'Review' : step.cta}
                {state === 'current' && <Icon name="hgi-arrow-right-01" size={15} />}
              </Link>
            </li>
            )
          })}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hair pt-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-muted">
            <Icon name="hgi-user-multiple" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">
              Invite your team
              <span className="ml-1 align-middle text-[11px] font-medium text-muted">Optional</span>
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              Staff can scan tickets at the door without seeing your finances.
            </p>
          </div>
          <Link to="/admin/users" className="btn btn-ghost btn-sm shrink-0">
            Invite
          </Link>
        </div>
      </section>

      {/* Real content, not an empty card — the designs exist before any event does. */}
      <TemplateShortcuts />
    </>
  )
}
