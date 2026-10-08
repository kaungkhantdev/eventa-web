import { useState } from 'react'
import { useFetcher } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import {
  Button,
  EventPicker,
  FieldError,
  Hint,
  Input,
  Label,
  Modal,
  Panel,
  Segmented,
  Textarea,
} from '@/components/ui'
import type { EventOption } from '@/features/events/eventOptions'
import { useSavedToast } from '@/lib/useSavedToast'
import type { DeliveryMode } from '../announcements.routes'
import { unattachedError } from '../refusal'

/** The kit's "Delivery" control, in its order. */
const DELIVERY: { value: DeliveryMode; label: string }[] = [
  { value: 'now', label: 'Send now' },
  { value: 'schedule', label: 'Schedule' },
]

/** What the organizer is told once the API has it, by what they asked for. */
const DONE: Record<DeliveryMode, string> = {
  now: 'Announcement sent.',
  schedule: 'Announcement scheduled.',
}

interface Draft {
  eventId: string
  subject: string
  message: string
  mode: DeliveryMode
  /** The `datetime-local` value, on the Bangkok clock. */
  sendAt: string
}

const EMPTY: Draft = { eventId: '', subject: '', message: '', mode: 'now', sendAt: '' }

/**
 * Composing a broadcast — to go now, or at a Bangkok time (US-MSG-04). Ported
 * from the kit's `#announce-panel`, including its Delivery segmented control
 * and "Send date & time" field; the audience and channel controls stay gone
 * (see the page).
 *
 * The panel stays open until the API says it has it. Closing on submit would
 * put a refusal — a time too soon, a 403, a broken connection — behind a panel
 * nobody can see, and leave the organizer believing it had gone.
 */
export function ComposePanel({
  open,
  onClose,
  events,
}: {
  open: boolean
  onClose: () => void
  events: EventOption[]
}) {
  const send = useFetcher<ActionResult>()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [asking, setAsking] = useState(false)
  // What was submitted, not what the toggle says now: the toast is about the
  // request that succeeded, and must not change if the toggle is touched after.
  const [submitted, setSubmitted] = useState<DeliveryMode>('now')

  const change = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const refused = send.data?.ok === false ? send.data : null
  const banner = unattachedError(refused)

  useSavedToast(send.state === 'idle' && send.data?.ok === true, DONE[submitted], () => {
    setDraft(EMPTY)
    onClose()
  })

  const confirm = () => {
    setAsking(false)
    setSubmitted(draft.mode)
    send.submit({ intent: 'send', ...draft }, { method: 'post' })
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
              disabled={!isReady(draft) || send.state !== 'idle'}
              onClick={() => setAsking(true)}
            >
              {draft.mode === 'schedule' ? 'Schedule' : 'Send'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {banner && (
            <p role="alert" className="text-[13px] text-red-500">
              {banner}
            </p>
          )}
          <MessageFields draft={draft} events={events} onChange={change} />
          <DeliveryFields draft={draft} error={refused?.fieldErrors?.sendAt} onChange={change} />
        </div>
      </Panel>

      <ConfirmSend
        open={asking}
        draft={draft}
        eventName={events.find((event) => event.id === draft.eventId)?.name}
        onKeepEditing={() => setAsking(false)}
        onConfirm={confirm}
      />
    </>
  )
}

/**
 * Whether the form has what a send needs. Tidying only: whether a time is far
 * enough ahead is the API's to say, not the browser clock's.
 */
function isReady(draft: Draft): boolean {
  const written = Boolean(draft.eventId && draft.subject.trim() && draft.message.trim())
  return written && (draft.mode === 'now' || Boolean(draft.sendAt))
}

interface FieldsProps {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
}

function MessageFields({ draft, events, onChange }: FieldsProps & { events: EventOption[] }) {
  return (
    <>
      <div>
        <Label>Event</Label>
        <div className="relative">
          <EventPicker
            value={draft.eventId}
            allValue=""
            allLabel="Choose an event"
            options={events}
            onChange={(eventId) => onChange({ eventId })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="announce-subject">Subject</Label>
        <Input
          id="announce-subject"
          type="text"
          maxLength={150}
          value={draft.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="e.g. Venue change for Tech Summit 2026"
        />
      </div>

      <div>
        <Label htmlFor="announce-message">Message</Label>
        <Textarea
          id="announce-message"
          rows={7}
          maxLength={5000}
          value={draft.message}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Write your announcement…"
        />
        <Hint>
          Sent as an email to everyone with a confirmed registration, in the order they registered.
          It cannot be unsent once it has gone.
        </Hint>
      </div>
    </>
  )
}

/** The kit's Delivery toggle, and the date field it reveals. */
function DeliveryFields({ draft, error, onChange }: FieldsProps & { error?: string }) {
  return (
    <>
      <div>
        <Label>Delivery</Label>
        <Segmented
          items={DELIVERY}
          value={draft.mode}
          onChange={(mode) => onChange({ mode })}
          // The kit's `segmented w-full` with `flex-1` on each button.
          className="w-full [&>button]:flex-1"
        />
      </div>
      {draft.mode === 'schedule' && (
        <div>
          <Label htmlFor="announce-send-at">Send date &amp; time</Label>
          <Input
            id="announce-send-at"
            type="datetime-local"
            value={draft.sendAt}
            onChange={(e) => onChange({ sendAt: e.target.value })}
            aria-describedby={error ? 'announce-send-at-error' : 'announce-send-at-hint'}
          />
          <FieldError id="announce-send-at-error" message={error} />
          <Hint id="announce-send-at-hint">
            Bangkok time. Its audience is whoever is registered when it goes, and you can cancel or
            move it until then.
          </Hint>
        </div>
      )}
    </>
  )
}

/**
 * The API asks for an explicit confirmation before it will send, and this is
 * what makes that mean something. The event — and, for a scheduled one, the
 * Bangkok time — is named back to the organizer.
 */
function ConfirmSend({
  open,
  draft,
  eventName,
  onKeepEditing,
  onConfirm,
}: {
  open: boolean
  draft: Draft
  eventName: string | undefined
  onKeepEditing: () => void
  onConfirm: () => void
}) {
  const scheduling = draft.mode === 'schedule'
  const who = `Everyone registered for ${eventName ?? 'this event'}`
  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      title={scheduling ? 'Schedule this announcement?' : 'Send this announcement?'}
      footer={
        <>
          <Button variant="soft" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {scheduling ? 'Schedule it' : 'Send it'}
          </Button>
        </>
      }
    >
      {scheduling
        ? `${who} at ${readableLocal(draft.sendAt)} Bangkok time will be emailed “${draft.subject}”. You can cancel or move it until then.`
        : `${who} will be emailed “${draft.subject}”. It cannot be unsent.`}
    </Modal>
  )
}

/** "2026-08-05T10:00" → "2026-08-05 10:00": the field's own wall time, no zone maths. */
function readableLocal(value: string): string {
  return value.replace('T', ' ')
}
