import './Search.css'

import searchHtml from './html/search.html?raw'

/** @typedef {'title' | 'author' | 'subject'} SearchMode */

export const SEARCH_UI_MODES = /** @type {const} */ ([
  {
    value: 'title',
    label: 'Title',
    placeholder: 'Search by title…',
    inputAriaLabel: 'Search books by title',
  },
  {
    value: 'author',
    label: 'Author',
    placeholder: 'Search by author…',
    inputAriaLabel: 'Search books by author',
  },
  {
    value: 'subject',
    label: 'Topic',
    placeholder: 'Search by topic…',
    inputAriaLabel: 'Search books by topic',
  },
])

/**
 * Apply the selected search mode to the input and trigger UI.
 *
 * @param {HTMLInputElement} input Search input element.
 * @param {HTMLSpanElement} triggerLabel Label element inside the mode trigger button.
 * @param {{ placeholder: string, inputAriaLabel: string, label: string }} def Mode definition.
 * @returns {void}
 */
function applyModeToUi(input, triggerLabel, def) {
  input.placeholder = def.placeholder
  input.setAttribute('aria-label', def.inputAriaLabel)
  triggerLabel.textContent = def.label
}

/**
 * Search input + mode selector.
 *
 * @param {object} [options]
 * @param {(value: string) => void} [options.onInput] Called on input changes (raw string).
 * @param {(mode: SearchMode, value: string) => void} [options.onSearchModeChange]
 * Called when the user selects a new search mode.
 * @param {string} [options.initialValue] Initial input value.
 * @param {SearchMode} [options.initialSearchMode] Initial selected mode.
 * @param {number} [options.inputBindDelayMs] Delay before attaching the input listener (ms).
 * @param {AbortSignal} [options.signal] Optional abort signal for cleanup.
 * @returns {HTMLDivElement} Root element.
 */
export function Search({
  onInput,
  onSearchModeChange,
  initialValue = '',
  initialSearchMode = 'title',
  inputBindDelayMs = 0,
  signal,
} = {}) {
  const tpl = document.createElement('template')
  tpl.innerHTML = searchHtml.trim()
  const root = /** @type {HTMLDivElement} */ (tpl.content.firstElementChild.cloneNode(true))

  const input = /** @type {HTMLInputElement} */ (root.querySelector('.search__input'))
  const wrap = /** @type {HTMLDivElement} */ (root.querySelector('.search__mode-wrap'))
  const menuClip = /** @type {HTMLDivElement} */ (root.querySelector('.search__mode-menu-clip'))
  const trigger = /** @type {HTMLButtonElement} */ (root.querySelector('.search__mode-trigger'))
  const triggerLabel = /** @type {HTMLSpanElement} */ (root.querySelector('.search__mode-label'))
  const menu = /** @type {HTMLUListElement} */ (root.querySelector('.search__mode-menu'))

  if (initialValue) input.value = initialValue

  let mode = /** @type {SearchMode} */ (
    SEARCH_UI_MODES.some((m) => m.value === initialSearchMode) ? initialSearchMode : 'title'
  )

  function defFor(m) {
    return SEARCH_UI_MODES.find((x) => x.value === m) ?? SEARCH_UI_MODES[0]
  }

  function setMode(next, { notify } = { notify: false }) {
    mode = next
    const def = defFor(mode)
    applyModeToUi(input, triggerLabel, def)
    for (const li of menu.querySelectorAll('[role="option"]')) {
      const v = /** @type {HTMLLIElement} */ (li).dataset.value
      li.setAttribute('aria-selected', v === mode ? 'true' : 'false')
    }
    if (notify) onSearchModeChange?.(mode, input.value)
  }

  for (const opt of SEARCH_UI_MODES) {
    const li = document.createElement('li')
    li.className = 'search__mode-option'
    li.setAttribute('role', 'option')
    li.dataset.value = opt.value
    li.textContent = opt.label
    li.addEventListener('click', (e) => {
      e.preventDefault()
      closeMenu()
      if (opt.value === mode) return
      setMode(/** @type {SearchMode} */ (opt.value), { notify: true })
    })
    menu.append(li)
  }

  setMode(mode, { notify: false })

  function isMenuOpen() {
    return !wrap.classList.contains('search__mode-wrap--collapsed')
  }

  function openMenu() {
    wrap.classList.remove('search__mode-wrap--collapsed')
    trigger.setAttribute('aria-expanded', 'true')
    menuClip?.setAttribute('aria-hidden', 'false')
  }

  function closeMenu() {
    wrap.classList.add('search__mode-wrap--collapsed')
    trigger.setAttribute('aria-expanded', 'false')
    menuClip?.setAttribute('aria-hidden', 'true')
  }

  function toggleMenu() {
    if (isMenuOpen()) closeMenu()
    else openMenu()
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault()
    toggleMenu()
  })

  function onDocPointerDown(e) {
    if (!wrap.contains(/** @type {Node} */ (e.target))) closeMenu()
  }

  document.addEventListener('pointerdown', onDocPointerDown, true)
  if (signal) {
    signal.addEventListener('abort', () => document.removeEventListener('pointerdown', onDocPointerDown, true), {
      once: true,
    })
  }

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen()) {
      e.stopPropagation()
      closeMenu()
      trigger.focus()
    }
  })

  if (typeof onInput === 'function') {
    const handler = (e) => {
      if (!e.isTrusted) return
      onInput(input.value)
    }

    const runAttach = () => {
      input.addEventListener('input', handler, { signal })
    }

    let bindTimerId = null
    if (inputBindDelayMs > 0) {
      bindTimerId = window.setTimeout(runAttach, inputBindDelayMs)
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            if (bindTimerId != null) window.clearTimeout(bindTimerId)
          },
          { once: true },
        )
      }
    } else {
      runAttach()
    }
  }

  return root
}
