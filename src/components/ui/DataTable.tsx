import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/* Thin wrappers over the `.data-table` CSS so pages don't repeat the
   overflow/scroll plumbing. Columns stay plain <th>/<td> markup. */

export function TableWrap({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cn('-mx-1 overflow-x-auto px-1', className)} {...rest} />
}

export function DataTable({ className, ...rest }: ComponentProps<'table'>) {
  return <table className={cn('data-table', className)} {...rest} />
}

/** Empty state shown in place of rows when a filter matches nothing. */
export function EmptyRow({
  colSpan,
  icon = 'hgi-search-01',
  title = 'No results',
  hint,
}: {
  colSpan: number
  icon?: string
  title?: string
  hint?: ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center">
        <span className="grid h-11 w-11 mx-auto place-items-center rounded-xl bg-line text-muted">
          <Icon name={icon} size={20} />
        </span>
        <p className="mt-2.5 text-[13px] font-semibold text-ink">{title}</p>
        {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
      </td>
    </tr>
  )
}
