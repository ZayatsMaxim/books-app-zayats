import './homePage.css'
import { BookCard } from '../../components/BookCard/BookCard.js'
import { Search } from '../../components/Search/Search.js'
import { searchBooksByTitle } from '../../api/openLibrary.js'

const PROJECT_NAME = 'Books App'
const SEARCH_DEBOUNCE_MS = 350

function getLoadingCardsHtml(count = 9) {
  return Array.from({ length: count })
    .map(
      () => `
        <article class="book-card" aria-label="Book card placeholder">
          <div class="book-card__cover skeleton"></div>
          <div class="book-card__body book-card__body--skeleton">
            <div class="book-card__skel-line book-card__skel-line--title skeleton" aria-hidden="true"></div>
            <div class="book-card__skel-line book-card__skel-line--author skeleton" aria-hidden="true"></div>
            <div class="book-card__skel-line book-card__skel-line--year skeleton" aria-hidden="true"></div>
          </div>
        </article>
      `,
    )
    .join('')
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

export function mountHomePage(root) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="container topbar__inner">
          <div class="topbar__brand">${PROJECT_NAME}</div>
        </div>
      </header>

      <main class="container">
        <section class="hero" aria-label="Page header">
          <h1 class="hero__title">Discover Your Next Great Read</h1>
          <p class="hero__subtitle">
            Search millions of books, build your personal library, and never lose track of what to read next
          </p>
          <div class="hero__search-block">
            <div id="heroSearchMount" class="hero__search"></div>
          </div>
        </section>

        <section class="layout" aria-label="Main content">
          <div class="layout__left">
            <div class="books-grid" id="booksGrid"></div>
            <div class="books-loading" id="booksLoadingHost" aria-hidden="true"></div>
          </div>

          <aside class="layout__right" aria-label="Favorites">
            <div class="favorites">
              <div class="section-header">
                <h2 class="section-title">Избранное</h2>
                <span class="section-hint">0</span>
              </div>
              <div class="favorites__placeholder">
                <div class="favorites__row skeleton" style="width: 90%"></div>
                <div class="favorites__row skeleton" style="width: 75%"></div>
                <div class="favorites__row skeleton" style="width: 82%"></div>
                <div class="favorites__row skeleton" style="width: 68%"></div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  `

  const grid = root.querySelector('#booksGrid')
  const loadingHost = root.querySelector('#booksLoadingHost')
  const searchMount = root.querySelector('#heroSearchMount')

  const state = {
    query: '',
    page: 1,
    limit: 9,
    loading: false,
    hasMore: true,
    seenIds: new Set(),
    /** Увеличивается при новом поиске / сбросе — отбрасываем ответы от старых запросов */
    searchSeq: 0,
    searchAbort: null,
  }

  let searchDebounceId = null

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
    grid.innerHTML = `
      <div class="books-empty" role="status">
        <span class="material-icons books-empty__icon" aria-hidden="true">question_mark</span>
        <p class="books-empty__text">Type your query in the box above and begin your journey!</p>
      </div>
    `
    loadingHost.innerHTML = ''
  }

  function renderNotFound() {
    state.loading = false
    renderBottomLoading(false)
    grid.classList.remove('books-grid--empty', 'books-grid--error')
    grid.classList.add('books-grid--not-found')
    grid.innerHTML = `
      <div class="books-not-found" role="status">
        <span class="material-icons books-not-found__icon" aria-hidden="true">search_off</span>
        <p class="books-not-found__text">No books found for your search. Try a different query.</p>
      </div>
    `
    loadingHost.innerHTML = ''
  }

  function renderError() {
    abortPendingSearch()
    state.loading = false
    renderBottomLoading(false)
    grid.classList.remove('books-grid--empty', 'books-grid--not-found')
    grid.classList.add('books-grid--error')
    grid.innerHTML = `
      <div class="books-error" role="alert">
        <span class="material-icons books-error__icon" aria-hidden="true">error</span>
        <p class="books-error__text">Something went wrong... Reload the page and try again.</p>
      </div>
    `
    loadingHost.innerHTML = ''
  }

  function applySearchFromInput(raw) {
    const q = raw.trim()

    state.query = q
    state.page = 1
    state.seenIds.clear()
    state.hasMore = true

    if (!q) {
      renderNoQuery()
      return
    }

    beginSearchFetchSession()

    grid.classList.remove('books-grid--empty', 'books-grid--error', 'books-grid--not-found')
    grid.innerHTML = getLoadingCardsHtml(9)
    loadNextPage()
  }

  function scheduleSearchFromInput(raw) {
    const q = raw.trim()
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

  searchMount.append(
    Search({
      onInput: scheduleSearchFromInput,
    }),
  )

  renderNoQuery()

  function renderBottomLoading(enabled) {
    loadingHost.innerHTML = enabled ? getLoadingCardsHtml(3) : ''
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
          renderNotFound()
        }
        return
      }

      if (state.page === 1) {
        grid.classList.remove('books-grid--empty', 'books-grid--error', 'books-grid--not-found')
        grid.innerHTML = ''
      }

      appendBooks({ root: grid, books, seenIds: state.seenIds })
      state.page += 1
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

  io.observe(sentinel)

  return () => {
    if (searchDebounceId != null) clearTimeout(searchDebounceId)
    state.searchAbort?.abort()
    io.disconnect()
    root.innerHTML = ''
  }
}
