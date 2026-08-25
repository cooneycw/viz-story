/**
 * viz-story: Story Engine
 * Loads, validates, and navigates branching narrative JSON.
 */
const StoryEngine = (() => {
    let _story = null;
    let _currentNodeId = null;
    let _history = [];
    let _listeners = [];

    /** Story JSON schema: { meta, nodes: { id: { title, text, choices, type } } } */
    function load(storyJson) {
        if (!storyJson || !storyJson.nodes) {
            throw new Error('Invalid story: missing nodes');
        }
        _story = storyJson;
        _history = [];
        const startId = storyJson.meta?.start || Object.keys(storyJson.nodes)[0];
        _currentNodeId = startId;
        _history.push(startId);
        _emit('load', { story: _story });
        _emit('navigate', { node: currentNode(), history: _history });
        return _story;
    }

    function currentNode() {
        if (!_story || !_currentNodeId) return null;
        const node = _story.nodes[_currentNodeId];
        return node ? { ...node, id: _currentNodeId } : null;
    }

    function navigate(nodeId) {
        if (!_story || !_story.nodes[nodeId]) {
            console.warn('StoryEngine: unknown node', nodeId);
            return null;
        }
        _currentNodeId = nodeId;
        _history.push(nodeId);
        const node = currentNode();
        _emit('navigate', { node, history: [..._history] });
        return node;
    }

    function goBack() {
        if (_history.length <= 1) return null;
        _history.pop();
        _currentNodeId = _history[_history.length - 1];
        const node = currentNode();
        _emit('navigate', { node, history: [..._history] });
        return node;
    }

    function restart() {
        if (!_story) return;
        _history = [];
        const startId = _story.meta?.start || Object.keys(_story.nodes)[0];
        _currentNodeId = startId;
        _history.push(startId);
        _emit('navigate', { node: currentNode(), history: [..._history] });
    }

    function allNodes() {
        if (!_story) return [];
        return Object.entries(_story.nodes).map(([id, node]) => ({ ...node, id }));
    }

    function allEdges() {
        if (!_story) return [];
        const edges = [];
        for (const [fromId, node] of Object.entries(_story.nodes)) {
            if (node.choices) {
                for (const choice of node.choices) {
                    edges.push({ from: fromId, to: choice.target, label: choice.text });
                }
            }
        }
        return edges;
    }

    function story() { return _story; }
    function history() { return [..._history]; }

    function on(event, fn) {
        _listeners.push({ event, fn });
        return () => { _listeners = _listeners.filter(l => l !== arguments[0]); };
    }

    function _emit(event, data) {
        _listeners.filter(l => l.event === event).forEach(l => l.fn(data));
    }

    return { load, currentNode, navigate, goBack, restart, allNodes, allEdges, story, history, on };
})();
