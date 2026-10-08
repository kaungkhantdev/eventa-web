import { Link } from 'react-router'
import { Icon } from '@/components/ui'
import { LANDING_TEMPLATES } from '@/features/events/landingTemplates'
import { SectionHeader } from './PanelChrome'

/**
 * Shortcuts into the landing-page designs (US-DASH-07).
 *
 * Read from the product's own template catalogue rather than a list written out
 * again here, so adding a design shows up on home without touching this file.
 */
export function TemplateShortcuts() {
  return (
    <section className="mt-4 rounded-2xl bg-surface p-4">
      <SectionHeader
        title="Website Templates"
        link={{ to: '/admin/landing-pages', label: 'See all' }}
      />
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_TEMPLATES.map((t) => (
          <Link
            key={t.id}
            to="/admin/landing-pages"
            className="group rounded-xl bg-canvas p-4 transition hover:bg-line"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-md bg-line px-2 py-1 text-[11px] font-medium text-muted">
                {t.badge}
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon name="hgi-arrow-up-right-01" size={14} />
              </span>
            </div>
            <p className="mt-3 text-[14px] font-bold tracking-tight text-ink">{t.title}</p>
            <p className="mt-1 text-[12px] leading-snug text-muted">{t.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
