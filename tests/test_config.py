import pytest

from materialx_bookmarks.config import (
    DISPLAYS,
    BookmarksConfig,
    resolve_display_options,
    resolve_page_size_options,
    validate_collections,
)
from materialx_bookmarks.loader import BookmarkError


def collection(**overrides):
    base = {
        "name": "reading",
        "file": "bookmarks/reading.yml",
        "per_page": 20,
        "item_name": "",
        "item_name_plural": "",
        "tag_sorting": "manual",
        "display": "list",
        "display_options": None,
        "per_page_options": None,
        "block_min_width": "12rem",
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
        ([collection(display="grid")], "'display' must be one of"),
        ([collection(display_options=["list", "grid"])], "'display_options' may only contain"),
        (
            [collection(display="compact", display_options=["list", "blocks"])],
            "'display_options' must include 'display'",
        ),
        ([collection(per_page_options=[10, "many"])], "'per_page_options' may only contain"),
        ([collection(per_page_options=[10, 0])], "'per_page_options' may only contain"),
        (
            [collection(per_page=20, per_page_options=[10, 30])],
            "'per_page_options' must include 'per_page'",
        ),
        ([collection(block_min_width="12")], "'block_min_width' must be a CSS length"),
        ([collection(block_min_width="wide")], "'block_min_width' must be a CSS length"),
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


def test_defaults_the_display_keys():
    config = BookmarksConfig()
    config.load_dict({"collections": [{"name": "reading", "file": "reading.yml"}]})
    failed, _ = config.validate()

    assert failed == []
    item = config["collections"][0]
    assert item["display"] == "list"
    assert item["display_options"] is None
    assert item["per_page_options"] is None
    assert item["block_min_width"] == "12rem"


def test_accepts_every_display_and_an_all_page_size():
    for display in DISPLAYS:
        validate_collections([collection(display=display)])

    validate_collections([collection(per_page=20, per_page_options=[20, 50, "all"])])


def test_an_empty_display_options_list_turns_the_switcher_off():
    validate_collections([collection(display="blocks", display_options=[])])


def test_resolve_display_options_defaults_to_every_mode():
    assert resolve_display_options(collection()) == list(DISPLAYS)
    assert resolve_display_options(collection(display_options=[])) == []
    assert resolve_display_options(collection(display_options=["list", "blocks"])) == [
        "list",
        "blocks",
    ]


def test_resolve_page_size_options_defaults_to_no_picker():
    assert resolve_page_size_options(collection()) == []
    assert resolve_page_size_options(collection(per_page_options=[20, "all"])) == [20, "all"]
