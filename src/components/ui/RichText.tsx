import { cn } from '@/lib/cn'
import { looksLikeHtml } from './looksLikeHtml'

/**
 * An event description, rendered.
 *
 * The value is HTML the API sanitised on write (`rich-text.ts` in eventa-api),
 * which is the only reason it can be set as markup here. Nothing on this side
 * cleans it, and nothing on this side should: a second, client-side pass would
 * imply the server's is optional, and anything can call the API directly.
 *
 * Descriptions written before the editor stored formatting are PLAIN TEXT with
 * real newlines. Handed to `dangerouslySetInnerHTML` those newlines collapse
 * and the paragraphs a organizer typed disappear, so text is detected and given
 * `whitespace-pre-line` instead. It is not a security fallback — the safety is
 * the server's — only a formatting one.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  if (!looksLikeHtml(html)) {
    // `whitespace-pre-line` ONLY here. On the wrapper it would also render the
    // newlines the editor leaves between tags, which doubles every gap in a
    // formatted description.
    return <p className={cn('richtext whitespace-pre-line', className)}>{html}</p>
  }
  return (
    <div
      className={cn('richtext', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
