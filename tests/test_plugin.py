import html
import json
import re
import shutil
from pathlib import Path

import pytest
from mkdocs.commands.build import build
from mkdocs.config import load_config
from mkdocs.exceptions import Abort

FIXTURE = Path(__file__).parent / "fixtures" / "site"


@pytest.fixture
def site(tmp_path):
    target = tmp_path / "site-src"
    shutil.copytree(FIXTURE, target)
    return target


def build_site(source: Path) -> Path:
    output = source.parent / "site"
    config = load_config(str(source / "mkdocs.yml"), site_dir=str(output))
    build(config)
    return output


def blob(html_text: str) -> dict:
    marker = 'data-mxb="'
    start = html_text.index(marker) + len(marker)
    end = html_text.index('"', start)
    return json.loads(html.unescape(html_text[start:end]))


def test_emits_collection_json(site):
    output = build_site(site)

    payload = json.loads((output / "assets" / "bookmarks" / "reading.json").read_text())

    assert payload["tags"] == ["python", "rust", "ai"]
    assert [item["title"] for item in payload["items"]][:2] == ["Ruff", "uv"]
    assert payload["items"][0]["links"] == [
        {"url": "https://astral.sh/ruff", "text": "Docs"},
        {"url": "https://github.com/astral-sh/ruff/releases"},
    ]
    assert "links" not in payload["items"][-1]


def test_emits_the_assets_with_hashed_names(site):
    output = build_site(site)
    assets = output / "assets" / "bookmarks"

    js = list(assets.glob("bookmarks.*.js"))
    css = list(assets.glob("bookmarks.*.css"))

    assert len(js) == 1
    assert len(css) == 1
    assert re.fullmatch(r"bookmarks\.[0-9a-f]{8}\.js", js[0].name)
    assert re.fullmatch(r"bookmarks\.[0-9a-f]{8}\.css", css[0].name)
    assert js[0].name in (output / "index.html").read_text()
    assert css[0].name in (output / "index.html").read_text()


def test_asset_name_changes_when_the_bundle_changes(site, tmp_path, monkeypatch):
    import materialx_bookmarks.plugin as plugin

    before = next(build_site(site).glob("assets/bookmarks/bookmarks.*.js")).name

    fake_assets = tmp_path / "assets"
    fake_assets.mkdir()
    (fake_assets / "bookmarks.css").write_text("/* changed */")
    (fake_assets / "bookmarks.js").write_text("console.debug('changed');")
    monkeypatch.setattr(plugin, "ASSETS_DIR", fake_assets)

    after = next(build_site(site).glob("assets/bookmarks/bookmarks.*.js")).name

    assert before != after


def test_replaces_the_fence_with_a_container(site):
    output = build_site(site)

    page = (output / "index.html").read_text()
    data = blob(page)

    assert 'class="mxb"' in page
    assert data["id"] == "reading"
    assert data["perPage"] == 2
    assert data["labels"]["no_results"] == "No bookmarks found"
    assert data["url"].startswith("assets/bookmarks/reading.json?h=")


def test_json_url_is_relative_to_the_page(site):
    output = build_site(site)

    data = blob((output / "guides" / "deep" / "index.html").read_text())

    assert data["id"] == "deep"
    assert data["url"].startswith("../../assets/bookmarks/reading.json?h=")


def test_injects_assets_only_into_pages_with_a_fence(site):
    (site / "docs" / "plain.md").write_text("# Plain\n\nNothing here.\n")

    output = build_site(site)

    assert "bookmarks." in (output / "index.html").read_text()
    assert "assets/bookmarks/bookmarks." not in (output / "plain" / "index.html").read_text()


def test_injects_assets_everywhere_when_instant_navigation_is_on(site):
    (site / "docs" / "plain.md").write_text("# Plain\n\nNothing here.\n")
    config_text = (site / "mkdocs.yml").read_text()
    (site / "mkdocs.yml").write_text(
        config_text.replace(
            "  name: mkdocs", "  name: mkdocs\n  features:\n    - navigation.instant"
        )
    )

    output = build_site(site)

    assert "assets/bookmarks/bookmarks." in (output / "plain" / "index.html").read_text()


def test_turkish_labels_come_from_the_theme_language(site):
    config_text = (site / "mkdocs.yml").read_text()
    (site / "mkdocs.yml").write_text(
        config_text.replace("  name: mkdocs", "  name: mkdocs\n  language: tr")
    )

    output = build_site(site)

    assert blob((output / "index.html").read_text())["labels"]["all_tags"] == "Tümü"


def test_a_bad_bookmark_file_fails_the_build(site, caplog):
    (site / "bookmarks" / "reading.yml").write_text(
        "tags: [python]\nbookmarks:\n  - title: a\n    tags: [nope]\n"
    )

    with pytest.raises(Abort):
        build_site(site)

    assert "not in the allowlist" in caplog.text


def test_an_unknown_collection_in_a_fence_fails_the_build(site, caplog):
    (site / "docs" / "index.md").write_text("```bookmarks\ncollection: nope\n```\n")

    with pytest.raises(Abort):
        build_site(site)

    assert "unknown collection: nope" in caplog.text


def test_labels_use_the_collection_nouns(site):
    config_text = (site / "mkdocs.yml").read_text()
    (site / "mkdocs.yml").write_text(
        config_text.replace(
            "          per_page: 2",
            "          per_page: 2\n          item_name: article\n"
            "          item_name_plural: articles",
        )
    )

    output = build_site(site)
    labels = blob((output / "index.html").read_text())["labels"]

    assert labels["search_placeholder"] == "Search articles"
    assert labels["no_results"] == "No articles found"
    assert labels["result_count"] == "{shown} of {total} articles"
    assert labels["result_count_one"] == "{shown} of {total} article"


def test_labels_fall_back_to_the_locale_nouns(site):
    output = build_site(site)
    labels = blob((output / "index.html").read_text())["labels"]

    assert labels["search_placeholder"] == "Search bookmarks"
    assert labels["result_count"] == "{shown} of {total} bookmarks"


def test_the_blob_carries_the_tag_sorting_and_the_language(site):
    config_text = (site / "mkdocs.yml").read_text()
    (site / "mkdocs.yml").write_text(
        config_text.replace(
            "          per_page: 2", "          per_page: 2\n          tag_sorting: count"
        )
    )

    output = build_site(site)
    data = blob((output / "index.html").read_text())

    assert data["tagSorting"] == "count"
    assert data["language"] == "en"


def test_the_blob_defaults_to_manual_sorting(site):
    output = build_site(site)

    assert blob((output / "index.html").read_text())["tagSorting"] == "manual"


def test_two_collections_get_their_own_labels(site):
    (site / "bookmarks" / "projects.yml").write_text("tags: [a]\nbookmarks:\n  - title: One\n")
    config_text = (site / "mkdocs.yml").read_text()
    (site / "mkdocs.yml").write_text(
        config_text + "        - name: projects\n          file: bookmarks/projects.yml\n"
        "          item_name: project\n          item_name_plural: projects\n"
    )
    (site / "docs" / "projects.md").write_text(
        "# Projects\n\n```bookmarks\ncollection: projects\n```\n"
    )

    output = build_site(site)

    reading = blob((output / "index.html").read_text())["labels"]
    projects = blob((output / "projects" / "index.html").read_text())["labels"]

    assert reading["search_placeholder"] == "Search bookmarks"
    assert projects["search_placeholder"] == "Search projects"
