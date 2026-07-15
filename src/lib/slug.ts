/**
 * Turkish-aware slug generator. Replaces TR diacritics, lowercases, collapses
 * non-alphanumerics into hyphens, trims edge hyphens, and caps length at 60.
 */
export function slugify(input: string): string {
  return input
    .replace(/İ/g, "I")
    .replace(/I/g, "I")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
