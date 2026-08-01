import pytest

from materialx_bookmarks.loader import BookmarkError, load_collection, parse_collection
from materialx_bookmarks.models import collection_to_dict

VALID = {
    "tags": ["python", "ai"],
    "bookmarks": [
        {
            "title": "Ruff",
            "url": "https://astral.sh/ruff",
            "description": "Fast Python linter",
            "tags": ["python"],
        },
        {"title": "Plain note", "tags": ["ai"]},
    ],
}


def test_parses_a_valid_collection():
    collection = parse_collection("reading", VALID, "reading.yml", 20)

    assert collection.name == "reading"
    assert collection.per_page == 20
    assert collection.tags == ("python", "ai")
    assert [item.title for item in collection.bookmarks] == ["Ruff", "Plain note"]
    assert collection.bookmarks[1].url is None
    assert collection.bookmarks[1].description is None


def test_preserves_yaml_order():
    data = {"tags": [], "bookmarks": [{"title": "c"}, {"title": "a"}, {"title": "b"}]}

    collection = parse_collection("x", data, "x.yml", 20)

    assert [item.title for item in collection.bookmarks] == ["c", "a", "b"]


def test_serializes_omitting_absent_fields():
    collection = parse_collection("reading", VALID, "reading.yml", 20)

    assert collection_to_dict(collection) == {
        "tags": ["python", "ai"],
        "items": [
            {
                "title": "Ruff",
                "url": "https://astral.sh/ruff",
                "description": "Fast Python linter",
                "tags": ["python"],
            },
            {"title": "Plain note", "tags": ["ai"]},
        ],
    }


@pytest.mark.parametrize(
    "data, message",
    [
        ([], "top level must be a mapping"),
        ({"tags": []}, "missing top level key"),
        ({"bookmarks": []}, "missing top level key"),
        ({"tags": "python", "bookmarks": []}, "'tags' must be a list of strings"),
        ({"tags": [], "bookmarks": {}}, "'bookmarks' must be a list"),
        ({"tags": [], "bookmarks": ["nope"]}, "must be a mapping"),
        ({"tags": [], "bookmarks": [{"url": "https://x"}]}, "'title' is required"),
        ({"tags": [], "bookmarks": [{"title": "a", "note": "x"}]}, "unknown field"),
        ({"tags": [], "bookmarks": [{"title": "a", "url": 5}]}, "'url' must be a string"),
        ({"tags": ["a"], "bookmarks": [{"title": "a", "tags": ["b"]}]}, "not in the allowlist"),
    ],
)
def test_rejects_invalid_input(data, message):
    with pytest.raises(BookmarkError) as error:
        parse_collection("x", data, "x.yml", 20)

    assert message in str(error.value)


def test_reads_a_file(tmp_path):
    path = tmp_path / "reading.yml"
    path.write_text("tags: [python]\nbookmarks:\n  - title: Ruff\n    tags: [python]\n")

    collection = load_collection("reading", path, 10)

    assert collection.bookmarks[0].title == "Ruff"
    assert collection.per_page == 10


def test_reports_a_missing_file(tmp_path):
    with pytest.raises(BookmarkError) as error:
        load_collection("reading", tmp_path / "nope.yml", 10)

    assert "bookmark file not found" in str(error.value)


def test_reports_broken_yaml(tmp_path):
    path = tmp_path / "reading.yml"
    path.write_text("tags: [python\nbookmarks: []\n")

    with pytest.raises(BookmarkError) as error:
        load_collection("reading", path, 10)

    assert "invalid YAML" in str(error.value)
