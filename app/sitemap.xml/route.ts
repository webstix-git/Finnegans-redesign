const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.finneganswakesgf.com';

interface RouteConfig {
  path: string;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
  priority: number;
}

const routes: RouteConfig[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/menu', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/promotions-and-events', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about-us', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/gallery', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/reviews', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact-us', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/sitemap', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/ai-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/ai-readiness-service-index', changeFrequency: 'yearly', priority: 0.3 },
];

// Plain route handler instead of app/sitemap.ts: Next's metadata-route loader
// breaks when the project path contains an apostrophe (Finnegan's Wake).
export function GET() {
  const lastModified = new Date().toISOString();

  const urls = routes
    .map(
      ({ path, changeFrequency, priority }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
