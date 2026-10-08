# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Codex, …) working in this
repository — the single source of truth; tool-specific files import it. The
porting contract for UI work lives in CONVENTIONS.md, referenced below.

## What this is

A React 19 + TypeScript + **Vite 8** + **Tailwind v4** app — a **1:1 visual port** of the static
HTML/Tailwind kit **eventa-ui-kit** (see `CONVENTIONS.md` for the authoritative porting contract).
It's the UI for **Eventa**, an event registration & management product: a public attendee **portal**,
public event **landing pages**, and an organizer **admin console**. Package manager is **pnpm**.

**It is mid-migration from prototype to real product.** Sign-in is real (JWT against **eventa-api**)
and `/admin/*` is behind a session guard. Every *page*, however, still reads in-memory typed modules
under `features/*/data/` until it is migrated one at a time — see **Talking to the API** below for the
seam and the per-feature playbook. A page is either fully on the API or fully on demo data; never half.

## Principles (non-negotiable)

Product-wide standards. They are stated **in full here** rather than linked, so this repo governs itself
even if the sibling checkouts are absent or moved; `eventa-api` carries the same list adapted for the
server. Breaking one is not a style disagreement — it is a defect, a compliance breach, or a security
hole.

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
   it, the change starts in **eventa-api**.
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
open it. Anything under `/admin` needs the **eventa-api** server running and reachable at
`VITE_API_URL`; start it with `pnpm start:dev` in that repo, wherever it is checked out.

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

**Skeleton loading is wired at the router, not in the pages.** Every route carries a `loader`, so
React Router reports `navigation.state === 'loading'` on every visit. A migrated page's loader is its
real API fetch; a page still on demo data gets `pageLoader`, an artificial `PAGE_LOAD_MS` wait that
exists only so its skeleton is visible against data that is already in memory (set it to 0 to drop the
delay; both it and `pageLoader` go when the last page is migrated). Two layouts turn that into a
placeholder: `AdminShell` swaps its `<Outlet>` for the destination's skeleton on admin→admin moves
(the rail and sub-nav stay mounted and jump to the destination via `routeStateOfPath`), and
`RootLayout` replaces the whole screen for first paint (`HydrateFallback`), public routes, and
crossing into or out of `/admin`. `src/app/pageSkeletons.tsx` maps **path → skeleton**; the
components live in `@/components/skeletons` and the `Skeleton` primitive in `@/components/ui`.
**Add a route, add its skeleton** — an unmapped path silently falls back to a generic list page.

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

**TDD is mandatory — no production code without a failing test that required it.** For every change:
write the failing test **first**, then the minimal code to make it pass, then refactor with the suite
green. Keep the suite green before every commit; new behaviour ships with its test in the same change.
Drive tests from the `US-*` story's acceptance criteria — they *are* the spec, and a rule with no test
is a rule nobody can change safely.

What that means in a UI repo, where not everything is worth a test:

- **Unit-test the rules, always.** Mappers (API row → view model), money and date formatting, permission
  gates, status/badge derivation, "is this joinable / editable / overdue" predicates. These are pure
  functions, they carry the domain meaning, and they are where a mistake is silent — a masked amount
  rendered as `฿0` instead of `—` is a correctness bug that types cannot catch.
- **Do not unit-test markup.** A test asserting a Tailwind class string is a copy of the source that
  breaks on every legitimate edit. Visual fidelity is verified in the browser against the source kit,
  not in jsdom.
- **The browser is this repo's e2e.** A loader that 404s, a mis-mapped field, a skeleton that never
  resolves, a DI-less runtime crash on first render — none of them fail `tsc` or `vitest`. **Open the
  route.** A green type-check is not evidence a page works.

Tests live **beside the code** as `*.spec.ts` — `registrations.mapper.spec.ts` next to
`registrations.mapper.ts`.

## Talking to the API

`src/lib/api` is the **only** place this app talks to **eventa-api**. Never call `fetch` from a
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

## Engineering standards (house rules — apply to all code you add)

Built for long-term maintainability. **Priority order** (never sacrifice architecture for short-term
speed): **Correctness → Maintainability → Readability → Testability → Performance → DX.** Stated in full
here so this repo is self-governing; the same standard, server-adapted, applies in `eventa-api`.

**SOLID & responsibilities**
- **Single Responsibility — one job per file.** `*.api.ts` fetches · `*.mapper.ts` converts a wire row to
  a view model · `pages/` reads loader data and renders · `components/` are presentational · hooks hold
  interaction state · `@/lib` is cross-feature. **Never mix.** If you need "and" to describe a file, it
  is two files.
- **Dependency Inversion** — depend on abstractions. A component takes the data and callbacks it needs
  as props; it does not reach for a router, a fetch, or a global. That is what makes it testable and
  reusable across the portal and the admin console.
- **Open/Closed** — extend via composition and lookup tables, not growing `if/else` chains. A
  status→badge map beats a switch that every new status has to be threaded through.

**Structure & layering**
- **Feature-first, never layer-first** — code lives under `src/features/<feature>/`; never a top-level
  `components/`+`services/` split by kind. One feature = one responsibility.
- **A feature never imports another feature's `pages/`.** Anything shared moves to `@/components/ui`
  or `@/lib`. Cross-feature imports of a *page* are the front-end equivalent of reaching into another
  module's repository.
- **Thin pages** — a page validates nothing, fetches nothing and decides nothing: it reads
  `useLoaderData()` and renders. Rules live in a mapper or a plain function, never inline in JSX.
- **View models at the edge** — never render a raw API row. Map it first, in the feature's mapper, so an
  API field rename breaks one file rather than seven.
- **Cross-cutting code lives in `@/lib` or `@/components/ui`, never in a feature.** A helper used by two
  features belongs there; a default used by one belongs to that feature as a local `const`.

**Domain & correctness**
- **Business rules live in a named, tested function** — never scattered through components or inlined in
  a render. If it can be got wrong, it can be unit-tested, and therefore must be.
- **Money is integer satang** on the wire; format once, at the edge (`@/lib/format` or the feature
  mapper). **Never do arithmetic on a formatted string.**
- **`null` is not `0`.** The API masks a figure the caller may not see as `null`; render "—" or hide the
  column, never `฿0`. "You may not see this" and "it was free" are different facts.
- **Time is UTC on the wire, Asia/Bangkok on screen**; the conversion belongs in `@/lib/format`, once.
  Never derive a business "today" from the browser's timezone.
- **Enums and constants over magic values** — a status, a page size, a tab id, a route path, a storage
  key: name it once as a module-level `const`. If a literal appears twice or carries domain meaning, it
  gets a name. Derive from a single source of truth rather than re-typing a list.
- **Errors are surfaced, never swallowed.** An empty `catch`, or one that logs and continues, hides a
  broken product from the person using it. Show the API's own message — it is written for them.
- **Every async surface has three states**: loading, empty, and failed. A page that only renders the
  happy path is not finished.

**Cross-cutting**
- **Config only through typed `import.meta.env`** (declared in `src/vite-env.d.ts`, template in
  `.env.example`) — never a hard-coded URL, host, port, key or feature flag in a component.
- **No `console.log` in committed code.** Nothing is logged that could carry a token or PII.
- **All network access goes through `@/lib/api`** — never `fetch` in a component, page or feature.
- **No circular dependencies** — extract the shared piece rather than importing in both directions.
- **Prop budget** — a component taking more than ~6 props, or a hook returning more than ~6 values, is a
  design smell; split it or pass an object with a named type.

**Components, TypeScript, naming**
- **Small functions and components** — house target ≤ 10 lines for a function, ~40 hard ceiling; extract
  a subcomponent or a hook rather than growing a 300-line render. **One level of abstraction each.**
- **TypeScript** — `strict` is on: no `any`, no `@ts-ignore`, no nested ternaries, no deep nesting. Use
  `readonly` where possible, optional chaining, nullish coalescing. `verbatimModuleSyntax` means
  `import type { … }`; `noUnusedLocals`/`noUnusedParameters` means dead imports fail the build.
- **Explicit names** — `RegistrationsApi`, `toRegistrationRow`, `useEventFilters`. Avoid
  `Helper`/`Util`/`Manager`/`data2`/`handleClick2`.
- **Comments explain WHY**, and only where the reason is not obvious from the code. Never restate the
  line beneath. Where the source kit's markup is copied verbatim, say so and why.

**UI & accessibility**
- **Visual fidelity is the contract** — copy class strings from the source kit verbatim (`CONVENTIONS.md`).
  Refactor the markup into components; never the design.
- **Semantic tokens only** (`bg-canvas`, `text-ink`, `border-hair`, …) so both themes work — never a
  hard-coded hex unless the source has one.
- **Keyboard and screen readers** — real `<button>`/`<a>` for actions, labels tied to inputs, `role="alert"`
  on error text, focus visible. A `<div onClick>` is a bug.

**Review checklist (before finishing a task):** tests written first and green · SRP respected · no
duplicated code · no magic strings/numbers · view model mapped at the edge · `null` money handled ·
errors surfaced, not swallowed · loading/empty/error states present · no `console.log` · a11y basics ·
**page opened in the browser with zero console errors** · demo `data/` module deleted if the feature
was migrated.

**When unsure** — prefer maintainability over clever code; **ask before architectural changes**; don't
refactor unrelated code while implementing a feature.

## Related repos (optional context — this file is self-contained without them)

Every rule above is stated here in full. These siblings are where the product's *other* halves live;
they are normally checked out next to this one, but nothing in this document depends on that, and a
missing sibling changes none of the standards.

- `eventa-api` — the backend this app consumes. Its `openapi.json` is the request/response contract, and
  its controller DTOs drive it: if a field isn't there, the change starts in that repo, not this one.
  It carries the same principles and house rules, server-adapted.
- `eventa-ui-kit` — the static HTML/Tailwind kit this app ports; the **visual** source of truth
  (`CONVENTIONS.md` is the porting contract, and it lives here).
- `eventa-docs` — the SDLC docs. `01-requirements-and-features/functional-requirements.md` holds the
  `US-*` backlog whose acceptance criteria are the spec for both repos.
- `eventa-worker` — RabbitMQ consumers for the API's outbox events (email, SMS, calendar sync). Nothing
  in this app talks to it directly.
