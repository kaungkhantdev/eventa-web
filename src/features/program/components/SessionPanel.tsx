import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Button, Hint, Input, Label, Panel, Select, Textarea } from '@/components/ui'
import { toast } from '@/lib/toast'
import type { ActionResult } from '@/app/loaders'
import type { AgendaDay, SessionDraft, SessionType } from '../program.types'

/**
 * Add or edit a session (US-PROG-01/02).
 *
 * A speaker already booked at that hour is a refusal, not a rejection: the API
 * answers 409 with what clashes, and re-submitting with "book them anyway"
 * confirms it. The organizer makes that call explicitly rather than the form
 * deciding for them.
 */

interface SessionPanelProps {
  open: boolean
  onClose: () => void
  eventId: string
  days: AgendaDay[]
  speakers: { id: string; name: string }[]
  /** The session being edited, or null for a new one. */
  editing: SessionDraft | null
  /** Removing the session being edited; absent on a new one. */
  onDelete?: () => void
}

const FORM_ID = 'session-form'
const TYPES: SessionType[] = ['Keynote', 'Talk', 'Workshop', 'Panel', 'Break']

export function SessionPanel({
  open,
  onClose,
  eventId,
  days,
  speakers,
  editing,
  onDelete,
}: SessionPanelProps) {
  const fetcher = useFetcher<ActionResult>()
  const saving = fetcher.state !== 'idle'
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true
  // The one refusal an organizer can wave through, rather than a rejection.
  const clash = Boolean(error && /clash|already/i.test(error))

  useEffect(() => {
    if (!saved || !open) return
    toast.success('Session saved.')
    onClose()
  }, [saved, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={editing ? 'Edit session' : 'New session'}
      footer={
        <>
          {editing && onDelete ? (
            <Button variant="danger" className="flex-1" onClick={onDelete} disabled={saving}>
              Delete
            </Button>
          ) : (
            <Button variant="soft" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button variant="primary" className="flex-1" type="submit" form={FORM_ID} disabled={saving}>
            {saving ? 'Saving…' : 'Save session'}
          </Button>
        </>
      }
    >
      <fetcher.Form
        id={FORM_ID}
        key={editing?.id ?? 'new'}
        method="post"
        className="space-y-4"
      >
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        <input type="hidden" name="eventId" value={eventId} />
        {editing && (
          <>
            <input type="hidden" name="sessionId" value={editing.id} />
            <input type="hidden" name="version" value={editing.version} />
          </>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-500/15">
            <p role="alert" className="text-[13px] text-red-600 dark:text-red-300">
              {error}
            </p>
            {clash && (
              <label className="mt-2 flex items-center gap-2 text-[13px] text-ink">
                <input type="checkbox" name="confirmSpeakerClash" className="checkbox" />
                Book them anyway
              </label>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="session-title">Title</Label>
          <Input
            id="session-title"
            name="title"
            type="text"
            required
            defaultValue={editing?.title ?? ''}
            placeholder="e.g. Opening keynote"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="session-day">Day</Label>
            <Select id="session-day" name="day" defaultValue={String(editing?.day ?? 1)}>
              {days.map((day) => (
                <option key={day.index} value={day.index}>
                  Day {day.index} · {day.weekday} {day.dayOfMonth}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="session-type">Type</Label>
            <Select id="session-type" name="type" defaultValue={editing?.type ?? 'Talk'}>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="session-start">Starts</Label>
            <Input
              id="session-start"
              name="startTime"
              type="time"
              required
              defaultValue={editing?.startTime ?? '09:00'}
            />
          </div>
          <div>
            <Label htmlFor="session-end">Ends</Label>
            <Input
              id="session-end"
              name="endTime"
              type="time"
              defaultValue={editing?.endTime ?? '10:00'}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="session-room">Room</Label>
          <Input
            id="session-room"
            name="room"
            type="text"
            defaultValue={editing?.room ?? ''}
            placeholder="Hall A"
          />
        </div>

        <div>
          <Label>Speakers</Label>
          {speakers.length === 0 ? (
            <Hint>No speakers on this event yet — add one first.</Hint>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg bg-canvas p-2">
              {speakers.map((speaker) => (
                <label key={speaker.id} className="flex items-center gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    name="speakerIds"
                    value={speaker.id}
                    defaultChecked={editing?.speakerIds.includes(speaker.id) ?? false}
                    className="checkbox"
                  />
                  {speaker.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="session-description">Description</Label>
          <Textarea
            id="session-description"
            name="description"
            rows={3}
            defaultValue={editing?.description ?? ''}
            placeholder="What this session covers…"
          />
        </div>
      </fetcher.Form>
    </Panel>
  )
}
