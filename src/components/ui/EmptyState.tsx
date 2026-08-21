import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/* The two things a page shows instead of content, ported from the kit's
   `.empty` block (styles/components.css).

   The distinction matters more than the styling. **First run** means the
   workspace has no data yet, so the copy explains what will fill the page and
   offers the one real next step — often on an *earlier* screen, because
   attendees arrive by publishing an event, not by an "add attendee" button.
   **No results** means the data exists and a filter hid it, so the only action
   is to put the filter back; suggesting "create one" there is a lie.

   Never render one of these with a "No X" line and no way forward — that is the
   dead card this component exists to replace. */

export interface EmptyAction {
  label: string
  /** Internal route. Omit when `onClick` drives it instead. */
  to?: string
  onClick?: () => void
  icon?: string
}

interface EmptyStateProps {
  /** Hugeicons slug — keep it exact, a wrong one renders tofu. */
  icon: string
  /** Omit inside a panel that already has a heading. */
  title?: string
  /** One or two sentences: why it is empty, and what will fill it. */
  children: ReactNode
  /** The first action is the primary one. */
  actions?: EmptyAction[]
  /** Compact padding for a table cell or an already-padded card. */
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon,
  title,
  children,
  actions = [],
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('empty', compact && 'empty-sm', className)}>
      <span className="empty-icon">
        {/* Sized explicitly because `Icon` writes an inline `font-size`, which
            beats the `font-size` on `.empty-icon` — the kit sets it in CSS and
            lets the glyph inherit, so without this the icon renders at the
            16px default inside a 56px tile. These two are the kit's values. */}
        <Icon name={icon} size={compact ? 20 : 26} />
      </span>
      {title && <h3 className="empty-title">{title}</h3>}
      <p className="empty-text">{children}</p>
      {actions.length > 0 && (
        <div className="empty-actions">
          {actions.map((a, i) => (
            <EmptyActionButton key={a.label} action={a} primary={i === 0} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyActionButton({ action, primary }: { action: EmptyAction; primary: boolean }) {
  const className = cn('btn btn-sm', primary ? 'btn-primary' : 'btn-ghost')
  const body = (
    <>
      {action.icon && <Icon name={action.icon} size={15} />}
      {action.label}
    </>
  )

  if (action.to) {
    return (
      <Link to={action.to} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {body}
    </button>
  )
}

/**
 * The no-results variant. Always compact, always offers the way back, and its
 * copy deliberately never suggests creating anything.
 *
 * Only render this when something is genuinely narrowing the list — see
 * `emptyListReason`. Shown for a page that merely ran off the end, it blames
 * filters the organizer never set and the button clears nothing.
 */
export function NoResults({
  noun,
  onClear,
  children,
}: {
  /** Plural, in the page's own words: "registrations", "VAT periods". */
  noun: string
  onClear?: () => void
  /** Overrides the default sentence when the page can say something better. */
  children?: ReactNode
}) {
  return (
    <EmptyState
      compact
      icon="hgi-search-01"
      title={`No ${noun} match`}
      actions={onClear ? [{ label: 'Clear filters', onClick: onClear, icon: 'hgi-refresh' }] : []}
    >
      {children ??
        `Nothing matches the current search and filters. Try a different spelling, or widen them.`}
    </EmptyState>
  )
}

/**
 * The third empty state: this page number is past the end of the list.
 *
 * It happens without anyone filtering anything — delete the last row on page 3
 * and you are standing in it — so neither of the other two states can explain
 * it honestly. The rows exist; they are just further back.
 */
export function PastEnd({
  noun,
  onFirstPage,
  children,
}: {
  /** Plural, in the page's own words. */
  noun: string
  onFirstPage?: () => void
  children?: ReactNode
}) {
  return (
    <EmptyState
      compact
      icon="hgi-arrow-turn-backward"
      title="Nothing on this page"
      actions={
        onFirstPage
          ? [{ label: 'Back to the first page', onClick: onFirstPage, icon: 'hgi-arrow-left-01' }]
          : []
      }
    >
      {children ?? `This page is past the end of the ${noun}. They are still there — start again
        from the beginning.`}
    </EmptyState>
  )
}
