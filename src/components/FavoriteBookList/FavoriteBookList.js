import './FavoriteBookList.css'

import { getCoverUrl } from '../../api/openLibrary.js'
import { removeFavorite } from '../../storage/favoritesStorage.js'
import { hueFromId } from '../../utils/hueFromId.js'

import favoriteBookListEmptyHtml from './html/favorite-book-list.empty.html?raw'
import favoriteBookListRowHtml from './html/favorite-book-list.row.html?raw'

const rowTpl = document.createElement('template')
rowTpl.innerHTML = favoriteBookListRowHtml.trim()

const emptyTpl = document.createElement('template')
emptyTpl.innerHTML = favoriteBookListEmptyHtml.trim()

/** @param {{ id: string, title?: string, author?: string | null, year?: number | null, coverId?: number | null, coverUrl?: string | null }} book */
function createRow(book) {
  const li = /** @type {HTMLLIElement} */ (rowTpl.content.firstElementChild.cloneNode(true))

  li.dataset.workId = book.id

  li.querySelector('.favorite-book-list__title').textContent = book.title
  li.querySelector('.favorite-book-list__author').textContent = book.author || 'Unknown author'
  li.querySelector('.favorite-book-list__year').textContent =
    book.year != null ? String(book.year) : '—'

  const wrap = li.querySelector('.favorite-book-list__icon-wrap')
  const icon = wrap?.querySelector('.favorite-book-list__icon')
  const fb = /** @type {HTMLDivElement | null} */ (wrap?.querySelector('.favorite-book-list__cover-fallback'))
  const fbTitle = fb?.querySelector('.favorite-book-list__cover-fallback-title')
  const fbAuthor = fb?.querySelector('.favorite-book-list__cover-fallback-author')

  function showListCoverFallback() {
    if (!fb || !fbTitle || !fbAuthor || !icon) return
    fb.hidden = false
    fbTitle.textContent = book.title || 'Untitled'
    fbAuthor.textContent = book.author || 'Unknown author'
    fb.style.setProperty('--cover-fallback-hue', String(hueFromId(book.id)))
    icon.classList.add('favorite-book-list__icon--hidden')
    wrap?.querySelector('.favorite-book-list__cover')?.remove()
  }

  const coverSrc = book.coverUrl || getCoverUrl({ coverId: book.coverId, size: 'S' })
  if (wrap && icon && coverSrc) {
    if (fb) fb.hidden = true
    const img = document.createElement('img')
    img.className = 'favorite-book-list__cover'
    img.alt = ''
    img.loading = 'lazy'
    img.decoding = 'async'
    img.src = coverSrc
    icon.classList.add('favorite-book-list__icon--hidden')
    wrap.insertBefore(img, icon)
    img.addEventListener('error', () => {
      showListCoverFallback()
    })
  } else if (wrap && icon && fb && fbTitle && fbAuthor) {
    showListCoverFallback()
  }

  const btn = li.querySelector('.favorite-book-list__bookmark')
  btn.setAttribute('aria-label', 'Remove from favorites')
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    removeFavorite(book.id)
  })

  return li
}

/** @param {{ books?: object[] }} [options] */
export function FavoriteBookList({ books = [] } = {}) {
  const root = document.createElement('div')
  root.className = 'favorite-book-list-root'

  const list = books.filter((b) => b?.id)
  if (list.length === 0) {
    const empty = /** @type {HTMLElement} */ (emptyTpl.content.firstElementChild.cloneNode(true))
    root.append(empty)
    return root
  }

  const ul = document.createElement('ul')
  ul.className = 'favorite-book-list'
  for (const book of list) {
    ul.append(createRow(book))
  }
  root.append(ul)
  return root
}
