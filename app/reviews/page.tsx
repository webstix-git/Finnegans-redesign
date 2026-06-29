import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Reviews | Finnegan\'s Wake',
  description:
    'Read what guests say about Finnegan\'s Wake, Springfield\'s downtown Irish pub on South Avenue since 2006.',
  openGraph: {
    title: 'Reviews | Finnegan\'s Wake',
    description:
      'Read what guests say about Finnegan\'s Wake, Springfield\'s downtown Irish pub on South Avenue since 2006.',
  },
};

export default function Page() {
  const html = getPageHtml('reviews');
  return <PageContent html={html} effects="scroll" />;
}
