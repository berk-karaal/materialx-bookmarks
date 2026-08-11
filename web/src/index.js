import { fetchCollection, parseConfig } from "./config.js";
import { applyFilters, orderTags, tagCounts } from "./filter.js";
import {
  buildShell,
  renderChips,
  renderCount,
  renderError,
  renderList,
  renderPagination,
} from "./render.js";
import { reflow } from "./reflow.js";
import { createSearch } from "./search.js";
import { readState, writeState } from "./state.js";

const DEBOUNCE_MS = 200;

function mount(root, config, data) {
  const { labels, perPage, id, tagSorting, language } = config;
  const nodes = buildShell(root, labels);
  const search = createSearch(data.items);

  let state = readState(id, window.location.search);

  const persist = () => {
    const query = writeState(id, state, window.location.search);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query}${window.location.hash}`,
    );
  };

  const draw = () => {
    const view = applyFilters(data.items, state, search, perPage);
    const counts = tagCounts(view.filtered, data.tags);
    state = { ...state, page: view.page };

    nodes.search.value = state.q;
    nodes.sort.setAttribute("aria-pressed", String(state.sort === "reversed"));
    const order = orderTags(data.tags, counts, tagSorting, language);
    reflow(nodes.chips, () =>
      renderChips(nodes.chips, data.tags, counts, state.tags, labels, order),
    );
    renderCount(nodes.count, view.visible.length, view.total, labels);
    renderList(nodes.list, view.visible, labels);
    renderPagination(nodes.pagination, view.page, view.pageCount, labels);
  };

  let timer;
  nodes.search.addEventListener("input", (event) => {
    const value = event.target.value;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      state = { ...state, q: value, page: 1 };
      persist();
      draw();
    }, DEBOUNCE_MS);
  });

  nodes.sort.addEventListener("click", () => {
    state = { ...state, sort: state.sort === "reversed" ? "default" : "reversed", page: 1 };
    persist();
    draw();
  });

  nodes.chips.addEventListener("click", (event) => {
    const chip = event.target.closest(".mxb__chip");
    if (!chip) return;
    const tag = chip.dataset.tag;
    const tags = !tag
      ? []
      : state.tags.includes(tag)
        ? state.tags.filter((entry) => entry !== tag)
        : [...state.tags, tag];
    state = { ...state, tags, page: 1 };
    persist();
    draw();
  });

  nodes.pagination.addEventListener("click", (event) => {
    const button = event.target.closest(".mxb__page");
    if (!button || button.disabled) return;
    state = { ...state, page: Number.parseInt(button.dataset.page, 10) };
    persist();
    draw();
  });

  draw();
}

function init() {
  for (const root of document.querySelectorAll(".mxb")) {
    if (root.dataset.mxbReady) continue;
    root.dataset.mxbReady = "1";

    const config = parseConfig(root);
    fetchCollection(config.url)
      .then((data) => mount(root, config, data))
      .catch(() => renderError(root, config.labels.no_results));
  }
}

if (typeof window.document$?.subscribe === "function") {
  window.document$.subscribe(init);
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
