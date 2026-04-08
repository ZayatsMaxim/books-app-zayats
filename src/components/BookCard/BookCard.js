import './BookCard.css'

export function BookCard({ book }) {
  const el = document.createElement('article')
  el.className = 'book-card'

  const coverWrap = document.createElement('div')
  coverWrap.className = 'book-card__cover'

  const coverImg = document.createElement('img')
  coverImg.className = 'book-card__cover-img'
  coverImg.src = book.coverUrl || ''
  coverImg.alt = book.title
  coverImg.loading = 'lazy'
  coverImg.addEventListener('error', () => {
    coverImg.remove()
  })

  const bookmarkBtn = document.createElement('button')
  bookmarkBtn.type = 'button'
  bookmarkBtn.className = 'book-card__bookmark'
  bookmarkBtn.setAttribute('aria-label', 'Add to favorites')
  bookmarkBtn.innerHTML = `<span class="material-icons" aria-hidden="true">bookmark_add</span>`

  coverWrap.append(coverImg, bookmarkBtn)

  const body = document.createElement('div')
  body.className = 'book-card__body'

  const title = document.createElement('h3')
  title.className = 'book-card__title-text'
  title.textContent = book.title

  const author = document.createElement('p')
  author.className = 'book-card__author'
  author.textContent = book.author || 'Unknown author'

  const year = document.createElement('p')
  year.className = 'book-card__year'
  year.textContent = book.year ? String(book.year) : ''

  body.append(title, author, year)
  el.append(coverWrap, body)
  return el
}
