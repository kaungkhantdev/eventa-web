import { useFetcher, useLoaderData } from 'react-router'
import { Badge, Button, Card, Hint, Icon, Input, Label, Select, Textarea } from '@/components/ui'
import type { ActionResult } from '@/app/loaders'
import { SettingsHeader } from '../components/SettingsHeader'
import type { ProfileData } from '../settings.routes'
import type { ProfileCard } from '../settings.types'

/**
 * Your own record (US-ACC-01, US-DISC-11).
 *
 * The kit hard-coded a person, a job title, "24 events managed" and a join
 * date. Only what the API actually holds is shown: inventing a tenure or a
 * count on somebody's own profile is a claim this app cannot support.
 */

const TIMEZONES = ['Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'UTC']

export default function SettingsProfilePage() {
  const { profile } = useLoaderData() as ProfileData
  const save = useFetcher<ActionResult>()
  const error = save.data?.ok === false ? save.data.error : null
  const saved = save.state === 'idle' && save.data?.ok === true

  return (
    <>
      <SettingsHeader
        title="Profile"
        subtitle="Your personal details and how your team can reach you."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <PhotoCard profile={profile} />

        <Card className="p-5">
          <h3 className="text-[14px] font-bold tracking-tight">Personal information</h3>
          <p className="mt-0.5 text-[12px] text-muted">
            Update your name and how your team can reach you.
          </p>

          <save.Form method="post" key={profile.email}>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                {/* The API holds one name, not a first and a last. */}
                <Label htmlFor="profile-name">Full name</Label>
                <Input id="profile-name" name="name" required defaultValue={profile.name} />
              </div>
              <div>
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={profile.phone}
                />
              </div>
              <div>
                <Label htmlFor="profile-city">City</Label>
                <Input id="profile-city" name="city" defaultValue={profile.city} />
              </div>
              <div>
                <Label htmlFor="profile-timezone">Timezone</Label>
                <Select id="profile-timezone" name="timezone" defaultValue={profile.timezone}>
                  <option value="">Not set</option>
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="profile-locale">Language</Label>
                <Select id="profile-locale" name="locale" defaultValue={profile.locale}>
                  <option value="en">English</option>
                  <option value="th">ไทย</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="profile-bio">About you</Label>
                <Textarea id="profile-bio" name="bio" rows={3} defaultValue={profile.bio} />
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-[13px] text-red-500">
                {error}
              </p>
            )}
            {saved && <p className="mt-3 text-[13px] text-brand">Profile saved.</p>}

            <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
              <Button variant="primary" size="sm" type="submit" disabled={save.state !== 'idle'}>
                <Icon name="hgi-tick-02" size={15} />
                {save.state === 'idle' ? 'Save changes' : 'Saving…'}
              </Button>
            </div>
          </save.Form>
        </Card>
      </div>

      <EmailCard profile={profile} />
    </>
  )
}

function PhotoCard({ profile }: { profile: ProfileCard }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-bold tracking-tight">Profile photo</p>
      <div className="mt-3 flex items-center gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-emerald-400 text-[26px] font-bold text-white">
            {profile.initials}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold tracking-tight">{profile.name}</h3>
          <p className="truncate text-[12px] text-muted">{profile.email}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
        <p className="flex items-center justify-between">
          <span className="text-muted">Email</span>
          <Badge tone={profile.emailVerified ? 'green' : 'amber'}>
            {profile.emailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </p>
      </div>
    </Card>
  )
}

/**
 * Changing the address you sign in with.
 *
 * A separate form because it is a separate act: the API sends a confirmation
 * to the new address and the old one keeps working until that link is used.
 */
function EmailCard({ profile }: { profile: ProfileCard }) {
  const change = useFetcher<ActionResult>()
  const error = change.data?.ok === false ? change.data.error : null
  const sent = change.state === 'idle' && change.data?.ok === true

  return (
    <Card className="mt-4 p-5">
      <h3 className="text-[14px] font-bold tracking-tight">Email address</h3>
      <p className="mt-0.5 text-[12px] text-muted">
        You sign in with this. A new address has to be confirmed before it takes over.
      </p>

      {profile.pendingEmail && (
        <Hint className="mt-3">
          Waiting for <span className="font-semibold text-ink">{profile.pendingEmail}</span> to be
          confirmed. Until then, <span className="font-semibold text-ink">{profile.email}</span> is
          still the one that works.
        </Hint>
      )}

      <change.Form method="post" className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="intent" value="email" />
        <div className="min-w-[240px] flex-1">
          <Label htmlFor="profile-email">New email</Label>
          <Input
            id="profile-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={profile.email}
          />
        </div>
        <Button variant="soft" size="sm" type="submit" disabled={change.state !== 'idle'}>
          Send confirmation
        </Button>
      </change.Form>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-500">
          {error}
        </p>
      )}
      {sent && <p className="mt-2 text-[13px] text-brand">Check the new address for a link.</p>}
    </Card>
  )
}
