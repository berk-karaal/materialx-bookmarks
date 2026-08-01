import pytest

from materialx_bookmarks.config import BookmarksConfig, validate_collections
from materialx_bookmarks.loader import BookmarkError


def collection(**overrides):
    base = {"name": "reading", "file": "bookmarks/reading.yml", "per_page": 20}
    base.update(overrides)
    return base


def test_accepts_a_valid_list():
    validate_collections([collection(), collection(name="tools")])


def test_defaults_per_page_to_twenty():
    config = BookmarksConfig()
    config.load_dict({"collections": [{"name": "reading", "file": "reading.yml"}]})
    failed, _ = config.validate()

    assert failed == []
    assert config["collections"][0]["per_page"] == 20
    assert config["language"] is None


@pytest.mark.parametrize(
    "collections, message",
    [
        ([], "at least one collection"),
        ([collection(name="")], "'name' is required"),
        ([collection(file="")], "'file' is required"),
        ([collection(per_page=0)], "'per_page' must be >= 1"),
        ([collection(), collection()], "duplicate collection name"),
    ],
)
def test_rejects_invalid_lists(collections, message):
    with pytest.raises(BookmarkError) as error:
        validate_collections(collections)

    assert message in str(error.value)
