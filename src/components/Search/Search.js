import './Search.css'

import searchHtml from './html/search.html?raw'

/**
 * Поле поиска по книгам.
 * inputBindDelayMs — задержка перед подпиской на input (после восстановления из LS браузер может позже прислать trusted input).
 * @param {{ onInput?: (value: string) => void, initialValue?: string, inputBindDelayMs?: number, signal?: AbortSignal }} [options]
 */
export function Search({
  onInput,
  initialValue = '',
  inputBindDelayMs = 0,
  signal,
} = {}) {
  const tpl = document.createElement('template')
  tpl.innerHTML = searchHtml.trim()
  const root = /** @type {HTMLDivElement} */ (tpl.content.firstElementChild.cloneNode(true))

  const input = root.querySelector('.search__input')
  if (initialValue) input.value = initialValue

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
