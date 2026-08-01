from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from materialx_bookmarks.models import Bookmark, Collection

BOOKMARK_KEYS = {"title", "url", "description", "tags"}


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

    return Bookmark(
        title=title,
        url=_optional_string(raw, "url", where),
        description=_optional_string(raw, "description", where),
        tags=tuple(item_tags),
    )


def _optional_string(raw: dict, key: str, where: str) -> str | None:
    value = raw.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise BookmarkError(f"{where}: '{key}' must be a string")
    return value
