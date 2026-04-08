import './style.css'
import { BookCard } from './ui/components/BookCard.js'
import { searchBooksByTitle } from './api/openLibrary.js'

const PROJECT_NAME = 'Books App'
const DEFAULT_QUERY = 'harry potter'

document.querySelector('#app').innerHTML = `
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
        <div class="search-placeholder" aria-label="Search bar placeholder">
          <div class="search-placeholder__input skeleton"></div>
          <div class="search-placeholder__button skeleton"></div>
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

function getLoadingCardsHtml(count = 9) {
  return Array.from({ length: count })
    .map(
      () => `
        <article class="book-card" aria-label="Book card placeholder">
          <div class="book-card__cover skeleton"></div>
          <div class="book-card__body">
            <div class="book-card__title skeleton" style="width: 75%"></div>
            <div class="book-card__meta skeleton" style="width: 55%"></div>
          </div>
        </article>
      `,
    )
    .join('')
}

function renderBooks(root, books) {
  root.innerHTML = ''
  const frag = document.createDocumentFragment()
  for (const book of books) {
    frag.append(BookCard({ book }))
  }
  root.append(frag)
}

const grid = document.querySelector('#booksGrid')
const loadingHost = document.querySelector('#booksLoadingHost')
grid.innerHTML = getLoadingCardsHtml(9)

const state = {
  query: DEFAULT_QUERY,
  page: 1,
  limit: 9,
  loading: false,
  hasMore: true,
  seenIds: new Set(),
}

function appendBooks(root, books) {
  const frag = document.createDocumentFragment()
  for (const book of books) {
    if (!book?.id) continue
    if (state.seenIds.has(book.id)) continue
    state.seenIds.add(book.id)
    frag.append(BookCard({ book }))
  }
  root.append(frag)
}

function renderBottomLoading(enabled) {
  if (!loadingHost) return
  loadingHost.innerHTML = enabled ? getLoadingCardsHtml(3) : ''
}

async function loadNextPage() {
  if (state.loading || !state.hasMore) return
  state.loading = true
  renderBottomLoading(true)

  try {
    const books = await searchBooksByTitle(state.query, {
      limit: state.limit,
      page: state.page,
    })

    if (state.page === 1) {
      grid.innerHTML = ''
    }

    if (books.length === 0) {
      state.hasMore = false
      return
    }

    appendBooks(grid, books)
    state.page += 1
  } catch (e) {
    if (state.page === 1) {
      grid.innerHTML = `<p style="color: var(--text)">Failed to load books. Try again later.</p>`
    }
    state.hasMore = false
  } finally {
    renderBottomLoading(false)
    state.loading = false
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
loadNextPage()
