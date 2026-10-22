import { useFetcher } from 'react-router'
import { Button, Input, Label, Panel, Textarea } from '@/components/ui'
import { toast } from '@/lib/toast'
import { useSaveSettled } from '@/lib/useSaveSettled'
import type { ActionResult } from '@/app/loaders'
import type { SpeakerCard } from '../program.types'
import { SPEAKER_PANEL_FORM_ID } from '@/lib/constants/program.constants'

/** Add or edit a speaker (US-PROG-04). */

interface SpeakerPanelProps {
  open: boolean
  onClose: () => void
  /** The speaker being edited, or null for a new one. */
  editing: SpeakerCard | null
  eventId: string
  eventName: string
}

export function SpeakerPanel({ open, onClose, editing, eventId, eventName }: SpeakerPanelProps) {
  const fetcher = useFetcher<ActionResult>()
  const saving = fetcher.state !== 'idle'
  // Once per save: the panel stays mounted, and the fetcher's last `ok` would
  // otherwise close the next speaker's panel as it opened.
  const { refusal: error, opening } = useSaveSettled(fetcher, {
    open,
    onSaved: () => {
      toast.success('Speaker saved.')
      onClose()
    },
  })

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={editing ? 'Edit speaker' : 'Add speaker'}
      subtitle={eventName}
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" type="submit" form={SPEAKER_PANEL_FORM_ID} disabled={saving}>
            {saving ? 'Saving…' : 'Save speaker'}
          </Button>
        </>
      }
    >
      {/* Rebuilt per opening, so the defaults are re-read: keyed on the speaker
          alone, a second Add speaker opened on the last one's name and bio. */}
      <fetcher.Form id={SPEAKER_PANEL_FORM_ID} key={opening} method="post" className="space-y-4">
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        <input type="hidden" name="eventId" value={eventId} />
        {editing && (
          <>
            <input type="hidden" name="speakerId" value={editing.id} />
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
          <Label htmlFor="speaker-name">Full name</Label>
          <Input
            id="speaker-name"
            name="name"
            type="text"
            required
            defaultValue={editing?.name ?? ''}
            placeholder="e.g. Anong Prasert"
          />
        </div>
        <div>
          <Label htmlFor="speaker-role">Title &amp; company</Label>
          <Input
            id="speaker-role"
            name="role"
            type="text"
            defaultValue={editing?.role ?? ''}
            placeholder="CTO · Nimble Works"
          />
        </div>
        <div>
          <Label htmlFor="speaker-email">Email</Label>
          <Input
            id="speaker-email"
            name="email"
            type="email"
            defaultValue={editing?.email ?? ''}
            placeholder="name@company.com"
          />
        </div>
        <div>
          <Label htmlFor="speaker-phone">Phone</Label>
          <Input
            id="speaker-phone"
            name="phone"
            type="tel"
            defaultValue={editing?.phone ?? ''}
            placeholder="02 555 0107"
          />
        </div>
        <div>
          <Label htmlFor="speaker-talk">Talk title</Label>
          <Input id="speaker-talk" name="talkTitle" type="text" placeholder="What they'll cover" />
        </div>
        <div>
          <Label htmlFor="speaker-bio">Bio</Label>
          <Textarea id="speaker-bio" name="bio" rows={4} placeholder="A short introduction…" />
        </div>
      </fetcher.Form>
    </Panel>
  )
}
