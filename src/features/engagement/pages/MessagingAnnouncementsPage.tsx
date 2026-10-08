import { useLoaderData } from 'react-router'
import {
  Button,
  Card,
  EventPicker,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  PanelEmptyPreview,
  PastEnd,
  Paginator,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import type { AnnouncementsData } from '../announcements.routes'
import type { AnnouncementRow } from '../announcements.mapper'
import { AnnouncementListItem } from '../components/AnnouncementListItem'
import { CancelAnnouncementModal } from '../components/CancelAnnouncementModal'
import { ComposePanel } from '../components/ComposePanel'
import { RescheduleModal } from '../components/RescheduleModal'
import { useRowDialog } from '../useRowDialog'

/**
 * Broadcasts sent to an event's attendees, and the ones still to go
 * (US-MSG-04/05). Ported from `eventa-ui-kit/admin/messaging-announcements.html`.
 *
 * Two of the composer's controls are gone, because the send they configure
 * does not exist:
 *
 * - **Audience.** The broadcast goes to an event's CONFIRMED attendees. There
 *   is no waitlist domain and no checked-in-only send, so a picker offering
 *   them would choose between one real option and two imaginary ones.
 * - **Channel.** Email only — there is no SMS provider in the product.
 * - **"All events".** The send takes one event; a broadcast to every attendee
 *   in the workspace is a different feature with different consent questions.
 *
 * **Schedule** is back: an announcement can be given a Bangkok time, and
 * cancelled or moved until it goes. The list carries the kit's status badge
 * again, because the rows no longer all say the same thing. What it
 * deliberately does NOT say is "Delivered" — this app knows the broadcast was
 * queued, not that it arrived. That is US-MSG-06.
 *
 * Reschedule and Cancel have no markup in the kit, so they are assembled from
 * its own primitives.
 */
export default function MessagingAnnouncementsPage() {
  const data = useLoaderData() as AnnouncementsData
  const panel = useDisclosure()
  const moving = useRowDialog<AnnouncementRow>()
  const cancelling = useRowDialog<AnnouncementRow>()
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="One-off emails to everyone registered for an event — now, or at a time you pick."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
              <Icon name="hgi-megaphone-01" />
              <span className="hidden sm:inline">Send announcement</span>
              <span className="sm:hidden">Send</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      <div className="mb-3 w-full sm:w-52">
        <EventPicker
          value={params.get('eventId') ?? ''}
          // '' rather than a label, so choosing "All events" drops `?eventId=`
          // instead of sending a name the API cannot match.
          allValue=""
          options={data.events}
          onChange={(eventId) => set({ eventId, page: null })}
          className="h-10 w-full border-0 bg-surface text-[14px] font-semibold"
        />
      </div>

      <Card className="p-4">
        <h2 className="text-[15px] font-bold tracking-tight">Sent &amp; scheduled</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          What is still to go, then what has gone. A sent announcement cannot be unsent.
        </p>

        {data.rows.length ? (
          <div className="mt-1">
            {data.rows.map((row, i) => (
              <AnnouncementListItem
                key={row.id}
                row={row}
                first={i === 0}
                onReschedule={moving.show}
                onCancel={cancelling.show}
              />
            ))}
          </div>
        ) : emptyReason === 'past-end' ? (
          /* The announcements exist, they are further back. A ghost of rows
             here would claim they belong on this page. */
          <PastEnd noun="announcements" onFirstPage={clear} />
        ) : emptyReason === 'no-results' ? (
          <PanelEmptyPreview
            preview="announcements"
            description="Nothing has been sent to this event’s attendees, and nothing is scheduled. Pick another event, or send the first one."
            action={{ label: 'All events', icon: 'hgi-refresh', onClick: clear }}
          >
            No announcements for this event.
          </PanelEmptyPreview>
        ) : (
          <PanelEmptyPreview
            preview="announcements"
            description="A one-off email to everyone registered for an event — a venue change, a schedule update, a thank-you. Send it now or schedule it."
            action={{
              label: 'Send announcement',
              icon: 'hgi-megaphone-01',
              onClick: panel.onOpen,
            }}
          >
            Nothing sent yet.
          </PanelEmptyPreview>
        )}

        <Paginator
          {...data.window}
          noun="announcements"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </Card>

      <PageFooter />

      <ComposePanel open={panel.open} onClose={panel.onClose} events={data.events} />
      <RescheduleModal dialog={moving} />
      <CancelAnnouncementModal dialog={cancelling} />
    </>
  )
}
