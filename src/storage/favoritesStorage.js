const STORAGE_KEY = 'books-app-zayats-favorites'

const CHANGED = 'favorites:changed'

function readRaw() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return []
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function notify() {
  window.dispatchEvent(
    new CustomEvent(CHANGED, {
      detail: { count: readRaw().length },
    }),
  )
}

/** @returns {object[]} */
export function getFavorites() {
  return readRaw()
}

/** @param {string | null | undefined} id */
export function isFavorite(id) {
  if (!id) return false
  return readRaw().some((b) => b.id === id)
}

/** @param {{ id?: string, title?: string, author?: string | null, year?: number | null, coverId?: number | null, coverUrl?: string | null }} book */
export function normalizeFavoriteBook(book) {
  if (!book?.id) return null
  return {
    id: book.id,
    title: book.title ?? 'Untitled',
    author: book.author ?? null,
    year: book.year ?? null,
    coverId: book.coverId ?? null,
    coverUrl: book.coverUrl ?? null,
  }
}

/** @param {object} book */
export function addFavorite(book) {
  const b = normalizeFavoriteBook(book)
  if (!b) return
  const rest = readRaw().filter((x) => x.id !== b.id)
  writeRaw([b, ...rest])
  notify()
}

/** @param {string} id */
export function removeFavorite(id) {
  if (!id) return
  const next = readRaw().filter((x) => x.id !== id)
  writeRaw(next)
  notify()
}

/** @param {object} book */
export function toggleFavorite(book) {
  if (!book?.id) return
  if (isFavorite(book.id)) {
    removeFavorite(book.id)
  } else {
    addFavorite(book)
  }
}

export const FAVORITES_CHANGED_EVENT = CHANGED
