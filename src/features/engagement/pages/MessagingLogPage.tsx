import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  Paginator,
  usePagination,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { DELIVERY_LOG, DELIVERY_CHANNEL, DELIVERY_STATUS } from '../data/deliveryLog'

export default function MessagingLogPage() {
  const pager = usePagination(DELIVERY_LOG)

  return (
    <>
      <PageHeader
        title="Delivery log"
        subtitle="Every individual email & SMS delivery, with its status."
        actions={
          <>
            <Button variant="ghost" className="shrink-0">
              <Icon name="hgi-download-04" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* ============ DELIVERY LOG ============ */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold tracking-tight">Delivery log</h2>
          <p className="text-[12px] text-muted">Delivery history</p>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Status</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.map((r) => {
                const chan = DELIVERY_CHANNEL[r.channel]
                const stat = DELIVERY_STATUS[r.status]
                return (
                  <tr key={r.email + r.time}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar h-8 w-8 text-[11px]">{r.initials}</span>
                        <div className="min-w-0 leading-tight">
                          <p className="font-medium text-ink">{r.name}</p>
                          <p className="text-[11px] text-muted">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{r.type}</td>
                    <td>
                      <span className={cn('badge', chan[0])}>
                        <i className={cn('hgi-stroke', chan[1], 'text-[12px]')} />
                        {chan[2]}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', stat[0])}>
                        <i className={cn('hgi-stroke', stat[1], 'text-[12px]')} />
                        {stat[2]}
                      </span>
                    </td>
                    <td className="text-right text-muted tnum">{r.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="deliveries"
        />
      </Card>

      <PageFooter />
    </>
  )
}
