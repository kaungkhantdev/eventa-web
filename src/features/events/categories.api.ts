import { api, type Query } from '@/lib/api'
import type { CategoryWire, Tone } from './types'

/**
 * What the create/edit panel sends. `description` is nullable rather than
 * optional: `null` clears it, while leaving the key out would mean "unchanged".
 */
export interface CategoryInput {
  name: string
  icon: string
  color: Tone
  description: string | null
}

export interface ListCategoriesQuery extends Query {
  page?: number
  limit?: number
  q?: string
  sort?: 'name' | 'recent'
}

/** Every call the categories screen makes (US-EVT-08). */
export const categoriesApi = {
  list: (query: ListCategoriesQuery) => api.list<CategoryWire>('/categories', { query }),

  create: (input: CategoryInput) => api.post<CategoryWire>('/categories', input),

  /** `version` is the row the panel was opened on — a stale edit is refused. */
  update: (id: number, input: CategoryInput & { version: number }) =>
    api.patch<CategoryWire>(`/categories/${id}`, input),

  remove: (id: number) => api.delete<void>(`/categories/${id}`),
}
