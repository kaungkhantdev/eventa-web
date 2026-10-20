import { useState } from 'react'
import { useFetcher } from 'react-router'
import {
  Button,
  EventPicker,
  Hint,
  Icon,
  Input,
  Label,
  Panel,
  Select,
  Textarea,
} from '@/components/ui'
import { toast } from '@/lib/toast'
import { useSaveSettled } from '@/lib/useSaveSettled'
import type { ActionResult } from '@/app/loaders'
import { MEETING_MODES, MEETING_TYPES } from '../meetings.routes'
import { initialMeetingMode, meetingModeChoice, meetingSaveLabel, promisesMeetLink, scheduleNote, type MeetingModeChoice } from '../meetings.presentation'
import type { MeetingDraft } from '../meetings.types'
import { ALL_EVENTS, FORM_ID, MEETING_MODE_PROMPT, NO_MODE } from '@/lib/constants/meetings.constants'

/** Schedule or reschedule a meeting (US-MTG-01/02). */

interface MeetingPanelProps {
  open: boolean
  onClose: () => void
  /** The meeting being changed, or null for a new one. */
  editing: MeetingDraft | null
  events: { id: string; name: string }[]
  onCancelMeeting?: () => void
  /**
   * Whether the workspace's Google Calendar is connected (US-MTG-08). Without
   * it nothing is emailed and no Meet link is made, so the panel must not
   * promise either.
   */
  calendarConnected: boolean
}

export function MeetingPanel({
  open,
  onClose,
  editing,
  events,
  onCancelMeeting,
  calendarConnected,
}: MeetingPanelProps) {
  const fetcher = useFetcher<ActionResult>()
  const saving = fetcher.state !== 'idle'
  // Reported once, as the save comes back — not read off the fetcher, which
  // keeps the answer: "idle and ok" stayed true after a schedule, and closed
  // the panel again the instant Edit opened it.
  const { refusal: error, opening } = useSaveSettled(fetcher, {
    open,
    onSaved: () => {
      // Matches the button that was pressed: scheduling sent the invites out,
      // rescheduling only moved a meeting that already existed.
      toast.success(editing ? 'Meeting saved.' : 'Meeting scheduled.')
      onClose()
    },
  })

  // Re-seeded from the meeting being edited each time the panel opens, so a
  // reschedule does not inherit the previous one's event or mode. Adjusted
  // during render rather than in an effect, so both are right on the first
  // paint. The mode is held here, not left to the box, because the Meet-link
  // hint depends on it.
  const [eventId, setEventId] = useState(editing?.eventId ?? '')
  const [mode, setMode] = useState(initialMeetingMode(editing))
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setEventId(editing?.eventId ?? '')
      setMode(initialMeetingMode(editing))
    }
  }

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={editing ? 'Reschedule meeting' : 'Schedule meeting'}
      footer={
        <>
          {editing && onCancelMeeting ? (
            <Button variant="danger" className="flex-1" onClick={onCancelMeeting} disabled={saving}>
              Cancel meeting
            </Button>
          ) : (
            <Button variant="soft" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button variant="primary" className="flex-1" type="submit" form={FORM_ID} disabled={saving}>
            {!saving && !editing && <Icon name="hgi-calendar-add-01" size={16} />}
            {meetingSaveLabel(Boolean(editing), saving)}
          </Button>
        </>
      }
    >
      {/* Rebuilt on every opening: the boxes are uncontrolled, and once typed
          into they ignore `defaultValue` — a second Schedule would otherwise
          open on the last meeting's title and guest. */}
      <fetcher.Form id={FORM_ID} key={opening} method="post" className="space-y-4">
        <input type="hidden" name="intent" value={editing ? 'reschedule' : 'schedule'} />
        {editing && (
          <>
            <input type="hidden" name="meetingId" value={editing.id} />
            <input type="hidden" name="version" value={editing.version} />
          </>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="meeting-title">Title</Label>
          <Input
            id="meeting-title"
            name="title"
            type="text"
            required
            defaultValue={editing?.title ?? ''}
            placeholder="e.g. Seating plan approval"
          />
        </div>

        <div>
          <Label htmlFor="meeting-date">Date</Label>
          <Input
            id="meeting-date"
            name="date"
            type="date"
            required
            defaultValue={editing?.date ?? ''}
          />
          <Hint>Bangkok calendar day.</Hint>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="meeting-start">Starts</Label>
            <Input
              id="meeting-start"
              name="startTime"
              type="time"
              required
              defaultValue={editing?.startTime ?? '10:00'}
            />
          </div>
          <div>
            <Label htmlFor="meeting-end">Ends</Label>
            <Input
              id="meeting-end"
              name="endTime"
              type="time"
              required
              defaultValue={editing?.endTime ?? '10:30'}
            />
          </div>
        </div>

        {/* Type and Mode each take a full row: half a row clipped "Choose how
            you'll meet" and "Video call (Google Meet)" on a phone, and a native
            select cuts its text off without an ellipsis. */}
        <div>
          <Label htmlFor="meeting-type">Type</Label>
          <Select id="meeting-type" name="type" defaultValue={editing?.type ?? 'Internal'}>
            {MEETING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="meeting-mode">Mode</Label>
          {/* Required, with nothing chosen for a new meeting (US-MTG-03): a
              preselected Video scheduled video calls nobody had picked. */}
          <Select
            id="meeting-mode"
            name="mode"
            required
            value={mode}
            onChange={(event) => setMode(event.target.value as MeetingModeChoice)}
          >
            <option value={NO_MODE} disabled>
              {MEETING_MODE_PROMPT}
            </option>
            {MEETING_MODES.map((choice) => (
              <option key={choice} value={choice}>
                {meetingModeChoice(choice)}
              </option>
            ))}
          </Select>
          {promisesMeetLink(mode, calendarConnected) && (
            <Hint>A Meet link is generated automatically.</Hint>
          )}
        </div>

        <div>
          <Label htmlFor="meeting-person">Who you are meeting</Label>
          <Input
            id="meeting-person"
            name="person"
            type="text"
            required
            defaultValue={editing?.person ?? ''}
            placeholder="Sophia Reynolds"
          />
        </div>
        <div>
          <Label htmlFor="meeting-role">Their role</Label>
          <Input
            id="meeting-role"
            name="role"
            type="text"
            defaultValue={editing?.role ?? ''}
            placeholder="Venue Coordinator"
          />
        </div>
        <div>
          <Label htmlFor="meeting-email">Guest email</Label>
          <Input
            id="meeting-email"
            name="guestEmail"
            type="email"
            required
            defaultValue={editing?.guestEmail ?? ''}
            placeholder="name@company.com"
          />
          <Hint>Where the calendar invite is sent.</Hint>
        </div>

        <div>
          <Label htmlFor="meeting-event">Event</Label>
          <EventPicker
            id="meeting-event"
            name="eventId"
            value={eventId}
            onChange={setEventId}
            options={events}
            allLabel={ALL_EVENTS}
            allValue=""
            placeholder={ALL_EVENTS}
          />
        </div>

        <div>
          <Label htmlFor="meeting-notes">Notes</Label>
          <Textarea id="meeting-notes" name="notes" rows={3} defaultValue={editing?.notes ?? ''} />
        </div>

        {/* What scheduling actually does, from the kit — the guests are emailed
            without the organizer sending anything, which is worth saying before
            the button rather than after. Only on a new meeting: rescheduling
            does not re-invite anybody. It follows the chosen mode, so In person
            or Phone call never promises a Meet link (US-MTG-04), and with no
            calendar connected it promises nothing at all (US-MTG-08). */}
        {!editing && (
          <div className="flex items-start gap-2 rounded-lg border border-hair bg-canvas p-3">
            <Icon name="hgi-calendar-check-in-01" size={16} className="mt-0.5 text-muted" />
            <p className="text-[12px] text-muted">{scheduleNote(mode, calendarConnected)}</p>
          </div>
        )}
      </fetcher.Form>
    </Panel>
  )
}
