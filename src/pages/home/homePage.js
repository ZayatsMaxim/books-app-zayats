import './homePage.css'
import { BookCard } from '../../components/BookCard/BookCard.js'
import { Favorites } from '../../components/Favorites/Favorites.js'
import { Search } from '../../components/Search/Search.js'
import { searchBooksByTitle } from '../../api/openLibrary.js'
import { FAVORITES_CHANGED_EVENT, isFavorite } from '../../storage/favoritesStorage.js'
import {
  clearSearchSnapshot,
  normalizeSearchQueryForCompare,
  readSearchSnapshot,
  writeSearchSnapshot,
} from '../../storage/searchStorage.js'

import bookCardSkeletonHtml from './html/book-card-skeleton.html?raw'
import booksEmptyHtml from './html/books-empty.html?raw'
import booksErrorHtml from './html/books-error.html?raw'
import booksNotFoundHtml from './html/books-not-found.html?raw'
import homeShellHtml from './html/home.shell.html?raw'

const PROJECT_NAME = 'Books App'
const SEARCH_DEBOUNCE_MS = 350

function getLoadingCardsHtml(count = 12) {
  const chunk = bookCardSkeletonHtml.trim()
  return Array.from({ length: count }, () => chunk).join('')
}

function appendBooks({ root, books, seenIds }) {
  const frag = document.createDocumentFragment()
  for (const book of books) {
    if (!book?.id) continue
    if (seenIds.has(book.id)) continue
    seenIds.add(book.id)
    frag.append(BookCard({ book }))
  }
  root.append(frag)
}

function syncBookmarkButtonsInGrid(grid) {
  if (!grid) return
  for (const card of grid.querySelectorAll('article.book-card[data-work-id]')) {
    const id = card.dataset.workId
    const btn = card.querySelector('.book-card__bookmark')
    const iconEl = btn?.querySelector('.material-icons')
    if (!btn || !iconEl || !id) continue
    const active = isFavorite(id)
    btn.classList.toggle('book-card__bookmark--active', active)
    btn.setAttribute('aria-pressed', String(active))
    btn.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites')
    iconEl.textContent = active ? 'bookmark' : 'bookmark_add'
  }
}

export function mountHomePage(root) {
  root.innerHTML = homeShellHtml.replace('{{PROJECT_NAME}}', PROJECT_NAME)

  const grid = root.querySelector('#booksGrid')
  const loadingHost = root.querySelector('#booksLoadingHost')
  const searchMount = root.querySelector('#heroSearchMount')
  const favoritesMount = root.querySelector('#heroFavoritesMount')
  const favoritesAbort = new AbortController()
  if (favoritesMount) {
    favoritesMount.append(Favorites({ signal: favoritesAbort.signal }))
  }

  window.addEventListener(
    FAVORITES_CHANGED_EVENT,
    () => syncBookmarkButtonsInGrid(grid),
    { signal: favoritesAbort.signal },
  )

  const state = {
    query: '',
    page: 1,
    limit: 12,
    loading: false,
    hasMore: true,
    seenIds: new Set(),
    searchSeq: 0,
    searchAbort: null,
  }

  let searchDebounceId = null

  const snapshot = readSearchSnapshot()
  const restoredQueryKey = snapshot?.query ?? null
  let ignoreInputMatchingRestoredQuery = restoredQueryKey != null

  function abortPendingSearch() {
    state.searchAbort?.abort()
    state.searchAbort = null
    state.searchSeq += 1
  }

  function beginSearchFetchSession() {
    state.searchAbort?.abort()
    state.searchAbort = new AbortController()
    state.searchSeq += 1
    state.loading = false
    return state.searchAbort.signal
  }

  function renderNoQuery() {
    abortPendingSearch()
    state.loading = false
    renderBottomLoading(false)
    grid.classList.remove('books-grid--error', 'books-grid--not-found')
    grid.classList.add('books-grid--empty')
    grid.innerHTML = booksEmptyHtml.trim()
    loadingHost.innerHTML = ''
  }

  function renderNotFound() {
    state.loading = false
    renderBottomLoading(false)
    grid.classList.remove('books-grid--empty', 'books-grid--error')
    grid.classList.add('books-grid--not-found')
    grid.innerHTML = booksNotFoundHtml.trim()
    loadingHost.innerHTML = ''
  }

  function renderError() {
    abortPendingSearch()
    state.loading = false
    renderBottomLoading(false)
    grid.classList.remove('books-grid--empty', 'books-grid--not-found')
    grid.classList.add('books-grid--error')
    grid.innerHTML = booksErrorHtml.trim()
    loadingHost.innerHTML = ''
  }

  function applySearchFromInput(raw) {
    if (
      ignoreInputMatchingRestoredQuery &&
      restoredQueryKey != null &&
      normalizeSearchQueryForCompare(raw) === normalizeSearchQueryForCompare(restoredQueryKey)
    ) {
      return
    }
    if (ignoreInputMatchingRestoredQuery) {
      ignoreInputMatchingRestoredQuery = false
    }

    const q = raw.trim()

    state.query = q
    state.page = 1
    state.seenIds.clear()
    state.hasMore = true

    if (!q) {
      clearSearchSnapshot()
      renderNoQuery()
      return
    }

    beginSearchFetchSession()

    grid.classList.remove('books-grid--empty', 'books-grid--error', 'books-grid--not-found')
    grid.innerHTML = getLoadingCardsHtml(12)
    loadNextPage()
  }

  function scheduleSearchFromInput(raw) {
    const q = raw.trim()
    if (
      ignoreInputMatchingRestoredQuery &&
      restoredQueryKey != null &&
      normalizeSearchQueryForCompare(raw) === normalizeSearchQueryForCompare(restoredQueryKey)
    ) {
      return
    }
    if (ignoreInputMatchingRestoredQuery) {
      ignoreInputMatchingRestoredQuery = false
    }

    if (!q) {
      if (searchDebounceId != null) {
        clearTimeout(searchDebounceId)
        searchDebounceId = null
      }
      applySearchFromInput(raw)
      return
    }
    if (searchDebounceId != null) clearTimeout(searchDebounceId)
    searchDebounceId = setTimeout(() => {
      searchDebounceId = null
      applySearchFromInput(raw)
    }, SEARCH_DEBOUNCE_MS)
  }

  if (snapshot?.query) {
    state.query = snapshot.query
    state.seenIds = new Set()
    if (snapshot.firstPage.length > 0) {
      state.page = 2
      state.hasMore = snapshot.firstPage.length >= state.limit
      grid.classList.remove('books-grid--empty', 'books-grid--error', 'books-grid--not-found')
      grid.innerHTML = ''
      appendBooks({ root: grid, books: snapshot.firstPage, seenIds: state.seenIds })
      syncBookmarkButtonsInGrid(grid)
      loadingHost.innerHTML = ''
      beginSearchFetchSession()
    } else {
      state.page = 1
      state.hasMore = false
      renderNotFound()
    }
  } else {
    renderNoQuery()
  }

  searchMount.append(
    Search({
      onInput: scheduleSearchFromInput,
      initialValue: snapshot?.query ?? '',
      inputBindDelayMs: snapshot?.query ? 400 : 0,
      signal: favoritesAbort.signal,
    }),
  )

  function renderBottomLoading(enabled) {
    loadingHost.innerHTML = enabled ? getLoadingCardsHtml(4) : ''
  }

  async function loadNextPage() {
    const q = state.query.trim()
    if (!q) return
    if (state.loading || !state.hasMore) return
    const seqAtStart = state.searchSeq
    const signal = state.searchAbort?.signal
    if (!signal) return

    state.loading = true
    renderBottomLoading(true)

    try {
      const books = await searchBooksByTitle(q, {
        limit: state.limit,
        page: state.page,
        signal,
      })

      if (seqAtStart !== state.searchSeq) return

      if (books.length === 0) {
        state.hasMore = false
        if (state.page === 1) {
          writeSearchSnapshot({ query: q, firstPage: [] })
          renderNotFound()
        }
        return
      }

      if (state.page === 1) {
        grid.classList.remove('books-grid--empty', 'books-grid--error', 'books-grid--not-found')
        grid.innerHTML = ''
      }

      appendBooks({ root: grid, books, seenIds: state.seenIds })

      if (state.page === 1) {
        let stored = books
        try {
          stored = JSON.parse(JSON.stringify(books))
        } catch {
          /* keep reference */
        }
        writeSearchSnapshot({ query: q, firstPage: stored })
      }

      state.page += 1
      if (books.length < state.limit) {
        state.hasMore = false
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
      if (seqAtStart !== state.searchSeq) return
      if (state.page === 1) {
        renderError()
      }
      state.hasMore = false
    } finally {
      if (seqAtStart === state.searchSeq) {
        renderBottomLoading(false)
        state.loading = false
      }
    }
  }

  const sentinel = document.createElement('div')
  sentinel.id = 'booksSentinel'
  sentinel.style.height = '1px'
  sentinel.style.width = '100%'
  grid.after(sentinel)

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadNextPage()
    },
    { root: null, rootMargin: '600px 0px', threshold: 0 },
  )

  requestAnimationFrame(() => {
    io.observe(sentinel)
  })

  return () => {
    if (searchDebounceId != null) clearTimeout(searchDebounceId)
    state.searchAbort?.abort()
    favoritesAbort.abort()
    io.disconnect()
    root.innerHTML = ''
  }
}
