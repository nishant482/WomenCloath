export function currentPath() {
  // Preserve old bookmarks while replacing their hash URL in place.
  if (location.hash.startsWith("#/")) {
    const legacy = location.hash.slice(1);
    if (!legacy.startsWith("//")) history.replaceState(null, "", legacy);
  }
  return location.pathname.replace(/\/+$/, "") || "/";
}

export function goTo(path) {
  const url = new URL(path, location.origin);
  if (url.origin !== location.origin) return;
  if (url.href !== location.href)
    history.pushState(null, "", url.pathname + url.search + url.hash);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function followStoreLink(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = event.target.closest?.("a[href]");
  if (
    !link ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  )
    return;
  let href = link.getAttribute("href");
  if (href.startsWith("#/")) href = href.slice(1);
  else if (href.startsWith("#")) return;
  const url = new URL(href, location.href);
  if (
    url.origin !== location.origin ||
    /^\/(admin|api)(\/|$)/.test(url.pathname)
  )
    return;
  if (
    !/^\/(?:$|collections\/|product\/|blog(?:\/|$)|account\/?$|checkout\/?$|about\/?$|contact\/?$|shipping\/?$|rajo-family\/?$)/.test(
      url.pathname,
    )
  )
    return;
  event.preventDefault();
  goTo(url.href);
}
