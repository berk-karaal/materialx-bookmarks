import pytest

from materialx_bookmarks.loader import BookmarkError
from materialx_bookmarks.locales import available_locales, load_labels, resolve_language

KEYS = {
    "search_placeholder",
    "no_results",
    "result_count",
    "all_tags",
    "sort_default",
    "sort_reversed",
    "prev_page",
    "next_page",
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
