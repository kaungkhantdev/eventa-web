import { Card, Button, Badge, Label, Input, Select, Textarea, Icon } from '@/components/ui'
import { SettingsHeader } from '../components/SettingsHeader'

export default function SettingsOrganizationPage() {
  return (
    <>
      <SettingsHeader title="Organization" subtitle="Your company profile and branding." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* logo card */}
        <Card className="p-5">
          <p className="text-[13px] font-bold tracking-tight">Organization logo</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-emerald-400 text-[28px] font-bold text-white">
              E
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="soft" size="sm">
                  <Icon name="hgi-image-upload-01" size={15} />
                  Upload
                </Button>
                <button
                  type="button"
                  className="text-[12px] font-medium text-muted transition hover:text-red-500"
                >
                  Remove
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted">SVG, PNG or JPG · Max 1MB</p>
            </div>
          </div>
          <div className="mt-4 border-t border-hair pt-4">
            <h3 className="text-[15px] font-bold tracking-tight">Eventa Co., Ltd.</h3>
            <p className="text-[12px] text-muted">Bangkok, Thailand</p>
          </div>
          <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
            <p className="flex items-center justify-between">
              <span className="text-muted">Plan</span>
              <Badge tone="green">Pro</Badge>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted">Events hosted</span>
              <span className="font-semibold tabular-nums">128</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted">Team members</span>
              <span className="font-semibold tabular-nums">8</span>
            </p>
          </div>
        </Card>

        {/* details form */}
        <Card className="p-5">
          <h3 className="text-[14px] font-bold tracking-tight">Organization details</h3>
          <p className="mt-0.5 text-[12px] text-muted">
            Legal business info used on invoices and receipts.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Organization name</Label>
              <Input defaultValue="Eventa Co., Ltd." />
            </div>
            <div>
              <Label>Website</Label>
              <Input type="url" defaultValue="https://eventa.io" />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Textarea rows={3} defaultValue="88 Sukhumvit Rd, Klongtoey, Bangkok 10110, Thailand" />
            </div>
            <div>
              <Label>Currency</Label>
              <Select defaultValue="Thai Baht (฿)">
                <option>Thai Baht (฿)</option>
                <option>US Dollar ($)</option>
                <option>Euro (€)</option>
                <option>Singapore Dollar (S$)</option>
              </Select>
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input defaultValue="0-1055-61234-56-7" />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-hair pt-4">
            <Button variant="soft" size="sm">
              Cancel
            </Button>
            <Button variant="primary" size="sm">
              <Icon name="hgi-tick-02" size={15} />
              Save changes
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
