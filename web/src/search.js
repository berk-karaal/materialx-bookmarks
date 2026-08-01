import Fuse from "fuse.js";

const OPTIONS = {
  threshold: 0.3,
  ignoreLocation: true,
  keys: [
    { name: "title", weight: 0.6 },
    { name: "description", weight: 0.3 },
    { name: "tags", weight: 0.1 },
  ],
};

export function createSearch(items) {
  const fuse = new Fuse(items, OPTIONS);

  return (query) => {
    const trimmed = query.trim();
    if (!trimmed) return items;
    return fuse.search(trimmed).map((hit) => hit.item);
  };
}
