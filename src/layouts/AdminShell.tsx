import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useMatches } from 'react-router'
import { MODULES, moduleOfPage, type NavGroup, type NavModule } from '@/app/navigation'
import { useTheme } from '@/lib/useTheme'
import { cn } from '@/lib/cn'

/* Double sidebar: an icon rail of modules plus a labeled panel of grouped
   sub-nav. Faithful port of the markup shell.js injected in the static kit.

   Active state is driven by a page id (the static kit's `data-page`), declared
   per route via `handle.page`. Detail screens reuse their parent's id — e.g.
   /admin/event-detail is page "events" — so the rail and the sub-nav leaf stay
   highlighted, exactly as in the original. */

const RAIL_ON =
  'grid h-9 w-9 place-items-center rounded-lg bg-brand text-white shadow-sm transition'
const RAIL_OFF =
  'grid h-9 w-9 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-brand'

const LEAF_ON =
  'block rounded-lg py-1.5 pl-9 pr-2.5 text-[13px] font-semibold bg-brand-soft text-brand'
const LEAF_OFF =
  'block rounded-lg py-1.5 pl-9 pr-2.5 text-[13px] font-medium text-muted transition hover:bg-brand-soft/60 hover:text-brand'

function RailButton({ mod, active }: { mod: NavModule; active: boolean }) {
  return (
    <div className="group relative flex justify-center">
      <Link to={mod.to} className={active ? RAIL_ON : RAIL_OFF}>
        <i className={cn('hgi-stroke', mod.icon, 'text-[18px]')} />
      </Link>
      <span className="rail-tip">{mod.label}</span>
    </div>
  )
}

function PanelGroup({ group, page }: { group: NavGroup; page: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-line"
      >
        <i className={cn('hgi-stroke', group.icon, 'text-[17px]')} />
        {group.label}
        <i
          className={cn(
            'hgi-stroke hgi-arrow-down-01 ml-auto text-[15px] text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5">
          {group.items.map((it) => (
            <li key={it.page}>
              <Link to={it.to} className={it.page === page ? LEAF_ON : LEAF_OFF}>
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Read the active page id from the deepest route that declares one. */
/** Read the active page id and the `focused` flag from the deepest route that
 *  declares them. `focused` routes (the create-event wizard) keep the icon rail
 *  but hide the module sub-nav panel, matching the static kit. */
function useRouteHandle(): { page: string; focused: boolean } {
  const matches = useMatches()
  let page = 'dashboard'
  let focused = false
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i]!.handle as { page?: string; focused?: boolean } | undefined
    if (handle?.page && page === 'dashboard') page = handle.page
    if (handle?.focused) focused = true
  }
  return { page, focused }
}

export default function AdminShell() {
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const { page, focused } = useRouteHandle()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const selected = useMemo(() => moduleOfPage(page), [page])
  const mod = useMemo(() => MODULES.find((m) => m.id === selected), [selected])
  const hasPanel = Boolean(mod?.groups?.length) && !focused

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [location.pathname])

  return (
    <div className="flex h-full min-h-screen">
      <div
        onClick={() => setDrawerOpen(false)}
        className={cn('fixed inset-0 z-40 bg-black/40 lg:hidden', drawerOpen ? 'block' : 'hidden')}
      />

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 lg:static lg:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* icon rail — modules */}
        <aside className="relative z-30 flex w-16 shrink-0 flex-col items-center bg-[#0e0f12] py-4 dark:bg-[#101613]">
          <div className="group relative flex justify-center">
            <Link
              to="/admin/dashboard"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-[13px] font-extrabold tracking-tight text-white"
            >
              EC
            </Link>
            <span className="rail-tip">Eventa Co., Ltd.</span>
          </div>

          <div className="mt-5 flex flex-col items-center gap-1.5">
            {MODULES.filter((m) => !m.bottom).map((m) => (
              <RailButton key={m.id} mod={m} active={m.id === selected} />
            ))}
          </div>

          <div className="mt-auto flex flex-col items-center gap-2 pt-4">
            <div className="flex flex-col items-center gap-1.5">
              {MODULES.filter((m) => m.bottom).map((m) => (
                <RailButton key={m.id} mod={m} active={m.id === selected} />
              ))}
            </div>
            <div className="group relative flex justify-center">
              <button
                type="button"
                onClick={toggle}
                title="Change mode"
                className="grid h-9 w-9 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-brand"
              >
                <i className={cn('hgi-stroke text-[20px]', dark ? 'hgi-sun-03' : 'hgi-moon-02')} />
              </button>
              <span className="rail-tip">Change mode</span>
            </div>
            <div className="group relative mt-1 flex justify-center">
              <span className="grid h-9 w-9 place-items-center text-brand">
                <span className="brand-logo h-[13px] w-[24px]" />
              </span>
              <span className="rail-tip">Eventa for Business · v1.0.0.0</span>
            </div>
          </div>
        </aside>

        {/* labeled panel — grouped sub-nav (absent for modules without groups) */}
        {hasPanel && mod && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-hair bg-surface">
            <div className="mt-4 flex h-9 items-center px-4">
              <h2 className="text-[17px] font-bold tracking-tight text-ink">{mod.label}</h2>
            </div>
            <nav className="no-scrollbar mt-2 flex-1 space-y-1.5 overflow-y-auto px-2.5 pb-4">
              {mod.groups!.map((g) => (
                <PanelGroup key={g.label} group={g} page={page} />
              ))}
            </nav>
            <div className="border-t border-hair px-4 py-3">
              <p className="text-[12px] font-semibold text-ink">Eventa for Business</p>
              <p className="tnum text-[11px] text-muted">Version 1.0.0.0</p>
            </div>
          </aside>
        )}
      </div>

      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-4 lg:px-7">
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet context={{ openDrawer: () => setDrawerOpen(true) }} />
        </div>
      </main>
    </div>
  )
}

/** Pages use this to open the mobile drawer from their own header button. */
export type AdminOutletContext = { openDrawer: () => void }
