import { toast as sonnerToast } from 'sonner'
import { Icon } from './Icon'
import { cn } from '@/lib/cn'

/**
 * A toast, as this app draws one.
 *
 * Headless: sonner keeps the stacking, the swipe and the enter/exit animation,
 * and everything inside the card is ours. That is what lets it use the app's
 * own semantic tokens — `bg-surface`, `text-ink`, `text-muted` flip with the
 * `dark` class by themselves, so the card is light on a light page and dark on
 * a dark one without a theme prop to keep in step with the header's toggle, and
 * without a second copy of the palette to drift.
 *
 * Presentational only: it takes what to say, an optional thing to do about it,
 * and an id to close itself with. It decides nothing.
 */

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

/**
 * Tone → the word it leads with, and the mark beside it.
 *
 * Each tint carries its own dark variant: the 400 weights are legible on a dark
 * surface and washed out on a white one, so the light theme takes the 600s.
 * `text-brand` is a token and already correct in both.
 */
const LOOKS: Record<ToastTone, { title: string; icon: string; tint: string }> = {
  success: { title: 'Success', icon: 'hgi-checkmark-circle-02', tint: 'text-brand' },
  error: { title: 'Error', icon: 'hgi-alert-02', tint: 'text-red-600 dark:text-red-400' },
  warning: { title: 'Warning', icon: 'hgi-alert-01', tint: 'text-amber-600 dark:text-amber-400' },
  info: { title: 'Info', icon: 'hgi-alert-circle', tint: 'text-blue-600 dark:text-blue-400' },
}

export interface ToastProps {
  id: string | number
  tone: ToastTone
  /** The sentence under the title — what actually happened. */
  description: string
  /** Overrides the tone's own word, for the rare case it is not enough. */
  title?: string
  /** The one thing worth doing about it, beside Dismiss. */
  action?: ToastAction
}

export function Toast({ id, tone, description, title, action }: ToastProps) {
  const look = LOOKS[tone]
  const close = () => sonnerToast.dismiss(id)

  return (
    <div
      className={cn(
        // A custom toast is `data-styled="false"`, so sonner applies none of its
        // own sizing and the card would otherwise shrink to its text. `--width`
        // is sonner's own, set on the viewport and inherited, so this stays
        // sonner's width even if the Toaster is given a different one.
        'flex w-[var(--width)] max-w-[calc(100vw-2rem)] gap-3',
        'rounded-xl bg-surface p-4 shadow-xl ring-1 ring-black/5 dark:ring-white/10',
      )}
    >
      {/* No optical nudge: it and the close button both sit on the card's own
          16px, so the four gaps around the content are the one number. */}
      <Icon name={look.icon} size={19} className={cn('h-fit shrink-0 leading-none', look.tint)} />

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold tracking-tight text-ink">{title ?? look.title}</p>
        <p className="mt-1 text-[13px] leading-snug text-muted">{description}</p>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={close}
            className="cursor-pointer text-[13px] font-medium text-muted hover:text-ink"
          >
            Dismiss
          </button>
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick()
                close()
              }}
              className="cursor-pointer text-[13px] font-medium text-ink hover:text-muted"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>

      {/* A flex item, not an absolute corner: the card's own `p-4` is then the
          only thing setting its distance from the edges, so the gap above it
          and the gap beside it cannot drift apart. The hit area is grown with a
          pseudo-element rather than padding, because padding would push the
          glyph back off that shared 16px and reintroduce the mismatch. */}
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className={cn(
          'relative h-fit shrink-0 cursor-pointer self-start leading-none',
          'text-muted hover:text-ink',
          "after:absolute after:-inset-2 after:content-['']",
        )}
      >
        <Icon name="hgi-cancel-01" size={14} />
      </button>
    </div>
  )
}
