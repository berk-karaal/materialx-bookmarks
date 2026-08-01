import pytest

from materialx_bookmarks.fence import FenceSpec, replace_fences
from materialx_bookmarks.loader import BookmarkError

KNOWN = {"reading", "tools"}


def render(spec):
    return f"<div id={spec.id} data-collection={spec.collection}></div>"


def run(markdown):
    return replace_fences(markdown, "index.md", KNOWN, render)


def test_replaces_a_fence():
    markdown = "# Title\n\n```bookmarks\ncollection: reading\n```\n\nAfter\n"

    output, specs = run(markdown)

    assert specs == [FenceSpec(collection="reading", id="reading")]
    assert output == "# Title\n\n<div id=reading data-collection=reading></div>\n\nAfter\n"


def test_explicit_id_overrides_the_default():
    output, specs = run("```bookmarks\ncollection: reading\nid: second\n```\n")

    assert specs == [FenceSpec(collection="reading", id="second")]
    assert "id=second" in output


def test_supports_several_fences_on_one_page():
    markdown = "```bookmarks\ncollection: reading\n```\n\n```bookmarks\ncollection: tools\n```\n"

    _, specs = run(markdown)

    assert [spec.collection for spec in specs] == ["reading", "tools"]


def test_leaves_other_fences_alone():
    markdown = "```python\nprint('bookmarks')\n```\n"

    output, specs = run(markdown)

    assert specs == []
    assert output == markdown


def test_leaves_a_nested_example_alone():
    markdown = "````markdown\n```bookmarks\ncollection: reading\n```\n````\n"

    output, specs = run(markdown)

    assert specs == []
    assert output == markdown


def test_returns_markdown_without_fences_unchanged():
    markdown = "# Title\n\nJust text.\n"

    output, specs = run(markdown)

    assert output == markdown
    assert specs == []


@pytest.mark.parametrize(
    "body, message",
    [
        ("id: x", "must set 'collection'"),
        ("collection: nope", "unknown collection: nope"),
        ("collection: reading\nextra: 1", "unknown key(s)"),
        ("- reading", "must contain a mapping"),
        ("collection: [reading", "invalid YAML"),
    ],
)
def test_rejects_a_bad_fence(body, message):
    with pytest.raises(BookmarkError) as error:
        run(f"```bookmarks\n{body}\n```\n")

    assert message in str(error.value)


def test_rejects_a_duplicate_id():
    markdown = "```bookmarks\ncollection: reading\n```\n\n```bookmarks\ncollection: reading\n```\n"

    with pytest.raises(BookmarkError) as error:
        run(markdown)

    assert "duplicate bookmarks id" in str(error.value)


def test_rejects_an_unclosed_fence():
    with pytest.raises(BookmarkError) as error:
        run("```bookmarks\ncollection: reading\n")

    assert "unclosed" in str(error.value)
