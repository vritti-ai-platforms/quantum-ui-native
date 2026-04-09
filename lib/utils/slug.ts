const SLUG_SEPARATOR = '~';

// Builds a slug segment: "acme-corp~230aa33f-7f07-4dd7-..."
export function buildSlug(name: string, id: string): string {
  return `${slugify(name)}${SLUG_SEPARATOR}${id}`;
}

// Parses a slug segment: returns { slug, id } or null if no separator
export function parseSlug(segment: string): { slug: string; id: string } | null {
  const idx = segment.indexOf(SLUG_SEPARATOR);
  if (idx < 0) return null;
  return { slug: segment.slice(0, idx), id: segment.slice(idx + 1) };
}

// Converts "Acme Corp" → "acme-corp", passes through already-slugified text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
