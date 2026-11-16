// Storage is best-effort: it can be blocked, or full because the whole domain
// shares it, and the pages must keep working either way. Keys are prefixed
// for the same reason.

export function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function save(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Nothing is kept for the next visit, which is the only loss.
  }
}
