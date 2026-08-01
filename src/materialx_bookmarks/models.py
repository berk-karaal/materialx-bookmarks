from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Bookmark:
    title: str
    url: str | None = None
    description: str | None = None
    tags: tuple[str, ...] = ()


@dataclass(frozen=True)
class Collection:
    name: str
    tags: tuple[str, ...]
    bookmarks: tuple[Bookmark, ...]
    per_page: int


def bookmark_to_dict(bookmark: Bookmark) -> dict:
    data: dict = {"title": bookmark.title}
    if bookmark.url is not None:
        data["url"] = bookmark.url
    if bookmark.description is not None:
        data["description"] = bookmark.description
    if bookmark.tags:
        data["tags"] = list(bookmark.tags)
    return data


def collection_to_dict(collection: Collection) -> dict:
    return {
        "tags": list(collection.tags),
        "items": [bookmark_to_dict(item) for item in collection.bookmarks],
    }
