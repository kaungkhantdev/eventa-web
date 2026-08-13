# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Codex, …) working in this
repository — the single source of truth; tool-specific files import it. The
porting contract for UI work lives in CONVENTIONS.md, referenced below.

## What this is

A React 19 + TypeScript + **Vite 8** + **Tailwind v4** app — a **1:1 visual port** of the static
HTML/Tailwind kit at `../eventa-ui-kit` (see `CONVENTIONS.md` for the authoritative porting contract).
It's the UI for **Eventa**, an event registration & management product: a public attendee **portal**,
public event **landing pages**, and an organizer **admin console**. Package manager is **pnpm**.

**It is mid-migration from prototype to real product.** Sign-in is real (JWT against `../eventa-api`)
and `/admin/*` is behind a session guard. Every *page*, however, still reads in-memory typed modules
under `features/*/data/` until it is migrated one at a time — see **Talking to the API** below for the
seam and the per-feature playbook. A page is either fully on the API or fully on demo data; never half.

## Principles (non-negotiable)

These come from [`../eventa-api/AGENTS.md`](../eventa-api/AGENTS.md) and bind this repo too. Breaking one
is not a style disagreement — it is a defect, a compliance breach, or a security hole.

1. **PCI SAQ-A: never render a card field.** Card, CVV and bank details go to **Stripe's hosted fields /
   Elements** — a PAN must never enter this app's state, props, form values, logs, error reports or
   analytics. If a design mockup shows a card form, it is implemented as Stripe Elements or not at all.
   The api holds the same rule; the front end is where it is most easily broken.
2. **Never log or ship secrets.** No `console.log` of tokens, no access/refresh token into analytics or
   an error reporter, no PII or token in a URL or query string. `console.log` has no place in committed
   code at all.
3. **Authorization is enforced server-side.** `me.permissions` is for *tidying the UI* — hiding a button
   the caller can't use. It is never the control: the API returns 403 and the UI must handle that. Never
   reason "the button is hidden, so the check is done".
4. **Money is integer satang on the wire**, formatted only at the edge. No arithmetic on a formatted
   string. **`null` is not `0`** — a masked figure renders as "—", never `฿0`.
5. **Time is UTC on the wire, Asia/Bangkok on screen**; user-facing strings are bilingual **EN/TH**.
   Never derive "today" from the browser's timezone for a business rule.
6. **TDD** — see below. No production rule without a test that required it.
7. **The API is the source of truth; never dual-write.** Don't keep a local copy of server state that
   can diverge — after a mutation, revalidate. Optimistic UI is allowed only where a failure can be
   fully rolled back and shown.
8. **`openapi.json` is the contract.** Don't invent fields or guess a shape; if the API doesn't return
   it, the change starts in `../eventa-api`.
9. **Config only through typed `import.meta.env`** (declared in `src/vite-env.d.ts`, template in
   `.env.example`) — never a hard-coded URL, host, port or key in a component.
10. **Ask before architectural changes**, and don't refactor unrelated code while implementing a feature.

## Commands

```bash
pnpm dev            # Vite dev server (the .claude/launch.json config runs it on port 5180)
pnpm build          # tsc -b && vite build  — type-checks the whole project, then bundles
pnpm lint           # eslint .
pnpm test           # vitest run   — the rules: mappers, formatting, permission gates
pnpm test:watch     # vitest       — while writing them
pnpm preview        # serve the production build
npx tsc -b          # type-check only (fast feedback; run this to verify a change compiles)
```

Run a **single test**: `pnpm test -- <path-or-name-pattern>` — e.g. `pnpm test -- registrations.mapper`
or `pnpm test -- -t "masks the amount"`.

**Definition of done** for any change: `pnpm test` green · `tsc -b` passes · `pnpm lint` no *new*
problems · the route renders in the browser with **zero console errors** and every interactive control
still works (`CONVENTIONS.md` §"Definition of done"). A green `tsc` is not evidence a page works —
open it. The API needs to be running (`cd ../eventa-api && pnpm start:dev`) for anything under `/admin`.

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

**Skeleton loading is wired at the router, not in the pages.** Every route carries a shared
`loader` (`PAGE_LOAD_MS` in `routes.tsx` — the stand-in for the fetch each page will one day do), so
React Router reports `navigation.state === 'loading'` on every visit. Two layouts turn that into a
placeholder: `AdminShell` swaps its `<Outlet>` for the destination's skeleton on admin→admin moves
(the rail and sub-nav stay mounted and jump to the destination via `routeStateOfPath`), and
`RootLayout` replaces the whole screen for first paint (`HydrateFallback`), public routes, and
crossing into or out of `/admin`. `src/app/pageSkeletons.tsx` maps **path → skeleton**; the
components live in `@/components/skeletons` and the `Skeleton` primitive in `@/components/ui`.
**Add a route, add its skeleton** — an unmapped path silently falls back to a generic list page.
Set `PAGE_LOAD_MS = 0` to drop the artificial delay.

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

## Test-driven development (must follow)

**TDD is mandatory — no production code without a failing test that required it.** Write the failing
test first, then the minimal code to pass it, then refactor with the suite green. This is the same rule
`../eventa-api/AGENTS.md` enforces, and it applies here for the same reason: the `US-*` acceptance
criteria are the spec, and a rule with no test is a rule nobody can change safely.

What that means in a UI repo, where not everything is worth a test:

- **Unit-test the rules, always.** Mappers (API row → view model), money and date formatting, permission
  gates, status/badge derivation, "is this joinable / editable / overdue" predicates. These are pure
  functions, they carry the domain meaning, and they are where a mistake is silent — a masked amount
  rendered as `฿0` instead of `—` is a correctness bug that types cannot catch.
- **Do not unit-test markup.** A test asserting a Tailwind class string is a copy of the source that
  breaks on every legitimate edit. Visual fidelity is verified in the browser against `../eventa-ui-kit`,
  not in jsdom.
- **The browser is this repo's e2e.** In the api, "the e2e suite proves the DI graph resolves — a green
  `tsc` does not". Here the equivalent is: **open the route.** A loader that 404s, a mis-mapped field, a
  skeleton that never resolves — none of them fail `tsc` or `vitest`. Drive the real page.

Tests live beside the code as `*.spec.ts` (`registrations.mapper.spec.ts` next to
`registrations.mapper.ts`), mirroring the api.

## Talking to the API

`src/lib/api` is the **only** place this app talks to `../eventa-api`. Never call `fetch` from a
component, a page, or a feature module.

- **`api.get/list/post/patch/delete`** unwrap the API's `{ success, data, meta }` envelope, so callers
  get `data` — never `response.data.data`. `api.list` returns `{ items, meta }`.
- **Every non-2xx throws `ApiError`** (`.status`, `.code`, `.fieldErrors`, `.isConflict`, …). A loader
  that returns has therefore succeeded, and pages write only the happy path; React Router's
  `errorElement` renders the rest. A 409 message is written by the API *for the person reading it* —
  show it verbatim rather than inventing your own.
- **An expired access token renews itself** once and replays the request, single-flight. Nothing above
  this layer should know that refresh tokens exist.

**Data fetching is React Router loaders and actions — do not add a query library.** `AdminShell` swaps
`<Outlet>` for a skeleton on `navigation.state === 'loading'`; that is the app's whole loading model, and
a second data layer would fight it. Mutations go through route `action`s / `useFetcher`, which
revalidate the loader automatically.

### Migrating a feature to the API (follow this exactly)

1. **`<feature>.api.ts`** — every call this feature makes, and nothing else. This is the repository
   equivalent: descriptive methods (`list`, `approve`, `reject`), no formatting, no view concerns.
2. **`<feature>.mapper.ts`** — API row → the view model the page already renders (`toRegistrationRow`).
   **Written test-first.** This is where satang becomes `฿1,880`, an ISO date becomes `Jul 8, 2026`, and
   a `null` amount becomes `—` rather than `฿0`.
3. **The loader** — `pageData(...)` from `@/app/loaders`, which gates on the session and converts a
   stale-session 401 into a redirect. Filters, search and paging belong in the **URL**, not component
   state: the API pages server-side, so the URL is the single source of truth and the back button works.
4. **The page stays thin** — read `useLoaderData()`, render. No `fetch`, no business rules, no
   client-side re-filtering of a server-paged list (the counts would disagree with the rows).
5. **Delete the feature's `data/` module** in the same commit. Two sources of truth is worse than either.

## Engineering standards (house rules)

Ported from [`../eventa-api/AGENTS.md`](../eventa-api/AGENTS.md) — that file is the canonical statement;
this is the front-end adaptation. Same priority order, never sacrifice architecture for speed:
**Correctness → Maintainability → Readability → Testability → Performance → DX.**

**Structure & responsibilities**
- **Feature-first, never layer-first.** Already the layout — keep it. A feature never imports another
  feature's `pages/`; share through `@/components/ui` or `@/lib`.
- **One job per module** — `*.api.ts` fetches · `*.mapper.ts` converts · `pages/` renders ·
  `components/` are presentational · `@/lib` is cross-feature. Never mix. If you need "and" to describe
  a file, it is two files.
- **Thin pages** — the page's job is to read loader data and render it, exactly as a controller's is to
  call a service and return. Rules live in a mapper or a plain function, not inline in JSX.
- **View models at the edge** — never render a raw API row. Map it first, in the feature's mapper, so a
  field rename in the API breaks one file rather than seven.

**Domain & correctness**
- **Money is integer satang** on the wire. Format it once, in `@/lib/format` or the feature mapper —
  never do arithmetic on a formatted string.
- **`null` is not `0`.** The API masks a figure the caller may not see as `null`, and that must render
  as "—" or a hidden column, never as a zero. "You may not see this" and "it was free" are different
  facts and the UI must not conflate them.
- **Dates are Asia/Bangkok**, displayed in the user's language. UTC instants arrive from the API; the
  conversion belongs in `@/lib/format`, once.
- **Enums and limits over magic values** — a status, a page size, a tab id, a route path used twice: name
  it as a module-level `const`. If a literal appears twice or carries domain meaning, name it once.
- **Authorization is the API's job.** Hide what the caller can't use (`me.permissions`) for a clean UI,
  but never treat that as the control — the server enforces it and will 403.

**TypeScript & methods**
- `strict` is on: no `any`, no `@ts-ignore`, no nested ternaries, no deep nesting. `verbatimModuleSyntax`
  means `import type { … }`. `noUnusedLocals`/`noUnusedParameters` — remove dead imports.
- **Small functions** — house target ≤ 10 lines, ~40 hard ceiling; one level of abstraction each.
- **Explicit names** — `RegistrationsApi`, `toRegistrationRow`, `useEventFilters`. Never `Helper`,
  `Util`, `Manager`, `data2`.
- **Comments explain WHY**, and only where the reason isn't obvious from the code. No comment that
  restates the line beneath it.

**Review checklist (before finishing a task):** tests written first and green · no duplicated code · no
magic strings/numbers · view model mapped at the edge · `null` money handled · errors surfaced to the
user, not swallowed · loading and empty states present · page opened in the browser with zero console
errors · demo `data/` module deleted if the feature was migrated.

**When unsure** — prefer maintainability over clever code; **ask before architectural changes**; don't
refactor unrelated code while implementing a feature.

## Related

- [`../eventa-api/AGENTS.md`](../eventa-api/AGENTS.md) — the API this app consumes, and the **canonical**
  house rules the section above adapts. Its `openapi.json` is the contract; controller DTOs drive it.
- `../eventa-ui-kit` — the static HTML/Tailwind kit this app ports (the visual source of truth).
- `../eventa-docs/01-requirements-and-features/functional-requirements.md` — the `US-*` backlog whose
  acceptance criteria are the spec for both repos.
- `../sdlc/` — the product's SDLC docs (requirements, architecture, test plan, DevOps) for this platform.
