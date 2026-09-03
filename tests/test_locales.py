import pytest

from materialx_bookmarks.loader import BookmarkError
from materialx_bookmarks.locales import (
    available_locales,
    load_labels,
    resolve_labels,
    resolve_language,
)

KEYS = {
    "item_name",
    "item_name_plural",
    "result_count_one",
    "search_placeholder",
    "no_results",
    "result_count",
    "all_tags",
    "sort_reverse",
    "prev_page",
    "next_page",
    "display_mode",
    "view_list",
    "view_blocks",
    "view_compact",
    "page_size",
    "page_size_all",
}


def test_ships_english_and_turkish():
    assert available_locales() == ["en", "tr"]


def test_every_locale_carries_every_key():
    for language in available_locales():
        assert set(load_labels(language)) == KEYS


def test_configured_language_wins():
    assert resolve_language("tr", "en") == "tr"


def test_falls_back_to_the_theme_language():
    assert resolve_language(None, "tr") == "tr"


def test_falls_back_to_english():
    assert resolve_language(None, None) == "en"
    assert resolve_language(None, "de") == "en"


def test_rejects_an_unknown_configured_language():
    with pytest.raises(BookmarkError) as error:
        resolve_language("de", None)

    assert "de" in str(error.value)
    assert "en, tr" in str(error.value)


def test_a_missing_key_falls_back_to_english(tmp_path, monkeypatch):
    import materialx_bookmarks.locales as locales

    (tmp_path / "en.yml").write_text("a: A\nb: B\n")
    (tmp_path / "xx.yml").write_text("a: Ax\n")
    monkeypatch.setattr(locales, "LOCALES_DIR", tmp_path)

    assert load_labels("xx") == {"a": "Ax", "b": "B"}


def test_substitutes_both_nouns():
    labels = {
        "search_placeholder": "Search {items}",
        "result_count": "{shown} of {total} {items}",
        "result_count_one": "{shown} of {total} {item}",
    }

    resolved = resolve_labels(labels, "project", "projects")

    assert resolved["search_placeholder"] == "Search projects"
    assert resolved["result_count"] == "{shown} of {total} projects"
    assert resolved["result_count_one"] == "{shown} of {total} project"


def test_substitution_does_not_leave_a_stray_s():
    resolved = resolve_labels({"a": "{items}"}, "project", "projects")

    assert resolved["a"] == "projects"


def test_substitution_leaves_the_input_untouched():
    labels = {"a": "Search {items}"}

    resolve_labels(labels, "project", "projects")

    assert labels == {"a": "Search {items}"}


def test_english_strings_read_naturally_with_the_default_nouns():
    labels = load_labels("en")
    resolved = resolve_labels(labels, labels["item_name"], labels["item_name_plural"])

    assert resolved["search_placeholder"] == "Search bookmarks"
    assert resolved["no_results"] == "No bookmarks found"
    assert resolved["result_count"] == "{shown} of {total} bookmarks"
    assert resolved["result_count_one"] == "{shown} of {total} bookmark"


def test_turkish_strings_read_naturally_with_the_default_nouns():
    labels = load_labels("tr")
    resolved = resolve_labels(labels, labels["item_name"], labels["item_name_plural"])

    assert resolved["search_placeholder"] == "Yer işaretleri içinde ara"
    assert resolved["no_results"] == "Yer işaretleri bulunamadı"
    assert resolved["result_count"] == "{total} yer işareti içinden {shown} tanesi"


def test_capitalizes_a_sentence_initial_noun():
    resolved = resolve_labels({"a": "{Items} bulunamadı"}, "proje", "projeler", "tr")

    assert resolved["a"] == "Projeler bulunamadı"


def test_capitalizes_a_turkish_dotted_i():
    resolved = resolve_labels({"a": "{Items} bulunamadı"}, "içerik", "içerikler", "tr")

    assert resolved["a"] == "İçerikler bulunamadı"
