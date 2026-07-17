const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.finneganswakesgf.com';

// Plain route handler instead of app/robots.ts: Next's metadata-route loader
// breaks when the project path contains an apostrophe (Finnegan's Wake).
export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /menu-editor
Disallow: /promotions-and-events-editor
Disallow: /thank-you

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
