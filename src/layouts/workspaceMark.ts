import { initials } from '@/lib/format'

/** What the top of the console's icon rail shows for the signed-in workspace. */
export interface WorkspaceMark {
  /** The workspace's logo URL; null shows the initials instead. */
  logo: string | null
  initials: string
  /** The workspace's name: the rail's hover label and the link's accessible name. */
  label: string
}

/**
 * The signed-in workspace's own logo, else its initials. Read from `/auth/me`,
 * so a logo replaced in Settings → Organization shows as soon as the shell's
 * loader revalidates after the save.
 */
export function workspaceMark(
  organization: { name: string; logoUrl?: string | null } | null | undefined,
): WorkspaceMark {
  const name = organization?.name.trim() ?? ''
  return {
    logo: organization?.logoUrl || null,
    initials: initials(name),
    label: name,
  }
}
