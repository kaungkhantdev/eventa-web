import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Card,
  Panel,
  Label,
  Input,
  Textarea,
  Icon,
} from '@/components/ui'
import type { ActionResult } from '@/app/loaders'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COLOR_KEYS,
  DEFAULT_NEW_CATEGORY,
} from '../categories.presentation'
import { CATEGORY_SORTS, categoryViewOf, type CategoriesData } from '../events.routes'
import type { CategoryCard, Tone } from '../types'

/* admin/event-categories.html — the workspace's categories, with a create/edit
   panel. Search and sort live in the URL; every change is a form post to the
   API, and the list revalidates from the server rather than being patched
   locally, so what is on screen is what was actually stored. */

/** What the API's `q` accepts; longer and it answers 400 instead of a list. */
const MAX_SEARCH_LENGTH = 80

const SORT_LABEL: Record<(typeof CATEGORY_SORTS)[number], string> = {
  name: 'Name A–Z',
  'count-desc': 'Most events',
  'count-asc': 'Fewest events',
}

function CategoryTile({
  color,
  icon,
  sizeClass,
  iconPx,
  shadow = true,
}: {
  color: Tone
  icon: string
  sizeClass: string
  iconPx: number
  shadow?: boolean
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-xl text-white',
        sizeClass,
        CATEGORY_COLORS[color],
        shadow && 'shadow-sm',
      )}
    >
      <Icon name={icon} size={iconPx} />
    </span>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={onEdit}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
        title="Edit category"
      >
        <Icon name="hgi-edit-02" size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/15"
        title="Delete category"
      >
        <Icon name="hgi-delete-02" size={15} />
      </button>
    </div>
  )
}

export default function EventCategoriesPage() {
  const { cards, total } = useLoaderData() as CategoriesData
  const { params, set } = useFilters()
  const filtering = useIsFiltering()
  // Deleting and saving get their own fetchers. A shared one would still be
  // holding the previous success when the panel is opened again, and the panel
  // closes itself on success — so it would shut the moment it was reopened.
  const deleter = useFetcher<ActionResult>()

  const view = categoryViewOf(params)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const panel = useDisclosure()
  const [editing, setEditing] = useState<CategoryCard | null>(null)

  const openNew = () => {
    setEditing(null)
    panel.onOpen()
  }
  const openEdit = (card: CategoryCard) => {
    setEditing(card)
    panel.onOpen()
  }

  const remove = (card: CategoryCard) => {
    deleter.submit({ intent: 'delete', id: String(card.id) }, { method: 'post' })
  }

  const viewBtn = (active: boolean) =>
    cn(
      'grid h-8 w-8 place-items-center rounded-md transition hover:text-ink',
      active ? 'bg-brand-soft text-brand' : 'text-muted',
    )

  return (
    <>
      <PageHeader
        title="Event categories"
        subtitle="Organize events into categories with their own icon & colour."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={openNew}>
              <Icon name="hgi-add-01" />
              <span className="hidden sm:inline">New category</span>
              <span className="sm:hidden">New</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search categories…"
            maxLength={MAX_SEARCH_LENGTH}
            aria-label="Search categories"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <i className="hgi-stroke hgi-arrow-up-down text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={params.get('sort') ?? 'name'}
            onChange={(e) => set({ sort: e.target.value === 'name' ? null : e.target.value })}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
            aria-label="Sort categories"
          >
            {CATEGORY_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABEL[sort]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start rounded-lg bg-surface p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => set({ view: null })}
            className={viewBtn(view === 'grid')}
            title="Grid view"
          >
            <Icon name="hgi-grid-view" size={16} />
          </button>
          <button
            type="button"
            onClick={() => set({ view: 'list' })}
            className={viewBtn(view === 'list')}
            title="List view"
          >
            <Icon name="hgi-list-view" size={16} />
          </button>
        </div>
      </div>

      <p className="mb-2 mt-3 text-[12px] text-muted">
        {total} {total === 1 ? 'category' : 'categories'}
      </p>

      {deleter.data?.error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
        >
          {deleter.data.error}
        </p>
      )}

      <div className={cn(filtering && 'opacity-60 transition-opacity')}>
        {cards.length === 0 ? (
          <div className="mt-2 card flex flex-col items-center justify-center p-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-line text-muted">
              <Icon name="hgi-folder-01" size={22} />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-ink">No categories found</p>
            <p className="mt-1 text-[12px] text-muted">
              Try a different search, or create a new category.
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <CategoryTile color={c.color} icon={c.icon} sizeClass="h-12 w-12" iconPx={24} />
                  <RowActions onEdit={() => openEdit(c)} onDelete={() => remove(c)} />
                </div>
                <p className="mt-3 text-[15px] font-bold text-ink">{c.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{c.description}</p>
                <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[12px] text-muted">
                  <Icon name="hgi-calendar-03" size={14} />
                  <span className="font-semibold text-ink tnum">{c.eventCount}</span> events
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <CategoryTile color={c.color} icon={c.icon} sizeClass="h-11 w-11" iconPx={21} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink">{c.name}</p>
                  <p className="truncate text-[12px] text-muted">{c.description}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-1.5 text-[12px] text-muted sm:flex">
                  <Icon name="hgi-calendar-03" size={14} />
                  <span className="font-semibold text-ink tnum">{c.eventCount}</span> events
                </div>
                <RowActions onEdit={() => openEdit(c)} onDelete={() => remove(c)} />
              </Card>
            ))}
          </div>
        )}
      </div>

      <PageFooter />

      {panel.open && (
        <CategoryPanel
          key={editing?.id ?? 'new'}
          category={editing}
          open={panel.open}
          onClose={panel.onClose}
        />
      )}

      {/* tailwind JIT safelist for dynamic category colours */}
      <div
        aria-hidden="true"
        className="hidden bg-pink-500 bg-blue-500 bg-amber-500 bg-brand bg-violet-500 bg-indigo-500 bg-teal-500 bg-red-500 bg-orange-500 bg-cyan-500"
      />
    </>
  )
}

/**
 * The create/edit panel. It is mounted only while open, so its fetcher starts
 * each time with no result — which is what lets "saved" mean *this* save.
 */
function CategoryPanel({
  category,
  open,
  onClose,
}: {
  category: CategoryCard | null
  open: boolean
  onClose: () => void
}) {
  const fetcher = useFetcher<ActionResult>()
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [icon, setIcon] = useState(category?.icon ?? DEFAULT_NEW_CATEGORY.icon)
  const [color, setColor] = useState<Tone>(category?.color ?? DEFAULT_NEW_CATEGORY.color)
  const saving = fetcher.state !== 'idle'

  // A saved category closes the panel; a refused one stays open with the API's
  // reason above the fields, so nothing typed is lost.
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok) onClose()
  }, [fetcher.state, fetcher.data, onClose])

  const save = () => {
    fetcher.submit(
      {
        intent: category ? 'update' : 'create',
        id: String(category?.id ?? ''),
        version: String(category?.version ?? ''),
        name,
        description,
        icon,
        color,
      },
      { method: 'post' },
    )
  }

  return (
    <Panel
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>
            <Icon name={category ? 'hgi-checkmark-circle-02' : 'hgi-add-01'} size={15} />
            {saving ? 'Saving…' : 'Save category'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {fetcher.data?.error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-600 dark:text-rose-400"
          >
            {fetcher.data.error}
          </p>
        )}
        <div>
          <Label htmlFor="category-name">Category name</Label>
          <Input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Birthday"
          />
        </div>
        <div>
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this category…"
          />
        </div>
        <div>
          <Label>Icon</Label>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICONS.map((ic) => {
              const on = ic === icon
              return (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  aria-pressed={on}
                  className={cn(
                    'grid aspect-square place-items-center rounded-lg border transition',
                    on
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-hair text-muted hover:border-brand/40 hover:text-ink',
                  )}
                >
                  <Icon name={ic} size={18} />
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <Label>Colour</Label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_KEYS.map((col) => {
              const on = col === color
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  aria-pressed={on}
                  className={cn(
                    'h-8 w-8 rounded-full transition',
                    CATEGORY_COLORS[col],
                    on ? 'ring-2 ring-offset-2 ring-ink ring-offset-surface' : 'hover:scale-110',
                  )}
                  title={col}
                />
              )
            })}
          </div>
        </div>
        <div className="rounded-xl bg-canvas p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Preview</p>
          <div className="mt-2 flex items-center gap-3">
            <CategoryTile color={color} icon={icon} sizeClass="h-11 w-11" iconPx={21} shadow={false} />
            <p className="text-[14px] font-bold text-ink">{name.trim() || 'New category'}</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}
