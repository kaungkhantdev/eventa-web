# Eventa React — porting conventions

This app is a 1:1 React/TypeScript port of the static kit **eventa-ui-kit**
(normally checked out beside this repo). **Visual fidelity is the priority**: a ported page should
render pixel-identically to its HTML source. Refactor the *markup into
components*, never the *design*.

## Folder structure — feature-based

```
src/
  app/            App.tsx, routes.tsx, navigation.ts   (router + nav model)
  layouts/        AdminShell.tsx                        (rail + sub-nav panel)
  components/ui/  design-system primitives (see barrel: @/components/ui)
  lib/            cn, format, useTheme, useDisclosure
  styles/         tokens.css, components.css           (ported from app.css)
  features/<feature>/
    pages/        route components — one per source .html, default export
    components/   pieces used by 2+ pages in this feature, or big sections
    data/         demo data as typed TS modules
    types.ts      shared types for the feature
```

Rules:

- A feature **never** imports from another feature's `pages/`. Share via
  `components/ui` or `lib` instead.
- Anything used by 2+ features belongs in `components/ui` or `lib`.
- Demo data lives in `features/<feature>/data/*.ts`, typed, exported `const`.
  Never inline a 40-row array inside a component.

## Styling

- Tailwind v4 (`@tailwindcss/vite`). **Copy the class strings from the source
  HTML verbatim** — including arbitrary values like `text-[13px]`,
  `max-w-[1600px]`, `gap-2.5`.
- Semantic colour tokens only: `bg-canvas`, `bg-surface`, `text-ink`,
  `text-muted`, `border-hair`, `border-line`, `bg-brand`, `bg-brand-soft`,
  `text-brand`. These flip in dark mode automatically — **never hard-code a
  hex** unless the source does.
- Component classes (`.btn`, `.card`, `.badge`, `.input`, `.select`,
  `.data-table`, `.panel`, `.modal`, `.pilltab`, `.segmented`, `.tnum`) already
  exist in `styles/components.css`. Use them; do not redefine.
- Dark-mode variants written in the source (`dark:bg-blue-500/15`) carry over
  unchanged.

## Icons

Hugeicons stroke font, loaded from CDN. Use `<Icon name="hgi-calendar-03" size={16} />`
from `@/components/ui`, which renders `<i class="hgi-stroke hgi-calendar-03">`.
**Keep the exact slug from the source** — a wrong slug renders as tofu.

## Page anatomy

Every admin page is an `Outlet` child of `AdminShell`, so it renders *inside*
`<main>` and the `max-w-[1600px]` wrapper. A page must **not** re-declare the
shell, `<main>`, or the sidebar.

```tsx
import { PageHeader, PageFooter, HeaderUser, ButtonLink, Card, Icon } from '@/components/ui'

export default function TicketsPage() {
  return (
    <>
      <PageHeader
        title="Tickets"
        subtitle="Manage ticket types, pricing and availability."
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
      {/* …sections, ported verbatim… */}
      <PageFooter />
    </>
  )
}
```

Routes are already declared in `src/app/routes.tsx` with the correct
`handle.page` id — **do not edit routes.tsx** when porting a page; just replace
the placeholder page component in place, keeping the same file path and default
export name. (Router-level wiring — the shared page loader, the root layout —
does live there, but that is not part of porting a page.)

Every page also needs a **loading skeleton** registered in
`src/app/pageSkeletons.tsx`, keyed by its path. It should mirror the page's
top-level shape — same tile count, same tab count, same table columns — so the
layout doesn't shift when the real content lands. Compose it from the blocks in
`@/components/skeletons` (`SkelPageHeader`, `SkelStatTiles`, `SkelTableCard`, …)
rather than hand-rolling grey boxes; most list pages are one `ListPageSkeleton`
call. A path with no entry falls back to a generic list page, so a missing
skeleton is easy to miss — add it with the page.

## Behaviour

The static kit used imperative DOM code. Port it to React state:

| Static kit                            | React                                      |
| ------------------------------------- | ------------------------------------------ |
| `data-open` / `data-close` slide-over | `useDisclosure()` + `<Panel>` / `<Modal>`  |
| `classList.toggle('tab-active')`      | `<PillTabs>` / `<Tabs>` / `<Segmented>`    |
| `state = {page, size:10}` paginator   | `usePagination(rows)` + `<Paginator>`      |
| `render()` rebuilding innerHTML       | derived state + `.map()`                   |
| search/filter `filtered()`            | `useMemo` over the data module             |

Keep filtering/sorting semantics identical (same fields searched, same sort
options, same empty-state copy).

## TypeScript

- No `any`. Type the data modules and derive row types from them
  (`type Ticket = (typeof TICKETS)[number]`).
- `noUnusedLocals` / `noUnusedParameters` are on — remove dead imports.
- `verbatimModuleSyntax` is on — use `import type { … }` for type-only imports.
- Import via the `@/` alias, never long relative chains.

## Definition of done for a ported page

1. `npx tsc -b` passes.
2. The route renders with **zero console errors**.
3. Every interactive control in the source works (tabs switch, panels open,
   pagination pages, filters filter, toggles toggle).
4. Row counts, totals, labels and copy match the source data exactly.

## Definition of done for a page wired to the API

Everything above, plus — see `AGENTS.md` §"Talking to the API" for the playbook:

5. `pnpm test` green, and the feature's **mapper was written test-first**.
6. `pnpm lint` reports no *new* problems.
7. **Loading, empty and error states all render.** The skeleton appears while the
   loader runs, the empty state shows when the API returns nothing, and an API
   failure surfaces its message rather than a blank page or a swallowed error.
8. Filters, search and paging live in the **URL**, so the back button works and a
   filtered view can be shared. The list is not re-filtered client-side — the
   API pages server-side and the tab counts would disagree with the rows.
9. Money the caller may not see renders as "—", **never `฿0`**.
10. The feature's demo `data/` module is **deleted** in the same commit.
