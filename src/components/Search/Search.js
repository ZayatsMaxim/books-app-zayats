import './Search.css'

/**
 * Поле поиска по книгам.
 * @param {{ onInput?: (value: string) => void }} [options]
 */
export function Search({ onInput } = {}) {
  const root = document.createElement('div')
  root.className = 'search'

  const control = document.createElement('div')
  control.className = 'search__control'

  const icon = document.createElement('span')
  icon.className = 'material-icons search__icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.textContent = 'search'

  const input = document.createElement('input')
  input.type = 'search'
  input.className = 'search__input'
  input.placeholder = 'Search by title…'
  input.autocomplete = 'off'
  input.setAttribute('aria-label', 'Search books by title')
  input.setAttribute('enterkeyhint', 'search')

  if (typeof onInput === 'function') {
    input.addEventListener('input', () => onInput(input.value))
  }

  control.append(icon, input)
  root.append(control)
  return root
}
