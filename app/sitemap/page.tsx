import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Sitemap | Finnegan\'s Wake',
  description: 'Browse all pages on the Finnegan\'s Wake website.',
  openGraph: {
    title: 'Sitemap | Finnegan\'s Wake',
    description: 'Browse all pages on the Finnegan\'s Wake website.',
  },
};

export default function Page() {
  const html = getPageHtml('sitemap');
  return <PageContent html={html} effects="scroll" />;
}
