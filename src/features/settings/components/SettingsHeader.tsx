import { useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { HeaderUser, Icon } from '@/components/ui'

/* The settings pages share a header with a "Settings" eyebrow above the title —
   a shape PageHeader doesn't cover — so it is reproduced verbatim here. */

export function SettingsHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const ctx = useOutletContext<AdminOutletContext | null>()

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => ctx?.openDrawer()}
          title="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
        >
          <Icon name="hgi-menu-01" size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Settings</p>
          <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
          <p className="mt-0.5 hidden truncate text-[12px] text-muted sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <HeaderUser />
      </div>
    </div>
  )
}
