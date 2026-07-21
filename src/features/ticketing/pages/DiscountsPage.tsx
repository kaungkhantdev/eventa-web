import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Badge,
  Icon,
  Card,
  DataTable,
  Panel,
  PillTabs,
  Paginator,
  usePagination,
  Label,
  Hint,
  Input,
  Select,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { num } from '@/lib/format'
import { useDisclosure } from '@/lib/useDisclosure'
import { DISCOUNTS, DISCOUNT_STATUS_META } from '../data/discounts'
import { EVENT_PICKER_OPTIONS } from '../data/events'
import type { DiscountStatus } from '../types'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'

type DiscountTab = 'all' | DiscountStatus

const GENERATE_WORDS = ['SAVE', 'PROMO', 'EVENT', 'EARLY', 'FEST', 'BKK'] as const

/** Copy-to-clipboard button with a brief tick confirmation (per-row). */
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const onClick = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1200)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button type="button" className="btn-icon h-7 w-7" title="Copy code" onClick={onClick}>
      <Icon
        name={copied ? 'hgi-tick-02' : 'hgi-copy-01'}
        size={13}
        className={copied ? 'text-brand' : undefined}
      />
    </button>
  )
}

export default function DiscountsPage() {
  const [tab, setTab] = useState<DiscountTab>('all')
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('')

  const codePanel = useDisclosure()
  const delModal = useDisclosure()

  // New-code panel state.
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [active, setActive] = useState(true)

  const counts = useMemo(() => {
    const c: Record<DiscountStatus, number> = { active: 0, scheduled: 0, expired: 0, disabled: 0 }
    for (const d of DISCOUNTS) c[d.status]++
    return c
  }, [])

  const tabs: PillTabItem<DiscountTab>[] = [
    { value: 'all', label: 'All', count: DISCOUNTS.length },
    { value: 'active', label: 'Active', count: counts.active },
    { value: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { value: 'expired', label: 'Expired', count: counts.expired },
    { value: 'disabled', label: 'Disabled', count: counts.disabled },
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DISCOUNTS.filter(
      (d) =>
        (tab === 'all' || d.status === tab) &&
        // A code applying to "All events" always matches a specific-event filter.
        (!eventFilter || d.event === eventFilter || d.event === 'All events') &&
        (!q || d.code.toLowerCase().includes(q) || d.event.toLowerCase().includes(q)),
    )
  }, [tab, query, eventFilter])

  const pag = usePagination(filtered)

  const generateCode = () => {
    const word = GENERATE_WORDS[Math.floor(Math.random() * GENERATE_WORDS.length)]!
    const n = Math.floor(Math.random() * 90) + 10
    setCode(word + n)
  }

  return (
    <>
      <PageHeader
        title="Discounts"
        subtitle="Create promo codes to boost registrations."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={codePanel.onOpen}>
              <Icon name="hgi-add-01" size={16} />
              <span className="hidden sm:inline">New code</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* pill tabs */}
      <PillTabs
        items={tabs}
        value={tab}
        onChange={(t) => {
          setTab(t)
          pag.setPage(1)
        }}
      />

      {/* search + filter */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              pag.setPage(1)
            }}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search codes…"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <i className="hgi-stroke hgi-calendar-03 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
          <select
            value={eventFilter || 'All events'}
            onChange={(e) => {
              setEventFilter(e.target.value === 'All events' ? '' : e.target.value)
              pag.setPage(1)
            }}
            className="select h-10 w-full border-0 bg-surface pl-9 text-[14px] font-semibold"
          >
            {EVENT_PICKER_OPTIONS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <DataTable className="min-w-[860px]">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Applies to</th>
                <th>Used / Limit</th>
                <th>Valid</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pag.slice.map((d) => {
                const meta = DISCOUNT_STATUS_META[d.status]
                const pct = d.limit ? Math.round((d.used / d.limit) * 100) : 0
                return (
                  <tr key={d.code}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[12px] font-semibold uppercase tracking-wide text-ink">
                          {d.code}
                        </span>
                        <CopyCodeButton code={d.code} />
                      </div>
                    </td>
                    <td>
                      {d.type === 'fixed' ? (
                        <Badge tone="blue">฿{d.value} off</Badge>
                      ) : (
                        <Badge tone="purple">{d.value}% off</Badge>
                      )}
                    </td>
                    <td className="text-muted">{d.event}</td>
                    <td>
                      <div className="w-28">
                        <p className="text-[11px] text-muted tnum">
                          {num(d.used)} / {num(d.limit)}
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-line">
                          <div
                            className="h-1.5 rounded-full bg-brand"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-muted tnum">{d.valid}</td>
                    <td>
                      <Badge tone={meta.tone}>
                        <Icon name={meta.icon} size={12} />
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit"
                          onClick={codePanel.onOpen}
                        >
                          <Icon name="hgi-edit-02" size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Delete"
                          onClick={delModal.onOpen}
                        >
                          <Icon name="hgi-delete-02" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pag.slice.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="py-10 text-center text-[13px] text-muted">No matches.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </div>

        <Paginator
          from={pag.from}
          to={pag.to}
          total={pag.total}
          page={pag.page}
          pageCount={pag.pageCount}
          size={pag.size}
          onPage={pag.setPage}
          onSize={pag.setSize}
          noun="discount codes"
        />
      </Card>

      <PageFooter />

      {/* New / edit discount code panel */}
      <Panel
        open={codePanel.open}
        onClose={codePanel.onClose}
        title="New discount code"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={codePanel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={codePanel.onClose}>
              Save code
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Code</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="font-mono uppercase"
                placeholder="e.g. SUMMER25"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button variant="soft" size="sm" className="shrink-0" onClick={generateCode}>
                <Icon name="hgi-refresh" size={14} />
                Generate
              </Button>
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <div className="segmented w-full">
              <button
                type="button"
                className={cn('flex-1', discountType === 'percent' && 'active')}
                onClick={() => setDiscountType('percent')}
              >
                Percent
              </button>
              <button
                type="button"
                className={cn('flex-1', discountType === 'fixed' && 'active')}
                onClick={() => setDiscountType('fixed')}
              >
                Fixed ฿
              </button>
            </div>
          </div>
          {discountType === 'percent' ? (
            <div>
              <Label>Percentage off</Label>
              <div className="relative">
                <Input type="number" min={1} max={100} step={1} className="pr-8" placeholder="25" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                  %
                </span>
              </div>
            </div>
          ) : (
            <div>
              <Label>Amount off</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                  ฿
                </span>
                <Input type="number" min={1} step={1} className="pl-8" placeholder="200" />
              </div>
            </div>
          )}
          <div>
            <Label>Applies to</Label>
            <Select defaultValue="All events">
              {EVENT_PICKER_OPTIONS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Usage limit</Label>
              <Input type="number" min={1} step={1} placeholder="500" />
              <Hint>Total times this code can be redeemed.</Hint>
            </div>
            <div>
              <Label>Per-user limit</Label>
              <Input type="number" min={1} step={1} placeholder="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" />
            </div>
          </div>
          <div>
            <Label>Minimum order (฿)</Label>
            <Input type="number" min={0} step={1} placeholder="0" />
            <Hint>Leave at 0 for no minimum.</Hint>
          </div>
          <div className="flex items-center justify-between border-t border-hair pt-4">
            <div>
              <p className="text-[13px] font-medium text-ink">Active</p>
              <Hint className="mt-0.5">Code can be applied at checkout while on</Hint>
            </div>
            <ToggleSwitch checked={active} onChange={setActive} />
          </div>
        </div>
      </Panel>

      {/* Delete confirm modal */}
      <ConfirmDeleteModal
        open={delModal.open}
        onClose={delModal.onClose}
        title="Delete discount code?"
        message="This will permanently remove the code. Attendees who already redeemed it won't be affected."
      />
    </>
  )
}
