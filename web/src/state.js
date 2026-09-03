export const PAGE_SIZE_ALL = "all";
export const DEFAULT_PER_PAGE = 20;
export const DEFAULT_STATE = {
  q: "",
  tags: [],
  sort: "default",
  page: 1,
  size: DEFAULT_PER_PAGE,
};

export function parsePageSize(raw, fallback) {
  if (raw === PAGE_SIZE_ALL) return PAGE_SIZE_ALL;
  const size = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(size) && size > 0 ? size : fallback;
}

export function readState(id, search, perPage = DEFAULT_PER_PAGE) {
  const params = new URLSearchParams(search);
  const rawTags = params.get(`${id}.tags`) ?? "";
  const rawPage = Number.parseInt(params.get(`${id}.page`) ?? "1", 10);

  return {
    q: params.get(`${id}.q`) ?? "",
    tags: rawTags.split(",").filter(Boolean),
    sort: params.get(`${id}.sort`) === "reversed" ? "reversed" : "default",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    size: parsePageSize(params.get(`${id}.size`), perPage),
  };
}

export function writeState(id, state, search, perPage = DEFAULT_PER_PAGE) {
  const params = new URLSearchParams(search);
  const set = (key, value, fallback) => {
    if (value === fallback) {
      params.delete(`${id}.${key}`);
    } else {
      params.set(`${id}.${key}`, value);
    }
  };

  set("q", state.q, "");
  set("tags", state.tags.join(","), "");
  set("sort", state.sort, "default");
  set("page", String(state.page), "1");
  set("size", String(state.size), String(perPage));

  const query = params.toString();
  return query ? `?${query}` : "";
}
