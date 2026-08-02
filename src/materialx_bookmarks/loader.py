from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from materialx_bookmarks.models import Bookmark, Collection, Link

BOOKMARK_KEYS = {"title", "links", "description", "tags"}
LINK_KEYS = {"text", "url"}
URL_REMOVED = (
    "'url' was replaced by 'links' in 0.3.0 — use\n  links:\n    - url: https://example.com"
)


class BookmarkError(Exception):
    pass


def parse_collection(name: str, data: Any, source: str, per_page: int) -> Collection:
    if not isinstance(data, dict):
        raise BookmarkError(f"{source}: top level must be a mapping")

    missing = {"tags", "bookmarks"} - set(data)
    if missing:
        raise BookmarkError(f"{source}: missing top level key(s): {', '.join(sorted(missing))}")

    tags = [] if data["tags"] is None else data["tags"]
    if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
        raise BookmarkError(f"{source}: 'tags' must be a list of strings")

    raw_items = [] if data["bookmarks"] is None else data["bookmarks"]
    if not isinstance(raw_items, list):
        raise BookmarkError(f"{source}: 'bookmarks' must be a list")

    allowed = set(tags)
    bookmarks = tuple(
        _parse_bookmark(raw, index, allowed, source) for index, raw in enumerate(raw_items)
    )
    return Collection(name=name, tags=tuple(tags), bookmarks=bookmarks, per_page=per_page)


def load_collection(name: str, path: Path, per_page: int) -> Collection:
    if not path.is_file():
        raise BookmarkError(f"bookmark file not found: {path}")
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as error:
        raise BookmarkError(f"{path}: invalid YAML: {error}") from error
    return parse_collection(name, data, str(path), per_page)


def _parse_bookmark(raw: Any, index: int, allowed: set[str], source: str) -> Bookmark:
    where = f"{source}: bookmark #{index + 1}"
    if not isinstance(raw, dict):
        raise BookmarkError(f"{where} must be a mapping")

    if "url" in raw:
        raise BookmarkError(f"{where}: {URL_REMOVED}")

    unknown = set(raw) - BOOKMARK_KEYS
    if unknown:
        raise BookmarkError(f"{where}: unknown field(s): {', '.join(sorted(unknown))}")

    title = raw.get("title")
    if not isinstance(title, str) or not title.strip():
        raise BookmarkError(f"{where}: 'title' is required")

    item_tags = raw.get("tags") if raw.get("tags") is not None else []
    if not isinstance(item_tags, list) or any(not isinstance(tag, str) for tag in item_tags):
        raise BookmarkError(f"{where}: 'tags' must be a list of strings")

    unlisted = [tag for tag in item_tags if tag not in allowed]
    if unlisted:
        raise BookmarkError(f"{where}: tag(s) not in the allowlist: {', '.join(unlisted)}")

    raw_links = [] if raw.get("links") is None else raw["links"]
    if not isinstance(raw_links, list):
        raise BookmarkError(f"{where}: 'links' must be a list")

    links = tuple(_parse_link(entry, index, where) for index, entry in enumerate(raw_links))

    return Bookmark(
        title=title,
        links=links,
        description=_optional_string(raw, "description", where),
        tags=tuple(item_tags),
    )


def _parse_link(raw: Any, index: int, where: str) -> Link:
    spot = f"{where}: link #{index + 1}"
    if not isinstance(raw, dict):
        raise BookmarkError(f"{spot} must be a mapping")

    unknown = set(raw) - LINK_KEYS
    if unknown:
        raise BookmarkError(f"{spot}: unknown field(s): {', '.join(sorted(unknown))}")

    url = raw.get("url")
    if not isinstance(url, str) or not url.strip():
        raise BookmarkError(f"{spot}: 'url' is required")

    text = raw.get("text")
    if text is not None and not isinstance(text, str):
        raise BookmarkError(f"{spot}: 'text' must be a string")

    return Link(url=url, text=text)


def _optional_string(raw: dict, key: str, where: str) -> str | None:
    value = raw.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise BookmarkError(f"{where}: '{key}' must be a string")
    return value
