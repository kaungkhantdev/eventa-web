import { toast as sonnerToast } from 'sonner'
import { Toast, type ToastAction, type ToastTone } from '@/components/ui/Toast'

/**
 * Transient notifications — the corner-of-the-screen kind that confirm an
 * action landed, then go away. Sonner does the stacking, timing and animation;
 * this decides what the app asks of it, and `<Toast>` draws the result.
 *
 * A toast never replaces the inline `role="alert"` text next to a form. That
 * text is the *record*: it stays until the problem is fixed, and it sits where
 * the mistake is. The toast is the *announcement*, for when what changed is
 * somewhere the eye is not — a save inside a slide-over that then closes, or a
 * Save button below the fold on a long settings card. Both, not either.
 *
 * Why a wrapper rather than importing `sonner` at every call site: the repeat
 * rule below has to hold everywhere, and one import that a couple of dozen
 * files already read is cheaper to keep honest than a couple of dozen chances
 * to forget an option.
 */

export type { ToastAction, ToastTone }

/**
 * How long each kind stays. An error outlives a success because it has to be
 * read rather than merely noticed, and because it is often the only thing on
 * screen explaining why an action appeared to do nothing.
 */
export const TOAST_DURATION_MS: Readonly<Record<ToastTone, number>> = {
  success: 4_000,
  info: 5_000,
  warning: 6_000,
  error: 8_000,
}

/**
 * What makes two announcements "the same news".
 *
 * Sonner replaces a toast already showing under the same id instead of stacking
 * a second one, so this is the whole repeat rule. It matters in practice rather
 * than in theory: StrictMode double-invokes every effect that raises one of
 * these in development, fetchers revalidate, and an impatient click sends the
 * same failing request twice.
 *
 * The tone is part of the key because the same words in a different tone are
 * different news — "Done" as a success and "Done" as a failure are not one
 * message arriving twice.
 */
export function toastKey(tone: ToastTone, message: string): string {
  return `${tone}:${message}`
}

/** Everything optional a caller may want to say beyond the sentence itself. */
export interface ToastOptions {
  /** Overrides the tone's own word — "Success", "Error" — as the title. */
  title?: string
  /** The one thing worth doing about it, offered beside Dismiss. */
  action?: ToastAction
}

function show(tone: ToastTone, message: string, options: ToastOptions = {}): string | number {
  return sonnerToast.custom(
    (id) => (
      <Toast
        id={id}
        tone={tone}
        description={message}
        title={options.title}
        action={options.action}
      />
    ),
    { id: toastKey(tone, message), duration: TOAST_DURATION_MS[tone] },
  )
}

export const toast = {
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  warning: (message: string, options?: ToastOptions) => show('warning', message, options),
  info: (message: string, options?: ToastOptions) => show('info', message, options),
  dismiss: (id: string | number) => sonnerToast.dismiss(id),
}
