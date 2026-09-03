# Two on one page

A page can hold as many components as it needs. Each one keeps its own search text, tags, sort order
and page number, and each writes its own set of URL parameters.

Display modes are kept apart too, though they are remembered rather than linked: switch the first
component below to compact and the second stays as it is, on this visit and the next.

## Rust tools

Filter this one by `rust` and note that only its parameters change.

```bookmarks
collection: tools
id: rust-tools
```

## Specifications

```bookmarks
collection: learning
id: specs
```

Placing the same collection twice on one page works too — give at least one of the fences an `id` so
the two components do not fight over the same URL parameters.
