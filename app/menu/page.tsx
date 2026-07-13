import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtmlAsync } from '@/lib/getPageHtml';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'The Menu | Finnegan\'s Wake',
  description: 'Pub food worth ordering at Finnegans Wake: apps, entrees, sandwiches, and more. Made to go with a cold pint.',
  openGraph: {
    title: 'The Menu | Finnegan\'s Wake',
    description: 'Pub food worth ordering at Finnegans Wake: apps, entrees, sandwiches, and more. Made to go with a cold pint.',
  },
};

export default async function Page() {
  const html = await getPageHtmlAsync('menu');
  return <PageContent html={html} effects="scroll" />;
}
