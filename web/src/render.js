const SORT_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>' +
  "</svg>";

const VIEW_ICONS = {
  list:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12' +
    'v-4H9v4zM9 5v4h12V5H9z"/></svg>',
  blocks:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>' +
    "</svg>",
  compact:
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M4 15h16v-2H4v2zm0 4h16v-2H4v2zm0-8h16V9H4v2zm0-6v2h16V5H4z"/>' +
    "</svg>",
};

const LINK_ICON =
  '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM5 5h4V3H3v18h18v-6h-2v4H5V5z"/>' +
  "</svg>";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildViews(displays, labels) {
  const group = element("div", "mxb__views");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", labels.display_mode);

  for (const display of displays) {
    const button = element("button", "mxb__view");
    button.type = "button";
    button.dataset.view = display;
    button.title = labels[`view_${display}`];
    button.setAttribute("aria-label", labels[`view_${display}`]);
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = VIEW_ICONS[display];
    group.append(button);
  }

  return group;
}

function buildSize(sizes, labels) {
  const field = element("label", "mxb__sizefield");
  field.append(element("span", "mxb__sizelabel", labels.page_size));

  const select = element("select", "mxb__size");
  for (const size of sizes) {
    const option = element("option", null, size === "all" ? labels.page_size_all : String(size));
    option.value = String(size);
    select.append(option);
  }

  field.append(select);
  return { field, select };
}

export function buildShell(root, labels, options = {}) {
  const displays = options.displayOptions ?? [];
  const sizes = options.pageSizeOptions ?? [];
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

  // A single switcher is not a choice, so it is left out rather than shown disabled.
  const views = displays.length > 1 ? buildViews(displays, labels) : null;
  controls.append(search, ...(views ? [views] : []), sort);

  const chips = element("div", "mxb__chips");

  // The page size belongs with the count it governs, pushed to the far end of that row.
  const countbar = element("div", "mxb__countbar");
  const count = element("p", "mxb__count");
  count.setAttribute("aria-live", "polite");
  const size = sizes.length > 1 ? buildSize(sizes, labels) : null;
  countbar.append(count, ...(size ? [size.field] : []));

  const list = element("ul", "mxb__list");
  const pagination = element("nav", "mxb__pagination");
  pagination.setAttribute("aria-label", labels.next_page);

  root.append(controls, chips, countbar, list, pagination);
  return { search, sort, views, size: size?.select ?? null, chips, count, list, pagination };
}

function buildChips(container, tags, labels) {
  const all = element("button", "mxb__chip mxb__chip--all", labels.all_tags);
  all.type = "button";
  all.dataset.tag = "";
  container.append(all);

  for (const tag of tags) {
    const chip = element("button", "mxb__chip");
    chip.type = "button";
    chip.dataset.tag = tag;
    container.append(chip);
  }
}

export function renderChips(container, tags, counts, selected, labels, order = tags) {
  if (!tags.length) return;
  if (!container.children.length) buildChips(container, tags, labels);

  container.firstElementChild.setAttribute("aria-pressed", String(selected.length === 0));

  for (const tag of tags) {
    const chip = container.querySelector(`.mxb__chip[data-tag="${CSS.escape(tag)}"]`);
    const count = counts.get(tag) ?? 0;
    const active = selected.includes(tag);

    chip.textContent = `${tag} (${count})`;
    chip.setAttribute("aria-pressed", String(active));
    chip.hidden = count === 0 && !active;
  }

  // Moving a node blurs it, so only move what is actually out of place, and give focus back.
  const focused = document.activeElement;
  let previous = container.firstElementChild;

  for (const tag of order) {
    const chip = container.querySelector(`.mxb__chip[data-tag="${CSS.escape(tag)}"]`);
    if (previous.nextElementSibling !== chip) previous.after(chip);
    previous = chip;
  }

  if (focused instanceof HTMLElement && container.contains(focused)) {
    focused.focus({ preventScroll: true });
  }
}

export function linkLabel(link) {
  if (link.text) return link.text;

  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

export function renderViews(container, display) {
  if (!container) return;

  for (const button of container.children) {
    button.setAttribute("aria-pressed", String(button.dataset.view === display));
  }
}

// Every display mode renders the same markup; only this class differs, and the stylesheet
// turns it into rows, blocks or one-liners.
export function renderList(container, items, labels, display = "list") {
  container.className = display === "list" ? "mxb__list" : `mxb__list mxb__list--${display}`;
  container.textContent = "";

  if (!items.length) {
    container.append(element("li", "mxb__empty", labels.no_results));
    return;
  }

  for (const item of items) {
    const entry = element("li", "mxb__item");
    entry.append(element("h3", "mxb__title", item.title));

    if (item.description) entry.append(element("p", "mxb__description", item.description));

    if (item.links?.length) {
      const links = element("p", "mxb__links");
      for (const link of item.links) {
        const anchor = element("a", "mxb__link");
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.title = link.url;
        anchor.innerHTML = LINK_ICON;
        // The label is wrapped so compact mode can hide it without losing the accessible name.
        const label = linkLabel(link);
        anchor.setAttribute("aria-label", label);
        anchor.append(element("span", "mxb__linktext", label));
        links.append(anchor);
      }
      entry.append(links);
    }

    if (item.tags?.length) {
      const tags = element("p", "mxb__tags");
      for (const tag of item.tags) tags.append(element("span", "mxb__tag", tag));
      entry.append(tags);
    }

    container.append(entry);
  }
}

export function countLabel(labels, shown, total) {
  const template = total === 1 ? labels.result_count_one : labels.result_count;
  return template.replace("{shown}", String(shown)).replace("{total}", String(total));
}

export function renderCount(node, shown, total, labels) {
  node.textContent = countLabel(labels, shown, total);
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
