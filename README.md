# PawPrint — Embark Vet Survey Platform

Internal survey builder and analytics platform for Embark Veterinary.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173/embark-pawprint/](http://localhost:5173/embark-pawprint/)

## Deploy to GitHub Pages

1. Create a repo named `embark-pawprint` on GitHub
2. Push this code to the `main` branch
3. Go to **Settings → Pages → Source** and select **GitHub Actions**
4. The included workflow (`.github/workflows/deploy.yml`) will auto-deploy on every push

Your app will be live at `https://<your-username>.github.io/embark-pawprint/`

## Tech Stack

- **React 19** (createElement — no JSX in app core)
- **Vite** — build tooling
- **Tailwind CSS 4** — via PostCSS
- **Dexie.js** — IndexedDB wrapper (ready, migration from localStorage included)
- **GitHub Pages** — hosting

## Project Structure

```
src/
  app-core.js    — All application logic (components, routing, state)
  main.jsx       — React mount point
  data/db.js     — IndexedDB layer (Dexie) with localStorage migration
  styles/
    index.css    — Tailwind config + custom styles
public/
  favicon.svg    — Paw print favicon
```
