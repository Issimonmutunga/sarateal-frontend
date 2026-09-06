const KEY = "sarateal:focusLocation";

export function setFocusLocation(name: string): void {
  sessionStorage.setItem(KEY, name);
}

export function consumeFocusLocation(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);

    if (value === null) {
      return null;
    }

    sessionStorage.removeItem(KEY);

    return value;
  } catch {
    return null;
  }
}