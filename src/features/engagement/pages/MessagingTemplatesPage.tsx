import { useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import type { ActionResult } from '@/app/loaders'
import {
  Button,
  Card,
  HeaderUser,
  Icon,
  Modal,
  PageFooter,
  PageHeader,
  Toggle,
} from '@/components/ui'
import { cn } from '@/lib/cn'
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
 * - **No wording editor.** eventa-worker renders built-in EN/TH copy and never
 *   reads the wording columns, so an editor here would save text that nothing
 *   would ever send. That is US-MSG-02, and it lands with the worker.
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
      </div>

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
