import './BookCard.css'

import { isFavorite, toggleFavorite } from '../../storage/favoritesStorage.js'
import { hueFromId } from '../../utils/hueFromId.js'

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

  const coverImg = /** @type {HTMLImageElement} */ (el.querySelector('.book-card__cover-img'))
  const coverFallback = /** @type {HTMLDivElement} */ (el.querySelector('.book-card__cover-fallback'))
  const coverFbTitle = coverFallback?.querySelector('.book-card__cover-fallback-title')
  const coverFbAuthor = coverFallback?.querySelector('.book-card__cover-fallback-author')

  function showCoverFallback() {
    if (!coverFallback || !coverFbTitle || !coverFbAuthor) return
    coverImg.hidden = true
    coverImg.removeAttribute('src')
    coverFallback.hidden = false
    coverFbTitle.textContent = book.title || 'Untitled'
    coverFbAuthor.textContent = book.author || 'Unknown author'
    coverFallback.style.setProperty('--cover-fallback-hue', String(hueFromId(book.id)))
  }

  function tryCoverImage(url) {
    if (!url) {
      showCoverFallback()
      return
    }
    coverImg.hidden = false
    if (coverFallback) coverFallback.hidden = true
    coverImg.alt = book.title || ''
    coverImg.src = url
  }

  coverImg.addEventListener('error', () => {
    showCoverFallback()
  })

  tryCoverImage(book.coverUrl || '')

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
    const wasFavorite = isFavorite(book.id)
    toggleFavorite(book)
    syncBookmarkButton(btn, iconEl, book.id)
    const changed = wasFavorite !== isFavorite(book.id)
    if (changed) {
      btn.classList.remove('book-card__bookmark--pulse')
      void btn.offsetWidth
      btn.classList.add('book-card__bookmark--pulse')
      btn.addEventListener(
        'animationend',
        () => {
          btn.classList.remove('book-card__bookmark--pulse')
        },
        { once: true },
      )
    }
  })

  return el
}
