# viz-story

Interactive storytelling platform — pure HTML/CSS/JS, zero dependencies.

## Architecture

Single-page app with hash-based routing. Four views: Home, Reader, Graph, Editor.

- `index.html` — app shell with all four views
- `js/story-engine.js` — loads JSON stories, tracks navigation history
- `js/graph-renderer.js` — SVG graph layout with pan/zoom
- `js/editor.js` — in-browser story editor with live preview
- `js/app.js` — hash router and view controller
- `stories/demo.json` — demo branching story

## Development

- Run a local server: `make dev` (python3 http.server on :8080)
- Verify files exist: `make verify`
- No build step, no bundler, no framework

## Story Format

Stories are JSON with `meta` (title, description, start node) and `nodes` (each
node has title, text, type, and choices array with text + target).

## Constraints

- **Zero external dependencies** — no CDN, no npm, no framework
- **Static files only** — must work opened directly or from any file server
- **Vanilla JS** — no TypeScript, no JSX, no build step
- **Theme-aware** — CSS custom properties for light/dark mode
