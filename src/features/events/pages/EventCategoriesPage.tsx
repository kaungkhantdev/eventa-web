import { useMemo, useState } from 'react'
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
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COLOR_KEYS,
  type Category,
  type CategoryColor,
} from '../data/categories'

type ViewMode = 'grid' | 'list'
type SortMode = 'name' | 'count-desc' | 'count-asc'

function CategoryTile({
  color,
  icon,
  sizeClass,
  iconPx,
  shadow = true,
}: {
  color: CategoryColor
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
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('name')
  const [view, setView] = useState<ViewMode>('grid')

  const panel = useDisclosure()

  // Create-panel form state.
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selIcon, setSelIcon] = useState<string>('hgi-new-releases')
  const [selColor, setSelColor] = useState<CategoryColor>('pink')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const mapped = categories
      .map((c, i) => ({ c, i }))
      .filter((x) => !q || (x.c.name + ' ' + x.c.desc).toLowerCase().indexOf(q) !== -1)
    mapped.sort((a, b) => {
      if (sort === 'count-desc') return b.c.count - a.c.count
      if (sort === 'count-asc') return a.c.count - b.c.count
      return a.c.name.localeCompare(b.c.name)
    })
    return mapped
  }, [categories, query, sort])

  function removeCategory(i: number) {
    setCategories((prev) => prev.filter((_, idx) => idx !== i))
  }

  function resetForm() {
    setName('')
    setDesc('')
    setSelIcon('hgi-new-releases')
    setSelColor('pink')
  }

  function saveCategory() {
    setCategories((prev) => [
      ...prev,
      {
        name: name.trim() || 'New category',
        desc: desc.trim() || 'No description yet.',
        icon: selIcon,
        color: selColor,
        count: 0,
      },
    ])
    resetForm()
    panel.onClose()
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
            <Button variant="primary" className="shrink-0" onClick={panel.onOpen}>
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search categories…"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <i className="hgi-stroke hgi-arrow-up-down text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
            aria-label="Sort categories"
          >
            <option value="name">Name A–Z</option>
            <option value="count-desc">Most events</option>
            <option value="count-asc">Fewest events</option>
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start rounded-lg bg-surface p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={viewBtn(view === 'grid')}
            title="Grid view"
          >
            <Icon name="hgi-grid-view" size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={viewBtn(view === 'list')}
            title="List view"
          >
            <Icon name="hgi-list-view" size={16} />
          </button>
        </div>
      </div>

      <p className="mb-2 mt-3 text-[12px] text-muted">
        {list.length} {list.length === 1 ? 'category' : 'categories'}
      </p>

      {list.length === 0 ? (
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
          {list.map(({ c, i }) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between">
                <CategoryTile color={c.color} icon={c.icon} sizeClass="h-12 w-12" iconPx={24} />
                <RowActions onEdit={panel.onOpen} onDelete={() => removeCategory(i)} />
              </div>
              <p className="mt-3 text-[15px] font-bold text-ink">{c.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{c.desc}</p>
              <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[12px] text-muted">
                <Icon name="hgi-calendar-03" size={14} />
                <span className="font-semibold text-ink tnum">{c.count}</span> events
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map(({ c, i }) => (
            <Card key={i} className="flex items-center gap-3 p-3">
              <CategoryTile color={c.color} icon={c.icon} sizeClass="h-11 w-11" iconPx={21} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink">{c.name}</p>
                <p className="truncate text-[12px] text-muted">{c.desc}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 text-[12px] text-muted sm:flex">
                <Icon name="hgi-calendar-03" size={14} />
                <span className="font-semibold text-ink tnum">{c.count}</span> events
              </div>
              <RowActions onEdit={panel.onOpen} onDelete={() => removeCategory(i)} />
            </Card>
          ))}
        </div>
      )}

      <PageFooter />

      {/* Create / edit category panel */}
      <Panel
        open={panel.open}
        onClose={panel.onClose}
        title="New category"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={panel.onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={saveCategory}>
              <Icon name="hgi-add-01" size={15} />
              Save category
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Category name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Birthday"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description of this category…"
            />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICONS.map((ic) => {
                const on = ic === selIcon
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setSelIcon(ic)}
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
                const on = col === selColor
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelColor(col)}
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
              <CategoryTile
                color={selColor}
                icon={selIcon}
                sizeClass="h-11 w-11"
                iconPx={21}
                shadow={false}
              />
              <p className="text-[14px] font-bold text-ink">{name.trim() || 'New category'}</p>
            </div>
          </div>
        </div>
      </Panel>

      {/* tailwind JIT safelist for dynamic category colours */}
      <div
        aria-hidden="true"
        className="hidden bg-pink-500 bg-blue-500 bg-amber-500 bg-brand bg-violet-500 bg-indigo-500 bg-teal-500 bg-red-500 bg-orange-500 bg-cyan-500"
      />
    </>
  )
}
