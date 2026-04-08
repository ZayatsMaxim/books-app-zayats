import './Favorites.css'
import { FavoriteBookList } from '../FavoriteBookList/FavoriteBookList.js'
import { FAVORITES_CHANGED_EVENT, getFavorites } from '../../storage/favoritesStorage.js'

import favoritesShellHtml from './html/favorites.shell.html?raw'

/**
 * @param {{ signal?: AbortSignal }} [options]
 */
export function Favorites({ signal } = {}) {
  const root = document.createElement('div')
  root.className = 'favorites favorites--collapsed'
  root.innerHTML = favoritesShellHtml.trim()

  const panel = root.querySelector('.favorites__panel')
  const panelClip = root.querySelector('.favorites__panel-clip')
  const countEl = root.querySelector('.favorites__count')
  const toggle = root.querySelector('.favorites__header')
  const expandIcon = root.querySelector('.favorites__expand-icon')

  function refreshCount() {
    const n = getFavorites().length
    countEl.textContent = String(n)
    countEl.hidden = n === 0
  }

  function renderListFromStorage() {
    panel.replaceChildren(FavoriteBookList({ books: getFavorites() }))
  }

  refreshCount()
  renderListFromStorage()

  toggle.addEventListener('click', () => {
    const collapsed = root.classList.toggle('favorites--collapsed')
    toggle.setAttribute('aria-expanded', String(!collapsed))
    panelClip?.setAttribute('aria-hidden', collapsed ? 'true' : 'false')
    expandIcon.textContent = collapsed ? 'expand_more' : 'expand_less'
    if (!collapsed) {
      renderListFromStorage()
    }
  })

  const onFavoritesChanged = () => {
    refreshCount()
    if (!root.classList.contains('favorites--collapsed')) {
      renderListFromStorage()
    }
  }

  const listenerOpts = signal ? { signal } : undefined
  window.addEventListener(FAVORITES_CHANGED_EVENT, onFavoritesChanged, listenerOpts)

  return root
}
