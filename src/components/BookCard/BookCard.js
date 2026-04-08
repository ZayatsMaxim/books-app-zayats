import './BookCard.css'

import { isFavorite, toggleFavorite } from '../../storage/favoritesStorage.js'

import bookCardHtml from './html/book-card.html?raw'

const tpl = document.createElement('template')
tpl.innerHTML = bookCardHtml.trim()

function syncBookmarkButton(btn, iconEl, bookId) {
  if (!bookId) return
  const active = isFavorite(bookId)
  btn.classList.toggle('book-card__bookmark--active', active)
  btn.setAttribute('aria-pressed', String(active))
  btn.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites')
  iconEl.textContent = active ? 'bookmark' : 'bookmark_add'
}

export function BookCard({ book }) {
  const el = /** @type {HTMLElement} */ (tpl.content.firstElementChild.cloneNode(true))

  const coverImg = el.querySelector('.book-card__cover-img')
  coverImg.src = book.coverUrl || ''
  coverImg.alt = book.title
  coverImg.addEventListener('error', () => {
    coverImg.remove()
  })

  el.querySelector('.book-card__title-text').textContent = book.title
  el.querySelector('.book-card__author').textContent = book.author || 'Unknown author'
  const yearEl = el.querySelector('.book-card__year')
  yearEl.textContent = book.year ? String(book.year) : ''

  const btn = el.querySelector('.book-card__bookmark')
  const iconEl = btn.querySelector('.material-icons')

  if (!book?.id) {
    btn.hidden = true
    return el
  }

  el.dataset.workId = book.id

  syncBookmarkButton(btn, iconEl, book.id)
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(book)
    syncBookmarkButton(btn, iconEl, book.id)
  })

  return el
}
