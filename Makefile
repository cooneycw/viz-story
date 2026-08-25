.PHONY: lint format test typecheck build clean verify dev

lint:
	ruff check .

format:
	ruff format .

test:
	uv run pytest

typecheck:
	uv run mypy .

build:
	uv build

clean:
	rm -rf dist/ .mypy_cache/ .pytest_cache/ .ruff_cache/

verify: lint test typecheck

dev:
	uv run python -m viz_story
