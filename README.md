# materialx-bookmarks

[![PyPI](https://img.shields.io/pypi/v/materialx-bookmarks?logo=pypi&logoColor=white)](https://pypi.org/project/materialx-bookmarks/)
[![Python](https://img.shields.io/pypi/pyversions/materialx-bookmarks?logo=python&logoColor=white)](https://pypi.org/project/materialx-bookmarks/)
[![Tests](https://github.com/berk-karaal/materialx-bookmarks/actions/workflows/tests.yml/badge.svg)](https://github.com/berk-karaal/materialx-bookmarks/actions/workflows/tests.yml)
[![License](https://img.shields.io/pypi/l/materialx-bookmarks)](https://github.com/berk-karaal/materialx-bookmarks/blob/main/LICENSE)

**A bookmark list component for [mkdocs-materialx](https://github.com/jaywhj/mkdocs-materialx).**
Write your links in YAML, drop one fence into any page, and readers get search, tag filtering,
sorting and pagination — no JavaScript to write, no database, no build step of your own.

> ### 🔖 [**Try the live demo →**](https://berkkaraal.com/materialx-bookmarks/)
>
> Search for a typo'd name, stack two tag filters, flip the order, page through — then copy the
> address bar and see the whole view come back.

| Light | Dark |
| :---: | :---: |
| <img width="100%" alt="A full documentation page in the light theme: site header, navigation sidebar, table of contents, and a bookmark component sitting between two paragraphs of ordinary prose, showing a search box, tag chips with counts, an active git filter, three bookmarks each with labelled link buttons, and centered pagination." src="https://raw.githubusercontent.com/berk-karaal/materialx-bookmarks/main/.github/assets/screenshot-light.png"> | <img width="100%" alt="The same page in the dark theme, with the component inheriting the theme's colours." src="https://raw.githubusercontent.com/berk-karaal/materialx-bookmarks/main/.github/assets/screenshot-dark.png"> |

---

## Why

Documentation sites accumulate link lists. Written as plain Markdown they turn into a wall of
bullets nobody can search, and keeping them tidy means editing prose. This plugin keeps the *data*
in YAML and the *presentation* in the theme:

| | |
|---|---|
| 🔍 **Fuzzy search** | Powered by Fuse.js, tolerant of typos, weighted toward titles |
| 🔗 **Several links per bookmark** | Docs, source, changelog — each one a labelled button, or labelled by hostname if you'd rather not |
| 🏷️ **Tag filtering** | Multi-select with AND semantics. Counts follow the current view, and a tag that would return nothing steps aside |
| ↕️ **Sorting** | Your YAML order, or reversed |
| 📄 **Pagination** | Numbered, configurable page size |
| 🔗 **Shareable state** | Every view is a URL — search, tags, sort and page all round-trip |
| 🧩 **Anywhere on any page** | Mid-article, several per page, as many collections as you like |
| 🎨 **Themed automatically** | Styled entirely with the theme's own CSS variables — light, dark and your accent colour |
| ✅ **Validated at build time** | A typo'd tag or an unknown collection fails the build, not the page |
| 🌍 **Translated** | English and Turkish included, one file to add your own |

---

## Quick start

### 1. Install

```bash
pip install materialx-bookmarks
```

### 2. Write some bookmarks

Create `bookmarks/reading.yml` next to your `mkdocs.yml`:

```yaml
tags:
  - python
  - rust

bookmarks:
  - title: Ruff
    description: Linter and formatter for Python, written in Rust.
    tags: [python, rust]
    links:
      - text: Docs
        url: https://docs.astral.sh/ruff/
      - text: GitHub
        url: https://github.com/astral-sh/ruff

  - title: ripgrep
    description: Recursively searches directories for a regex pattern.
    tags: [rust]
    links:
      - url: https://github.com/BurntSushi/ripgrep
```

### 3. Register the collection

```yaml
plugins:
  - materialx-bookmarks:
      collections:
        - name: reading
          file: bookmarks/reading.yml
```

### 4. Drop it on a page

````markdown
# My reading list

Things worth coming back to.

```bookmarks
collection: reading
```
````

That's it. `mkdocs serve`, and editing the YAML live-reloads the page.

---

## Reference

### Bookmark files

```yaml
tags: [python, rust]        # allowlist — a bookmark may only use tags listed here

bookmarks:
  - title: Ruff             # the only required field
    description: …          # optional
    tags: [python]          # optional
    links:                  # optional — each entry needs a url
      - text: Docs          # optional — without it the button shows the hostname
        url: https://…
```

Bookmarks appear in the order you write them. The `tags` allowlist is what turns a misspelled tag
into a build error instead of a chip nobody ever clicks.

Links render as buttons under the description, in the order you write them. A bookmark with no
links renders as plain text.

### Plugin options

```yaml
plugins:
  - materialx-bookmarks:
      language: en
      collections:
        - name: reading
          file: bookmarks/reading.yml
          per_page: 20
```

| Option | Required | Default | Description |
|---|---|---|---|
| `language` | no | `theme.language`, else `en` | Language for the interface strings |
| `collections[].name` | **yes** | — | The name pages refer to. Must be unique |
| `collections[].file` | **yes** | — | Path to the YAML file, relative to `mkdocs.yml`. Keep it outside `docs/` so it is not copied into the built site |
| `collections[].per_page` | no | `20` | Bookmarks per page |

### Placing components

A page may hold as many components as you like. Give a fence an `id` when two of them would
otherwise collide:

````markdown
```bookmarks
collection: reading
id: reading-secondary
```
````

| Key | Required | Description |
|---|---|---|
| `collection` | **yes** | Name of a collection from `mkdocs.yml` |
| `id` | no | Defaults to the collection name. Namespaces this component's URL parameters |

### URL state

Every control writes to the address bar, namespaced by component id, so a filtered view can be
linked to and returns intact:

```
?reading.q=ruff&reading.tags=python,rust&reading.sort=reversed&reading.page=2
```

---

## How it works

At **build time** the plugin reads your YAML, validates it, and writes one JSON file per collection
into the site. Each fence becomes an empty container carrying its configuration. Anything wrong —
a missing file, a bookmark without a title, a tag outside the allowlist, a fence naming a
collection that does not exist — stops the build with a message naming the file and the entry.

In the **browser** a small bundle (about 30 KB including Fuse.js) fetches that JSON once per
collection and renders the list. Assets are emitted under content-hashed filenames, so upgrading
the plugin never leaves a visitor on a stale bundle.

Controls are real buttons with `aria-pressed`, the search box is labelled, the result count is a
live region, and pagination sits in a landmark `nav` — all of it keyboard reachable.

---

## Languages

English (`en`) and Turkish (`tr`) ship with the plugin, and the language follows your
`theme.language` unless you set one. Adding another is a single file — see
[CONTRIBUTING.md](https://github.com/berk-karaal/materialx-bookmarks/blob/main/CONTRIBUTING.md).

## Requirements

Python 3.10+, MkDocs 1.5+, and the mkdocs-materialx theme.

## Contributing

Tests, the demo site and the release workflow are described in [CONTRIBUTING.md](https://github.com/berk-karaal/materialx-bookmarks/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/berk-karaal/materialx-bookmarks/blob/main/LICENSE)
