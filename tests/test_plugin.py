import html
import json
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
    assert "url" not in payload["items"][-1]


def test_emits_the_assets(site):
    output = build_site(site)

    assert (output / "assets" / "bookmarks" / "bookmarks.js").is_file()
    assert (output / "assets" / "bookmarks" / "bookmarks.css").is_file()


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

    assert "bookmarks.js" in (output / "index.html").read_text()
    assert "bookmarks.js" not in (output / "plain" / "index.html").read_text()


def test_injects_assets_everywhere_when_instant_navigation_is_on(site):
    (site / "docs" / "plain.md").write_text("# Plain\n\nNothing here.\n")
    config_text = (site / "mkdocs.yml").read_text()
    (site / "mkdocs.yml").write_text(
        config_text.replace("  name: mkdocs", "  name: mkdocs\n  features:\n    - navigation.instant")
    )

    output = build_site(site)

    assert "bookmarks.js" in (output / "plain" / "index.html").read_text()


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
