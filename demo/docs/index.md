# materialx-bookmarks

This site is the live demo for
[materialx-bookmarks](https://github.com/berk-karaal/materialx-bookmarks), a bookmark component for
mkdocs-materialx. Every list here is built from a YAML file in this repository.

Installing it and wiring up your first collection takes four steps — see the
[quick start](https://github.com/berk-karaal/materialx-bookmarks#quick-start).

## A component in the middle of a page

The block below sits between two paragraphs of ordinary Markdown — the component is not a special
page type, it goes wherever you put the fence.

```bookmarks
collection: tools
```

Everything after the component is normal page content again. Try a search, combine two tags, or
switch the sort order and watch the address bar.

This one opens as a grid of blocks because its collection asks for it. Use the switcher beside the
search box to try the other two modes — and note that the address bar does *not* change when you
do. See [display modes](display.md) for why.
