import { useEffect } from 'react'
import { toast } from './toast'

/**
 * Announcing a save that already has a notice beside the form.
 *
 * The settings pages say "Organization saved." under the fields, and that is
 * the right thing to keep: it is anchored to what was saved. But the Save
 * button sits at the bottom of a long card, and on a tall page that line can
 * land below the fold — so the confirmation appears somewhere the eye is not.
 * The toast is the announcement; the inline line stays as the record.
 *
 * Firing twice is not a worry: StrictMode double-invokes these in development,
 * and the store folds an identical message back into the one already showing.
 */

/**
 * Pass the same `succeeded` boolean the inline notice is rendered from. It goes
 * false for the duration of the next submit, so a second save announces itself
 * again rather than staying silent.
 */
export function useSavedToast(succeeded: boolean, message: string): void {
  useEffect(() => {
    if (!succeeded) return
    toast.success(message)
  }, [succeeded, message])
}

/**
 * The same for a refusal, so a failed save is never quieter than a successful
 * one — which is the wrong way round, and is what happens if only the happy
 * path announces itself.
 *
 * Pass the API's own message, gated on the request having settled:
 * `useFailureToast(save.state === 'idle' ? error : null)`. A fetcher keeps the
 * previous result while the next one is in flight, so without that gate a
 * repeat of the same failure would never re-announce; with it, the value falls
 * to null for the duration of the submit and comes back.
 *
 * Not used for the slide-over panels. Those stay open on a refusal with the
 * reason at the top of the form, so the message is already where the eye is;
 * they toast only their successes, which is when the panel closes and takes the
 * evidence with it.
 */
export function useFailureToast(message: string | null | undefined): void {
  useEffect(() => {
    if (!message) return
    // Verbatim: a 409 is written by the API for the person reading it.
    toast.error(message)
  }, [message])
}
