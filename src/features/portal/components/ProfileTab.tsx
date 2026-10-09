import { useId, useRef, useState } from 'react'
import { useFetcher, useRevalidator } from 'react-router'
import { Badge, Hint, Icon } from '@/components/ui'
import { messageOf } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import { EMAIL_CHANGE_INTENT } from '../myEvents.routes'
import { profileApi } from '../profile.api'
import { PHOTO_ACCEPT_ATTRIBUTE, checkProfilePhoto } from '../profile.photo'
import type { AttendeeProfileCard } from '../profile.types'

/**
 * "My Account" → Profile (US-DISC-11), lifted out of `MyEventsPage` whole.
 *
 * The markup is the kit's (`portal/my-events.html`), class string for class
 * string. What changed is that there is now something behind it: it was ported
 * with a person already in it — a surname, a phone number, a city, a date of
 * birth, a bio, "12 events attended" and the initials "AP" — on inputs nothing
 * read and buttons nothing was wired to. An attendee could edit their details,
 * press Save and watch nothing happen, so the phone number an organizer needs
 * never arrived.
 *
 * Three things are gone rather than wired, because the API holds no such field
 * and a plausible number on somebody's own profile is a claim this app cannot
 * support: the Interests list, "Events attended" and "Member since".
 */

/**
 * The email-change form's id, named once because three elements have to agree
 * on it: the form, the box the kit left in the details grid, and its button.
 *
 * A fixed id rather than `useId()`, as the checkout page's `form="booking"`
 * already does — there is one Profile tab on one page, and the id has to be
 * quotable in a `form=` attribute.
 */
const EMAIL_FORM_ID = 'portal-profile-email'

export function ProfileTab({ profile }: { profile: AttendeeProfileCard }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <PhotoCard profile={profile} />
      <DetailsCard profile={profile} />
    </div>
  )
}

/* ------------------------------- the photo ------------------------------- */

/**
 * Choosing and clearing the profile photo (criterion 4).
 *
 * Three steps, because the bytes never pass through this app or the API: ask
 * for a signed URL, PUT the file to storage, then confirm. A file this app will
 * not send is reported and nothing else happens — no request is made, so the
 * photo already on the profile is still there.
 */
function usePhotoUpload() {
  const revalidator = useRevalidator()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** The loader owns this record; re-read it rather than keeping a copy. */
  async function done(message: string): Promise<void> {
    await revalidator.revalidate()
    toast.success(message)
  }

  async function run(act: () => Promise<void>): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      await act()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  async function upload(chosen: File): Promise<void> {
    const checked = checkProfilePhoto(chosen)
    // Refused before anything is sent, so there is nothing to undo.
    if (!checked.accepted) {
      setError(checked.reason)
      return
    }
    await run(async () => {
      const issued = await profileApi.photoUploadUrl(chosen.type, chosen.size)
      await profileApi.sendPhotoBytes(issued, chosen)
      await profileApi.confirmPhoto(issued.key)
      await done('Photo updated.')
    })
  }

  const remove = () =>
    run(async () => {
      await profileApi.removePhoto()
      await done('Photo removed.')
    })

  return { busy, error, upload, remove }
}

function PhotoCard({ profile }: { profile: AttendeeProfileCard }) {
  const file = useRef<HTMLInputElement>(null)
  const photo = usePhotoUpload()

  return (
    <div className="card p-5">
      <p className="text-[13px] font-bold tracking-tight">Profile photo</p>
      <div className="mt-3 flex items-center gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          /* The kit's gradient tile, with the signed-in person's own initials
             in place of its hard-coded "AP". */
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-emerald-400 text-[26px] font-bold text-white">
            {profile.initials}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-soft btn-sm"
              disabled={photo.busy}
              onClick={() => file.current?.click()}
            >
              <Icon name="hgi-image-upload-01" size={15} />
              Upload
            </button>
            {/* Only when there is one to remove: a control that deletes nothing
                is a promise the card cannot keep. */}
            {profile.avatarUrl && (
              <button
                type="button"
                disabled={photo.busy}
                onClick={() => void photo.remove()}
                className="text-[12px] font-medium text-muted transition hover:text-red-500"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">JPG or PNG · Max 5MB</p>
        </div>
      </div>

      {photo.busy && <p className="mt-2 text-[12px] text-muted">Working…</p>}
      {photo.error && (
        <p role="alert" className="mt-2 text-[13px] text-red-500">
          {photo.error}
        </p>
      )}

      {/* Hidden, and opened by the button above, which is a real button and so
          reachable by keyboard. `accept` comes from the same allow-list the
          check uses, so the picker offers exactly what will be taken. */}
      <input
        ref={file}
        type="file"
        accept={PHOTO_ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0]
          // Cleared first: picking the same file twice must fire again.
          e.target.value = ''
          if (chosen) void photo.upload(chosen)
        }}
      />

      <div className="mt-4 border-t border-hair pt-4">
        <h3 className="text-[15px] font-bold tracking-tight">{profile.name}</h3>
        <p className="text-[12px] text-muted">{profile.email}</p>
      </div>
      <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
        {/* The kit read "Verified · Email", which is only true half the time.
            The subject is the address and the badge is its state, as the
            organizer console's profile screen already puts it. */}
        <p className="flex items-center justify-between">
          <span className="text-muted">Email</span>
          <Badge tone={profile.emailStatus.tone}>
            {profile.emailVerified && <i className="hgi-stroke hgi-tick-02 text-[11px]" />}
            {profile.emailStatus.label}
          </Badge>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------ the details ------------------------------ */

/**
 * What the form was loaded with, as one string.
 *
 * The boxes are uncontrolled, so they keep whatever has been typed into them.
 * Keying the form on this re-mounts them — restoring the loaded values — both
 * when Cancel asks for them back and when a save returns a record the server
 * has normalised. Nothing is copied into state: this is derived from the
 * loader's own data every render.
 *
 * `pendingEmail` is deliberately NOT in here, although the email box does have
 * to reset when it changes. This signature keys the whole details form, and a
 * requested email change revalidates the loader while somebody may be part-way
 * through typing a phone number and a bio: remounting on it discarded every
 * unsaved edit in the form, with no warning and no way to get the text back.
 * The email box resets on its own instead — see the `key` on its input.
 */
function loadedSignature(profile: AttendeeProfileCard): string {
  const { email, name, phone, city, dateOfBirth, bio } = profile
  return [email, name, phone, city, dateOfBirth, bio].join('\u0000')
}

function DetailsCard({ profile }: { profile: AttendeeProfileCard }) {
  const id = useId()
  const save = useFetcher<ActionResult>()
  const email = useFetcher<ActionResult>()
  const [discards, discard] = useState(0)

  const error = save.data?.ok === false ? save.data.error : null
  useSavedToast(save.state === 'idle' && save.data?.ok === true, 'Profile saved.')
  useFailureToast(save.state === 'idle' ? error : null)

  return (
    <div className="card p-5">
      <h3 className="text-[14px] font-bold tracking-tight">Personal information</h3>
      <p className="mt-0.5 text-[12px] text-muted">
        Update your details so organizers can reach you.
      </p>

      {/* Its own request, so its own form — and outside the details form
          because forms cannot nest. The box itself stays where the kit put it,
          in the grid below, and names this one with `form=`. */}
      <email.Form method="post" id={EMAIL_FORM_ID}>
        <input type="hidden" name="intent" value={EMAIL_CHANGE_INTENT} />
      </email.Form>

      <save.Form method="post" key={`${loadedSignature(profile)}#${discards}`}>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Across the row: the kit's "Last name" is gone, because the API
              holds one `name` and two boxes writing one field would quietly
              discard whichever was read second. */}
          <div className="sm:col-span-2">
            <label className="label" htmlFor={`${id}-name`}>
              Name
            </label>
            <input
              id={`${id}-name`}
              className="input"
              name="name"
              required
              autoComplete="name"
              defaultValue={profile.name}
            />
          </div>
          <EmailField profile={profile} fieldId={`${id}-email`} fetcher={email} />
          <div>
            <label className="label" htmlFor={`${id}-phone`}>
              Phone
            </label>
            <input
              id={`${id}-phone`}
              className="input"
              type="tel"
              name="phone"
              autoComplete="tel"
              defaultValue={profile.phone}
            />
            {/*
             * Said plainly because the number goes live the moment it saves.
             * US-DISC-11 asks for a confirm-by-code step before it is used for
             * texts, and there is no endpoint for one — eventa-api has no
             * phone-verification route, and `UpdateProfileDto` takes the string
             * straight through. Until that exists, the honest thing is to tell
             * the reader what actually happens rather than leave the one field
             * with a missing step as the only one that explains nothing.
             */}
            <Hint className="mt-1">
              Used for texts about your bookings as soon as you save it.
            </Hint>
          </div>
          <div>
            <label className="label" htmlFor={`${id}-city`}>
              City
            </label>
            <input
              id={`${id}-city`}
              className="input"
              name="city"
              defaultValue={profile.city}
            />
          </div>
          <div>
            <label className="label" htmlFor={`${id}-dob`}>
              Date of birth
            </label>
            <input
              id={`${id}-dob`}
              className="input"
              type="date"
              name="dateOfBirth"
              defaultValue={profile.dateOfBirth}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor={`${id}-bio`}>
              Bio
            </label>
            <textarea
              id={`${id}-bio`}
              className="textarea"
              rows={3}
              name="bio"
              placeholder="Tell organizers a bit about yourself…"
              defaultValue={profile.bio}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[13px] text-red-500">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
          {/* Criterion 1: throw away what has been typed and show what was
              loaded. Re-mounting the fields is the whole of it — there is no
              draft kept anywhere to clear. */}
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() => discard((n) => n + 1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={save.state !== 'idle'}
          >
            <Icon name="hgi-tick-02" size={15} />
            {save.state === 'idle' ? 'Save changes' : 'Saving…'}
          </button>
        </div>
      </save.Form>
    </div>
  )
}

/**
 * Moving the address you sign in with (criterion 2).
 *
 * The kit's box was `readOnly`, which left no way to change it at all. It is an
 * ordinary field now, but not part of the save: the API emails a link to the
 * NEW address and the old one goes on working until that link is opened, so
 * this asks for the change and never applies it. The wording is the organizer
 * console's, which says the same thing about the same endpoint.
 */
function EmailField({
  profile,
  fieldId,
  fetcher,
}: {
  profile: AttendeeProfileCard
  fieldId: string
  /** Owned by the card above, because the form element lives outside this cell. */
  fetcher: ReturnType<typeof useFetcher<ActionResult>>
}) {
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  useSavedToast(
    fetcher.state === 'idle' && fetcher.data?.ok === true,
    'Check the new address for a link.',
  )
  useFailureToast(fetcher.state === 'idle' ? error : null)

  return (
    <div>
      <label className="label" htmlFor={fieldId}>
        Email
      </label>
      {/*
       * Keyed on `pendingEmail` so this ONE box resets when a change is
       * requested, rather than the whole details form.
       *
       * It has to reset: `email` is untouched until the link is opened, so
       * without it the box would go on showing the address somebody just typed
       * — one that does not sign in yet — directly above the line saying the
       * old one is still the one that works. Resetting only here keeps that
       * correction while leaving a half-typed phone number and bio alone.
       */}
      <input
        key={profile.pendingEmail ?? ''}
        id={fieldId}
        className="input"
        type="email"
        name="email"
        form={EMAIL_FORM_ID}
        required
        autoComplete="email"
        defaultValue={profile.email}
      />
      <Hint className="mt-1">
        You sign in with this. A new address has to be confirmed before it takes over.
      </Hint>

      {profile.pendingEmail && (
        <Hint className="mt-2">
          Waiting for <span className="font-semibold text-ink">{profile.pendingEmail}</span> to be
          confirmed. Until then, <span className="font-semibold text-ink">{profile.email}</span> is
          still the one that works.
        </Hint>
      )}

      <button
        type="submit"
        form={EMAIL_FORM_ID}
        className="btn btn-soft btn-sm mt-2"
        disabled={fetcher.state !== 'idle'}
      >
        {fetcher.state === 'idle' ? 'Send confirmation' : 'Sending…'}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
