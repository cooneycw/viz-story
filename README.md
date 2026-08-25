# viz-story

An interactive storytelling platform where branching narratives come alive through visual graphs. Create, visualize, and experience choose-your-own-adventure stories — all in pure HTML/CSS/JS with zero dependencies.

## ✨ Features (MVP)

- **Story Reader** — Navigate branching narratives with smooth transitions and browser history support
- **Graph Visualizer** — See the full story structure as an interactive SVG tree with visited-path highlighting
- **Story Editor** — Create and edit stories in-browser with live graph preview, import/export JSON
- **Dark/Light Theme** — Automatic system detection with light/dark support
- **Fully Offline** — No server, no CDN, no build step. Open `index.html` and go.

## 🚀 Quick Start

```bash
# Clone and open
git clone https://github.com/cooneycw/viz-story.git
cd viz-story

# Option 1: Just open it
open index.html

# Option 2: Local server (for fetch to work)
python3 -m http.server 8080
# → http://localhost:8080
```

## 📁 Project Structure

```
viz-story/
├── index.html              # Single-page app shell (reader + graph + editor)
├── css/style.css           # Theme-aware styles (light/dark)
├── js/
│   ├── story-engine.js     # Story loading, navigation, history tracking
│   ├── graph-renderer.js   # SVG graph layout and rendering with pan/zoom
│   ├── editor.js           # In-browser story editor with live preview
│   └── app.js              # Hash-based router and view controller
├── stories/
│   └── demo.json           # Demo branching story
└── .specify/               # Spec-driven development structure
```

## 📋 MVP Issues

Track progress on the [GitHub Issues](https://github.com/cooneycw/viz-story/issues) board.

| # | Issue | Description |
|---|-------|-------------|
| [#1](https://github.com/cooneycw/viz-story/issues/1) | **Define story JSON schema** | Node-based branching narrative data format with metadata |
| [#2](https://github.com/cooneycw/viz-story/issues/2) | **Build story reader page** | Main reading experience with choice navigation and hash routing |
| [#3](https://github.com/cooneycw/viz-story/issues/3) | **Build story graph visualizer** | Interactive inline SVG tree with pan/zoom and click-to-navigate |
| [#4](https://github.com/cooneycw/viz-story/issues/4) | **Build story editor** | In-browser editor with live preview, import/export JSON |
| [#5](https://github.com/cooneycw/viz-story/issues/5) | **Create sample stories** | Demo stories showcasing the branching narrative format |
| [#6](https://github.com/cooneycw/viz-story/issues/6) | **Design and implement CSS theme** | Dark/light modes, responsive layout, accessible contrast |
| [#7](https://github.com/cooneycw/viz-story/issues/7) | **Story landing page and navigation** | Story cards, hash routing between pages, top nav |

## 🏗️ Architecture

**Zero dependencies.** Everything is vanilla HTML, CSS, and JavaScript.

- **Data:** Stories are JSON files with a node-graph structure — each node has content and choices pointing to other nodes
- **Rendering:** DOM manipulation with `createElement`, CSS transitions for animations
- **Visualization:** Inline SVG with computed layered layout — no D3, no canvas
- **Routing:** Hash-based (`#reader/0`, `#graph`, `#editor`) with `hashchange` listener
- **Persistence:** `localStorage` for custom stories and editor state

## 📖 Story Format

```json
{
  "meta": {
    "title": "The Enchanted Forest",
    "description": "A branching adventure",
    "start": "entrance"
  },
  "nodes": {
    "entrance": {
      "title": "The Forest Entrance",
      "text": "You stand before an ancient forest...",
      "type": "start",
      "choices": [
        { "text": "Take the left path", "target": "left-path" },
        { "text": "Take the right path", "target": "right-path" }
      ]
    }
  }
}
```

## 📄 License

MIT
