import pytest

from materialx_bookmarks.config import BookmarksConfig, validate_collections
from materialx_bookmarks.loader import BookmarkError


def collection(**overrides):
    base = {
        "name": "reading",
        "file": "bookmarks/reading.yml",
        "per_page": 20,
        "item_name": "",
        "item_name_plural": "",
        "tag_sorting": "manual",
    }
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
        ([collection(item_name="project")], "'item_name' and 'item_name_plural'"),
        ([collection(item_name_plural="projects")], "'item_name' and 'item_name_plural'"),
        (
            [collection(item_name="   ", item_name_plural="projects")],
            "'item_name' and 'item_name_plural'",
        ),
        ([collection(tag_sorting="by-count")], "'tag_sorting' must be one of"),
        ([collection(tag_sorting="")], "'tag_sorting' must be one of"),
        ([collection(), collection()], "duplicate collection name"),
    ],
)
def test_rejects_invalid_lists(collections, message):
    with pytest.raises(BookmarkError) as error:
        validate_collections(collections)

    assert message in str(error.value)


def test_accepts_a_noun_pair_and_every_tag_sorting():
    for sorting in ("manual", "alphabetical", "count"):
        validate_collections(
            [collection(item_name="project", item_name_plural="projects", tag_sorting=sorting)]
        )


def test_defaults_the_new_keys():
    config = BookmarksConfig()
    config.load_dict({"collections": [{"name": "reading", "file": "reading.yml"}]})
    failed, _ = config.validate()

    assert failed == []
    assert config["collections"][0]["item_name"] == ""
    assert config["collections"][0]["item_name_plural"] == ""
    assert config["collections"][0]["tag_sorting"] == "manual"


def test_unknown_tag_sorting_lists_the_options():
    with pytest.raises(BookmarkError) as error:
        validate_collections([collection(tag_sorting="nope")])

    assert "manual, alphabetical, count" in str(error.value)
