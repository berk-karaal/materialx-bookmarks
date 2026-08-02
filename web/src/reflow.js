const MOVE_MS = 180;
const FADE_MS = 130;
const EASING = "cubic-bezier(0.2, 0, 0.2, 1)";

function settle(node) {
  for (const animation of node.getAnimations?.() ?? []) animation.cancel();
  if (!node.dataset.mxbGhost) return;

  delete node.dataset.mxbGhost;
  node.style.position = "";
  node.style.left = "";
  node.style.top = "";
  node.style.width = "";
  node.style.pointerEvents = "";
  node.hidden = true;
}

function enter(node) {
  node.animate([{ opacity: 0, transform: "scale(0.8)" }, { opacity: 1, transform: "none" }], {
    duration: FADE_MS,
    easing: EASING,
  });
}

function move(node, first, last) {
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  if (!dx && !dy) return;

  node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
    duration: MOVE_MS,
    easing: EASING,
  });
}

function leave(node, rect, origin) {
  node.dataset.mxbGhost = "1";
  node.hidden = false;
  node.style.position = "absolute";
  node.style.left = `${rect.left - origin.left}px`;
  node.style.top = `${rect.top - origin.top}px`;
  node.style.width = `${rect.width}px`;
  node.style.pointerEvents = "none";

  const animation = node.animate(
    [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.8)" }],
    { duration: FADE_MS, easing: EASING },
  );
  animation.addEventListener("finish", () => settle(node));
}

export function reflow(container, update) {
  const still =
    typeof container.animate !== "function" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (still) {
    update();
    return;
  }

  const before = new Map();
  for (const node of [...container.children]) {
    settle(node);
    if (!node.hidden) before.set(node, node.getBoundingClientRect());
  }

  update();

  if (!before.size) return;

  const origin = container.getBoundingClientRect();
  const after = new Map();
  for (const node of container.children) {
    if (!node.hidden) after.set(node, node.getBoundingClientRect());
  }

  for (const node of container.children) {
    const first = before.get(node);
    const last = after.get(node);

    if (!first && !last) continue;
    if (!last) leave(node, first, origin);
    else if (!first) enter(node);
    else move(node, first, last);
  }
}
