"""Placeholder test to verify setup."""


def test_import():
    """Verify the package can be imported."""
    import importlib
    mod = importlib.import_module("viz_story")
    assert hasattr(mod, "__version__")
