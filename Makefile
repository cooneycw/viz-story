.PHONY: dev clean verify

dev:
	python3 -m http.server 8080

clean:
	rm -rf .venv/ __pycache__/

verify:
	@echo "viz-story: static HTML project — open index.html in a browser"
	@test -f index.html && echo "  ✓ index.html exists" || echo "  ✗ index.html missing"
	@test -f js/app.js && echo "  ✓ js/app.js exists" || echo "  ✗ js/app.js missing"
	@test -f js/story-engine.js && echo "  ✓ js/story-engine.js exists" || echo "  ✗ js/story-engine.js missing"
	@test -f js/graph-renderer.js && echo "  ✓ js/graph-renderer.js exists" || echo "  ✗ js/graph-renderer.js missing"
	@test -f js/editor.js && echo "  ✓ js/editor.js exists" || echo "  ✗ js/editor.js missing"
	@test -f stories/demo.json && echo "  ✓ stories/demo.json exists" || echo "  ✗ stories/demo.json missing"
