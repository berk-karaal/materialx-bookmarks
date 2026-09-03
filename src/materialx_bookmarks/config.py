from __future__ import annotations

import re

from mkdocs.config import config_options
from mkdocs.config.base import Config

from materialx_bookmarks.loader import BookmarkError

TAG_SORTINGS = ("manual", "alphabetical", "count")
DISPLAYS = ("list", "blocks", "compact")
PAGE_SIZE_ALL = "all"
_LENGTH = re.compile(r"^\d+(\.\d+)?(rem|em|px|ch)$")


class CollectionConfig(Config):
    name = config_options.Type(str, default="")
    file = config_options.Type(str, default="")
    per_page = config_options.Type(int, default=20)
    per_page_options = config_options.Optional(config_options.Type(list))
    item_name = config_options.Type(str, default="")
    item_name_plural = config_options.Type(str, default="")
    tag_sorting = config_options.Type(str, default="manual")
    display = config_options.Type(str, default="list")
    display_options = config_options.Optional(config_options.Type(list))
    block_min_width = config_options.Type(str, default="12rem")


class BookmarksConfig(Config):
    language = config_options.Optional(config_options.Type(str))
    collections = config_options.ListOfItems(config_options.SubConfig(CollectionConfig), default=[])


def resolve_display_options(item) -> list[str]:
    """The display modes the reader may switch between, empty when there is no switcher."""
    if item["display_options"] is None:
        return list(DISPLAYS)
    return list(item["display_options"])


def resolve_page_size_options(item) -> list[int | str]:
    """The page sizes the reader may choose from, empty when there is no picker."""
    return list(item["per_page_options"] or [])


def validate_collections(collections: list) -> None:
    if not collections:
        raise BookmarkError("materialx-bookmarks: 'collections' must list at least one collection")

    seen: set[str] = set()
    for index, item in enumerate(collections):
        where = f"materialx-bookmarks: collection #{index + 1}"
        if not item["name"]:
            raise BookmarkError(f"{where}: 'name' is required")
        if not item["file"]:
            raise BookmarkError(f"{where} ({item['name']}): 'file' is required")

        label = f"{where} ({item['name']})"
        if item["per_page"] < 1:
            raise BookmarkError(f"{label}: 'per_page' must be >= 1")
        if bool(item["item_name"].strip()) != bool(item["item_name_plural"].strip()):
            raise BookmarkError(
                f"{label}: 'item_name' and 'item_name_plural' must be given together"
            )
        if item["tag_sorting"] not in TAG_SORTINGS:
            raise BookmarkError(f"{label}: 'tag_sorting' must be one of: {', '.join(TAG_SORTINGS)}")

        _validate_display(label, item)
        _validate_page_sizes(label, item)

        if not _LENGTH.match(item["block_min_width"]):
            raise BookmarkError(
                f"{label}: 'block_min_width' must be a CSS length such as 12rem, not "
                f"{item['block_min_width']!r}"
            )
        if item["name"] in seen:
            raise BookmarkError(f"materialx-bookmarks: duplicate collection name: {item['name']}")
        seen.add(item["name"])


def _validate_display(label: str, item) -> None:
    if item["display"] not in DISPLAYS:
        raise BookmarkError(f"{label}: 'display' must be one of: {', '.join(DISPLAYS)}")

    options = item["display_options"]
    if options is None:
        return

    for option in options:
        if option not in DISPLAYS:
            raise BookmarkError(
                f"{label}: 'display_options' may only contain: {', '.join(DISPLAYS)}"
            )
    if options and item["display"] not in options:
        raise BookmarkError(
            f"{label}: 'display_options' must include 'display' ({item['display']})"
        )


def _validate_page_sizes(label: str, item) -> None:
    options = item["per_page_options"]
    if options is None:
        return

    for option in options:
        if option == PAGE_SIZE_ALL:
            continue
        if not isinstance(option, int) or isinstance(option, bool) or option < 1:
            raise BookmarkError(
                f"{label}: 'per_page_options' may only contain positive numbers or "
                f"'{PAGE_SIZE_ALL}', not {option!r}"
            )
    if options and item["per_page"] not in options:
        raise BookmarkError(
            f"{label}: 'per_page_options' must include 'per_page' ({item['per_page']})"
        )
