import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { Badge, Button, Card, Icon, Panel } from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import { SettingsHeader } from '../components/SettingsHeader'
import {
  AUDIT_EVENTS,
  AUDIT_ICONS,
  RECOVERY_CODES,
  SESSIONS,
  TWOFA_OTPAUTH,
  TWOFA_SECRET_DISPLAY,
} from '../data/security'

/** A password input with a show/hide reveal button, mirroring the kit's
 *  data-reveal handler (hgi-view ↔ hgi-view-off). */
function PasswordField({ label, hint }: { label: string; hint?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="••••••••" />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
          title="Show password"
        >
          <i className={cn('hgi-stroke', show ? 'hgi-view-off' : 'hgi-view', 'text-[16px]')} />
        </button>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export default function SettingsSecurityPage() {
  const passwordPanel = useDisclosure()
  const twofaPanel = useDisclosure()
  const auditPanel = useDisclosure()

  const [twofaOn, setTwofaOn] = useState(true)
  const [copied, setCopied] = useState(false)

  const qrSvg = useMemo(() => {
    const q = qrcode(0, 'M')
    q.addData(TWOFA_OTPAUTH)
    q.make()
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true })
  }, [])

  // Toggle 2FA: turning off is immediate; turning on runs the setup flow first.
  const onTwofaToggle = () => {
    if (twofaOn) setTwofaOn(false)
    else twofaPanel.onOpen()
  }

  const copyKey = () => {
    try {
      void navigator.clipboard.writeText(TWOFA_SECRET_DISPLAY.replace(/\s/g, ''))
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      <SettingsHeader
        title="Security"
        subtitle="Password, two-factor authentication and sessions."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* security actions */}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <Icon name="hgi-shield-key" size={17} className="text-muted" />
            Security
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-canvas px-3.5 py-3">
              <span>
                <span className="block text-[13px] font-medium text-ink">Password</span>
                <span className="block text-[11px] text-muted">Last changed 3 months ago</span>
              </span>
              <Button variant="soft" size="sm" className="shrink-0" onClick={passwordPanel.onOpen}>
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-canvas px-3.5 py-3">
              <span>
                <span className="block text-[13px] font-medium text-ink">
                  Two-factor authentication
                </span>
                <span className="block text-[11px] text-muted">
                  Require a one-time code at sign-in
                </span>
              </span>
              <button
                type="button"
                onClick={onTwofaToggle}
                aria-label="Toggle two-factor authentication"
                className={cn(
                  'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                  twofaOn ? 'bg-brand' : 'bg-line',
                )}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full bg-white shadow transition-transform',
                    twofaOn ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-hair bg-canvas px-3.5 py-3">
              <span>
                <span className="block text-[13px] font-medium text-ink">Audit log</span>
                <span className="block text-[11px] text-muted">
                  Sign-ins, permission changes &amp; exports
                </span>
              </span>
              <Button variant="soft" size="sm" className="shrink-0" onClick={auditPanel.onOpen}>
                View log
              </Button>
            </div>
          </div>
        </Card>

        {/* active sessions */}
        <Card className="p-5">
          <h2 className="text-[15px] font-bold tracking-tight">Active sessions</h2>
          <div className="mt-1 divide-y divide-line">
            {SESSIONS.map((s) => (
              <div
                key={s.device}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-line text-muted">
                  <Icon name="hgi-smart-phone-01" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{s.device}</p>
                  <p className="text-[11px] text-muted">{s.meta}</p>
                </div>
                {s.current ? (
                  <Badge tone="green" className="shrink-0">
                    This device
                  </Badge>
                ) : (
                  <Button variant="soft" size="sm" className="shrink-0">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Change password panel */}
      <Panel
        open={passwordPanel.open}
        onClose={passwordPanel.onClose}
        title="Change password"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={passwordPanel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={passwordPanel.onClose}>
              Update password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <PasswordField label="Current password" />
          <PasswordField
            label="New password"
            hint="At least 8 characters, with a number and a symbol."
          />
          <PasswordField label="Confirm new password" />
        </div>
      </Panel>

      {/* Two-factor setup panel */}
      <Panel
        open={twofaPanel.open}
        onClose={twofaPanel.onClose}
        title="Set up two-factor authentication"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={twofaPanel.onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                setTwofaOn(true)
                twofaPanel.onClose()
              }}
            >
              <Icon name="hgi-shield-key" size={16} />
              Enable 2FA
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[12.5px] leading-relaxed text-muted">
            Scan the QR code with an authenticator app —{' '}
            <span className="font-medium text-ink">Google Authenticator, 1Password or Authy</span> —
            then enter the 6-digit code to finish.
          </p>
          <div className="flex justify-center">
            <div className="rounded-xl border border-hair bg-white p-3">
              <div className="h-40 w-40" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
          </div>
          <div>
            <label className="label">Can't scan? Enter this key</label>
            <div className="flex items-center gap-2 rounded-lg border border-hair bg-canvas px-3 py-2">
              <code className="flex-1 select-all font-mono text-[13px] tracking-wider text-ink">
                {TWOFA_SECRET_DISPLAY}
              </code>
              <button type="button" onClick={copyKey} className="btn-icon" title="Copy key">
                <i
                  className={cn(
                    'hgi-stroke text-[16px]',
                    copied ? 'hgi-tick-02 text-brand' : 'hgi-copy-01',
                  )}
                />
              </button>
            </div>
          </div>
          <div>
            <label className="label">Enter the 6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="input text-center text-[16px] font-semibold tracking-[0.4em] tnum"
              placeholder="000000"
            />
          </div>
          <div className="rounded-lg border border-hair bg-canvas p-3">
            <p className="text-[12px] font-semibold text-ink">Recovery codes</p>
            <p className="mt-0.5 text-[11px] text-muted">
              Save these somewhere safe. Each can be used once if you lose your device.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[12px] text-ink tnum">
              {RECOVERY_CODES.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <Button variant="soft" size="sm" className="mt-2.5">
              <Icon name="hgi-download-01" size={14} />
              Download codes
            </Button>
          </div>
        </div>
      </Panel>

      {/* Audit log panel */}
      <Panel
        open={auditPanel.open}
        onClose={auditPanel.onClose}
        title="Audit log"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={auditPanel.onClose}>
              Close
            </Button>
            <Button variant="primary" className="flex-1" onClick={auditPanel.onClose}>
              <Icon name="hgi-download-01" size={16} />
              Export log
            </Button>
          </>
        }
      >
        <div className="divide-y divide-line">
          {AUDIT_EVENTS.map((e, idx) => {
            const ic = AUDIT_ICONS[e.t]
            return (
              <div key={idx} className="flex items-start gap-3 py-3 first:pt-0">
                <span
                  className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', ic.c)}
                >
                  <i className={cn('hgi-stroke', ic.i, 'text-[16px]')} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{e.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{e.meta}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-muted">{e.time}</span>
              </div>
            )
          })}
        </div>
      </Panel>
    </>
  )
}
