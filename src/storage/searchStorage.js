const STORAGE_KEY = 'books-app-zayats-last-search'

/**
 * Normalize a query string for equality checks.
 * The same phrase can differ by whitespace or NBSP, so this prevents unnecessary refetches.
 *
 * @param {string | null | undefined} s Raw query value (can be null/undefined).
 * @returns {string} Normalized query string.
 */
export function normalizeSearchQueryForCompare(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFKC')
}

/**
 * @typedef {{ id: string, title?: string, author?: string | null, year?: number | null, coverId?: number | null, coverUrl?: string | null }} SearchBook
 */

function readRaw() {
  try {
    let s = localStorage.getItem(STORAGE_KEY)
    if (!s) s = sessionStorage.getItem(STORAGE_KEY)
    return s
  } catch {
    return null
  }
}

const SEARCH_MODE_VALUES = new Set(['title', 'author', 'subject'])

/**
 * Read a persisted search snapshot (used to restore UI state after reload).
 *
 * @returns {{ query: string, firstPage: SearchBook[], searchMode: 'title'|'author'|'subject' } | null}
 */
export function readSearchSnapshot() {
  try {
    const s = readRaw()
    if (!s) return null
    const o = JSON.parse(s)
    if (!o || typeof o.query !== 'string') return null
    const query = o.query.trim()
    if (!query) return null
    if (!Array.isArray(o.firstPage)) return null
    const firstPage = o.firstPage
      .filter((b) => b != null && b.id != null && String(b.id).trim() !== '')
      .map((b) => ({ ...b, id: String(b.id) }))
    const searchMode = SEARCH_MODE_VALUES.has(o.searchMode) ? o.searchMode : 'title'
    return { query, firstPage, searchMode }
  } catch {
    return null
  }
}

/**
 * Persist a search snapshot to localStorage (falls back to sessionStorage on quota errors).
 *
 * @param {{ query: string, firstPage: SearchBook[], searchMode?: 'title'|'author'|'subject' }} snapshot Snapshot payload.
 * @returns {void}
 */
export function writeSearchSnapshot({ query, firstPage, searchMode = 'title' }) {
  const q = String(query ?? '').trim()
  if (!q) {
    try {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  const mode = SEARCH_MODE_VALUES.has(searchMode) ? searchMode : 'title'
  let payload
  try {
    payload = JSON.stringify({
      query: q,
      firstPage: Array.isArray(firstPage) ? firstPage : [],
      searchMode: mode,
    })
  } catch {
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, payload)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    try {
      sessionStorage.setItem(STORAGE_KEY, payload)
    } catch {
      /* quota / private mode */
    }
  }
}

export function clearSearchSnapshot() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
