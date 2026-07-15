/** Build an absolute URL that respects Vite's BASE_URL (e.g. /WalletCo-frontend/ on GitHub Pages). */
export function absoluteAppUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    return `${base}${normalized}`;
  }

  return `${window.location.origin}${base}${normalized}`;
}
