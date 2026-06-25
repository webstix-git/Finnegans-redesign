import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Promotions & Events | Finnegan\'s Wake',
  description: 'Weekly trivia, live music, private events, and what\'s happening at Finnegan\'s Wake Irish Pub.',
  openGraph: {
    title: 'Promotions & Events | Finnegan\'s Wake',
    description: 'Weekly trivia, live music, private events, and what\'s happening at Finnegan\'s Wake Irish Pub.',
  },
};

export default function Page() {
  const html = getPageHtml('promotions-and-events');
  return <PageContent html={html} effects="scroll-promo" />;
}
