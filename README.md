# Books App

## Task

Specification (internship assignment — simple book catalog):  
[Innowise Internship — Simple book catalog (PDF on Google Drive)](https://drive.google.com/file/d/1RBRcuH-_oAvtjem5Xs0c4NXZ8I38aYyH/view)

## How to run the app

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server (Vite):

   ```bash
   npm run dev
   ```

   Open the URL printed in the terminal (usually `http://localhost:5173`).

3. Optional — production build and local preview of the built files:

   ```bash
   npm run build
   npm run preview
   ```

   Output is written to `dist/`.

Requires [Node.js](https://nodejs.org/) with npm. No API keys are needed for the Open Library API.

## App structure

| Location | Role |
|----------|------|
| **`index.html`** | App shell: fonts, favicon link, `#app` mount point. |
| **`public/`** | Static assets served as-is (e.g. favicon). |
| **`src/main.js`** | Entry: theme init before paint, mounts the home page into `#app`. |
| **`src/style.css`** | Global base styles, layout helpers, skeleton; imports theme token files. |
| **`src/themes/`** | Design tokens for light (`:root`) and dark (`html.theme-dark`) — CSS variables only. |
| **`src/api/`** | HTTP client for external APIs — Open Library search and cover URLs. |
| **`src/storage/`** | `localStorage` access for favorites and last-search snapshot; no UI. |
| **`src/utils/`** | Small shared helpers unrelated to a single component. |
| **`src/components/`** | Reusable UI blocks. Each feature folder keeps **JS** (behavior), **CSS** (scoped to that block), and **`html/`** snippets imported as `?raw` templates. Examples: `BookCard`, `Search`, `Favorites`, `ThemeToggle`. |
| **`src/pages/home/`** | **Page-level** glue: `homePage.js` wires search, grid, favorites, and infinite scroll; **`homePage.css`** styles layout sections (hero, topbar, grid); **`html/`** holds the page shell and empty/error/skeleton fragments. |

Separation rule: **API and persistence** live outside components; **components** focus on one UI concern; **pages** compose components and own route-level state and effects.
