import { useFetcher, useLoaderData } from 'react-router'
import {
  Button,
  Card,
  FieldError,
  Hint,
  Icon,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import type { ActionResult } from '@/app/loaders'
import { LogoCard } from '../components/LogoCard'
import { SettingsHeader } from '../components/SettingsHeader'
import type { OrganizationData } from '../settings.routes'
import type { OrganizationForm } from '../settings.types'

/**
 * The workspace itself (US-ACC-02).
 *
 * The currency, country and VAT rate are shown but not edited here: they
 * decide how every invoice and receipt this workspace has already issued was
 * calculated, and changing one is not a form field — it is a conversation.
 */

const TIMEZONES = ['Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'UTC']

export default function SettingsOrganizationPage() {
  const { organization, summary } = useLoaderData() as OrganizationData
  const save = useFetcher<ActionResult>()
  const error = save.data?.ok === false ? save.data.error : null
  /**
   * Refusals the API pinned to a field. Those render under their input; the
   * banner below keeps only what belongs to no field in particular — a stale
   * version, a dropped connection.
   */
  const fields = (save.data?.ok === false ? save.data.fieldErrors : undefined) ?? {}
  const unattached = Object.keys(fields).length === 0 ? error : null
  const saved = save.state === 'idle' && save.data?.ok === true
  useSavedToast(saved, 'Organization saved.')
  useFailureToast(save.state === 'idle' ? error : null)

  return (
    <>
      <SettingsHeader title="Organization" subtitle="Your company profile and branding." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Branding first, as the kit orders it. The logo uploads the moment a
            file is chosen rather than on Save, so it stays out of the form. */}
        <div className="space-y-3">
          <LogoCard
            logoUrl={organization.logoUrl}
            name={organization.name}
            country={organization.country}
            summary={summary}
          />
          <FixedFacts organization={organization} />
        </div>

        <Card className="p-5">
          <h3 className="text-[14px] font-bold tracking-tight">Organization details</h3>
          <p className="mt-0.5 text-[12px] text-muted">
            Legal business info used on invoices and receipts.
          </p>

          <save.Form method="post" key={organization.version}>
            {/* Sent back untouched: the API refuses a form opened before
                somebody else's edit rather than letting it overwrite theirs. */}
            <input type="hidden" name="version" value={organization.version} />

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" name="name" required defaultValue={organization.name} aria-describedby={fields.name ? 'org-name-error' : undefined} />
                <FieldError id="org-name-error" message={fields.name} />
              </div>
              <div>
                <Label htmlFor="org-website">Website</Label>
                <Input
                  id="org-website"
                  name="website"
                  type="url"
                  placeholder="https://"
                  defaultValue={organization.website}
                  aria-describedby={fields.website ? 'org-website-error' : undefined}
                />
                <FieldError id="org-website-error" message={fields.website} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="org-address">Address</Label>
                <Textarea id="org-address" name="address" rows={3} defaultValue={organization.address} aria-describedby={fields.address ? 'org-address-error' : undefined} />
                <FieldError id="org-address-error" message={fields.address} />
              </div>
              <div>
                <Label htmlFor="org-currency">Currency</Label>
                {/* The kit offers a picker. This one does not, because the API
                    will not take a change: every invoice and receipt already
                    issued was calculated in it. Shown in the kit's slot, in the
                    state it is actually in, rather than as a control that looks
                    live and silently does nothing. */}
                <Select id="org-currency" value={organization.currency} disabled onChange={() => {}}>
                  <option value={organization.currency}>{organization.currency}</option>
                </Select>
                <Hint>Fixed once money has moved. Contact support to change it.</Hint>
              </div>
              <div>
                <Label htmlFor="org-tax-id">Tax ID</Label>
                <Input id="org-tax-id" name="taxId" defaultValue={organization.taxId} aria-describedby={fields.taxId ? 'org-tax-id-error' : undefined} />
                <FieldError id="org-tax-id-error" message={fields.taxId} />
              </div>
              <div>
                <Label htmlFor="org-timezone">Timezone</Label>
                <Select id="org-timezone" name="timezone" defaultValue={organization.timezone}>
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="org-descriptor">Statement descriptor</Label>
                <Input
                  id="org-descriptor"
                  name="statementDescriptor"
                  maxLength={22}
                  defaultValue={organization.statementDescriptor}
                />
                <Hint>What buyers see on their bank statement.</Hint>
              </div>
            </div>

            {unattached && (
              <p role="alert" className="mt-3 text-[13px] text-red-500">
                {unattached}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
              {/* `reset` rather than a navigation: the form is uncontrolled, so
                  this puts every box back to what the loader supplied. */}
              <Button variant="soft" size="sm" type="reset" disabled={save.state !== 'idle'}>
                Cancel
              </Button>
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

/**
 * The settings that are not a form field.
 *
 * Every invoice and receipt already issued was calculated with these. They are
 * shown so nobody has to guess, and not edited so nobody changes one by
 * accident.
 */
function FixedFacts({ organization }: { organization: OrganizationForm }) {
  // Currency moved into the form, in the kit's slot, so it is not repeated here.
  const facts = [
    { label: 'Workspace', value: organization.slug },
    { label: 'Country', value: organization.country },
    { label: 'VAT rate', value: organization.vatRate },
  ]

  return (
    <Card className="h-fit p-5">
      <p className="text-[13px] font-bold tracking-tight">Billing basis</p>
      <div className="mt-3 space-y-2 border-t border-hair pt-3 text-[12px]">
        {facts.map((fact) => (
          <p key={fact.label} className="flex items-center justify-between gap-2">
            <span className="text-muted">{fact.label}</span>
            <span className="tnum font-semibold text-ink">{fact.value}</span>
          </p>
        ))}
      </div>
      <Hint className="mt-3">
        These decide how every invoice already issued was calculated. Contact support to change one.
      </Hint>
    </Card>
  )
}
