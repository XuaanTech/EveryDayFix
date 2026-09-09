import { readFileSync } from 'node:fs';

/**
 * Shared article helpers used across pages.
 *
 * - readingTime: real estimate from raw content (~200 words/min)
 * - categoryFromPath: robust slug derivation from the folder the file lives in
 */

/** Strip the YAML frontmatter block from a raw MDX source string. */
export function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  return raw.slice(end + 4);
}

/** Estimate reading time in minutes from raw article text (~200 words/min). */
export function readingTimeFromRaw(raw) {
  const body = stripFrontmatter(raw)
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/[#>*`~\-_\[\]()!|<>=]/g, ' ') // markdown syntax
    .replace(/\s+/g, ' ')
    .trim();

  const words = body.length ? body.split(' ').filter(Boolean).length : 1;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

/**
 * Reading time from an MDX module's absolute `file` path.
 * (MDX files loaded eagerly via import.meta.glob expose `.file`.)
 */
export function readingTimeFromFile(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    return readingTimeFromRaw(raw);
  } catch {
    return '5 min read';
  }
}

/**
 * Derive the category slug from a module path by looking at its parent
 * directory. Robust against slugs that happen to contain other category names.
 *   ".../home-living/remove-mold.mdx" -> "home-living"
 */
export function categoryFromPath(path) {
  const segments = String(path).split(/[\\/]/).filter(Boolean);
  if (segments.length < 2) return 'everyday-life';
  return segments[segments.length - 2];
}