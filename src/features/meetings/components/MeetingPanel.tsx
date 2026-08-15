import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Button, Hint, Input, Label, Panel, Select, Textarea } from '@/components/ui'
import type { ActionResult } from '@/app/loaders'
import { MEETING_MODES, MEETING_TYPES } from '../meetings.routes'
import type { MeetingDraft } from '../meetings.types'

/** Schedule or reschedule a meeting (US-MTG-01/02). */

interface MeetingPanelProps {
  open: boolean
  onClose: () => void
  /** The meeting being changed, or null for a new one. */
  editing: MeetingDraft | null
  events: { id: string; name: string }[]
  onCancelMeeting?: () => void
}

const FORM_ID = 'meeting-form'
const ALL_EVENTS = 'All events'

export function MeetingPanel({
  open,
  onClose,
  editing,
  events,
  onCancelMeeting,
}: MeetingPanelProps) {
  const fetcher = useFetcher<ActionResult>()
  const saving = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (saved && open) onClose()
  }, [saved, open, onClose])

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
            {saving ? 'Saving…' : 'Save meeting'}
          </Button>
        </>
      }
    >
      <fetcher.Form id={FORM_ID} key={editing?.id ?? 'new'} method="post" className="space-y-4">
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

        <div className="grid grid-cols-2 gap-3">
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
            <Select id="meeting-mode" name="mode" defaultValue={editing?.mode ?? 'Video'}>
              {MEETING_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </Select>
          </div>
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
          <Select id="meeting-event" name="eventId" defaultValue={editing?.eventId ?? ''}>
            <option value="">{ALL_EVENTS}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="meeting-notes">Notes</Label>
          <Textarea id="meeting-notes" name="notes" rows={3} defaultValue={editing?.notes ?? ''} />
        </div>
      </fetcher.Form>
    </Panel>
  )
}
