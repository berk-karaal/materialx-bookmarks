const SORT_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>' +
  "</svg>";

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

  for (const tag of order) {
    container.append(container.querySelector(`.mxb__chip[data-tag="${CSS.escape(tag)}"]`));
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

export function renderList(container, items, labels) {
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
        anchor.append(document.createTextNode(linkLabel(link)));
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
