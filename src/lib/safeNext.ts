/**
 * Return a safe same-origin path for post-auth redirects.
 * Rejects external URLs, protocol-relative URLs (//evil.com), and anything
 * that isn't a leading-slash absolute path. Falls back to `/dashboard`.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  if (typeof next !== "string") return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}
