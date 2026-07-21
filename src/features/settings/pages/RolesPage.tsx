import { useMemo, useState } from 'react'
import { PageHeader, PageFooter, HeaderUser, Button, Icon } from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { RolePanel, type RolePanelSeed } from '../components/RolePanel'
import { ROLE_CARDS, ROLE_DESC, ROLE_PERMS, type RoleName } from '../data/roles'

const NEW_SEED: RolePanelSeed = {
  title: 'New role',
  saveLabel: 'Create role',
  roleName: '',
  namePlaceholder: 'e.g. Volunteer',
  description: 'Describe what this role can do.',
  perms: ROLE_PERMS.Attendee, // the all-off preset — a blank "create" state
}

function editSeed(role: RoleName): RolePanelSeed {
  return {
    title: 'Edit ' + role,
    saveLabel: 'Save changes',
    roleName: role,
    description: ROLE_DESC[role],
    perms: ROLE_PERMS[role],
  }
}

export default function RolesPage() {
  const [q, setQ] = useState('')
  const panel = useDisclosure()
  const [seed, setSeed] = useState<RolePanelSeed>(NEW_SEED)
  const [seedKey, setSeedKey] = useState('init')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return ROLE_CARDS
    return ROLE_CARDS.filter((c) =>
      [c.name, c.members, c.desc, ...c.bullets, 'Edit role']
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [q])

  const openEdit = (role: RoleName) => {
    setSeed(editSeed(role))
    setSeedKey('edit:' + role)
    panel.onOpen()
  }
  const openNew = () => {
    setSeed(NEW_SEED)
    setSeedKey('new')
    panel.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Roles"
        subtitle="Define what each role can access in your workspace."
        actions={<HeaderUser />}
      />

      {/* toolbar: search + create */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search roles…"
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <Button variant="primary" className="shrink-0 sm:ml-auto" onClick={openNew}>
          <Icon name="hgi-add-01" size={16} />
          New role
        </Button>
      </div>

      {/* role cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((card) => (
          <div key={card.name} className="card flex flex-col p-4">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${card.iconWrap}`}
              >
                <Icon name={card.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink">{card.name}</p>
                <p className="text-[11px] text-muted tnum">{card.members}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-muted">{card.desc}</p>
            <ul className="mt-3 mb-5 space-y-1.5">
              {card.bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-[12px] text-ink">
                  <Icon name="hgi-tick-02" size={13} className="text-brand" />
                  {b}
                </li>
              ))}
            </ul>
            <Button
              variant="soft"
              size="sm"
              className="mt-auto w-full"
              onClick={() => openEdit(card.name)}
            >
              <Icon name="hgi-edit-02" size={14} />
              Edit role
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-14 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-line text-muted">
            <Icon name="hgi-search-01" size={22} />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-ink">No roles found</p>
          <p className="mt-0.5 text-[12px] text-muted">Try a different search term.</p>
        </div>
      )}

      <PageFooter />

      <RolePanel open={panel.open} onClose={panel.onClose} seed={seed} seedKey={seedKey} />
    </>
  )
}
