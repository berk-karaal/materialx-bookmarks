# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Display modes. A collection can be drawn as the usual `list`, as responsive `blocks` whose column
  count follows the component's own width, or as `compact` one-line rows. `display` sets where a
  collection starts, `display_options` limits what the reader may switch to (`[]` hides the
  switcher), and `block_min_width` tunes the block grid. The reader's choice is remembered in
  `localStorage` under a key namespaced by component id, so two collections on one page keep their
  own; it stays out of the URL because it changes how a collection is drawn, not what it shows.
- `per_page_options` on a collection, offering the reader a page size next to the result count.
  Entries are page sizes or `all`, and the list must include `per_page`, which remains the default.
  The chosen size travels in the URL as `<id>.size`, since it decides which bookmarks a given page
  number lands on.

## [0.4.0] - 2026-08-12

### Added

- `item_name` and `item_name_plural` on a collection, so the interface can say what the collection
  actually holds — "Search projects", "1 of 12 projects". Both keys go together; left out, each
  language supplies its own word and nothing changes.
- `tag_sorting` on a collection: `manual` (the default, the order the tags are written in),
  `alphabetical` under the site's language, or `count`, which puts the most-used tag first and
  re-orders live as the reader filters.

## [0.3.0] - 2026-08-02

### Added

- A bookmark may carry several links through a `links` list, each with an optional `text`. They
  render as buttons beneath the description. A link without `text` is labelled with its hostname.

### Removed

- **Breaking:** `url` on a bookmark. Use `links` instead, and note that the title is no longer a
  link — every destination is a button.

  ```yaml
  # before
  - title: Ruff
    url: https://docs.astral.sh/ruff/

  # after
  - title: Ruff
    links:
      - text: Docs
        url: https://docs.astral.sh/ruff/
  ```

  A build that still uses `url` fails with a message naming the file and entry.

## [0.2.0] - 2026-08-02

### Changed

- Tag counts now follow the current view instead of the whole collection. With tags selected, the
  number beside a tag is how many bookmarks carry the selection *and* that tag, so it always
  predicts what clicking it gives. The search query narrows the counts too.
- A tag whose count reaches zero is hidden until it can match again. The chip row animates the
  reflow, and respects `prefers-reduced-motion`.

## [0.1.0] - 2026-08-01

First release.

### Added

- Bookmark collections written as YAML and validated at build time. A bookmark requires only a
  `title`; `url`, `description` and `tags` are optional, and every tag must appear in the file's
  `tags` allowlist.
- A ` ```bookmarks ` fence that places a component anywhere on any page, any number of times, with
  an optional `id` to namespace a component's URL parameters.
- Fuzzy search over titles, descriptions and tags, powered by Fuse.js.
- Multi-select tag filtering with AND semantics and per-tag counts.
- Order reversal through a single icon toggle.
- Numbered pagination with a configurable `per_page`.
- Search, tags, sort and page state mirrored into the URL so any view can be linked to.
- Interface strings in English and Turkish, resolved at build time and defaulting to the theme's
  `language`.
- Styling driven entirely by the theme's `--md-*` custom properties, so light, dark and accent
  colours are inherited.
- Support for the theme's `navigation.instant`: components re-initialise after an instant page
  swap, and assets are injected site-wide when that feature is enabled.
- Content-hashed asset filenames, so upgrading the plugin never serves a stale bundle.
- Build-time failures, with the offending file and entry named, for unknown collections, duplicate
  component ids, unlisted tags, malformed YAML and missing files.

[Unreleased]: https://github.com/berk-karaal/materialx-bookmarks/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/berk-karaal/materialx-bookmarks/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/berk-karaal/materialx-bookmarks/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/berk-karaal/materialx-bookmarks/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/berk-karaal/materialx-bookmarks/releases/tag/v0.1.0
