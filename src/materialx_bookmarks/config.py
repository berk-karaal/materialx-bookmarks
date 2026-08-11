from __future__ import annotations

from mkdocs.config import config_options
from mkdocs.config.base import Config

from materialx_bookmarks.loader import BookmarkError

TAG_SORTINGS = ("manual", "alphabetical", "count")


class CollectionConfig(Config):
    name = config_options.Type(str, default="")
    file = config_options.Type(str, default="")
    per_page = config_options.Type(int, default=20)
    item_name = config_options.Type(str, default="")
    item_name_plural = config_options.Type(str, default="")
    tag_sorting = config_options.Type(str, default="manual")


class BookmarksConfig(Config):
    language = config_options.Optional(config_options.Type(str))
    collections = config_options.ListOfItems(config_options.SubConfig(CollectionConfig), default=[])


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
        if item["per_page"] < 1:
            raise BookmarkError(f"{where} ({item['name']}): 'per_page' must be >= 1")
        if bool(item["item_name"].strip()) != bool(item["item_name_plural"].strip()):
            raise BookmarkError(
                f"{where} ({item['name']}): 'item_name' and 'item_name_plural' "
                "must be given together"
            )
        if item["tag_sorting"] not in TAG_SORTINGS:
            raise BookmarkError(
                f"{where} ({item['name']}): 'tag_sorting' must be one of: {', '.join(TAG_SORTINGS)}"
            )
        if item["name"] in seen:
            raise BookmarkError(f"materialx-bookmarks: duplicate collection name: {item['name']}")
        seen.add(item["name"])
