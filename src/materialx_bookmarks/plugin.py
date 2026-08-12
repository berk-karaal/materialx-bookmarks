from __future__ import annotations

import hashlib
import html
import json
from pathlib import Path

from mkdocs.exceptions import PluginError
from mkdocs.plugins import BasePlugin
from mkdocs.structure.files import File
from mkdocs.utils import get_relative_url

from materialx_bookmarks.config import BookmarksConfig, validate_collections
from materialx_bookmarks.fence import FenceSpec, replace_fences
from materialx_bookmarks.loader import BookmarkError, load_collection
from materialx_bookmarks.locales import load_labels, resolve_labels, resolve_language
from materialx_bookmarks.models import collection_to_dict

ASSETS_DIR = Path(__file__).parent / "assets"
OUTPUT_DIR = "assets/bookmarks"


class BookmarksPlugin(BasePlugin[BookmarksConfig]):
    def on_config(self, config):
        try:
            validate_collections(self.config["collections"])
            self.language = resolve_language(self.config["language"], _theme_language(config))
            labels = load_labels(self.language)
            root = Path(config["config_file_path"]).parent
            self.watch_paths = [str(root / item["file"]) for item in self.config["collections"]]
            self.collections = {
                item["name"]: load_collection(item["name"], root / item["file"], item["per_page"])
                for item in self.config["collections"]
            }
            self.labels_by_collection = {
                item["name"]: resolve_labels(
                    labels,
                    item["item_name"].strip() or labels["item_name"],
                    item["item_name_plural"].strip() or labels["item_name_plural"],
                    self.language,
                )
                for item in self.config["collections"]
            }
            self.tag_sortings = {
                item["name"]: item["tag_sorting"] for item in self.config["collections"]
            }
        except BookmarkError as error:
            raise PluginError(str(error)) from error

        self.payloads = {
            name: json.dumps(collection_to_dict(collection), ensure_ascii=False)
            for name, collection in self.collections.items()
        }
        self.digests = {
            name: hashlib.sha256(payload.encode("utf-8")).hexdigest()[:8]
            for name, payload in self.payloads.items()
        }
        self.pages_with_bookmarks: set[str] = set()
        self.inject_everywhere = _uses_instant_navigation(config)

        self.assets = {}
        for name in ("bookmarks.css", "bookmarks.js"):
            content = (ASSETS_DIR / name).read_text("utf-8")
            stem, suffix = name.rsplit(".", 1)
            digest = hashlib.sha256(content.encode("utf-8")).hexdigest()[:8]
            self.assets[suffix] = (f"{OUTPUT_DIR}/{stem}.{digest}.{suffix}", content)
        return config

    def on_files(self, files, config):
        for name, payload in self.payloads.items():
            files.append(File.generated(config, f"{OUTPUT_DIR}/{name}.json", content=payload))
        for uri, content in self.assets.values():
            files.append(File.generated(config, uri, content=content))
        return files

    def on_page_markdown(self, markdown, page, config, files):
        try:
            output, specs = replace_fences(
                markdown,
                page.file.src_uri,
                set(self.collections),
                lambda spec: self._placeholder(spec, page.url),
            )
        except BookmarkError as error:
            raise PluginError(str(error)) from error

        if specs:
            self.pages_with_bookmarks.add(page.file.src_uri)
        return output

    def on_post_page(self, output, page, config):
        if not self.inject_everywhere and page.file.src_uri not in self.pages_with_bookmarks:
            return output
        css = get_relative_url(self.assets["css"][0], page.url)
        js = get_relative_url(self.assets["js"][0], page.url)
        tags = f'<link rel="stylesheet" href="{css}"><script defer src="{js}"></script>'
        return output.replace("</body>", f"{tags}</body>", 1)

    def on_serve(self, server, config, builder):
        for path in self.watch_paths:
            server.watch(path)
        return server

    def _placeholder(self, spec: FenceSpec, page_url: str) -> str:
        json_url = get_relative_url(f"{OUTPUT_DIR}/{spec.collection}.json", page_url)
        data = {
            "id": spec.id,
            "url": f"{json_url}?h={self.digests[spec.collection]}",
            "perPage": self.collections[spec.collection].per_page,
            "tagSorting": self.tag_sortings[spec.collection],
            "language": self.language,
            "labels": self.labels_by_collection[spec.collection],
        }
        blob = html.escape(json.dumps(data, ensure_ascii=False))
        return f'<div class="mxb" data-mxb="{blob}"></div>'


def _theme_language(config) -> str | None:
    try:
        return config["theme"]["language"]
    except KeyError:
        return None


def _uses_instant_navigation(config) -> bool:
    try:
        features = config["theme"]["features"]
    except KeyError:
        return False
    return "navigation.instant" in (features or [])
