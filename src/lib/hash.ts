export function navigateHash(hash: string): void {
  if (window.location.hash === hash) {
    return;
  }

  const previous = window.location.hash;

  history.replaceState(null, "", `${window.location.pathname}${hash}`);

  window.dispatchEvent(
    new HashChangeEvent("hashchange", {
      oldURL: `${window.location.origin}${window.location.pathname}${previous}`,
      newURL: `${window.location.origin}${window.location.pathname}${hash}`,
    }),
  );
}

export function openAppTab(tab: string): void {
  navigateHash(`#/app/${tab}`);
}