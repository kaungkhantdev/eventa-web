import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ScanFeedback } from '../door.types'

/**
 * What the door just saw.
 *
 * Five outcomes, five things for the person on the door to do — so each gets
 * its own colour and its own sentence, and none of them reads as a generic
 * failure. A refused ticket is not an error; it is an answer.
 */

const LOOKS: Record<ScanFeedback['tone'], { panel: string; icon: string }> = {
  ok: { panel: 'bg-brand text-white', icon: 'hgi-checkmark-circle-02' },
  dupe: { panel: 'bg-amber-500 text-white', icon: 'hgi-alert-02' },
  invalid: { panel: 'bg-slate-700 text-white', icon: 'hgi-help-circle' },
  wrong: { panel: 'bg-violet-600 text-white', icon: 'hgi-calendar-03' },
  void: { panel: 'bg-red-600 text-white', icon: 'hgi-cancel-circle' },
}

export function ScanResult({ feedback }: { feedback: ScanFeedback }) {
  const look = LOOKS[feedback.tone]

  return (
    <div
      // A refusal is announced: the person on the door may be looking at the
      // queue rather than the screen.
      role="status"
      aria-live="polite"
      className={cn('mt-3 flex items-center gap-4 rounded-2xl p-5', look.panel)}
    >
      <Icon name={look.icon} size={34} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-[18px] font-extrabold tracking-tight">{feedback.title}</p>
        <p className="truncate text-[14px] font-semibold opacity-90">{feedback.name}</p>
        {feedback.detail && <p className="text-[12.5px] opacity-80">{feedback.detail}</p>}
      </div>
    </div>
  )
}
