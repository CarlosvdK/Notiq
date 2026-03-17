# CLAUDE.md

## Project Overview
Notiq is an AI-powered note-taking app. The primary codebase is the **React frontend** (`react-vite/`), a single-page app built with React 19 + Vite 7. The Streamlit files (`notiq_streamlit.py`, `streamlit_v1.py`) are legacy prototypes from Assignment 1.

## Tech Stack
- **Frontend**: React 19, Vite 7, plain CSS (inline styles in App.jsx)
- **AI**: Gemini 2.0 Flash API for autocomplete, analysis, chat
- **Video**: YouTube Data API v3 for related video suggestions
- **No backend** — all state is client-side (React useState)
- **No database** — seed data is hardcoded in App.jsx

## Key Files
- `react-vite/src/App.jsx` — entire app (components, styles, data, AI logic)
- `react-vite/src/index.css` — global CSS reset + CSS variables for theming
- `react-vite/src/App.css` — root layout
- `react-vite/index.html` — entry point
- `react-vite/vite.config.js` — Vite config
- `react-vite/.env` — API keys (VITE_GEMINI_KEY, VITE_YOUTUBE_KEY)

## Architecture (App.jsx sections)
1. **Theme** — Dark/light CSS variables, theme toggle
2. **Data** — INIT_FOLDERS, INIT_NOTES, INIT_REVIEWS (seed data with parent/child note hierarchy)
3. **AI Engines** — Gemini API calls (autocomplete, analyze), YouTube search, ghost text DB, knowledge tracker, video DB, parsers (calories, budget, mood, idea scoring)
4. **Styles** — S object with all inline style definitions
5. **App Component** — Main component with sidebar, editor, AI panels

## Data Model
- **Folders**: `{id, name, notes[]}` — group top-level notes
- **Notes**: `{title, cat, created, content, children?[], parent?}` — support sub-notes via parent/children
- **Categories**: daily, study, health, plan, idea, social

## Commands
```bash
cd react-vite && npm run dev    # Start dev server
cd react-vite && npm run build  # Production build
cd react-vite && npm run lint   # ESLint
```

## API Keys
Keys are loaded via `import.meta.env.VITE_GEMINI_KEY` and `VITE_YOUTUBE_KEY`. Never commit `.env` files. Use `.env.example` as a template.

## Coding Conventions
- Single-file app (App.jsx) — all components are in one file with inline styles
- CSS variables for theming (--t-* prefix)
- Compact style: short variable names (T, S, CM), dense object literals
- Category map: CM object maps category slugs to labels/colors
- Gemini calls use direct fetch to REST API (no SDK)

## Assignment 2 Focus
- Improve existing LLM usage (autocomplete, video suggestions) to be non-straightforward
- Add Smart Note Linking / Knowledge Graph (multi-call LLM, post-processing)
- Add AI Note Transformer / Multi-Format Export (structured LLM output, rendering)
- All LLM features must demonstrate non-trivial prompt engineering or output processing
