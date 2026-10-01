import type { ReactNode } from 'react'
import { Link, useRevalidator } from 'react-router'
import { cn } from '@/lib/cn'

/**
 * The bits every home panel shares: its heading, and what it shows when the
 * read never arrived.
 *
 * US-DASH-13 asks that one panel failing leaves the rest working, so a panel
 * says so in place and offers the retry rather than the page dying around it.
 *
 * The other thing a panel shows instead of content — the still preview of what
 * will fill it — is `PanelEmptyPreview` in `@/components/ui`: the reports
 * screens draw the same moment, and one look for it is the point.
 */

interface SectionHeaderProps {
  title: string
  badge?: ReactNode
  link?: { to: string; label: string }
}

export function SectionHeader({ title, badge, link }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
        {badge}
      </div>
      {link && (
        <Link to={link.to} className="text-[12px] font-semibold text-brand hover:underline">
          {link.label}
        </Link>
      )}
    </div>
  )
}

/** The count chip beside a heading. `tone` is the kit's two variants. */
export function CountBadge({ value, tone }: { value: number; tone: 'brand' | 'plain' }) {
  return (
    <span
      className={cn(
        'grid h-5 min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-semibold',
        tone === 'brand'
          ? 'bg-brand-soft text-brand-dark dark:text-brand'
          : 'bg-line text-muted',
      )}
    >
      {value}
    </span>
  )
}

export function PanelUnavailable({ error }: { error: string }) {
  const { revalidate, state } = useRevalidator()

  return (
    <div className="mt-3.5 rounded-xl bg-canvas px-4 py-6 text-center">
      <p role="alert" className="text-[13px] text-muted">
        {error}
      </p>
      <button
        type="button"
        onClick={() => void revalidate()}
        disabled={state === 'loading'}
        className="mt-2 text-[13px] font-semibold text-brand hover:text-brand-dark disabled:opacity-60"
      >
        Try again
      </button>
    </div>
  )
}
