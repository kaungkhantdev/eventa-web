import { useEffect, useRef, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  HeaderUser,
  Icon,
  Input,
  Label,
  PageFooter,
  PageHeader,
  Paginator,
  Panel,
  PastEnd,
  Select,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import type { ActionResult } from '@/app/loaders'
import type { MemberCounts, UsersData } from '../settings.routes'
import type { MemberRow } from '../settings.types'

/**
 * Who can get into the workspace (US-ACC-08..11). Ported from users.html.
 *
 * Every control here only tidies the UI. The API decides who may invite,
 * suspend or remove anybody, and answers 403 regardless of what is on screen.
 */
export default function UsersPage() {
  const data = useLoaderData() as UsersData
  const { set, clear, emptyReason } = useFilters({ total: data.window.total })
  const invite = useDisclosure()
  // A first run has to be told apart from a search that found nobody, and from
  // a page number past the end: emptying the last page by removing somebody
  // must not tell an organizer with twenty colleagues to invite their first.
  const filtered = Boolean(
    data.filters.search || data.filters.status || data.filters.roleId,
  )
  const firstRun =
    data.rows.length === 0 && emptyReason === 'first-run' && !filtered

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage who can access your workspace."
        actions={
          <>
            <Button variant="primary" onClick={invite.onOpen}>
              <Icon name="hgi-user-add-01" size={16} />
              <span className="hidden sm:inline">Invite user</span>
              <span className="sm:hidden">Invite</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {!firstRun && (
        <UserFilters
          filters={data.filters}
          counts={data.counts}
          roles={data.roles}
          onChange={set}
        />
      )}

      {firstRun ? (
        <EmptyState
          className="card"
          icon="hgi-user-multiple"
          title="No teammates yet"
          actions={[
            { label: 'Invite a teammate', onClick: invite.onOpen, icon: 'hgi-user-add-01' },
            { label: 'See what each role can do', to: '/admin/roles' },
          ]}
        >
          The workspace has one member so far — you, as its owner. Invite people once you need the
          help: organizers to build and publish events, staff to check attendees in on the day.
        </EmptyState>
      ) : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <DataTable className="min-w-[720px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {data.rows.map((row) => (
                  <MemberTableRow key={row.id} row={row} roles={data.roles} />
                ))}
                {/* Two different empties, and telling somebody the wrong one
                    sends them looking in the wrong place. A filter that matched
                    nobody is their search; an empty page past the first is the
                    page number running off the end. `clear` in both cases so a
                    stale link carrying anything else is dropped too, and the
                    button always lands somewhere. */}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      {filtered ? (
                        <EmptyState
                          compact
                          icon="hgi-search-01"
                          title="Nobody matches that"
                          actions={[{ label: 'Clear filters', onClick: clear }]}
                        >
                          No member of this workspace matches the filters above. Widen them, or
                          check the spelling of the name or address.
                        </EmptyState>
                      ) : (
                        <PastEnd noun="users" onFirstPage={clear}>
                          Nothing is on this page of the list — it may have got shorter since it was
                          opened. The workspace&apos;s members are still there, back at the start.
                        </PastEnd>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </div>

          <Paginator
            {...data.window}
            noun="users"
            onPage={(page) => set({ page })}
            onSize={(size) => set({ limit: size, page: null })}
          />
        </Card>
      )}

      <PageFooter />

      <InvitePanel open={invite.open} onClose={invite.onClose} roles={data.roles} />
    </>
  )
}

interface RoleOption {
  id: number
  name: string
}

function MemberTableRow({ row, roles }: { row: MemberRow; roles: RoleOption[] }) {
  const act = useFetcher<ActionResult>()
  const busy = act.state !== 'idle'

  const submit = (fields: Record<string, string>) =>
    act.submit({ ...fields, memberId: String(row.id) }, { method: 'post' })

  return (
    <tr>
      <td>
        <div className="flex items-center gap-2">
          <span className="avatar h-8 w-8 text-[11px]">{row.initials}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium text-ink">{row.name}</p>
            <p className="truncate text-[11px] text-muted">{row.email}</p>
          </div>
        </div>
      </td>
      <td>
        <select
          value={row.roleId}
          onChange={(e) => submit({ intent: 'role', roleId: e.target.value })}
          disabled={busy}
          className="select h-9 border-0 bg-canvas font-medium"
          aria-label={`Role for ${row.name}`}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <Badge tone={row.statusTone}>{row.status}</Badge>
        {act.data?.ok === false && (
          <p role="alert" className="mt-1 text-[11px] text-red-500">
            {act.data.error}
          </p>
        )}
      </td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-1">
          {row.invited && (
            <button
              type="button"
              className="btn-icon"
              title="Send the invitation again"
              disabled={busy}
              onClick={() => submit({ intent: 'resend', email: row.email })}
            >
              <Icon name="hgi-mail-send-01" size={16} />
            </button>
          )}
          <button
            type="button"
            className="btn-icon"
            title={row.suspended ? 'Reactivate' : 'Suspend'}
            disabled={busy}
            onClick={() => submit({ intent: row.suspended ? 'reactivate' : 'suspend' })}
          >
            <Icon name={row.suspended ? 'hgi-play' : 'hgi-pause'} size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Remove from workspace"
            disabled={busy}
            onClick={() => submit({ intent: 'remove' })}
          >
            <Icon name="hgi-delete-02" size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/** The tabs the kit draws, and what each one asks the API for. */
const STATUS_TABS = [
  { value: '', label: 'All', count: 'all' },
  { value: 'Active', label: 'Active', count: 'active' },
  { value: 'Invited', label: 'Invited', count: 'invited' },
  { value: 'Suspended', label: 'Suspended', count: 'suspended' },
] as const satisfies readonly {
  value: string
  label: string
  count: keyof MemberCounts
}[]

/** Long enough that a fast typist gets one request, short enough to feel live. */
const SEARCH_SETTLE_MS = 300

/**
 * Status tabs, search and a role filter (US-ACC-02), as the kit draws them.
 *
 * Every one of them goes into the URL rather than component state, because the
 * API pages and counts server-side: the URL is what the loader reads, so it is
 * the only place they can live without the rows, the counts and the paginator
 * drifting apart. It also means the back button works and a filtered view can
 * be linked to.
 *
 * Changing any filter resets to page 1. Staying on page 4 of a list that now
 * has one page is how somebody lands on "no results" for a search that matched.
 */
function UserFilters({
  filters,
  counts,
  roles,
  onChange,
}: {
  filters: UsersData['filters']
  counts: MemberCounts
  roles: { id: number; name: string }[]
  onChange: (patch: Record<string, string | number | null>) => void
}) {
  // Mirrors the URL so typing feels immediate, while the request waits for a
  // pause. Seeded from the URL so a shared link shows its own term.
  const [term, setTerm] = useState(filters.search)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)

  const search = (next: string) => {
    setTerm(next)
    clearTimeout(settle.current)
    settle.current = setTimeout(
      () => onChange({ q: next || null, page: 1 }),
      SEARCH_SETTLE_MS,
    )
  }

  return (
    <div className="mb-3 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => onChange({ status: tab.value || null, page: 1 })}
            className={cn('pilltab', filters.status === tab.value && 'tab-active')}
          >
            {tab.label}
            <span className="pilltab-count tnum">{counts[tab.count]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:flex-1">
          <Icon
            name="hgi-search-01"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => search(event.target.value)}
            aria-label="Search users by name or email"
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search by name or email…"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            value={filters.roleId}
            onChange={(event) => onChange({ roleId: event.target.value || null, page: 1 })}
            aria-label="Filter by role"
            className="h-10 w-full border-0 bg-surface font-medium"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}

function InvitePanel({
  open,
  onClose,
  roles,
}: {
  open: boolean
  onClose: () => void
  roles: RoleOption[]
}) {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const sent = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!sent || !open) return
    toast.success('Invitation sent.')
    onClose()
  }, [sent, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title="Invite user"
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            form="invite-user"
            disabled={fetcher.state !== 'idle'}
          >
            {fetcher.state === 'idle' ? 'Send invitation' : 'Sending…'}
          </Button>
        </>
      }
    >
      <fetcher.Form id="invite-user" method="post" className="space-y-4">
        <input type="hidden" name="intent" value="invite" />

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="invite-name">Name</Label>
          <Input id="invite-name" name="name" type="text" required placeholder="Anong Prasert" />
        </div>
        <div>
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="name@company.com"
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Role</Label>
          <Select id="invite-role" name="roleId" required defaultValue={roles[0]?.id ?? ''}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>
      </fetcher.Form>
    </Panel>
  )
}
