const SORT_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>' +
  "</svg>";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function buildShell(root, labels) {
  root.textContent = "";

  const controls = element("div", "mxb__controls");
  const search = element("input", "mxb__search");
  search.type = "search";
  search.placeholder = labels.search_placeholder;
  search.setAttribute("aria-label", labels.search_placeholder);

  const sort = element("button", "mxb__sort");
  sort.type = "button";
  sort.title = labels.sort_reverse;
  sort.setAttribute("aria-label", labels.sort_reverse);
  sort.setAttribute("aria-pressed", "false");
  sort.innerHTML = SORT_ICON;

  controls.append(search, sort);

  const chips = element("div", "mxb__chips");
  const count = element("p", "mxb__count");
  count.setAttribute("aria-live", "polite");
  const list = element("ul", "mxb__list");
  const pagination = element("nav", "mxb__pagination");
  pagination.setAttribute("aria-label", labels.next_page);

  root.append(controls, chips, count, list, pagination);
  return { search, sort, chips, count, list, pagination };
}

export function renderChips(container, tags, counts, selected, labels) {
  container.textContent = "";
  if (!tags.length) return;

  const all = element("button", "mxb__chip mxb__chip--all", labels.all_tags);
  all.type = "button";
  all.dataset.tag = "";
  all.setAttribute("aria-pressed", String(selected.length === 0));
  container.append(all);

  for (const tag of tags) {
    const chip = element("button", "mxb__chip", `${tag} (${counts.get(tag) ?? 0})`);
    chip.type = "button";
    chip.dataset.tag = tag;
    chip.setAttribute("aria-pressed", String(selected.includes(tag)));
    container.append(chip);
  }
}

export function renderList(container, items, labels) {
  container.textContent = "";

  if (!items.length) {
    container.append(element("li", "mxb__empty", labels.no_results));
    return;
  }

  for (const item of items) {
    const entry = element("li", "mxb__item");
    const heading = element("h3", "mxb__title");

    if (item.url) {
      const link = element("a", "mxb__link", item.title);
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      heading.append(link);
    } else {
      heading.textContent = item.title;
    }
    entry.append(heading);

    if (item.description) entry.append(element("p", "mxb__description", item.description));

    if (item.tags?.length) {
      const tags = element("p", "mxb__tags");
      for (const tag of item.tags) tags.append(element("span", "mxb__tag", tag));
      entry.append(tags);
    }

    container.append(entry);
  }
}

export function renderCount(node, shown, total, labels) {
  node.textContent = labels.result_count
    .replace("{shown}", String(shown))
    .replace("{total}", String(total));
}

export function renderPagination(container, page, pageCount, labels) {
  container.textContent = "";

  const button = (label, target, disabled, current, modifier) => {
    const node = element("button", `mxb__page mxb__page--${modifier}`, label);
    node.type = "button";
    node.dataset.page = String(target);
    node.disabled = disabled;
    if (current) node.setAttribute("aria-current", "page");
    return node;
  };

  container.append(button(labels.prev_page, page - 1, page <= 1, false, "prev"));
  for (let index = 1; index <= pageCount; index += 1) {
    container.append(button(String(index), index, false, index === page, "number"));
  }
  container.append(button(labels.next_page, page + 1, page >= pageCount, false, "next"));
}

export function renderError(root, message) {
  root.textContent = "";
  root.append(element("p", "mxb__error", message));
}
