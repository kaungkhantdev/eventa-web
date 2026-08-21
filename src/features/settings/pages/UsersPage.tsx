import { useEffect } from 'react'
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
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import type { ActionResult } from '@/app/loaders'
import type { UsersData } from '../settings.routes'
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
  // The list has no search, role filter or status tabs — the API pages it and
  // nothing else — so the only way it comes back empty other than on a first
  // run is a page number past the end. That still has to be told apart:
  // emptying the last page by removing somebody must not tell an organizer with
  // twenty colleagues to invite their first.
  const firstRun = data.rows.length === 0 && emptyReason === 'first-run'

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
                {/* There is nothing on this page to blame on a filter: the page
                    offers none, so an empty body past the first run means the
                    page number ran off the end of the list. `clear` rather than
                    `set({ page: null })` so a stale link carrying anything else
                    is dropped too, and the button always lands somewhere. */}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <PastEnd noun="users" onFirstPage={clear}>
                        Nothing is on this page of the list — it may have got shorter since it was
                        opened. The workspace&apos;s members are still there, back at the start.
                      </PastEnd>
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
