# materialx-bookmarks

This site is the live demo for
[materialx-bookmarks](https://github.com/berk-karaal/materialx-bookmarks), a bookmark component for
mkdocs-materialx. Every list below is built from a YAML file in this repository.

## What it does

Bookmarks are written as YAML, validated when the site builds, and rendered in the browser with
search, tag filtering, sorting and pagination. State lives in the URL, so any view you are looking
at can be linked to.

## A component in the middle of a page

The block below sits between two paragraphs of ordinary Markdown — the component is not a special
page type, it goes wherever you put the fence.

```bookmarks
collection: tools
```

Everything after the component is normal page content again. Try a search, combine two tags, or
switch the sort order and watch the address bar.

## Where to go next

- [Tools](tools.md) — the same collection on a page of its own
- [Reading](reading.md) — blogs, six per page
- [Learning](learning.md) — documentation, specs and books, including one entry with no link
- [Two on one page](multiple.md) — two independent components side by side
