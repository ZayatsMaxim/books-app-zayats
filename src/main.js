import './style.css'
import { initThemeBeforePaint } from './components/ThemeToggle/ThemeToggle.js'
import { mountHomePage } from './pages/home/homePage.js'

initThemeBeforePaint()

const app = document.querySelector('#app')
mountHomePage(app)
