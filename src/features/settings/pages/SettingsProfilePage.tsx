import { useFetcher, useLoaderData } from 'react-router'
import { Badge, Button, Card, Hint, Icon, Input, Label, Select, Textarea } from '@/components/ui'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import { SettingsHeader } from '../components/SettingsHeader'
import {
  PHONE_CONFIRM_INTENT,
  PHONE_REMOVE_INTENT,
  PHONE_REQUEST_INTENT,
  type ProfileData,
} from '../settings.routes'
import type { ProfileCard } from '../settings.types'

/**
 * Your own record (US-ACC-01, US-DISC-11).
 *
 * The kit hard-coded a person, a job title, "24 events managed" and a join
 * date. Only what the API actually holds is shown: inventing a tenure or a
 * count on somebody's own profile is a claim this app cannot support.
 */

const TIMEZONES = ['Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'UTC']

/**
 * The phone's three submissions, each its own form — and all OUTSIDE the
 * details form, because forms cannot nest: a nested one is dropped by the
 * browser and its button silently submits the outer form instead.
 */
const PHONE_REQUEST_FORM_ID = 'settings-profile-phone'
const PHONE_CONFIRM_FORM_ID = 'settings-profile-phone-code'
const PHONE_REMOVE_FORM_ID = 'settings-profile-phone-remove'

export default function SettingsProfilePage() {
  const { profile } = useLoaderData() as ProfileData
  const save = useFetcher<ActionResult>()
  const phone = {
    request: useFetcher<ActionResult>(),
    confirm: useFetcher<ActionResult>(),
    remove: useFetcher<ActionResult>(),
  }
  const error = save.data?.ok === false ? save.data.error : null
  const saved = save.state === 'idle' && save.data?.ok === true
  useSavedToast(saved, 'Profile saved.')
  useFailureToast(save.state === 'idle' ? error : null)

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

          <phone.request.Form method="post" id={PHONE_REQUEST_FORM_ID}>
            <input type="hidden" name="intent" value={PHONE_REQUEST_INTENT} />
          </phone.request.Form>
          <phone.confirm.Form method="post" id={PHONE_CONFIRM_FORM_ID}>
            <input type="hidden" name="intent" value={PHONE_CONFIRM_INTENT} />
          </phone.confirm.Form>
          <phone.remove.Form method="post" id={PHONE_REMOVE_FORM_ID}>
            <input type="hidden" name="intent" value={PHONE_REMOVE_INTENT} />
          </phone.remove.Form>

          <save.Form method="post" key={profile.email}>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                {/* The API holds one name, not a first and a last. */}
                <Label htmlFor="profile-name">Full name</Label>
                <Input id="profile-name" name="name" required defaultValue={profile.name} />
              </div>
              <PhoneField profile={profile} phone={phone} />
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

            <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
              <Button variant="primary" size="sm" type="submit" disabled={save.state !== 'idle'}>
                <Icon name="hgi-tick-02" size={15} />
                {save.state === 'idle' ? 'Save changes' : 'Saving…'}
              </Button>
            </div>
          </save.Form>
        </Card>
      </div>
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
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-emerald-400 text-[26px] font-bold text-white">
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

      {/* Directly under the badge that reports on it: the address, whether it
          is confirmed, and how to move it are one subject. */}
      <EmailForm profile={profile} />
    </Card>
  )
}

/**
 * Changing the address you sign in with.
 *
 * Its own form, and its own fetcher, because it is a separate act from saving a
 * profile: the API sends a confirmation to the NEW address and the old one goes
 * on working until that link is opened. Stacked rather than laid out in a row —
 * it lives in the 280px column, where a side-by-side field and button would
 * wrap anyway.
 */
function EmailForm({ profile }: { profile: ProfileCard }) {
  const change = useFetcher<ActionResult>()
  const error = change.data?.ok === false ? change.data.error : null
  const sent = change.state === 'idle' && change.data?.ok === true
  useSavedToast(sent, 'Check the new address for a link.')
  useFailureToast(change.state === 'idle' ? error : null)

  return (
    <div className="mt-4 border-t border-hair pt-4">
      <p className="text-[13px] font-bold tracking-tight">Change email</p>
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

      <change.Form method="post" className="mt-3">
        <input type="hidden" name="intent" value="email" />
        <Label htmlFor="profile-email">New email</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          // Not the current address: on a field asking for a new one that reads
          // as already filled in, and it is the one value the API refuses.
          placeholder="you@example.com"
        />
        <Button
          variant="soft"
          size="sm"
          type="submit"
          className="mt-2 w-full"
          disabled={change.state !== 'idle'}
        >
          Send confirmation
        </Button>
      </change.Form>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The number, proved by a texted code before Eventa will use it.
 *
 * US-SET-01 asks that a member can edit their phone and have the change kept.
 * It was an ordinary box on the details form, which no longer worked at all:
 * `phone` left `UpdateProfileDto` when confirm-by-code landed, and
 * `forbidNonWhitelisted` refuses the key outright, so the save 400'd — and
 * once the key was dropped from the patch, the same box silently discarded
 * what was typed into it, which is worse. It is the API's three calls now,
 * the same flow the attendee portal uses over the same routes.
 */
function PhoneField({
  profile,
  phone,
}: {
  profile: ProfileCard
  /**
   * Owned by the page, because the form elements live outside this cell —
   * forms cannot nest, so a button inside the details form would submit THAT.
   */
  phone: {
    request: ReturnType<typeof useFetcher<ActionResult>>
    confirm: ReturnType<typeof useFetcher<ActionResult>>
    remove: ReturnType<typeof useFetcher<ActionResult>>
  }
}) {
  const { request, confirm, remove } = phone
  const busy =
    request.state !== 'idle' || confirm.state !== 'idle' || remove.state !== 'idle'

  const failure =
    (request.data?.ok === false ? request.data.error : null) ??
    (confirm.data?.ok === false ? confirm.data.error : null) ??
    (remove.data?.ok === false ? remove.data.error : null)
  useFailureToast(!busy ? failure : null)
  useSavedToast(
    request.state === 'idle' && request.data?.ok === true,
    'Code sent. Check your phone.',
  )
  useSavedToast(
    confirm.state === 'idle' && confirm.data?.ok === true,
    'Number confirmed.',
  )

  return (
    <div>
      <Label htmlFor="profile-phone">Phone</Label>
      <div className="flex gap-2">
        {/* Keyed on what is on file, so the box resets once a code is on its
            way rather than showing a number that is not in use yet. */}
        <Input
          key={profile.pendingPhone ?? profile.phone}
          id="profile-phone"
          name="phone"
          type="tel"
          form={PHONE_REQUEST_FORM_ID}
          autoComplete="tel"
          placeholder="081 234 5678"
          defaultValue={profile.phone}
        />
        <Button
          variant="soft"
          size="sm"
          type="submit"
          form={PHONE_REQUEST_FORM_ID}
          disabled={busy}
        >
          Send code
        </Button>
      </div>

      <Hint className="mt-1">
        Eventa texts a code to confirm it. Until you type the code back, the
        number is not used for anything.
      </Hint>

      {profile.pendingPhone && (
        <>
          <div className="mt-2 flex gap-2">
            <Input
              name="code"
              form={PHONE_CONFIRM_FORM_ID}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              aria-label={`Code texted to ${profile.pendingPhone}`}
              required
            />
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form={PHONE_CONFIRM_FORM_ID}
              disabled={busy}
            >
              Confirm
            </Button>
          </div>
          <Hint className="mt-2">
            Waiting for the code texted to{' '}
            <span className="font-semibold text-ink">{profile.pendingPhone}</span>.
          </Hint>
        </>
      )}

      {profile.phone && profile.phoneVerified && (
        <Hint className="mt-2">
          <span className="font-semibold text-ink">{profile.phone}</span> is
          confirmed.{' '}
          <button
            type="submit"
            form={PHONE_REMOVE_FORM_ID}
            className="underline"
            disabled={busy}
          >
            Remove it
          </button>
        </Hint>
      )}
    </div>
  )
}
