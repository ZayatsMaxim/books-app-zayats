const STORAGE_KEY = 'books-app-zayats-last-search'

/**
 * Одна и та же фраза в поле и в snapshot может отличаться пробелами/NBSP — для сравнения без лишнего перезапроса API.
 * @param {string | null | undefined} s
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

/**
 * @returns {{ query: string, firstPage: SearchBook[] } | null}
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
    return { query, firstPage }
  } catch {
    return null
  }
}

/**
 * @param {{ query: string, firstPage: SearchBook[] }} snapshot
 */
export function writeSearchSnapshot({ query, firstPage }) {
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
  let payload
  try {
    payload = JSON.stringify({
      query: q,
      firstPage: Array.isArray(firstPage) ? firstPage : [],
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
