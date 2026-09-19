import { useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import {
  Button,
  Card,
  EventPicker,
  HeaderUser,
  Hint,
  Icon,
  Input,
  Label,
  Modal,
  PageFooter,
  PageHeader,
  PanelEmptyPreview,
  PastEnd,
  Paginator,
  Panel,
  Textarea,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import { useSavedToast } from '@/lib/useSavedToast'
import type { AnnouncementsData } from '../announcements.routes'

/**
 * Broadcasts sent to an event's attendees (US-MSG-04). Ported from
 * `eventa-ui-kit/admin/messaging-announcements.html`.
 *
 * Four of the composer's controls are gone, because the send they configure
 * does not exist:
 *
 * - **Audience.** The broadcast goes to an event's CONFIRMED attendees. There
 *   is no waitlist domain and no checked-in-only send, so a picker offering
 *   them would choose between one real option and two imaginary ones.
 * - **Channel.** Email only — there is no SMS provider in the product.
 * - **Schedule.** Nothing in Eventa can send later. A date field that silently
 *   sent immediately would be the worst kind of control.
 * - **"All events".** The send takes one event; a broadcast to every attendee
 *   in the workspace is a different feature with different consent questions.
 *
 * The list drops the kit's status badge for a related reason: every row in it
 * has been sent, so a column reading "Sent" on every line says nothing. What it
 * deliberately does NOT say is "Delivered" — this app knows the broadcast was
 * queued, not that it arrived. That is US-MSG-06.
 */
export default function MessagingAnnouncementsPage() {
  const data = useLoaderData() as AnnouncementsData
  const panel = useDisclosure()
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="One-off emails sent to everyone registered for an event."
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
        <h2 className="text-[15px] font-bold tracking-tight">Sent announcements</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          Newest first. An announcement cannot be unsent.
        </p>

        {data.rows.length ? (
          <div className="mt-1">
            {data.rows.map((row, i) => (
              <div
                key={row.id}
                className={
                  i > 0
                    ? 'flex items-start gap-3 border-t border-line py-3'
                    : 'flex items-start gap-3 py-3'
                }
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name="hgi-megaphone-01" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{row.subject}</p>
                  <p className="truncate text-[12px] text-muted">{row.body}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted tnum">{row.meta}</p>
                </div>
              </div>
            ))}
          </div>
        ) : emptyReason === 'past-end' ? (
          /* The announcements exist, they are further back. A ghost of rows
             here would claim they belong on this page. */
          <PastEnd noun="announcements" onFirstPage={clear} />
        ) : emptyReason === 'no-results' ? (
          <PanelEmptyPreview
            preview="announcements"
            description="Nothing has been sent to this event’s attendees. Pick another event, or send the first one."
            action={{ label: 'All events', icon: 'hgi-refresh', onClick: clear }}
          >
            No announcements for this event.
          </PanelEmptyPreview>
        ) : (
          <PanelEmptyPreview
            preview="announcements"
            description="A one-off email to everyone registered for an event — a venue change, a schedule update, a thank-you."
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
    </>
  )
}

function ComposePanel({
  open,
  onClose,
  events,
}: {
  open: boolean
  onClose: () => void
  events: AnnouncementsData['events']
}) {
  const send = useFetcher<ActionResult>()
  const [eventId, setEventId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [asking, setAsking] = useState(false)

  const sending = send.state !== 'idle'
  const ready = Boolean(eventId && subject.trim() && message.trim())
  const chosen = events.find((event) => event.id === eventId)

  /**
   * The panel stays open until the API says it went. Closing on submit would
   * put a refusal — a 403, a broken connection — behind a panel nobody can see,
   * and leave the organizer believing they had sent it.
   */
  useSavedToast(send.state === 'idle' && send.data?.ok === true, 'Announcement sent.', () => {
    setSubject('')
    setMessage('')
    onClose()
  })

  const confirmSend = () => {
    setAsking(false)
    send.submit({ eventId, subject, message }, { method: 'post' })
  }

  return (
    <>
      <Panel
        open={open}
        onClose={onClose}
        title="Send announcement"
        subtitle="Goes to everyone registered for the event you pick."
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={!ready || sending}
              onClick={() => setAsking(true)}
            >
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {send.data?.ok === false && (
            <p role="alert" className="text-[13px] text-red-500">
              {send.data.error}
            </p>
          )}

          <div>
            <Label>Event</Label>
            <div className="relative">
              <EventPicker
                value={eventId}
                allValue=""
                allLabel="Choose an event"
                options={events}
                onChange={setEventId}
              />
            </div>
          </div>

          <div>
            <Label>Subject</Label>
            <Input
              type="text"
              maxLength={150}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Venue change for Tech Summit 2026"
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              rows={7}
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement…"
            />
            <Hint>
              Sent as an email to everyone with a confirmed registration, in the order they
              registered. It cannot be unsent.
            </Hint>
          </div>
        </div>
      </Panel>

      {/* The API asks for an explicit confirmation before it will send, and this
          is what makes that mean something. Emailing every attendee of an event
          is not undoable, so the event is named back to the organizer. */}
      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title="Send this announcement?"
        footer={
          <>
            <Button variant="soft" onClick={() => setAsking(false)}>
              Keep editing
            </Button>
            <Button variant="primary" onClick={confirmSend}>
              Send it
            </Button>
          </>
        }
      >
        Everyone registered for {chosen?.name ?? 'this event'} will be emailed “{subject}”. It
        cannot be unsent.
      </Modal>
    </>
  )
}
