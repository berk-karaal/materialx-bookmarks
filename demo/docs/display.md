# Display modes

A collection can be drawn three ways, and the switcher beside the search box lets you change your
mind. The three icons are, in order, **list**, **blocks** and **compact**.

Two things behave differently here to everything else in this demo:

- **Your choice is remembered, not linked.** Pick a mode, reload the page, and it comes back. It
  lives in this browser's `localStorage`, keyed by component — so the two components below never
  overwrite each other. It is the one control that does *not* write to the address bar, because it
  changes how a collection is drawn rather than which bookmarks it shows.
- **The author picks where it starts.** Each collection below opens in a different mode because its
  `mkdocs.yml` entry says so. An author can also narrow the choice, or take it away entirely.

## Blocks

A responsive grid. The column count is a function of the **component's own width**, not the
browser's — so it reflows the same way inside a narrow content column as it does on a wide page.
Try dragging the window narrower and watch the columns collapse one at a time.

The author sets how narrow a column may get before the grid drops one; this collection uses
`block_min_width: 14rem`.

```bookmarks
collection: tools
id: display-blocks
```

Blocks suit collections whose descriptions are worth reading. Cards in a row share a height, and
the link buttons sit at the foot of each card so they line up however long the description runs.

## Compact

One row per bookmark: title, a single-line description, then the links as unlabelled icons and the
tags at the right edge. Nothing is hidden from a screen reader — each link keeps its label as its
accessible name.

```bookmarks
collection: learning
id: display-compact
```

Compact suits a long collection you scan rather than read. Note the page-size picker at the end of
the count line: this collection offers 8, 16 or **All**, and choosing All drops pagination for that
view. Unlike the display mode, the page size *does* travel in the address bar — it decides which
bookmarks a given page number lands on, so a link you share would otherwise point somewhere else
for whoever opens it.

## Narrowing the choice

An author who wants a collection to stay readable can offer fewer modes. The component below is
configured with `display_options: [list, compact]`, so its switcher has two buttons rather than
three — these descriptions are long enough that blocks would make for a lot of scrolling.

```bookmarks
collection: reading
id: display-narrowed
```

Set `display_options: []` instead and the switcher disappears altogether, leaving the collection
fixed in whatever `display` says. It also has no page-size picker, because its `mkdocs.yml` entry
leaves `per_page_options` out — omit the key and the reader gets no choice.

## What this page is configured with

```yaml
collections:
  - name: tools
    file: bookmarks/tools.yml
    per_page: 6
    per_page_options: [6, 12, all]
    display: blocks
    block_min_width: 14rem

  - name: learning
    file: bookmarks/learning.yml
    per_page: 8
    per_page_options: [8, 16, all]
    display: compact

  - name: reading
    file: bookmarks/reading.yml
    per_page: 5
    display_options: [list, compact]
```

Every one of those keys is optional. Leave them all out and a collection renders as a paginated
list with no switcher and no size picker, exactly as it did before these options existed.
