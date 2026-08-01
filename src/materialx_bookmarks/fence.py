from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import yaml

from materialx_bookmarks.loader import BookmarkError

FENCE_KEYS = {"collection", "id"}
_OPENING = re.compile(r"^\s*(`{3,})\s*(\S*)\s*$")


@dataclass(frozen=True)
class FenceSpec:
    collection: str
    id: str


def replace_fences(
    markdown: str,
    page: str,
    known: set[str],
    render: Callable[[FenceSpec], str],
) -> tuple[str, list[FenceSpec]]:
    lines = markdown.split("\n")
    output: list[str] = []
    specs: list[FenceSpec] = []
    seen_ids: set[str] = set()

    index = 0
    while index < len(lines):
        opening = _OPENING.match(lines[index])
        if not opening:
            output.append(lines[index])
            index += 1
            continue

        ticks, info = opening.groups()
        end = _find_closing(lines, index + 1, ticks)
        if info != "bookmarks":
            stop = len(lines) - 1 if end is None else end
            output.extend(lines[index : stop + 1])
            index = stop + 1
            continue

        if end is None:
            raise BookmarkError(f"{page}: unclosed bookmarks block")

        spec = _parse_body("\n".join(lines[index + 1 : end]), page, known, seen_ids)
        specs.append(spec)
        output.append(render(spec))
        index = end + 1

    return "\n".join(output), specs


def _find_closing(lines: list[str], start: int, ticks: str) -> int | None:
    for index in range(start, len(lines)):
        stripped = lines[index].strip()
        if set(stripped) == {"`"} and len(stripped) >= len(ticks):
            return index
    return None


def _parse_body(body: str, page: str, known: set[str], seen_ids: set[str]) -> FenceSpec:
    try:
        data: Any = yaml.safe_load(body) or {}
    except yaml.YAMLError as error:
        raise BookmarkError(f"{page}: invalid YAML in a bookmarks block: {error}") from error

    if not isinstance(data, dict):
        raise BookmarkError(f"{page}: a bookmarks block must contain a mapping")

    unknown = set(data) - FENCE_KEYS
    if unknown:
        raise BookmarkError(
            f"{page}: unknown key(s) in a bookmarks block: {', '.join(sorted(unknown))}"
        )

    collection = data.get("collection")
    if not isinstance(collection, str) or not collection:
        raise BookmarkError(f"{page}: a bookmarks block must set 'collection'")
    if collection not in known:
        raise BookmarkError(f"{page}: unknown collection: {collection}")

    instance = data.get("id") or collection
    if not isinstance(instance, str):
        raise BookmarkError(f"{page}: 'id' must be a string")
    if instance in seen_ids:
        raise BookmarkError(f"{page}: duplicate bookmarks id on one page: {instance}")
    seen_ids.add(instance)

    return FenceSpec(collection=collection, id=instance)
