export const DEFAULT_STATE = { q: "", tags: [], sort: "default", page: 1 };

export function readState(id, search) {
  const params = new URLSearchParams(search);
  const rawTags = params.get(`${id}.tags`) ?? "";
  const rawPage = Number.parseInt(params.get(`${id}.page`) ?? "1", 10);

  return {
    q: params.get(`${id}.q`) ?? "",
    tags: rawTags.split(",").filter(Boolean),
    sort: params.get(`${id}.sort`) === "reversed" ? "reversed" : "default",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function writeState(id, state, search) {
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

  const query = params.toString();
  return query ? `?${query}` : "";
}
