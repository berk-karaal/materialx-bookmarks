from __future__ import annotations

import logging
from pathlib import Path

import yaml

from materialx_bookmarks.loader import BookmarkError

LOCALES_DIR = Path(__file__).parent / "locales"
FALLBACK_LANGUAGE = "en"

log = logging.getLogger("mkdocs.plugins.materialx-bookmarks")


def available_locales() -> list[str]:
    return sorted(path.stem for path in LOCALES_DIR.glob("*.yml"))


def resolve_language(configured: str | None, theme_language: str | None) -> str:
    available = available_locales()
    if configured:
        if configured not in available:
            raise BookmarkError(
                f"materialx-bookmarks: unknown language '{configured}'. "
                f"Available: {', '.join(available)}"
            )
        return configured
    if theme_language in available:
        return theme_language
    return FALLBACK_LANGUAGE


def load_labels(language: str) -> dict[str, str]:
    fallback = _read(FALLBACK_LANGUAGE)
    if language == FALLBACK_LANGUAGE:
        return fallback

    labels = _read(language)
    missing = sorted(key for key in fallback if key not in labels)
    if missing:
        log.warning(
            "materialx-bookmarks: locale '%s' is missing key(s), using English for: %s",
            language,
            ", ".join(missing),
        )
    merged = dict(fallback)
    merged.update({key: value for key, value in labels.items() if key in fallback})
    return merged


def _read(language: str) -> dict[str, str]:
    path = LOCALES_DIR / f"{language}.yml"
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
