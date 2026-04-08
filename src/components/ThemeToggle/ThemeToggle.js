import './ThemeToggle.css'

import themeToggleHtml from './html/theme-toggle.html?raw'

const THEME_STORAGE_KEY = 'books-app-zayats-theme'

function isDarkPreferred() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Вызвать до первого рендера, чтобы не было мигания темы. */
export function initThemeBeforePaint() {
  let dark = false
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark') dark = true
    else if (saved === 'light') dark = false
    else dark = isDarkPreferred()
  } catch {
    dark = isDarkPreferred()
  }
  document.documentElement.classList.toggle('theme-dark', dark)
}

const tpl = document.createElement('template')
tpl.innerHTML = themeToggleHtml.trim()

/**
 * Переключатель светлой/тёмной темы (localStorage + View Transition / opacity fallback).
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {HTMLButtonElement}
 */
export function ThemeToggle({ signal } = {}) {
  const btn = /** @type {HTMLButtonElement} */ (tpl.content.firstElementChild.cloneNode(true))
  const iconEl = btn.querySelector('.theme-toggle__icon')

  function sync() {
    const isDark = document.documentElement.classList.contains('theme-dark')
    btn.setAttribute('aria-label', isDark ? 'Turn off dark theme' : 'Turn on dark theme')
    btn.setAttribute('aria-checked', String(isDark))
    if (iconEl) iconEl.textContent = isDark ? 'dark_mode' : 'light_mode'
  }

  sync()

  function applyTheme(next) {
    document.documentElement.classList.toggle('theme-dark', next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    sync()
  }

  btn.addEventListener(
    'click',
    () => {
      const next = !document.documentElement.classList.contains('theme-dark')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        applyTheme(next)
        return
      }

      if (typeof document.startViewTransition === 'function') {
        document.startViewTransition(() => applyTheme(next))
        return
      }

      const app = document.getElementById('app')
      if (!app) {
        applyTheme(next)
        return
      }

      app.style.transition = 'opacity 0.22s ease'
      app.style.opacity = '0.86'
      window.setTimeout(() => {
        applyTheme(next)
        requestAnimationFrame(() => {
          app.style.opacity = '1'
          window.setTimeout(() => {
            app.style.transition = ''
            app.style.removeProperty('opacity')
          }, 240)
        })
      }, 200)
    },
    { signal },
  )

  return btn
}
