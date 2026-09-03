import { PAGE_SIZE_ALL } from "./state.js";

export function applyFilters(items, state, search, perPage) {
  const searched = search(state.q);
  const filtered = state.tags.length
    ? searched.filter((item) => state.tags.every((tag) => (item.tags ?? []).includes(tag)))
    : searched;
  const ordered = state.sort === "reversed" ? [...filtered].reverse() : filtered;

  const total = ordered.length;
  // "All" is just a page size that always covers everything, so paging stays one code path.
  const size = perPage === PAGE_SIZE_ALL ? Math.max(total, 1) : perPage;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, state.page), pageCount);
  const start = (page - 1) * size;

  return { visible: ordered.slice(start, start + size), total, pageCount, page, filtered };
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

export function orderTags(tags, counts, mode, language) {
  if (mode === "alphabetical") {
    return [...tags].sort((left, right) => left.localeCompare(right, language));
  }

  if (mode === "count") {
    return [...tags].sort((left, right) => (counts.get(right) ?? 0) - (counts.get(left) ?? 0));
  }

  return tags;
}
