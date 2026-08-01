# materialx-bookmarks

A bookmark list component for [mkdocs-materialx](https://github.com/jaywhj/mkdocs-materialx).
Author bookmarks in YAML, place the component on any page, and readers get search, tag filtering,
sorting, and pagination.

## Install

```bash
pip install materialx-bookmarks
```

## Configure

```yaml
plugins:
  - materialx-bookmarks:
      language: en
      collections:
        - name: reading
          file: bookmarks/reading.yml
          per_page: 20
```

| Key | Required | Default | Meaning |
|---|---|---|---|
| `language` | no | `theme.language` if a locale exists for it, else `en` | UI language. |
| `collections[].name` | yes | — | Name referenced by a page. Must be unique. |
| `collections[].file` | yes | — | Path to the bookmark file, relative to `mkdocs.yml`. Keep it outside `docs/`. |
| `collections[].per_page` | no | `20` | Items per page. |

## Write bookmarks

```yaml
tags:
  - python
  - rust

bookmarks:
  - title: Ruff
    url: https://astral.sh/ruff
    description: Fast Python linter
    tags: [python]
  - title: A note with no link
    tags: [rust]
```

Only `title` is required. A tag used by a bookmark must appear in `tags`, otherwise the build fails.
Bookmarks display in the order written.

## Place the component

````markdown
```bookmarks
collection: reading
```
````

Use `id` when placing the same collection twice on one page:

````markdown
```bookmarks
collection: reading
id: reading-2
```
````

Component state lives in the URL, namespaced by id:
`?reading.q=ruff&reading.tags=python&reading.sort=reversed&reading.page=2`.

## Languages

English and Turkish ship with the plugin. See `CONTRIBUTING.md` to add another.
