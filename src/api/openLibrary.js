const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org'
const COVERS_BASE_URL = 'https://covers.openlibrary.org'

function toQuery(params) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    qs.set(key, String(value))
  }
  return qs.toString()
}

/**
 * Builds a cover image URL from a cover ID (cover_i from search docs).
 *
 * size: 'S' | 'M' | 'L'
 */
export function getCoverUrl({ coverId, size = 'M' } = {}) {
  if (!coverId) return null
  return `${COVERS_BASE_URL}/b/id/${encodeURIComponent(coverId)}-${size}.jpg`
}

function normalizeSearchDoc(doc) {
  const coverId = doc?.cover_i ?? null
  return {
    id: doc?.key ?? null, // e.g. "/works/OL82563W"
    title: doc?.title ?? 'Untitled',
    author: Array.isArray(doc?.author_name) ? doc.author_name.join(', ') : null,
    year: doc?.first_publish_year ?? null,
    coverId,
    coverUrl: getCoverUrl({ coverId, size: 'M' }),
  }
}

/** @typedef {'title' | 'author' | 'subject'} SearchMode */

/** @type {readonly SearchMode[]} */
export const SEARCH_MODES = ['title', 'author', 'subject']

/** @param {SearchMode} mode */
function searchQueryParam(mode) {
  if (mode === 'author') return 'author'
  if (mode === 'subject') return 'subject'
  return 'title'
}

/** Набор полей ответа зависит от режима (релевантные Solr-поля). */
/** @param {SearchMode} mode */
function fieldsForMode(mode) {
  const base = 'key,title,author_name,first_publish_year,cover_i,edition_count'
  if (mode === 'author') return `${base},author_key`
  if (mode === 'subject') return `${base},subject`
  return base
}

/**
 * Поиск по Open Library: в запросе один из параметров title / author / subject и свой `fields`.
 *
 * @param {string} query
 * @param {{ mode?: SearchMode, limit?: number, page?: number, signal?: AbortSignal }} [options]
 */
export async function searchBooks(query, { mode = 'title', limit = 24, page = 1, signal } = {}) {
  const q = String(query ?? '').trim()
  if (!q) return []

  const param = searchQueryParam(mode)
  const url =
    `${OPEN_LIBRARY_BASE_URL}/search.json?` +
    toQuery({
      [param]: q,
      page,
      limit,
      fields: fieldsForMode(mode),
    })

  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`OpenLibrary search failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const docs = Array.isArray(data?.docs) ? data.docs : []
  return docs.map(normalizeSearchDoc).filter((b) => b.id)
}

