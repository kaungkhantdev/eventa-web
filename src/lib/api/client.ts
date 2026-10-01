import { ApiError, NetworkError } from './ApiError'
import type { FailureEnvelope, Page, SuccessEnvelope } from './envelope'
import { EMPTY_META } from './envelope'
import { session } from './session'

/** Where the API lives. Set `VITE_API_URL` per environment; see `.env.example`. */
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '')

export type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  query?: Query
  body?: unknown
  signal?: AbortSignal
  /** Skip the Authorization header — login and refresh, which have no token yet. */
  anonymous?: boolean
}

/**
 * The one place the app talks to eventa-api.
 *
 * Three things happen here so that no page has to think about them:
 *
 * 1. **The envelope is unwrapped.** Callers get `data`, or a `{items, meta}`
 *    for a list — never `response.data.data`.
 * 2. **Failures become `ApiError`.** Every non-2xx throws, so a loader that
 *    returns has succeeded, and React Router's `errorElement` catches the rest.
 *    A page only writes the happy path.
 * 3. **An expired access token is renewed once, transparently.** A 401 triggers
 *    a single refresh — shared between every request that raced into the same
 *    401, see `refreshing` — and the original request is replayed. If the
 *    refresh itself fails the session ends, and the router's guard takes over.
 */
export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    request<T>('GET', path, options),

  /** A list endpoint: returns the rows and the `meta` beside them. */
  async list<T>(path: string, options: RequestOptions = {}): Promise<Page<T>> {
    const envelope = await send<T[]>('GET', path, options)
    return { items: envelope.data ?? [], meta: envelope.meta ?? EMPTY_META }
  },

  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    request<T>('POST', path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    request<T>('PATCH', path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    request<T>('PUT', path, { ...options, body }),

  delete: <T>(path: string, options: RequestOptions = {}) =>
    request<T>('DELETE', path, options),

  /**
   * A file endpoint — the CSV, Excel and PDF exports, and the SVG invoices.
   *
   * Fetched rather than linked to with an `<a href>`, because these routes are
   * behind the same bearer token as everything else and a plain link sends no
   * Authorization header: the browser would follow it to a 401 and show the
   * organizer a blank page instead of their spreadsheet. Refresh-and-replay
   * applies here as well, so an export never fails just because the access
   * token aged out while the page was open.
   */
  async download(path: string, options: RequestOptions = {}): Promise<Blob> {
    const response = await dispatch('GET', path, options)
    if (response.ok) return response.blob()
    if (response.status === 401 && session.refreshToken() && (await renewAccess())) {
      const replay = await dispatch('GET', path, options)
      if (replay.ok) return replay.blob()
      throw await toError(replay)
    }
    throw await toError(response)
  },
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions,
): Promise<T> {
  return (await send<T>(method, path, options)).data
}

async function send<T>(
  method: string,
  path: string,
  options: RequestOptions,
): Promise<SuccessEnvelope<T>> {
  const response = await dispatch(method, path, options)
  if (response.ok) return parse<T>(response)
  // Only a token that has gone stale is worth retrying, and only once: an
  // anonymous call has nothing to renew, and a 401 on the replay is a real one.
  if (response.status === 401 && !options.anonymous && session.refreshToken()) {
    const renewed = await renewAccess()
    if (renewed) {
      const replay = await dispatch(method, path, options)
      if (replay.ok) return parse<T>(replay)
      throw await toError(replay)
    }
    session.end()
  }
  throw await toError(response)
}

async function dispatch(
  method: string,
  path: string,
  options: RequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = options.anonymous ? null : session.accessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(BASE_URL + path + queryString(options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (cause) {
    // `fetch` rejects only when the request never completed. An AbortError is
    // the app's own doing (a superseded navigation) and must stay abort-shaped
    // so React Router can ignore it rather than render an error page.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new NetworkError(cause)
  }
}

/**
 * One refresh at a time. Several requests can hit a 401 in the same tick — a
 * dashboard fires six — and each starting its own refresh would race, with the
 * losers replaying against a token the winner had already rotated away.
 */
let refreshing: Promise<boolean> | null = null

function renewAccess(): Promise<boolean> {
  refreshing ??= performRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = session.refreshToken()
  if (!refreshToken) return false
  try {
    const response = await dispatch('POST', '/auth/refresh', {
      body: { refreshToken },
      anonymous: true,
    })
    if (!response.ok) return false
    const envelope = await parse<{ accessToken: string; refreshToken?: string }>(response)
    session.renew(envelope.data.accessToken, envelope.data.refreshToken)
    return true
  } catch {
    return false
  }
}

async function parse<T>(response: Response): Promise<SuccessEnvelope<T>> {
  // 204 and an empty body are successes with nothing to say.
  if (response.status === 204) return emptyEnvelope<T>(response.status)
  const text = await response.text()
  if (!text) return emptyEnvelope<T>(response.status)
  return JSON.parse(text) as SuccessEnvelope<T>
}

function emptyEnvelope<T>(statusCode: number): SuccessEnvelope<T> {
  return {
    success: true,
    statusCode,
    message: '',
    data: null as T,
    timestamp: new Date().toISOString(),
  }
}

async function toError(response: Response): Promise<ApiError> {
  let body: Partial<FailureEnvelope> = {}
  try {
    body = (await response.json()) as Partial<FailureEnvelope>
  } catch {
    /* A gateway or proxy failure with an HTML body — the status still tells us. */
  }
  return new ApiError(response.status, body)
}

function queryString(query: Query | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    // Absent and empty both mean "no filter" — sending `?search=` would ask the
    // API to match the empty string rather than to skip the clause.
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}
