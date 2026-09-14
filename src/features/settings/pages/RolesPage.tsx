import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Button,
  Card,
  EmptyState,
  HeaderUser,
  Hint,
  Icon,
  Input,
  Label,
  PageFooter,
  PageHeader,
  Panel,
  Textarea,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import type { ActionResult } from '@/app/loaders'
import { Toggle } from '../components/Toggle'
import type { RolesData } from '../settings.routes'
import type { PermissionOption, RoleCard } from '../settings.types'

/**
 * What each role may do (US-ACC-09/10). Ported from roles.html.
 *
 * Permissions here only tidy the console — hiding a button somebody cannot
 * use. The API enforces every one of them and answers 403 whatever this page
 * chose to show.
 */
export default function RolesPage() {
  const data = useLoaderData() as RolesData
  const panel = useDisclosure()
  const [editing, setEditing] = useState<RoleCard | null>(null)
  const [term, setTerm] = useState('')

  /**
   * Filtered in the browser, unlike the Users list.
   *
   * Roles are not paged — the API answers with all of them in one array — so
   * there is no server-side page or count for a client-side filter to disagree
   * with. Pushing this into the URL and back to the API would add a round trip
   * and a loading state to narrowing a list of six.
   */
  const shown = useMemo(() => {
    const needle = term.trim().toLowerCase()
    if (!needle) return data.roles
    return data.roles.filter(
      (role) =>
        role.name.toLowerCase().includes(needle) ||
        role.description.toLowerCase().includes(needle),
    )
  }, [data.roles, term])

  /** Permission key → the label the editor already humanised for its checkboxes. */
  const labels = useMemo(() => {
    const pairs = data.groups.flatMap((group) =>
      group.permissions.map((permission) => [permission.key, permission.label] as const),
    )
    return new Map(pairs)
  }, [data.groups])

  const newRole = () => {
    setEditing(null)
    panel.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Roles"
        subtitle="Define what each role can access in your workspace."
        actions={
          <>
            <Button variant="primary" onClick={newRole}>
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">New role</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {data.roles.length > 0 && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="hgi-search-01"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search roles by name or description"
              className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search roles…"
            />
          </div>
        </div>
      )}

      {/* A workspace arrives with its built-in roles, so an empty list is the
          case where one somehow does not — told apart from a search that
          matched nothing, which is the searcher's own doing to undo. */}
      {data.roles.length === 0 ? (
        <EmptyState
          className="card"
          icon="hgi-shield-user"
          title="No roles yet"
          actions={[
            { label: 'New role', onClick: newRole, icon: 'hgi-add-01' },
            { label: 'See who is in the workspace', to: '/admin/users' },
          ]}
        >
          A role is what a teammate is allowed to reach — building events, taking payments,
          checking people in at the door. Create one, then hand it out from the Users page.
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState
          className="card"
          compact
          icon="hgi-search-01"
          title="No role matches that"
          actions={[{ label: 'Clear search', onClick: () => setTerm('') }]}
        >
          Nothing in this workspace matches &ldquo;{term.trim()}&rdquo;. Check the spelling, or
          clear the search to see every role.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((role) => (
            <RoleTile
              key={role.id}
              role={role}
              labels={labels}
              onEdit={() => {
                setEditing(role)
                panel.onOpen()
              }}
            />
          ))}
        </div>
      )}

      <PageFooter />

      <RolePanel
        open={panel.open}
        onClose={panel.onClose}
        editing={editing}
        groups={data.groups}
      />
    </>
  )
}

/** The icon the kit puts beside each group heading in the edit panel. */
const GROUP_ICONS: Record<string, string> = {
  Events: 'hgi-calendar-03',
  Registrations: 'hgi-user-add-01',
  Finance: 'hgi-wallet-01',
  Settings: 'hgi-settings-01',
}

const FALLBACK_GROUP_ICON = 'hgi-shield-user'

type PermissionGroups = { name: string; permissions: PermissionOption[] }[]

function RolePanel({
  open,
  onClose,
  editing,
  groups,
}: {
  open: boolean
  onClose: () => void
  editing: RoleCard | null
  groups: PermissionGroups
}) {
  const fetcher = useFetcher<ActionResult>()
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!saved || !open) return
    toast.success('Role saved.')
    onClose()
  }, [saved, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={editing ? 'Edit role & permissions' : 'New role'}
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            form="role-form"
            disabled={fetcher.state !== 'idle'}
          >
            <SaveLabel editing={Boolean(editing)} busy={fetcher.state !== 'idle'} />
          </Button>
        </>
      }
    >
      {/* Keyed so switching roles rebuilds the switches from the new role's
          permissions — they are state, and state does not reset on its own. */}
      <RoleForm key={editing?.id ?? 'new'} Form={fetcher.Form} editing={editing} groups={groups}>
        {fetcher.data?.ok === false && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {fetcher.data.error}
          </p>
        )}
      </RoleForm>
    </Panel>
  )
}

function SaveLabel({ editing, busy }: { editing: boolean; busy: boolean }) {
  if (busy) return <>{editing ? 'Saving…' : 'Creating…'}</>
  return <>{editing ? 'Save changes' : 'Create role'}</>
}

/**
 * The panel's body, ported from roles.html: a role name, then one bordered
 * card per permission group with a switch on every row.
 *
 * The switches are React state rather than checkboxes, so what is submitted is
 * a hidden field per granted permission. The API is sent the whole set, not a
 * diff — `PUT /roles/:id/permissions` replaces it — so a switch turned off has
 * to be an absent field, which is exactly what this produces.
 */
function RoleForm({
  Form,
  editing,
  groups,
  children,
}: {
  Form: ReturnType<typeof useFetcher<ActionResult>>['Form']
  editing: RoleCard | null
  groups: PermissionGroups
  children: ReactNode
}) {
  const [granted, setGranted] = useState<Set<string>>(
    () => new Set(editing?.permissions ?? []),
  )

  const set = (key: string, on: boolean) =>
    setGranted((was) => {
      const next = new Set(was)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })

  return (
    <Form id="role-form" method="post" className="space-y-5">
      {/* Wrapped in one `hidden` element on purpose: `space-y-5` spaces every
          sibling that lacks the `hidden` attribute, and a bare run of hidden
          inputs would push a gap above the first field. */}
      <div hidden>
        <input type="hidden" name="intent" value={editing ? 'permissions' : 'create'} />
        {editing && <input type="hidden" name="roleId" value={editing.id} />}
        {[...granted].map((key) => (
          <input key={key} type="hidden" name="permissions" value={key} />
        ))}
      </div>

      {children}

      <div>
        <Label htmlFor="role-name">Role name</Label>
        {/* Read-only while editing, and greyed to say so. The API has no rename
            — only `PUT /roles/:id/permissions` — and a box that takes typing
            and discards it is worse than one that plainly does not. */}
        <Input
          id="role-name"
          name="name"
          type="text"
          required
          readOnly={Boolean(editing)}
          defaultValue={editing?.name ?? ''}
          placeholder="Box office"
          className={editing ? 'text-muted' : undefined}
          title={editing ? 'Renaming a role is not available yet' : undefined}
        />
        {editing ? <Hint>{editing.description}</Hint> : null}
      </div>

      {!editing && (
        <div>
          <Label htmlFor="role-description">Description</Label>
          <Textarea
            id="role-description"
            name="description"
            rows={2}
            required
            placeholder="What this role is for"
          />
        </div>
      )}

      {editing?.isSystem && (
        <Hint>
          This is a built-in role. The API may refuse changes to it — it will say so if it does.
        </Hint>
      )}

      {groups.map((group) => (
        <PermissionGroupCard
          key={group.name}
          group={group}
          granted={granted}
          onToggle={set}
        />
      ))}
    </Form>
  )
}

function PermissionGroupCard({
  group,
  granted,
  onToggle,
}: {
  group: PermissionGroups[number]
  granted: Set<string>
  onToggle: (key: string, on: boolean) => void
}) {
  return (
    <div>
      <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <Icon name={GROUP_ICONS[group.name] ?? FALLBACK_GROUP_ICON} size={13} />
        {group.name}
      </h4>
      <div className="divide-y divide-line rounded-lg border border-hair px-3">
        {group.permissions.map((permission) => (
          <div key={permission.key} className="flex items-center justify-between py-2.5">
            <p className="text-[13px] text-ink">{permission.label}</p>
            <Toggle
              on={granted.has(permission.key)}
              onChange={(next) => onToggle(permission.key, next)}
              label={permission.label}
              transition="transition-transform"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * How each built-in role looks, as the kit colours them. Keyed on name because
 * that is what the kit distinguishes; a role somebody created gets the neutral
 * tile rather than borrowing a meaning it does not have.
 */
const ROLE_LOOKS: Record<string, { icon: string; tint: string }> = {
  Admin: {
    icon: 'hgi-shield-key',
    tint: 'bg-purple-50 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300',
  },
  Organizer: { icon: 'hgi-shield-user', tint: 'bg-brand-soft text-brand' },
  Staff: {
    icon: 'hgi-user-check-01',
    tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  },
  Attendee: { icon: 'hgi-user-circle', tint: 'bg-line text-muted' },
}

const CUSTOM_ROLE_LOOK = { icon: 'hgi-shield-user', tint: 'bg-line text-muted' }

/** As many permissions as the kit's card shows before the rest are counted. */
const BULLETS_SHOWN = 3

function RoleTile({
  role,
  labels,
  onEdit,
}: {
  role: RoleCard
  /** Permission key → the readable label, shared with the editor. */
  labels: Map<string, string>
  onEdit: () => void
}) {
  const look = ROLE_LOOKS[role.name] ?? CUSTOM_ROLE_LOOK
  const bullets = role.permissions.slice(0, BULLETS_SHOWN)
  const rest = role.permissions.length - bullets.length

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', look.tint)}>
          <Icon name={look.icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[14px] font-bold text-ink">{role.name}</p>
            {role.isSystem && <span className="badge badge-gray shrink-0">Built-in</span>}
          </div>
          <p className="tnum text-[11px] text-muted">{role.members}</p>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-muted">{role.description}</p>

      {/* The kit lists what a role may do, not how many things. A count tells
          somebody choosing a role for a colleague nothing about the choice. */}
      <ul className="mb-5 mt-3 space-y-1.5">
        {bullets.map((key) => (
          <li key={key} className="flex items-center gap-1.5 text-[12px] text-ink">
            <Icon name="hgi-tick-02" size={13} className="shrink-0 text-brand" />
            <span className="truncate">{labels.get(key) ?? key}</span>
          </li>
        ))}
        {rest > 0 && (
          <li className="text-[12px] text-muted">
            <span className="tnum">+{rest}</span> more
          </li>
        )}
        {role.permissions.length === 0 && (
          <li className="text-[12px] text-muted">No permissions yet</li>
        )}
      </ul>

      <Button variant="soft" size="sm" className="mt-auto w-full" onClick={onEdit}>
        <Icon name="hgi-edit-02" size={14} />
        Edit role
      </Button>
    </Card>
  )
}
