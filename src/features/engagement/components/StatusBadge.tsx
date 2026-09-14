import { Badge, type BadgeTone } from '@/components/ui'
import type { FeedbackStatus } from '../data/feedback'

/* Survey/event status pill — the static kit's STATUS map (tone + icon). */

const STATUS: Record<FeedbackStatus, { tone: BadgeTone; icon: string }> = {
  Live: { tone: 'green', icon: 'hgi-tick-02' },
  Closed: { tone: 'gray', icon: 'hgi-time-quarter-pass' },
  Draft: { tone: 'gray', icon: 'hgi-note-edit' },
}

export function StatusBadge({
  status,
  className,
}: {
  status: FeedbackStatus
  className?: string
}) {
  const st = STATUS[status] ?? STATUS.Draft
  return (
    <Badge tone={st.tone} icon={st.icon} className={className}>
      {status}
    </Badge>
  )
}
