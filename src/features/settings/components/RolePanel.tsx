import { useEffect, useState } from 'react'
import { Panel, Button, Label, Hint, Input, Icon } from '@/components/ui'
import { PERM_GROUPS, type PermKey, type PermState } from '../data/roles'
import { Toggle } from './Toggle'

/* The "Edit role & permissions" slide-over, shared by the Users and Roles pages.
   The static kit populated it imperatively (openRolePanel / new-role) before
   shell.js opened it; here the caller passes the seed and a `seedKey` that
   re-initialises the editable toggles each time a different role is opened. */

export type RolePanelSeed = {
  /** Header title, e.g. "Edit Admin", "New role" or "Edit role & permissions". */
  title: string
  /** Primary button label — "Save changes" or "Create role". */
  saveLabel: string
  roleName: string
  namePlaceholder?: string
  description: string
  perms: PermState
}

export function RolePanel({
  open,
  onClose,
  seed,
  seedKey,
}: {
  open: boolean
  onClose: () => void
  seed: RolePanelSeed
  /** Changes whenever a new role/mode is opened, resetting the editable state. */
  seedKey: string
}) {
  const [name, setName] = useState(seed.roleName)
  const [perms, setPerms] = useState<PermState>(seed.perms)

  // Re-seed the editable fields every time the panel is (re)opened for a role —
  // matching the source, which rebuilt the toggles on each open.
  useEffect(() => {
    if (open) {
      setName(seed.roleName)
      setPerms(seed.perms)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedKey])

  const setPerm = (key: PermKey, next: boolean) =>
    setPerms((p) => ({ ...p, [key]: next }))

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={seed.title}
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose}>
            {seed.saveLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <Label>Role name</Label>
          <Input
            type="text"
            value={name}
            placeholder={seed.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
          />
          <Hint>{seed.description}</Hint>
        </div>

        {PERM_GROUPS.map((group) => (
          <div key={group.label}>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <Icon name={group.icon} size={13} />
              {group.label}
            </h4>
            <div className="divide-y divide-line rounded-lg border border-hair px-3">
              {group.perms.map((perm) => (
                <div key={perm.key} className="flex items-center justify-between py-2.5">
                  <p className="text-[13px] text-ink">{perm.label}</p>
                  <Toggle
                    on={perms[perm.key]}
                    onChange={(next) => setPerm(perm.key, next)}
                    transition="transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
