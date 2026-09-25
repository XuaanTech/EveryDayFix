import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/site.js';

const robotsTxt = `User-agent: *
Allow: /
Disallow: /search
Disallow: /docs

Sitemap: ${SITE_URL}/sitemap-index.xml
`;

export const GET: APIRoute = () => {
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
