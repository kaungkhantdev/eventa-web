# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React 19 + TypeScript + **Vite 8** + **Tailwind v4** app — a **1:1 visual port** of the static
HTML/Tailwind kit at `../eventa-ui-kit` (see `CONVENTIONS.md` for the authoritative porting contract).
It's the UI for **Eventa**, an event registration & management product: a public attendee **portal**,
public event **landing pages**, and an organizer **admin console**. It is a **prototype** — all data is
in-memory typed modules under `features/*/data/`; there is **no backend or real auth**. Package manager
is **pnpm**.

## Commands

```bash
pnpm dev            # Vite dev server (the .claude/launch.json config runs it on port 5180)
pnpm build          # tsc -b && vite build  — type-checks the whole project, then bundles
pnpm lint           # eslint .
pnpm preview        # serve the production build
npx tsc -b          # type-check only (fast feedback; run this to verify a change compiles)
```

There is **no test runner** (no vitest/jest). The Definition of Done for a change is: `tsc -b` passes,
the route renders with **zero console errors**, and every interactive control still works (see
`CONVENTIONS.md` §"Definition of done"). Verify UI changes in the browser via the dev server.

## Architecture (the parts that span multiple files)

**Feature-based, with a hard isolation rule.** Code lives in `src/features/<feature>/{pages,components,data,types}`.
A feature **never imports another feature's `pages/`** — anything shared goes in `@/components/ui` or
`@/lib`. Demo data is always a typed, exported `const` in `features/<feature>/data/*.ts`, never inlined.

**The router and nav model are separate, data-driven files in `src/app/`:**
- `routes.tsx` — the whole route manifest, every page **code-split** via `lazy`. Each admin route carries
  a `handle.page` id (the static kit's old `data-page`) that drives **sidebar active state**, and
  `handle.focused: true` hides the sub-nav panel for focused flows (e.g. the create-event wizard). Root
  `/` redirects to the public `/portal/discover`.
- `navigation.ts` — the `MODULES` array is the **single source of truth** for the admin icon rail and its
  grouped sub-nav panel. Add/rename admin nav here, not in the shell. `moduleOfPage()` maps a page id → its rail module.

**`src/layouts/AdminShell.tsx` owns the admin chrome (double sidebar: icon rail + labeled panel).** Admin
pages are `<Outlet>` children rendered *inside* the shell's `<main>` and its `max-w-[1600px]` wrapper — a
page **must not** re-declare `<main>`, the sidebar, or that wrapper. The shell reads the active route's
`handle` (`{ page, focused }`) to highlight the rail and toggle the sub-nav panel.

**Two separate auth personas — never share a login:**
- `/` → `/portal/discover` (public browsing; no account needed)
- `/auth/login` → `/admin/*` (organizer console, under `AdminShell`)
- `/portal/login` → `/portal/my-events` (attendee)

**Shared code:** `@/components/ui` (barrel export of design-system primitives — Button/Card/Field/Panel/
Modal/Paginator/Tabs/DataTable/Icon/charts, plus `PageHeader`/`HeaderUser`/`PageFooter`); `@/lib`
(`cn`, `format` for Thai Baht, `useTheme` for class-based dark mode, `useDisclosure`, `eventCatalog`);
`@/styles` (`tokens.css`, `components.css`).

**Path alias:** import via `@/*` → `./src/*` (declared in `tsconfig.app.json` `paths`, **no `baseUrl`** —
TS 7 drops it). Never use long relative chains.

## Tailwind v4 setup — non-obvious, and easy to break (all in `src/index.css`)

- **Layer order matters.** `components.css` is imported with `layer(components)` so Tailwind's own
  `@layer utilities` outranks it (the markup relies on utilities overriding `.select`/`.input`/etc).
  In Tailwind v4 **any *unlayered* CSS beats layered CSS** — so anything that competes with a utility must
  live in a layer below utilities, or it will silently clobber the design.
- **Hugeicons is loaded via a `<link>` in `index.html`, not a CSS `@import`.** Its `@font-face` uses
  *relative* URLs that only resolve when linked directly to the CDN; `@import`ing it loads a bogus font →
  **CJK tofu on every icon**. Use `<Icon name="hgi-…" />` and keep the exact slug (a wrong slug = tofu).
- `@custom-variant dark (&:where(.dark, .dark *))` — dark mode is **class-based** (`class="dark"` on
  `<html>`, toggled by `useTheme`), not `prefers-color-scheme`.
- Colors come from **semantic `@theme` tokens** (`bg-canvas`, `bg-surface`, `text-ink`, `text-muted`,
  `border-hair`, `border-line`, `bg-brand`, `bg-brand-soft`) that flip per theme — **never hard-code a hex**
  unless the source HTML does.
- A base rule sets bare `border-*` to `rgb(var(--hair))` (v4 defaults to `currentColor`; the kit has ~185
  bare borders relying on the v3 grey) and sets `#root { height: 100% }` (restores the body→shell height
  chain so `main` scrolls internally instead of pushing the rail's bottom items off-screen).

## Conventions that will bite you

- **TypeScript is strict:** no `any`; `noUnusedLocals`/`noUnusedParameters` are on (remove dead imports);
  `verbatimModuleSyntax` is on (use `import type { … }`). Derive row types from data modules
  (`type Ticket = (typeof TICKETS)[number]`).
- **Reuse component classes** already in `styles/components.css` (`.btn`, `.card`, `.badge`, `.input`,
  `.select`, `.data-table`, `.panel`, `.modal`, `.pilltab`, `.segmented`, `.tnum`) — don't redefine them.
- **Imperative-DOM → React state** when porting: `useDisclosure()`+`<Panel>`/`<Modal>` for slide-overs,
  `<PillTabs>`/`<Tabs>`/`<Segmented>` for tab toggles, `usePagination()`+`<Paginator>` for paging,
  `useMemo` for search/filter. Keep filtering/sorting semantics and empty-state copy identical to the source.
- A few features use **real libraries** where the static kit did: `quill` powers the rich-text editor on
  the create-event page (instantiated imperatively in `useEffect` with a StrictMode re-init guard);
  `qrcode-generator` renders 2FA QR codes; the invoice PDF is hand-rolled from raw PDF operators (no lib).

## Related

- `../eventa-ui-kit` — the static HTML/Tailwind kit this app ports (the visual source of truth).
- `../sdlc/` — the product's SDLC docs (requirements, architecture, test plan, DevOps) for this platform.
