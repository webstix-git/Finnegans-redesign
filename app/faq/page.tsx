import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'FAQs | Finnegan\'s Wake',
  description:
    'Frequently asked questions about Finnegan\'s Wake: hours, parking, reservations, trivia, private events, and more.',
  openGraph: {
    title: 'FAQs | Finnegan\'s Wake',
    description:
      'Frequently asked questions about Finnegan\'s Wake: hours, parking, reservations, trivia, private events, and more.',
  },
};

export default function Page() {
  const html = getPageHtml('faq');
  return <PageContent html={html} effects="faq" />;
}
