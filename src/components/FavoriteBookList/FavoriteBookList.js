import './FavoriteBookList.css'

import { removeFavorite } from '../../storage/favoritesStorage.js'

import favoriteBookListEmptyHtml from './html/favorite-book-list.empty.html?raw'
import favoriteBookListRowHtml from './html/favorite-book-list.row.html?raw'

const rowTpl = document.createElement('template')
rowTpl.innerHTML = favoriteBookListRowHtml.trim()

const emptyTpl = document.createElement('template')
emptyTpl.innerHTML = favoriteBookListEmptyHtml.trim()

/** @param {{ id: string, title?: string, author?: string | null, year?: number | null }} book */
function createRow(book) {
  const li = /** @type {HTMLLIElement} */ (rowTpl.content.firstElementChild.cloneNode(true))

  li.dataset.workId = book.id

  li.querySelector('.favorite-book-list__title').textContent = book.title
  li.querySelector('.favorite-book-list__author').textContent = book.author || 'Unknown author'
  li.querySelector('.favorite-book-list__year').textContent =
    book.year != null ? String(book.year) : '—'

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
