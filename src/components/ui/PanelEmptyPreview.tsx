import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import type { EmptyAction } from './EmptyState'
import { Icon } from './Icon'

/**
 * A panel with nothing in it yet, shown as a still preview of what will fill
 * it, dissolving into the reason it is empty and what puts something there.
 *
 * The preview is deliberately NOT the `Skeleton` primitive. `.skeleton`
 * shimmers, and a shimmer means "this is loading, wait" — on a panel that has
 * finished loading and genuinely has nothing, it promises rows that are never
 * coming. These blocks are inert.
 *
 * Each shape mirrors its own panel's real row, so the preview reads as "your
 * registrations will look like this" rather than as generic grey furniture.
 *
 * Shared by the dashboard and the reports screens. Anything that draws a panel
 * and can have nothing in it should use this rather than inventing a second
 * look for the same moment.
 */
export function PanelEmptyPreview({
  preview,
  description,
  action,
  children,
}: {
  preview: PreviewKind
  /** What the organizer can do about it. One sentence. */
  description: ReactNode
  /**
   * The one next step this card offers. Omitted where there genuinely is none:
   * an empty Alerts panel means nothing is wrong, and a button there would
   * manufacture work that does not exist.
   */
  action?: EmptyAction
  /** The headline — the panel's own empty message, shown verbatim. */
  children: ReactNode
}) {
  const { render, place, fade = DISSOLVE } = PREVIEWS[preview]

  return (
    <div className="relative mt-3.5">
      <div aria-hidden="true" className={fade}>
        {render()}
      </div>
      {/* Where the message sits is the shape's own business. A tall stack of
          rows is OVERLAID — laid over the dissolving tail, which keeps the
          card's height and leaves the ghost running on beneath the button. A
          negative margin cannot do that: it collapses the flow, so the tail it
          was supposed to sit on stops existing and the card shrinks to fit.
          Shapes one row deep have no tail to overlay, so they stay in flow. */}
      <div className={cn('px-2 text-center', place)}>
        <p className="text-[15px] font-bold tracking-tight text-ink">{children}</p>
        <p className="mx-auto mt-1 max-w-[34ch] text-[13px] leading-snug text-muted">
          {description}
        </p>
        {action && (
          <div className="mt-4 flex justify-center">
            <PreviewAction action={action} />
          </div>
        )}
      </div>
    </div>
  )
}

/** The card's single next step, as the solid brand button the design asks for. */
function PreviewAction({ action }: { action: EmptyAction }) {
  const body = (
    <>
      {action.icon && <Icon name={action.icon} size={15} />}
      {action.label}
    </>
  )

  if (action.to) {
    return (
      <Link to={action.to} className="btn btn-primary">
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className="btn btn-primary">
      {body}
    </button>
  )
}

export type PreviewKind =
  | 'registrations'
  | 'meetings'
  | 'alerts'
  | 'events'
  | 'ring'
  | 'table'
  | 'tiers'
  | 'chart'
  | 'bars'
  | 'announcements'

/**
 * Fades the preview out downwards so the message sits on clear ground.
 *
 * It goes early and hard: the FIRST row is the one that says "registrations
 * look like this", and everything under it is texture. Holding rows two and
 * three at full strength made them read as content that had failed to load.
 *
 * Written out in full, twice, rather than composed from a shared constant:
 * Tailwind scans source TEXT for class names, so a class built by template
 * literal is never generated and the mask silently does nothing.
 */
const DISSOLVE =
  '[mask-image:linear-gradient(to_bottom,#000_0%,#000_23%,transparent_52%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_23%,transparent_52%)]'

/** One inert block. `bg-line` is the same grey both themes use for chrome. */
function Block({ className }: { className: string }) {
  return <span className={cn('block shrink-0 rounded-full bg-line', className)} />
}

function PreviewRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-hair px-3 py-3">
      {children}
    </div>
  )
}

/**
 * Five of a row — more than any panel shows at once, deliberately. The message
 * is laid over the middle of it, so the tail carries the card's height past the
 * button and the ghost keeps running underneath rather than stopping dead.
 */
function Stack({ row }: { row: () => ReactNode }) {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i}>{row()}</div>
      ))}
    </div>
  )
}

interface Preview {
  render: () => ReactNode
  /**
   * Where the message goes: overlaid on the dissolving tail for a stack of
   * rows, or in normal flow beneath a shape that has no tail.
   */
  place: string
  /**
   * How the shape recedes. The default dissolves downwards, which suits a list
   * — the first row is the point and the tail is texture. A shape whose meaning
   * is spread across it, like a chart, has no tail to lose and fades evenly
   * instead; masked the same way, its curve would be rubbed out entirely.
   */
  fade?: string
}

/**
 * A lookup rather than a switch, so a new panel adds a shape here and changes
 * nothing else.
 */
const PREVIEWS: Record<PreviewKind, Preview> = {
  // Avatar, name, and the time it came in.
  registrations: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <Stack
        row={() => (
          <PreviewRow>
            <Block className="h-8 w-8 rounded-full" />
            <Block className="h-2.5 flex-1" />
            <Block className="h-2.5 w-12" />
          </PreviewRow>
        )}
      />
    ),
  },
  // Icon tile, title, then time and guest on their own lines.
  meetings: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <Stack
        row={() => (
          <PreviewRow>
            <Block className="h-9 w-9 rounded-lg" />
            <span className="flex-1 space-y-1.5">
              <Block className="h-2.5 w-3/4" />
              <Block className="h-2 w-1/3" />
            </span>
          </PreviewRow>
        )}
      />
    ),
  },
  // A tone dot and one line of text.
  alerts: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <Stack
        row={() => (
          <PreviewRow>
            <Block className="h-2 w-2" />
            <Block className="h-2.5 w-2/3" />
          </PreviewRow>
        )}
      />
    ),
  },
  // Cards across, matching the panel's own three-column grid — two rows of
  // them, so there is a dissolved tail for the message to sit on the way every
  // other shape here has one. With a single row the message had to go beneath
  // it, which left the faded half of that row reading as a blank band above the
  // text rather than as texture behind it.
  //
  // Below `sm` that grid becomes a column, so only the first card is kept and
  // the message goes back into flow: six stacked cards would make an empty
  // panel taller than the phone, and one card is too short to overlay.
  events: {
    // A quarter down, not a third: this preview is two rows where the others
    // are five, so the same fraction leaves the message sitting low. A quarter
    // of 232px puts the 116px message dead centre of the ghost.
    place: 'mt-4 sm:absolute sm:inset-x-0 sm:top-1/4',
    render: () => (
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn('rounded-xl border border-hair p-4', i > 0 && 'hidden sm:block')}
          >
            <div className="flex items-center justify-between">
              <span className="flex -space-x-2">
                <Block className="h-8 w-8" />
                <Block className="h-8 w-8" />
              </span>
              <Block className="h-5 w-12" />
            </div>
            <Block className="mt-3 h-3 w-2/3" />
            <Block className="mt-3.5 h-1.5 w-full" />
          </div>
        ))}
      </div>
    ),
  },
  // A row of a report/registrations TABLE: a name, then the columns it carries
  // across — event, amount, status, time.
  table: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <Stack
        row={() => (
          <PreviewRow>
            <Block className="h-7 w-7 rounded-full" />
            <Block className="h-2.5 w-24" />
            <Block className="h-2.5 flex-1" />
            <Block className="h-2.5 w-10" />
            <Block className="h-4 w-14 rounded-full" />
            <Block className="h-2.5 w-8" />
          </PreviewRow>
        )}
      />
    ),
  },
  // A ticket tier: its icon tile, name over event, and how many are left.
  tiers: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <Stack
        row={() => (
          <PreviewRow>
            <Block className="h-10 w-10 rounded-xl" />
            <span className="flex-1 space-y-1.5">
              <Block className="h-2.5 w-1/2" />
              <Block className="h-2 w-1/3" />
            </span>
            <Block className="h-2.5 w-8" />
          </PreviewRow>
        )}
      />
    ),
  },
  // A sent broadcast: its icon tile, then the subject over the message and the
  // line naming the event, the count and the day.
  announcements: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <Stack
        row={() => (
          <PreviewRow>
            <Block className="h-10 w-10 rounded-xl" />
            <span className="flex-1 space-y-1.5">
              <Block className="h-2.5 w-2/5" />
              <Block className="h-2 w-3/4" />
              <Block className="h-2 w-1/3" />
            </span>
          </PreviewRow>
        )}
      />
    ),
  },
  // A ranked bar: the label, the track it fills, and its figure. No borders —
  // the real thing is a bare row, not a card.
  bars: {
    place: 'absolute inset-x-0 top-1/3',
    render: () => (
      <div className="space-y-3.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Block className="h-2.5 w-36 sm:w-44" />
            <span className="h-2 flex-1 rounded-full bg-line" />
            <Block className="h-2.5 w-8" />
          </div>
        ))}
      </div>
    ),
  },
  // The trend's own gridlines with a soft curve under them — the shape of a
  // chart, without inventing a series that would read as real figures.
  chart: {
    place: 'absolute inset-x-0 top-1/3',
    fade: 'opacity-50',
    render: () => (
      <div className="relative h-52">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-px w-full bg-line" />
          ))}
        </div>
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-24 w-full"
        >
          <path
            d="M0,34 L14,27 L28,30 L42,19 L56,23 L70,11 L84,17 L100,7 L100,40 L0,40 Z"
            fill="rgb(var(--line))"
          />
        </svg>
      </div>
    ),
  },
  // The donut, without its arcs. Text over a ring reads as a mistake, so this
  // one only tucks under it.
  ring: {
    place: '-mt-3',
    render: () => (
      <div className="flex justify-center">
        <span className="h-24 w-24 rounded-full border-[9px] border-line" />
      </div>
    ),
  },
}
