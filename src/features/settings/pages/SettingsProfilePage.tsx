import { Badge, Button, Card, Icon, Input, Label, Select } from '@/components/ui'
import { SettingsHeader } from '../components/SettingsHeader'

export default function SettingsProfilePage() {
  return (
    <>
      <SettingsHeader
        title="Profile"
        subtitle="Your personal details and how your team can reach you."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* avatar card */}
        <Card className="p-5">
          <p className="text-[13px] font-bold tracking-tight">Profile photo</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-emerald-400 text-[26px] font-bold text-white">
              HN
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
              <p className="mt-2 text-[11px] leading-snug text-muted">JPG or PNG · Max 5MB</p>
            </div>
          </div>
          <div className="mt-4 border-t border-hair pt-4">
            <h3 className="text-[15px] font-bold tracking-tight">Harper Nelson</h3>
            <p className="text-[12px] text-muted">Event Manager · Eventa</p>
          </div>
          <div className="mt-4 space-y-2 border-t border-hair pt-4 text-[12px]">
            <p className="flex items-center justify-between">
              <span className="text-muted">Verified</span>
              <Badge tone="green">
                <Icon name="hgi-tick-02" size={11} />
                Email
              </Badge>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted">Events managed</span>
              <span className="font-semibold tabular-nums">24</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted">Member since</span>
              <span className="font-semibold">Jan 2024</span>
            </p>
          </div>
        </Card>

        {/* details form */}
        <Card className="p-5">
          <h3 className="text-[14px] font-bold tracking-tight">Personal information</h3>
          <p className="mt-0.5 text-[12px] text-muted">
            Update your name and how your team can reach you.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>First name</Label>
              <Input defaultValue="Harper" />
            </div>
            <div>
              <Label>Last name</Label>
              <Input defaultValue="Nelson" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" defaultValue="harper.nelson@eventa.io" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" defaultValue="+66 81 234 5678" />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select defaultValue="(GMT+7) Bangkok, Hanoi, Jakarta">
                <option>(GMT+7) Bangkok, Hanoi, Jakarta</option>
                <option>(GMT+8) Singapore, Kuala Lumpur, Manila</option>
                <option>(GMT+9) Tokyo, Seoul, Osaka</option>
                <option>(GMT+0) London, Lisbon, Dublin</option>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select defaultValue="English">
                <option>English</option>
                <option>ไทย (Thai)</option>
                <option>中文 (Chinese)</option>
                <option>日本語 (Japanese)</option>
              </Select>
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
