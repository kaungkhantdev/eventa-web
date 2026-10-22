import type { BodySegment } from '../notifications.mapper'

/**
 * A notification's sentence, with the parts the mapper marked bold in `<b>`.
 * Shared by the feed page and the header's notification bell.
 */
export function NotificationBody({ segments }: { segments: BodySegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.bold ? (
          <b key={index} className="font-semibold text-ink">
            {segment.text}
          </b>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}
