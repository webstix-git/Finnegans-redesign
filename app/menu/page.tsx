import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'The Menu | Finnegan\'s Wake',
  description: 'Pub food worth ordering at Finnegans Wake: apps, entrees, sandwiches, and more. Made to go with a cold pint.',
  openGraph: {
    title: 'The Menu | Finnegan\'s Wake',
    description: 'Pub food worth ordering at Finnegans Wake: apps, entrees, sandwiches, and more. Made to go with a cold pint.',
  },
};

export default function Page() {
  const html = getPageHtml('menu');
  return <PageContent html={html} effects="scroll" />;
}
