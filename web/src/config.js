const cache = new Map();

export function parseConfig(element) {
  return JSON.parse(element.dataset.mxb);
}

export function fetchCollection(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`failed to load ${url}`);
        return response.json();
      }),
    );
  }
  return cache.get(url);
}
