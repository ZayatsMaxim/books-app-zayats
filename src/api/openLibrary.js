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

/**
 * Search books by title using Open Library Search API.
 * Endpoint: GET https://openlibrary.org/search.json?title=...
 */
export async function searchBooksByTitle(title, { limit = 24, page = 1, signal } = {}) {
  const q = String(title ?? '').trim()
  if (!q) return []

  const url =
    `${OPEN_LIBRARY_BASE_URL}/search.json?` +
    toQuery({
      title: q,
      page,
      limit,
      fields: 'key,title,author_name,first_publish_year,cover_i,edition_count',
    })

  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`OpenLibrary search failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const docs = Array.isArray(data?.docs) ? data.docs : []
  return docs.map(normalizeSearchDoc).filter((b) => b.id)
}

