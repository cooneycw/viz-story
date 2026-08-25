/**
 * viz-story: App Controller
 * Hash-based routing and view orchestration.
 */
(function () {
    'use strict';

    const DEMO_STORIES = ['stories/demo.json'];
    let loadedStories = [];

    // --- Routing ---
    function route() {
        const hash = location.hash.slice(1) || 'home';
        const parts = hash.split('/');
        const view = parts[0];

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const viewEl = document.getElementById(`view-${view}`);
        if (viewEl) {
            viewEl.classList.add('active');
            const navLink = document.querySelector(`a[href="#${view}"]`);
            if (navLink) navLink.classList.add('active');
        }

        if (view === 'home') renderHome();
        if (view === 'reader' && parts[1]) loadAndRead(parts[1]);
        if (view === 'graph') renderGraph();
    }

    window.addEventListener('hashchange', route);

    // --- Home ---
    function renderHome() {
        const list = document.getElementById('story-list');
        list.innerHTML = '';

        if (!loadedStories.length) {
            list.innerHTML = '<p style="color:var(--text-muted)">Loading stories…</p>';
            return;
        }

        loadedStories.forEach((story, i) => {
            const card = document.createElement('div');
            card.className = 'story-card fade-in';
            const nodeCount = Object.keys(story.nodes).length;
            const edgeCount = StoryEngine.load(story) && StoryEngine.allEdges().length;
            card.innerHTML = `
                <h3>${story.meta?.title || 'Untitled'}</h3>
                <p>${story.meta?.description || ''}</p>
                <div class="meta">${nodeCount} nodes · ${edgeCount} paths</div>
            `;
            card.addEventListener('click', () => {
                location.hash = `reader/${i}`;
            });
            list.appendChild(card);
        });
    }

    // --- Reader ---
    function loadAndRead(storyIndex) {
        const story = loadedStories[parseInt(storyIndex)];
        if (!story) return;

        StoryEngine.load(story);
        renderCurrentNode();
    }

    StoryEngine.on('navigate', () => renderCurrentNode());

    function renderCurrentNode() {
        const node = StoryEngine.currentNode();
        if (!node) return;

        document.getElementById('node-title').textContent = node.title || node.id;
        document.getElementById('node-text').innerHTML = node.text || '';

        const choicesEl = document.getElementById('node-choices');
        choicesEl.innerHTML = '';

        if (node.type === 'end' || !node.choices || !node.choices.length) {
            const endMsg = document.createElement('div');
            endMsg.className = 'fade-in';
            endMsg.innerHTML = `
                <p style="color:var(--text-muted); margin-bottom:1rem;">— End of this path —</p>
                <button class="btn btn-primary" onclick="StoryEngine.restart()">Restart</button>
                <button class="btn btn-outline" onclick="location.hash='graph'">View Graph</button>
            `;
            choicesEl.appendChild(endMsg);
            return;
        }

        node.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn fade-in';
            btn.textContent = choice.text;
            btn.addEventListener('click', () => StoryEngine.navigate(choice.target));
            choicesEl.appendChild(btn);
        });

        // Progress
        const progress = document.getElementById('story-progress');
        const hist = StoryEngine.history();
        const total = StoryEngine.allNodes().length;
        const visited = new Set(hist).size;
        progress.innerHTML = `
            <div><strong>Step:</strong> ${hist.length}</div>
            <div><strong>Visited:</strong> ${visited}/${total}</div>
            <div style="margin-top:0.5rem;">
                <button class="btn btn-sm" onclick="StoryEngine.goBack()" ${hist.length <= 1 ? 'disabled' : ''}>← Back</button>
            </div>
        `;
    }

    // --- Graph ---
    document.getElementById('btn-show-graph')?.addEventListener('click', () => {
        location.hash = 'graph';
    });

    function renderGraph() {
        const svg = document.getElementById('story-graph');
        const nodes = StoryEngine.allNodes();
        const edges = StoryEngine.allEdges();
        const info = document.getElementById('graph-info');

        if (!nodes.length) {
            info.textContent = 'No story loaded. Read a story first.';
            return;
        }

        info.textContent = `${nodes.length} nodes · ${edges.length} edges`;

        GraphRenderer.render(svg, nodes, edges, {
            visitedNodes: StoryEngine.history(),
            currentNodeId: StoryEngine.currentNode()?.id,
            onNodeClick: (id) => {
                StoryEngine.navigate(id);
                location.hash = `reader/${0}`;
            },
        });
    }

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
        GraphRenderer.zoomIn();
        renderGraph();
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
        GraphRenderer.zoomOut();
        renderGraph();
    });
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
        GraphRenderer.resetView();
        renderGraph();
    });

    // --- Load stories on boot ---
    async function init() {
        for (const url of DEMO_STORIES) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    const story = await res.json();
                    loadedStories.push(story);
                }
            } catch (e) {
                console.warn('Failed to load story:', url, e);
            }
        }

        // Also load from localStorage
        try {
            const saved = localStorage.getItem('viz-story-custom');
            if (saved) {
                const custom = JSON.parse(saved);
                if (Array.isArray(custom)) {
                    loadedStories.push(...custom);
                } else {
                    loadedStories.push(custom);
                }
            }
        } catch (e) { /* ignore */ }

        route();
    }

    init();
})();
