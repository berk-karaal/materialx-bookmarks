// Reader preferences that are deliberately not part of the shareable view: the display mode
// says how a collection is drawn, not which bookmarks it shows. Keys are namespaced by fence
// id, so two collections on one page remember their own choice.
//
// Every access is guarded: localStorage throws outright when a browser is set to block site
// data, and a preference is never worth breaking the component over.

function key(id, name) {
  return `mxb.${id}.${name}`;
}

export function readPref(id, name, allowed, fallback) {
  try {
    const value = window.localStorage.getItem(key(id, name));
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writePref(id, name, value) {
  try {
    window.localStorage.setItem(key(id, name), value);
  } catch {
    // Storage unavailable; the choice simply will not outlive the page.
  }
}
