import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader, PageFooter, HeaderUser, ButtonLink, Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  SAMPLE_EVENTS,
  LANDING_TEMPLATES,
  type TemplateId,
} from '../data/landingTemplates'

/** The three-dot browser chrome plus the template-specific preview body. */
function TemplatePreview({ id }: { id: TemplateId }) {
  return (
    <div className="bg-canvas p-3">
      <div className="overflow-hidden rounded-xl">
        <div className="flex items-center gap-1 bg-black/5 px-2.5 py-1.5 dark:bg-white/5">
          <span className="h-2 w-2 rounded-full bg-black/15 dark:bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-black/15 dark:bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-black/15 dark:bg-white/20" />
        </div>
        {id === 'aurora' && (
          <div className="h-28 overflow-hidden bg-white p-3">
            <div className="h-7 rounded-md bg-gradient-to-r from-brand to-emerald-400" />
            <div className="mt-2.5 h-2.5 w-24 rounded bg-neutral-800" />
            <div className="mt-1.5 h-2 w-16 rounded bg-neutral-300" />
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <span className="h-5 rounded bg-neutral-100" />
              <span className="h-5 rounded bg-neutral-100" />
              <span className="h-5 rounded bg-neutral-100" />
            </div>
          </div>
        )}
        {id === 'noir' && (
          <div className="grid h-28 grid-cols-5 gap-2 overflow-hidden bg-white p-3">
            <div className="col-span-3 space-y-1.5">
              <div className="h-2 w-8 rounded-full bg-brand/60" />
              <div className="h-2.5 w-full rounded bg-neutral-800" />
              <div className="h-2 w-4/5 rounded bg-neutral-300" />
              <div className="mt-1 h-4 w-12 rounded bg-brand" />
            </div>
            <div className="col-span-2 space-y-1.5 rounded-lg bg-brand-soft p-2">
              <div className="h-3 w-10 rounded bg-brand" />
              <div className="h-4 w-full rounded bg-brand" />
              <div className="h-1.5 w-full rounded bg-white/70" />
              <div className="h-1.5 w-3/4 rounded bg-white/70" />
            </div>
          </div>
        )}
        {id === 'minimal' && (
          <div className="flex h-28 flex-col items-center justify-center gap-2 overflow-hidden bg-white px-6">
            <div className="h-1.5 w-6 rounded-full bg-brand" />
            <div className="h-2.5 w-28 rounded bg-neutral-800" />
            <div className="h-2 w-20 rounded bg-neutral-300" />
            <div className="my-1 h-px w-full bg-neutral-200" />
            <div className="h-4 w-14 rounded bg-brand" />
          </div>
        )}
        {id === 'atlas' && (
          <div className="relative h-28 overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-brand to-emerald-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="relative flex h-full flex-col justify-end gap-1.5 p-3">
              <div className="h-1.5 w-8 rounded-full bg-white/70" />
              <div className="h-3.5 w-28 rounded bg-white" />
              <div className="h-3.5 w-20 rounded bg-white" />
              <div className="mt-1 h-3 w-14 rounded-full bg-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LandingPagesPage() {
  const [sampleEvent, setSampleEvent] = useState('tech-summit-2026')

  function preview(id: TemplateId) {
    window.open(`/landing/${id}?event=${sampleEvent}`, '_blank', 'noopener')
  }

  return (
    <>
      <PageHeader
        title="Landing Pages"
        subtitle="Pick a website template — every event gets its own page with its details filled in automatically."
        actions={
          <>
            <ButtonLink to="/admin/event-form" variant="primary" className="shrink-0">
              <Icon name="hgi-calendar-add-01" />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      {/* how it works + sample switcher */}
      <div className="rounded-2xl bg-surface p-4 lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon name="hgi-sparkles" size={20} />
            </span>
            <div>
              <p className="text-[14px] font-bold tracking-tight text-ink">Dynamic by design</p>
              <p className="mt-0.5 max-w-xl text-[12.5px] leading-snug text-muted">
                Choose a template once. The event title, date, venue, agenda, speakers and tickets
                all pull straight from the event — so the same design works for every event you run.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Preview with
            </p>
            <div className="inline-flex rounded-lg bg-canvas p-0.5 text-[12px] font-semibold">
              {SAMPLE_EVENTS.map((ev) => {
                const on = ev.id === sampleEvent
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSampleEvent(ev.id)}
                    className={cn(
                      'rounded-md px-3 py-1.5 transition',
                      on ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                    )}
                  >
                    {ev.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* template cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LANDING_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="flex flex-col overflow-hidden rounded-2xl bg-surface">
            <TemplatePreview id={tpl.id} />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight">{tpl.title}</h3>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                  {tpl.badge}
                </span>
              </div>
              <p className="mt-1 flex-1 text-[12.5px] leading-snug text-muted">{tpl.desc}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => preview(tpl.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-[12.5px] font-semibold text-brand transition hover:brightness-95"
                >
                  <Icon name="hgi-play" size={14} />
                  Preview
                </button>
                <Link
                  to="/admin/event-form"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-brand-dark"
                >
                  Use template
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PageFooter />
    </>
  )
}
