import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finneganswake.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/menu', '/about-us', '/promotions-and-events', '/reviews', '/gallery', '/faq', '/contact-us', '/sitemap', '/privacy-policy'];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}
