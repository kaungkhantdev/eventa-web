import { useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import {
  Button,
  Card,
  HeaderUser,
  Icon,
  Input,
  Label,
  Modal,
  PageFooter,
  PageHeader,
  Panel,
  Segmented,
  Textarea,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useDisclosure } from '@/lib/useDisclosure'
import { useSavedToast } from '@/lib/useSavedToast'
import type { TemplateCard } from '../templates.mapper'
import type { TemplatesData } from '../templates.routes'

/**
 * The automated messages a workspace sends (US-MSG-01). Cards ported from
 * `eventa-ui-kit/admin/messaging-templates.html`.
 *
 * Three departures from the kit, each because the kit drew a control that
 * would not have done anything:
 *
 * - **No "New template".** A template is a trigger the platform owns, not
 *   something an organizer authors — a message with nothing to fire it would
 *   never be sent.
 * - **No wording editor for a message nothing sends.** Only the two eventa-worker
 *   actually sends can be edited; text that will never reach anybody is a
 *   draft with nowhere to go, which is the same reason their switches are
 *   refused.
 * - **A switch only where moving it changes something.** The kit gave all six
 *   messages an Active pill. Only the two eventa-worker actually sends can be
 *   switched; the rest say "Not sent yet" instead of claiming to be on.
 */
export default function MessagingTemplatesPage() {
  const data = useLoaderData() as TemplatesData

  return (
    <>
      <PageHeader
        title="Message templates"
        subtitle="The emails Eventa sends your attendees automatically."
        actions={<HeaderUser />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.cards.map((card) => (
          <TemplateTile key={card.slug} card={card} />
        ))}
      </div>

      <PageFooter />
    </>
  )
}

function TemplateTile({ card }: { card: TemplateCard }) {
  const toggle = useFetcher<ActionResult>()
  const [asking, setAsking] = useState(false)
  const editor = useDisclosure()
  const busy = toggle.state !== 'idle'

  const submit = (active: boolean) =>
    toggle.submit(
      { slug: card.slug, active: String(active) },
      { method: 'post' },
    )

  /** Off is asked about when attendees are entitled to the message; on never is. */
  const request = (active: boolean) => {
    if (!active && card.confirmOff) return setAsking(true)
    submit(active)
  }

  const confirmOff = () => {
    setAsking(false)
    submit(false)
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            card.iconClass,
          )}
        >
          <Icon name={card.icon} size={18} />
        </span>
        <p className="text-[14px] font-semibold text-ink">{card.title}</p>
      </div>

      <p className="text-[12px] text-muted">{card.description}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {card.channels.map((channel) => (
          <span key={channel.label} className="badge badge-blue">
            <Icon name={channel.icon} size={12} />
            {channel.label}
          </span>
        ))}
      </div>

      {toggle.data?.ok === false && (
        <p role="alert" className="text-[12px] text-red-500">
          {toggle.data.error}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-hair pt-3">
        {card.switchable ? (
          <div className="flex items-center gap-2">
            <Toggle
              on={card.active}
              disabled={busy}
              onChange={request}
              label={`Send “${card.title}” to attendees`}
            />
            <span className="text-[12px] font-medium text-muted">
              {card.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ) : (
          /* Not a disabled switch: that reads as "off, and you could turn it
             on". Neither is true of these. */
          <p className="text-[12px] font-medium text-muted" title={card.standing?.hint}>
            {card.standing?.label}
          </p>
        )}

        {/* Only a message something sends can have wording worth writing. */}
        {card.switchable && (
          <Button variant="soft" size="sm" onClick={editor.onOpen}>
            <Icon name="hgi-edit-02" size={14} />
            {card.edited ? 'Edit wording' : 'Reword'}
          </Button>
        )}
      </div>

      {card.switchable && (
        <WordingEditor
          open={editor.open}
          onClose={editor.onClose}
          card={card}
        />
      )}

      {card.confirmOff && (
        <Modal
          open={asking}
          onClose={() => setAsking(false)}
          title={card.confirmOff.title}
          footer={
            <>
              <Button variant="soft" onClick={() => setAsking(false)}>
                Keep it on
              </Button>
              <Button variant="danger" onClick={confirmOff}>
                {card.confirmOff.confirmLabel}
              </Button>
            </>
          }
        >
          {card.confirmOff.body}
        </Modal>
      )}
    </Card>
  )
}

type Locale = 'en' | 'th'

const LOCALES = [
  { value: 'en' as const, label: 'English' },
  { value: 'th' as const, label: 'ไทย' },
]

/**
 * The wording editor (US-MSG-02).
 *
 * Two things it deliberately does NOT do. It validates nothing — whether a
 * language is half-written, and whether a merge field is one this message can
 * fill, are the API's to say, in a sentence written for the reader. And it
 * never edits the whole email: an organizer writes the OPENING, and Eventa
 * always appends the part that carries the ticket, the reference and the
 * refund line. An attendee losing their ticket because somebody rewrote a
 * greeting is not a wording choice anybody meant to make.
 */
function WordingEditor({
  open,
  onClose,
  card,
}: {
  open: boolean
  onClose: () => void
  card: TemplateCard
}) {
  const save = useFetcher<ActionResult>()
  const [locale, setLocale] = useState<Locale>('en')
  const [draft, setDraft] = useState(() => ({
    subjectEn: card.wording.subjectEn ?? '',
    bodyEn: card.wording.bodyEn ?? '',
    subjectTh: card.wording.subjectTh ?? '',
    bodyTh: card.wording.bodyTh ?? '',
  }))

  useSavedToast(
    save.state === 'idle' && save.data?.ok === true,
    'Wording saved.',
    onClose,
  )

  const subjectKey = locale === 'en' ? 'subjectEn' : 'subjectTh'
  const bodyKey = locale === 'en' ? 'bodyEn' : 'bodyTh'
  const language = locale === 'en' ? 'English' : 'Thai'

  const submit = () =>
    save.submit({ intent: 'wording', slug: card.slug, ...draft }, { method: 'post' })

  const insert = (tag: string) =>
    setDraft((current) => ({
      ...current,
      [bodyKey]: `${current[bodyKey]}${tag}`,
    }))

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={card.title}
      subtitle="Your opening. Eventa always adds the ticket and order details underneath."
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={save.state !== 'idle'}
            onClick={submit}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {save.data?.ok === false && (
          <p role="alert" className="text-[13px] text-red-500">
            {save.data.error}
          </p>
        )}

        <Segmented items={LOCALES} value={locale} onChange={setLocale} />

        <div>
          <Label>Subject</Label>
          <Input
            type="text"
            maxLength={200}
            value={draft[subjectKey]}
            onChange={(event) =>
              setDraft((current) => ({ ...current, [subjectKey]: event.target.value }))
            }
            placeholder={`Leave empty to use Eventa's ${language} subject`}
          />
        </div>

        <div>
          <Label>Opening</Label>
          <Textarea
            rows={6}
            maxLength={4000}
            value={draft[bodyKey]}
            onChange={(event) =>
              setDraft((current) => ({ ...current, [bodyKey]: event.target.value }))
            }
            placeholder={`Leave empty to use Eventa's ${language} wording`}
          />
        </div>

        {card.tags.length > 0 && (
          <div>
            <Label>
              Merge fields{' '}
              <span className="font-normal normal-case text-muted">
                — click to add
              </span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insert(tag)}
                  className="rounded-md border border-hair bg-canvas px-2 py-1 font-mono text-[11px] text-muted transition hover:border-brand hover:text-brand"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[12px] text-muted">
          A language left empty uses Eventa’s own wording for it — you don’t
          have to write Thai to change your English.
        </p>
      </div>
    </Panel>
  )
}
