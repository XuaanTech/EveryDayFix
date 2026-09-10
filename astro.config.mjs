// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = join(ROOT, 'src', 'content', 'articles');

/** Recursively collect all .mdx file paths under a directory. */
function collectMdx(dir, acc = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMdx(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      acc.push(full);
    }
  }
  return acc;
}

/** Split frontmatter body into lines of key: value (list items appended). */
function parseFrontmatter(raw) {
  // Frontmatter sits between the first two '---' lines.
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return {};
  const body = raw.slice(3, end).trim();
  const result = {};
  let currentKey = null;

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const listMatch = trimmed.match(/^-\s+(.*)$/);
    if (listMatch && currentKey && Array.isArray(result[currentKey])) {
      result[currentKey].push(listMatch[1].trim());
      continue;
    }

    const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    currentKey = kv[1];
    let value = kv[2].trim();

    // Handle simple list values ("tags: [a, b]" or "- a" lines).
    if (/^\[.*\]$/.test(value)) {
      result[currentKey] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      result[currentKey] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

/**
 * Build the client-side search index from every article's frontmatter and
 * write it to the given directory. Runs via the searchIndex integration on
 * every dev start and every build, so the index is always in sync — no
 * separate script step to remember.
 */
function writeSearchIndex(outDir) {
  const files = collectMdx(ARTICLES_DIR);
  const index = [];

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const fm = parseFrontmatter(raw);

    // Slug comes from the file path relative to the articles dir.
    const rel = file.slice(ARTICLES_DIR.length + 1).replace(/\.mdx$/, '');
    const [category, slug] = rel.split(/[\\/]/);

    const title = fm.title || slug;
    index.push({
      title,
      description: fm.description || '',
      category,
      categoryName: fm.categoryName || '',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      date: fm.date || '',
      url: `/${category}/${slug}/`,
      text: `${title} ${fm.description || ''} ${(Array.isArray(fm.tags) ? fm.tags : []).join(' ')} ${fm.categoryName || ''}`.toLowerCase(),
    });
  }

  // Stable ordering by date (newest first), then by title.
  index.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title));

  const outFile = join(outDir, 'search-index.json');
  if (!existsSync(dirname(outFile))) {
    mkdirSync(dirname(outFile), { recursive: true });
  }
  writeFileSync(outFile, JSON.stringify(index), 'utf8');
  console.log(`[search-index] Wrote ${index.length} articles to ${outFile}`);
}

/**
 * Astro integration that keeps public/search-index.json fresh. Runs on every
 * dev start and at the beginning of every build, so the client-side search
 * always reflects the latest articles — also on the Cloudflare build server,
 * where no extra repository file is required.
 */
function searchIndex() {
  return {
    name: 'search-index',
    hooks: {
      'astro:config:setup': ({ config }) => {
        writeSearchIndex(fileURLToPath(config.publicDir));
      },
    },
  };
}

/**
 * Map of article URL (pathname) -> last-modified date from frontmatter
 * (`updated` if present, otherwise `date`). Used to stamp <lastmod> on the
 * sitemap so crawlers know when each page changed, without recrawling
 * everything on every pass.
 */
function buildLastmodMap() {
  const files = collectMdx(ARTICLES_DIR);
  const map = new Map();
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const fm = parseFrontmatter(raw);
    const rel = file.slice(ARTICLES_DIR.length + 1).replace(/\.mdx$/, '');
    const [category, slug] = rel.split(/[\\/]/);
    const lastmod = fm.updated || fm.date || '';
    if (lastmod) {
      map.set(`/${category}/${slug}/`, lastmod);
    }
  }
  return map;
}

const lastmodMap = buildLastmodMap();

export default defineConfig({
  site: 'https://everydayfix.pages.dev',
  trailingSlash: 'always',
  prefetch: true,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/search') && !page.includes('/docs'),
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const lastmod = lastmodMap.get(pathname);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    searchIndex(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});