export function applyFilters(items, state, search, perPage) {
  const searched = search(state.q);
  const filtered = state.tags.length
    ? searched.filter((item) => state.tags.every((tag) => (item.tags ?? []).includes(tag)))
    : searched;
  const ordered = state.sort === "reversed" ? [...filtered].reverse() : filtered;

  const total = ordered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, state.page), pageCount);
  const start = (page - 1) * perPage;

  return { visible: ordered.slice(start, start + perPage), total, pageCount, page, filtered };
}

export function tagCounts(items, tags) {
  const counts = new Map(tags.map((tag) => [tag, 0]));

  for (const item of items) {
    for (const tag of item.tags ?? []) {
      if (counts.has(tag)) counts.set(tag, counts.get(tag) + 1);
    }
  }

  return counts;
}
