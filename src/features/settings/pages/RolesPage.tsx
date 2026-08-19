import { useEffect, useState } from 'react'
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
import { useDisclosure } from '@/lib/useDisclosure'
import type { ActionResult } from '@/app/loaders'
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

      {/* Nothing on this page filters the list, so an empty one can only be a
          first run — there is no "hidden by a filter" case to tell apart. In
          practice a workspace arrives with its built-in roles, and this is what
          shows if one ever does not. */}
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
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.roles.map((role) => (
            <Card key={role.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-ink">{role.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{role.members}</p>
                </div>
                {role.isSystem && <span className="badge badge-gray">Built-in</span>}
              </div>
              <p className="text-[12.5px] text-muted">{role.description}</p>
              <p className="text-[12px] text-muted">
                <span className="tnum font-semibold text-ink">{role.permissions.length}</span>{' '}
                permissions
              </p>
              <div className="mt-auto border-t border-hair pt-3">
                <Button
                  variant="soft"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setEditing(role)
                    panel.onOpen()
                  }}
                >
                  <Icon name="hgi-edit-02" size={14} />
                  Edit permissions
                </Button>
              </div>
            </Card>
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

function RolePanel({
  open,
  onClose,
  editing,
  groups,
}: {
  open: boolean
  onClose: () => void
  editing: RoleCard | null
  groups: { name: string; permissions: PermissionOption[] }[]
}) {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const saved = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (saved && open) onClose()
  }, [saved, open, onClose])

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'New role'}
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
            {fetcher.state === 'idle' ? 'Save role' : 'Saving…'}
          </Button>
        </>
      }
    >
      <fetcher.Form id="role-form" key={editing?.id ?? 'new'} method="post" className="space-y-4">
        <input type="hidden" name="intent" value={editing ? 'permissions' : 'create'} />
        {editing && <input type="hidden" name="roleId" value={editing.id} />}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-500/15 dark:text-red-300"
          >
            {error}
          </p>
        )}

        {!editing && (
          <>
            <div>
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" name="name" type="text" required placeholder="Box office" />
            </div>
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
          </>
        )}

        {editing?.isSystem && (
          <Hint>
            This is a built-in role. The API may refuse changes to it — it will say so if it does.
          </Hint>
        )}

        {groups.map((group) => (
          <fieldset key={group.name}>
            <legend className="label">{group.name}</legend>
            <div className="space-y-1.5 rounded-lg bg-canvas p-2">
              {group.permissions.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center gap-2 text-[13px] text-ink"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission.key}
                    defaultChecked={editing?.permissions.includes(permission.key) ?? false}
                    className="checkbox"
                  />
                  {permission.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </fetcher.Form>
    </Panel>
  )
}
