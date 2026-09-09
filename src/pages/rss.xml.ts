import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return {};
  const body = raw.slice(3, end).trim();
  const result = {};

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      result[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

function collectArticles(dir, acc = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectArticles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      acc.push(full);
    }
  }
  return acc;
}

function toRfc2822(dateStr) {
  const d = new Date(dateStr);
  return d.toUTCString();
}

export function GET() {
  const articlesDir = join(process.cwd(), 'src', 'content', 'articles');
  const files = collectArticles(articlesDir);

  const items = files
    .map((file) => {
      const raw = readFileSync(file, 'utf8');
      const fm = parseFrontmatter(raw);
      const rel = file.slice(articlesDir.length + 1).replace(/\.mdx$/, '');
      const [category, slug] = rel.split(/[\\/]/);
      const url = `https://everydayfix.pages.dev/${category}/${slug}/`;
      return { ...fm, url, category, slug };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((a) => `    <item>
      <title>${escapeXml(a.title || a.slug)}</title>
      <link>${a.url}</link>
      <guid isPermaLink="true">${a.url}</guid>
      <description>${escapeXml(a.description || '')}</description>
      <category>${escapeXml(a.categoryName || a.category)}</category>
      <pubDate>${toRfc2822(a.date || new Date().toISOString())}</pubDate>
    </item>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EverydayFix</title>
    <link>https://everydayfix.pages.dev</link>
    <description>Simple solutions for everyday problems. Practical tips, tricks, and step-by-step guides.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://everydayfix.pages.dev/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}