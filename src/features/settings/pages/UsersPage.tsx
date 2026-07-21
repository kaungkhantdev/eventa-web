import { useEffect, useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Panel,
  Label,
  Hint,
  Input,
  Select,
  Icon,
  PillTabs,
  Paginator,
  usePagination,
  type PillTabItem,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import { RolePanel, type RolePanelSeed } from '../components/RolePanel'
import {
  USERS,
  USER_ROLE_BADGE,
  USER_STATUS_BADGE,
  USER_TAB_STATUS,
  USER_ROLE_FILTERS,
  type UserTab,
} from '../data/users'
import { ROLE_BULLETS, ROLE_DESC, ROLE_NAMES, ROLE_PERMS, type RoleName } from '../data/roles'

export default function UsersPage() {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<UserTab>('all')
  const [roleFilter, setRoleFilter] = useState('All roles')

  const invite = useDisclosure()
  const [inviteRole, setInviteRole] = useState<RoleName>('Organizer')

  const rolePanel = useDisclosure()
  // Seeded with the Organizer preset — the panel's default state in the source.
  const [seed, setSeed] = useState<RolePanelSeed>({
    title: 'Edit role & permissions',
    saveLabel: 'Save changes',
    roleName: 'Organizer',
    description: ROLE_DESC.Organizer,
    perms: ROLE_PERMS.Organizer,
  })
  const [seedKey, setSeedKey] = useState('init')

  const del = useDisclosure()

  // Escape closes the remove-user confirm modal, matching the shared shell.js
  // behaviour of the slide-over primitives.
  useEffect(() => {
    if (!del.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') del.onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [del.open, del.onClose])

  const counts = useMemo(
    () => ({
      all: USERS.length,
      active: USERS.filter((u) => u.status === 'Active').length,
      invited: USERS.filter((u) => u.status === 'Invited').length,
      suspended: USERS.filter((u) => u.status === 'Suspended').length,
    }),
    [],
  )

  const tabs: PillTabItem<UserTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'active', label: 'Active', count: counts.active },
    { value: 'invited', label: 'Invited', count: counts.invited },
    { value: 'suspended', label: 'Suspended', count: counts.suspended },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return USERS.filter((u) => {
      const byTab = tab === 'all' || u.status === USER_TAB_STATUS[tab]
      const byRole = roleFilter === 'All roles' || u.role === roleFilter
      const bySearch =
        !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      return byTab && byRole && bySearch
    })
  }, [q, tab, roleFilter])

  const pager = usePagination(filtered)

  const openEditRole = (role: RoleName) => {
    setSeed({
      title: 'Edit role & permissions',
      saveLabel: 'Save changes',
      roleName: role,
      description: ROLE_DESC[role],
      perms: ROLE_PERMS[role],
    })
    setSeedKey('edit:' + role)
    rolePanel.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage who can access your workspace."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={invite.onOpen}>
              <Icon name="hgi-user-add-01" size={16} />
              <span className="hidden sm:inline">Invite user</span>
              <span className="sm:hidden">Invite</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* pill tabs (out of table) */}
      <PillTabs
        className="mt-4"
        items={tabs}
        value={tab}
        onChange={(v) => {
          setTab(v)
          pager.reset()
        }}
      />

      {/* search + filter (out of table) */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              pager.reset()
            }}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <i className="hgi-stroke hgi-shield-user text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              pager.reset()
            }}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
          >
            <option>All roles</option>
            {USER_ROLE_FILTERS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <section className="card mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="py-10 text-center text-[13px] text-muted">No matches.</div>
                  </td>
                </tr>
              ) : (
                pager.slice.map((u) => {
                  const rb = USER_ROLE_BADGE[u.role]
                  const sb = USER_STATUS_BADGE[u.status]
                  return (
                    <tr key={u.email}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="avatar h-8 w-8 text-[11px]">{u.initials}</span>
                          <div className="min-w-0 leading-tight">
                            <p className="truncate font-medium text-ink">{u.name}</p>
                            <p className="truncate text-[11px] text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={cn('badge', rb.cls)}>
                          <i className={cn('hgi-stroke', rb.icon, 'text-[12px]')} />
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={cn('badge', sb.cls)}>
                          <i className={cn('hgi-stroke', sb.icon, 'text-[12px]')} />
                          {u.status}
                        </span>
                      </td>
                      {u.lastActive === '—' ? (
                        <td className="text-muted">—</td>
                      ) : (
                        <td className="text-muted tnum">{u.lastActive}</td>
                      )}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit role"
                            onClick={() => openEditRole(u.role)}
                          >
                            <Icon name="hgi-edit-02" size={16} />
                          </button>
                          <button type="button" className="btn-icon" title="More">
                            <Icon name="hgi-more-vertical" size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Remove user"
                            onClick={del.onOpen}
                          >
                            <Icon name="hgi-delete-02" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="workspace users"
        />
      </section>

      <PageFooter />

      {/* Invite user panel */}
      <Panel
        open={invite.open}
        onClose={invite.onClose}
        title="Invite user"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={invite.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={invite.onClose}>
              <Icon name="hgi-mail-send-01" size={16} />
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input type="text" placeholder="e.g. Somchai Tanakit" />
          </div>
          <div>
            <Label>Email address</Label>
            <Input type="email" placeholder="name@example.com" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as RoleName)}>
              {ROLE_NAMES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="label mb-1.5">This role can</p>
            <ul className="space-y-1.5 rounded-lg border border-hair p-3">
              {ROLE_BULLETS[inviteRole].map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[12px] text-ink">
                  <Icon name="hgi-tick-02" size={13} className="text-brand" />
                  {b}
                </li>
              ))}
            </ul>
            <Hint>You can fine-tune individual permissions later from Users &amp; Roles.</Hint>
          </div>
        </div>
      </Panel>

      {/* Edit role & permissions panel */}
      <RolePanel open={rolePanel.open} onClose={rolePanel.onClose} seed={seed} seedKey={seedKey} />

      {/* Remove user confirm modal */}
      <div className={cn('panel-overlay', del.open && 'open')} onClick={del.onClose} />
      <div className={cn('modal', del.open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
            <Icon name="hgi-alert-01" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Remove user?</h3>
          <p className="mt-1 text-[13px] text-muted">
            This immediately revokes their access to this workspace. They can be re-invited at any
            time.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={del.onClose}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={del.onClose}>
              Remove
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
