const SLUG_SEPARATOR = '~';

export function buildSlug(name: string, id: string): string {
  return `${slugify(name)}${SLUG_SEPARATOR}${id}`;
}

export function parseSlug(segment: string): { slug: string; id: string } | null {
  const idx = segment.indexOf(SLUG_SEPARATOR);
  if (idx < 0) return null;
  return { slug: segment.slice(0, idx), id: segment.slice(idx + 1) };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
