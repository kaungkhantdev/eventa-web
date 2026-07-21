import { useRef, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  Panel,
  Label,
  Input,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import {
  MESSAGE_TEMPLATES,
  COMMON_TAGS,
  NEW_TEMPLATE_TRIGGER,
  type TemplateChannel,
} from '../data/messagingTemplates'

/** Card / editor toggle switch — a faithful port of the `.demo-toggle`. */
function DemoToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className={cn('flex h-5 w-9 items-center rounded-full p-0.5', on ? 'bg-brand' : 'bg-line')}
      >
        <span
          className={cn('h-4 w-4 rounded-full bg-white shadow', on && 'translate-x-4')}
        />
      </button>
      <span className="text-[12px] font-medium text-muted">{on ? 'Active' : 'Inactive'}</span>
    </div>
  )
}

type LastField = 'subject' | 'emailBody' | 'smsBody'

type EditorState = {
  title: string
  trigger: string
  name: string
  subject: string
  emailBody: string
  smsBody: string
  /** Whether this template also sends SMS (shows the channel switch). */
  hasSms: boolean
  channel: TemplateChannel
  active: boolean
  tags: string[]
}

function buildEditor(id: string): EditorState {
  if (id === 'new') {
    return {
      title: 'New template',
      trigger: NEW_TEMPLATE_TRIGGER,
      name: '',
      subject: '',
      emailBody: '',
      smsBody: '',
      hasSms: true,
      channel: 'email',
      active: true,
      tags: COMMON_TAGS,
    }
  }
  const t = MESSAGE_TEMPLATES.find((x) => x.id === id)!
  return {
    title: t.title,
    trigger: t.description,
    name: t.title,
    subject: t.email.subject,
    emailBody: t.email.body,
    smsBody: t.sms?.body ?? '',
    hasSms: Boolean(t.sms),
    channel: 'email',
    active: t.active,
    tags: t.tags,
  }
}

export default function MessagingTemplatesPage() {
  const panel = useDisclosure()

  // Per-card Active/Inactive state.
  const [cardActive, setCardActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MESSAGE_TEMPLATES.map((t) => [t.id, t.active] as [string, boolean])),
  )

  const [editor, setEditor] = useState<EditorState>(() => buildEditor('new'))

  const subjectRef = useRef<HTMLInputElement>(null)
  const emailBodyRef = useRef<HTMLTextAreaElement>(null)
  const smsBodyRef = useRef<HTMLTextAreaElement>(null)
  const lastField = useRef<LastField>('emailBody')

  function openEditor(id: string) {
    setEditor(buildEditor(id))
    lastField.current = 'emailBody'
    panel.onOpen()
  }

  function selectChan(ch: TemplateChannel) {
    setEditor((s) => ({ ...s, channel: ch }))
    lastField.current = ch === 'sms' ? 'smsBody' : 'emailBody'
  }

  /** Insert a merge tag at the cursor of the last-focused field. */
  function insertTag(tag: string) {
    const field = lastField.current
    const el =
      field === 'subject'
        ? subjectRef.current
        : field === 'emailBody'
          ? emailBodyRef.current
          : smsBodyRef.current
    if (!el) return
    const s = el.selectionStart ?? el.value.length
    const e = el.selectionEnd ?? el.value.length
    setEditor((prev) => {
      if (field === 'subject')
        return { ...prev, subject: prev.subject.slice(0, s) + tag + prev.subject.slice(e) }
      if (field === 'emailBody')
        return { ...prev, emailBody: prev.emailBody.slice(0, s) + tag + prev.emailBody.slice(e) }
      return { ...prev, smsBody: prev.smsBody.slice(0, s) + tag + prev.smsBody.slice(e) }
    })
    const pos = s + tag.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const smsLen = editor.smsBody.length
  const smsSeg = Math.max(1, Math.ceil(smsLen / 160))
  const smsCount = `${smsLen} character${smsLen === 1 ? '' : 's'} · ${smsSeg} SMS`

  return (
    <>
      <PageHeader
        title="Message templates"
        subtitle="Automated emails & SMS sent on registration, payment, reminders and more."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={() => openEditor('new')}>
              <Icon name="hgi-add-01" />
              <span className="hidden sm:inline">New template</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* ============ TEMPLATES ============ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MESSAGE_TEMPLATES.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                  t.iconClass,
                )}
              >
                <i className={cn('hgi-stroke', t.icon, 'text-[18px]')} />
              </span>
              <p className="text-[14px] font-semibold text-ink">{t.title}</p>
            </div>
            <p className="text-[12px] text-muted">{t.description}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {t.channels.includes('email') && (
                <span className="badge badge-blue">
                  <i className="hgi-stroke hgi-mail-01 text-[12px]" />
                  Email
                </span>
              )}
              {t.channels.includes('sms') && (
                <span className="badge badge-green">
                  <i className="hgi-stroke hgi-smart-phone-01 text-[12px]" />
                  SMS
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-hair pt-3">
              <DemoToggle
                on={cardActive[t.id] ?? false}
                onToggle={() => setCardActive((m) => ({ ...m, [t.id]: !m[t.id] }))}
              />
              <Button variant="soft" size="sm" onClick={() => openEditor(t.id)}>
                <Icon name="hgi-edit-02" size={14} />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <PageFooter />

      {/* ============ Template editor slide-over ============ */}
      <Panel
        open={panel.open}
        onClose={panel.onClose}
        title={editor.title}
        subtitle={editor.trigger}
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={panel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={panel.onClose}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Template name</Label>
            <Input
              type="text"
              value={editor.name}
              onChange={(e) => setEditor((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g. Registration confirmation"
            />
          </div>

          {/* channel switch (hidden for single-channel templates) */}
          {editor.hasSms && (
            <div>
              <Label>Channel</Label>
              <div className="segmented w-full">
                <button
                  type="button"
                  className={cn('flex-1', editor.channel === 'email' && 'active')}
                  onClick={() => selectChan('email')}
                >
                  <i className="hgi-stroke hgi-mail-01 text-[14px]" />
                  Email
                </button>
                <button
                  type="button"
                  className={cn('flex-1', editor.channel === 'sms' && 'active')}
                  onClick={() => selectChan('sms')}
                >
                  <i className="hgi-stroke hgi-smart-phone-01 text-[14px]" />
                  SMS
                </button>
              </div>
            </div>
          )}

          {/* EMAIL content */}
          <div className={cn('space-y-4', editor.channel !== 'email' && 'hidden')}>
            <div>
              <Label>Subject line</Label>
              <input
                ref={subjectRef}
                type="text"
                className="input"
                placeholder="Email subject…"
                value={editor.subject}
                onFocus={() => (lastField.current = 'subject')}
                onChange={(e) => setEditor((s) => ({ ...s, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email body</Label>
              <textarea
                ref={emailBodyRef}
                className="textarea font-mono text-[12px] leading-relaxed"
                rows={10}
                placeholder="Write the email…"
                value={editor.emailBody}
                onFocus={() => (lastField.current = 'emailBody')}
                onChange={(e) => setEditor((s) => ({ ...s, emailBody: e.target.value }))}
              />
            </div>
          </div>

          {/* SMS content */}
          <div className={cn('space-y-1.5', editor.channel !== 'sms' && 'hidden')}>
            <Label>SMS message</Label>
            <textarea
              ref={smsBodyRef}
              className="textarea font-mono text-[12px] leading-relaxed"
              rows={5}
              placeholder="Write the SMS…"
              value={editor.smsBody}
              onFocus={() => (lastField.current = 'smsBody')}
              onChange={(e) => setEditor((s) => ({ ...s, smsBody: e.target.value }))}
            />
            <p className="hint tnum">{smsCount}</p>
          </div>

          {/* merge tags */}
          <div>
            <Label>
              Merge tags{' '}
              <span className="font-normal normal-case text-muted">
                — click to insert at cursor
              </span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {editor.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  className="rounded-md border border-hair bg-canvas px-2 py-1 font-mono text-[11px] text-muted transition hover:border-brand hover:text-brand"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* active */}
          <div className="flex items-center justify-between border-t border-hair pt-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">Status</p>
              <p className="text-[11px] text-muted">Turn this automated message on or off.</p>
            </div>
            <DemoToggle
              on={editor.active}
              onToggle={() => setEditor((s) => ({ ...s, active: !s.active }))}
            />
          </div>
        </div>
      </Panel>
    </>
  )
}
