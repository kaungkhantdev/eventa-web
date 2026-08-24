import { mapEmbedFor, mapLinkFor, type VenueParts } from '@/lib/mapLink'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/**
 * Where the venue is, as a map.
 *
 * Shared rather than per-feature: the organizer checks it while editing, and
 * the attendee reads it on the event page and in the portal. One component, so
 * all three show the same place from the same fields.
 *
 * Renders nothing when there is nothing to show — an online event, or a venue
 * nobody has named yet. A map of the empty string is a pin in the Gulf of
 * Guinea, which is worse than no map.
 */
export function VenueMap({
  venue,
  title = 'Venue location',
  className,
}: {
  venue: VenueParts
  /** Names the frame for a screen reader; every iframe needs one. */
  title?: string
  className?: string
}) {
  const embed = mapEmbedFor(venue, import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY)
  const link = mapLinkFor(venue)
  if (!embed || !link) return null

  return (
    <div className={cn('overflow-hidden rounded-xl border border-hair', className)}>
      <iframe
        src={embed}
        title={title}
        // Deferred until it is nearly on screen. The map is supporting detail,
        // not the reason anybody opened the page, and an iframe that loads
        // eagerly costs the first paint of every event page that has a venue.
        loading="lazy"
        // The frame is a third party: deny it the ambient permissions it would
        // otherwise inherit, and do not leak the full URL of the page it sits
        // on — an admin path can name a workspace.
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="block h-[220px] w-full border-0"
      />
      <a
        href={link}
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center justify-center gap-1.5 border-t border-hair bg-surface py-2 text-[12px] font-semibold text-brand hover:underline"
      >
        <Icon name="hgi-navigation-03" size={13} />
        Get directions
      </a>
    </div>
  )
}
