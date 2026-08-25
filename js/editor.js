/**
 * StoryEditor — Editor view for interactive story authoring.
 *
 * Depends on globals: StoryEngine, GraphRenderer
 * Attaches to global: window.StoryEditor
 */
var StoryEditor = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────
  var selectedNodeId = null;
  var nodeCounter = 0;

  // ── DOM refs (resolved once on init) ───────────────────────────────
  var els = {};

  // ── Helpers ────────────────────────────────────────────────────────

  /** Generate a unique node ID that doesn't collide with existing ones. */
  function generateNodeId() {
    var story = StoryEngine.getStory();
    var nodes = story && story.nodes ? story.nodes : {};
    var id;
    do {
      nodeCounter++;
      id = 'node-' + nodeCounter;
    } while (nodes[id]);
    return id;
  }

  /** Return an array of all node IDs in the current story. */
  function getNodeIds() {
    var story = StoryEngine.getStory();
    if (!story || !story.nodes) return [];
    return Object.keys(story.nodes);
  }

  /** Return a node object by ID, or null. */
  function getNode(id) {
    var story = StoryEngine.getStory();
    if (!story || !story.nodes) return null;
    return story.nodes[id] || null;
  }

  // ── Starter story ─────────────────────────────────────────────────

  function ensureStoryLoaded() {
    var story = StoryEngine.getStory();
    if (story && story.nodes && Object.keys(story.nodes).length > 0) return;

    var startId = 'node-1';
    nodeCounter = 1;
    var starter = {
      title: 'Untitled Story',
      start: startId,
      nodes: {}
    };
    starter.nodes[startId] = {
      title: 'Beginning',
      type: 'start',
      text: 'Your story starts here…',
      choices: []
    };
    StoryEngine.loadStory(starter);
  }

  // ── Node list ─────────────────────────────────────────────────────

  function renderNodeList() {
    var list = els.nodeList;
    if (!list) return;
    list.innerHTML = '';

    var ids = getNodeIds();
    ids.forEach(function (id) {
      var node = getNode(id);
      var item = document.createElement('div');
      item.className = 'node-list-item' + (id === selectedNodeId ? ' active' : '');
      item.setAttribute('data-node-id', id);

      var label = document.createElement('span');
      label.className = 'node-list-label';
      label.textContent = (node.title || id) + ' (' + (node.type || 'normal') + ')';
      item.appendChild(label);

      item.addEventListener('click', function () {
        selectNode(id);
      });

      list.appendChild(item);
    });
  }

  // ── Node editor form ──────────────────────────────────────────────

  function selectNode(id) {
    selectedNodeId = id;
    renderNodeList();
    renderNodeEditor();
  }

  function renderNodeEditor() {
    var container = els.nodeEditor;
    if (!container) return;

    if (!selectedNodeId) {
      container.innerHTML = '<p class="editor-placeholder">Select a node to edit.</p>';
      return;
    }

    var node = getNode(selectedNodeId);
    if (!node) {
      container.innerHTML = '<p class="editor-placeholder">Node not found.</p>';
      selectedNodeId = null;
      renderNodeList();
      return;
    }

    var allIds = getNodeIds();
    var choices = node.choices || [];

    var html = '';

    // Title
    html += '<div class="form-group">';
    html += '<label for="editor-title">Title</label>';
    html += '<input type="text" id="editor-title" class="form-control" value="' + escapeAttr(node.title || '') + '">';
    html += '</div>';

    // Type
    html += '<div class="form-group">';
    html += '<label for="editor-type">Type</label>';
    html += '<select id="editor-type" class="form-control">';
    ['start', 'normal', 'end'].forEach(function (t) {
      var sel = (node.type === t) ? ' selected' : '';
      html += '<option value="' + t + '"' + sel + '>' + t + '</option>';
    });
    html += '</select>';
    html += '</div>';

    // Text
    html += '<div class="form-group">';
    html += '<label for="editor-text">Story Text</label>';
    html += '<textarea id="editor-text" class="form-control" rows="5">' + escapeHtml(node.text || '') + '</textarea>';
    html += '</div>';

    // Choices
    html += '<div class="form-group">';
    html += '<label>Choices</label>';
    html += '<div id="choices-container">';
    choices.forEach(function (choice, idx) {
      html += buildChoiceRow(idx, choice, allIds);
    });
    html += '</div>';
    html += '<button type="button" id="btn-add-choice" class="btn btn-sm">+ Add Choice</button>';
    html += '</div>';

    // Actions
    html += '<div class="form-group editor-actions">';
    html += '<button type="button" id="btn-save-node" class="btn btn-primary">Save</button>';
    html += '<button type="button" id="btn-delete-node" class="btn btn-danger">Delete</button>';
    html += '</div>';

    container.innerHTML = html;

    // Bind events
    document.getElementById('btn-save-node').addEventListener('click', saveCurrentNode);
    document.getElementById('btn-delete-node').addEventListener('click', deleteCurrentNode);
    document.getElementById('btn-add-choice').addEventListener('click', addChoiceRow);
    bindChoiceRemoveButtons();
  }

  function buildChoiceRow(idx, choice, allIds) {
    var html = '<div class="choice-row" data-choice-idx="' + idx + '">';
    html += '<input type="text" class="form-control choice-text" placeholder="Choice text" value="' + escapeAttr(choice.text || '') + '">';
    html += '<select class="form-control choice-target">';
    html += '<option value="">(none)</option>';
    allIds.forEach(function (nid) {
      var sel = (choice.target === nid) ? ' selected' : '';
      html += '<option value="' + escapeAttr(nid) + '"' + sel + '>' + escapeHtml(nid) + '</option>';
    });
    html += '</select>';
    html += '<button type="button" class="btn btn-sm btn-remove-choice" title="Remove choice">&times;</button>';
    html += '</div>';
    return html;
  }

  function addChoiceRow() {
    var container = document.getElementById('choices-container');
    if (!container) return;
    var idx = container.querySelectorAll('.choice-row').length;
    var allIds = getNodeIds();
    var div = document.createElement('div');
    div.innerHTML = buildChoiceRow(idx, { text: '', target: '' }, allIds);
    var row = div.firstChild;
    container.appendChild(row);
    bindChoiceRemoveButtons();
  }

  function bindChoiceRemoveButtons() {
    var btns = document.querySelectorAll('.btn-remove-choice');
    btns.forEach(function (btn) {
      // Replace to remove prior listeners
      var clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', function () {
        var row = clone.closest('.choice-row');
        if (row) row.remove();
      });
    });
  }

  // ── Save / Delete ─────────────────────────────────────────────────

  function saveCurrentNode() {
    if (!selectedNodeId) return;
    var story = StoryEngine.getStory();
    if (!story || !story.nodes) return;

    var titleEl = document.getElementById('editor-title');
    var typeEl = document.getElementById('editor-type');
    var textEl = document.getElementById('editor-text');

    var choices = [];
    var rows = document.querySelectorAll('#choices-container .choice-row');
    rows.forEach(function (row) {
      var ct = row.querySelector('.choice-text');
      var tg = row.querySelector('.choice-target');
      if (ct && tg) {
        choices.push({
          text: ct.value.trim(),
          target: tg.value || null
        });
      }
    });

    // Filter out empty choices
    choices = choices.filter(function (c) {
      return c.text !== '' || c.target;
    });

    story.nodes[selectedNodeId] = {
      title: titleEl ? titleEl.value.trim() : '',
      type: typeEl ? typeEl.value : 'normal',
      text: textEl ? textEl.value : '',
      choices: choices
    };

    // If type changed to start, update story.start
    if (typeEl && typeEl.value === 'start') {
      story.start = selectedNodeId;
    }

    StoryEngine.loadStory(story);
    refresh();
  }

  function deleteCurrentNode() {
    if (!selectedNodeId) return;
    if (!confirm('Delete node "' + selectedNodeId + '"? This cannot be undone.')) return;

    var story = StoryEngine.getStory();
    if (!story || !story.nodes) return;

    var deletedId = selectedNodeId;

    // Remove the node
    delete story.nodes[deletedId];

    // Clean up choices that reference this node
    Object.keys(story.nodes).forEach(function (nid) {
      var n = story.nodes[nid];
      if (n.choices && n.choices.length) {
        n.choices = n.choices.map(function (c) {
          if (c.target === deletedId) {
            return { text: c.text, target: null };
          }
          return c;
        });
      }
    });

    // Update start if we deleted the start node
    if (story.start === deletedId) {
      var remaining = Object.keys(story.nodes);
      story.start = remaining.length > 0 ? remaining[0] : null;
    }

    StoryEngine.loadStory(story);
    selectedNodeId = null;
    refresh();
  }

  // ── Add node ──────────────────────────────────────────────────────

  function addNode() {
    ensureStoryLoaded();
    var story = StoryEngine.getStory();
    var id = generateNodeId();

    story.nodes[id] = {
      title: id,
      type: 'normal',
      text: '',
      choices: []
    };

    StoryEngine.loadStory(story);
    selectNode(id);
    refresh();
  }

  // ── Export ─────────────────────────────────────────────────────────

  function exportStory() {
    var story = StoryEngine.getStory();
    if (!story) return;

    var json = JSON.stringify(story, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'story.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Import ─────────────────────────────────────────────────────────

  function importStory() {
    var fileInput = els.importFile;
    if (!fileInput) return;

    // Reset and trigger
    fileInput.value = '';
    fileInput.click();
  }

  function handleImportFile(evt) {
    var file = evt.target.files && evt.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var story = JSON.parse(e.target.result);
        if (!story.nodes || typeof story.nodes !== 'object') {
          alert('Invalid story file: missing "nodes" object.');
          return;
        }
        StoryEngine.loadStory(story);
        selectedNodeId = null;
        nodeCounter = 0; // reset; generateNodeId will skip existing
        refresh();
      } catch (err) {
        alert('Failed to parse story file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ── Live preview ──────────────────────────────────────────────────

  function renderPreview() {
    if (els.editorGraph && typeof GraphRenderer !== 'undefined' && GraphRenderer.render) {
      GraphRenderer.render(els.editorGraph);
    }
  }

  // ── Refresh all ───────────────────────────────────────────────────

  function refresh() {
    renderNodeList();
    renderNodeEditor();
    renderPreview();
  }

  // ── Escaping ──────────────────────────────────────────────────────

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Init ──────────────────────────────────────────────────────────

  function init() {
    // Resolve DOM elements
    els.nodeList = document.getElementById('node-list');
    els.nodeEditor = document.getElementById('node-editor');
    els.editorGraph = document.getElementById('editor-graph');
    els.importFile = document.getElementById('import-file');

    // Button bindings
    var btnAdd = document.getElementById('btn-add-node');
    if (btnAdd) btnAdd.addEventListener('click', addNode);

    var btnExport = document.getElementById('btn-export');
    if (btnExport) btnExport.addEventListener('click', exportStory);

    var btnImport = document.getElementById('btn-import');
    if (btnImport) btnImport.addEventListener('click', importStory);

    if (els.importFile) {
      els.importFile.addEventListener('change', handleImportFile);
    }

    // Ensure a story is loaded, then render
    ensureStoryLoaded();
    refresh();
  }

  // ── Public API ────────────────────────────────────────────────────

  return {
    init: init,
    refresh: refresh,
    selectNode: selectNode,
    addNode: addNode,
    exportStory: exportStory,
    importStory: importStory
  };
})();
