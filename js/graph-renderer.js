/**
 * viz-story: Graph Renderer
 * Renders story node graphs as inline SVG with pan/zoom.
 */
const GraphRenderer = (() => {
    const NODE_W = 140;
    const NODE_H = 40;
    const H_GAP = 60;
    const V_GAP = 80;

    let _zoom = 1;
    let _panX = 0;
    let _panY = 0;
    let _dragging = false;
    let _dragStart = { x: 0, y: 0 };

    /**
     * Render a story graph into the given SVG element.
     * @param {SVGElement} svg
     * @param {Array} nodes - [{id, title, type}]
     * @param {Array} edges - [{from, to, label}]
     * @param {Object} opts - {onNodeClick, visitedNodes, currentNodeId}
     */
    function render(svg, nodes, edges, opts = {}) {
        const positions = _layout(nodes, edges);
        _drawGraph(svg, nodes, edges, positions, opts);
        _setupInteraction(svg);
    }

    /** Simple layered layout (Sugiyama-lite). */
    function _layout(nodes, edges) {
        if (!nodes.length) return {};

        // Build adjacency
        const children = {};
        const parents = {};
        nodes.forEach(n => { children[n.id] = []; parents[n.id] = []; });
        edges.forEach(e => {
            if (children[e.from]) children[e.from].push(e.to);
            if (parents[e.to]) parents[e.to].push(e.from);
        });

        // Assign layers via BFS from roots (nodes with no parents)
        const layers = {};
        const roots = nodes.filter(n => parents[n.id].length === 0).map(n => n.id);
        if (roots.length === 0) roots.push(nodes[0].id);

        const queue = roots.map(id => ({ id, layer: 0 }));
        const visited = new Set();
        while (queue.length) {
            const { id, layer } = queue.shift();
            if (visited.has(id)) {
                layers[id] = Math.max(layers[id] || 0, layer);
                continue;
            }
            visited.add(id);
            layers[id] = layer;
            (children[id] || []).forEach(child => {
                queue.push({ id: child, layer: layer + 1 });
            });
        }

        // Handle unvisited nodes
        nodes.forEach(n => {
            if (!(n.id in layers)) layers[n.id] = 0;
        });

        // Group by layer
        const layerGroups = {};
        Object.entries(layers).forEach(([id, layer]) => {
            if (!layerGroups[layer]) layerGroups[layer] = [];
            layerGroups[layer].push(id);
        });

        // Compute positions
        const positions = {};
        const maxLayer = Math.max(...Object.values(layers));
        const padding = 60;

        Object.entries(layerGroups).forEach(([layer, ids]) => {
            const y = padding + parseInt(layer) * (NODE_H + V_GAP);
            const totalWidth = ids.length * NODE_W + (ids.length - 1) * H_GAP;
            const startX = padding + (maxLayer > 0 ? 0 : 0);
            ids.forEach((id, i) => {
                positions[id] = {
                    x: startX + i * (NODE_W + H_GAP) + NODE_W / 2,
                    y: y + NODE_H / 2,
                };
            });
        });

        return positions;
    }

    function _drawGraph(svg, nodes, edges, positions, opts) {
        // Clear
        svg.innerHTML = '';

        if (!nodes.length) return;

        // Compute bounds
        const xs = Object.values(positions).map(p => p.x);
        const ys = Object.values(positions).map(p => p.y);
        const minX = Math.min(...xs) - NODE_W;
        const minY = Math.min(...ys) - NODE_H;
        const maxX = Math.max(...xs) + NODE_W;
        const maxY = Math.max(...ys) + NODE_H;

        svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX + 40} ${maxY - minY + 40}`);

        // Defs (arrowhead)
        const defs = _svgEl('defs');
        const marker = _svgEl('marker', {
            id: 'arrowhead', viewBox: '0 0 10 10', refX: '10', refY: '5',
            markerWidth: '8', markerHeight: '8', orient: 'auto-start-reverse',
        });
        const arrow = _svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'var(--edge-color)' });
        marker.appendChild(arrow);
        defs.appendChild(marker);
        svg.appendChild(defs);

        // Transform group for pan/zoom
        const g = _svgEl('g', { class: 'graph-root' });
        g.setAttribute('transform', `translate(${_panX},${_panY}) scale(${_zoom})`);

        // Draw edges
        edges.forEach(edge => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return;

            const isActive = opts.visitedNodes &&
                opts.visitedNodes.includes(edge.from) &&
                opts.visitedNodes.includes(edge.to);

            // Curved path
            const midY = (from.y + to.y) / 2;
            const path = _svgEl('path', {
                d: `M ${from.x} ${from.y + NODE_H / 2} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - NODE_H / 2}`,
                class: `graph-edge${isActive ? ' active' : ''}`,
            });
            g.appendChild(path);

            // Edge label
            if (edge.label) {
                const labelText = edge.label.length > 20 ? edge.label.slice(0, 18) + '…' : edge.label;
                const lx = (from.x + to.x) / 2;
                const ly = midY - 8;
                const label = _svgEl('text', { x: lx, y: ly, class: 'graph-edge-label' });
                label.textContent = labelText;
                g.appendChild(label);
            }
        });

        // Draw nodes
        nodes.forEach(node => {
            const pos = positions[node.id];
            if (!pos) return;

            const group = _svgEl('g', { class: 'graph-node', 'data-id': node.id });

            const isVisited = opts.visitedNodes && opts.visitedNodes.includes(node.id);
            const isCurrent = opts.currentNodeId === node.id;
            let fill = 'var(--node-normal)';
            if (node.type === 'start') fill = 'var(--node-start)';
            else if (node.type === 'end') fill = 'var(--node-end)';
            if (isVisited && !isCurrent) fill = 'var(--node-visited)';

            const rect = _svgEl('rect', {
                x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2,
                width: NODE_W, height: NODE_H,
                fill: fill,
                stroke: isCurrent ? 'white' : 'transparent',
                'stroke-width': isCurrent ? 3 : 0,
            });
            group.appendChild(rect);

            const title = (node.title || node.id).slice(0, 18);
            const text = _svgEl('text', { x: pos.x, y: pos.y });
            text.textContent = title;
            group.appendChild(text);

            if (opts.onNodeClick) {
                group.style.cursor = 'pointer';
                group.addEventListener('click', () => opts.onNodeClick(node.id));
            }

            g.appendChild(group);
        });

        svg.appendChild(g);
    }

    function _setupInteraction(svg) {
        let isPanning = false;
        let startX, startY;

        svg.addEventListener('mousedown', e => {
            if (e.target.closest('.graph-node')) return;
            isPanning = true;
            startX = e.clientX - _panX;
            startY = e.clientY - _panY;
            svg.style.cursor = 'grabbing';
        });

        svg.addEventListener('mousemove', e => {
            if (!isPanning) return;
            _panX = e.clientX - startX;
            _panY = e.clientY - startY;
            _applyTransform(svg);
        });

        svg.addEventListener('mouseup', () => {
            isPanning = false;
            svg.style.cursor = 'grab';
        });

        svg.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            _zoom = Math.max(0.2, Math.min(3, _zoom * delta));
            _applyTransform(svg);
        }, { passive: false });

        svg.style.cursor = 'grab';
    }

    function _applyTransform(svg) {
        const g = svg.querySelector('.graph-root');
        if (g) g.setAttribute('transform', `translate(${_panX},${_panY}) scale(${_zoom})`);
    }

    function zoomIn() { _zoom = Math.min(3, _zoom * 1.2); }
    function zoomOut() { _zoom = Math.max(0.2, _zoom * 0.8); }
    function resetView() { _zoom = 1; _panX = 0; _panY = 0; }

    function _svgEl(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        return el;
    }

    return { render, zoomIn, zoomOut, resetView };
})();
