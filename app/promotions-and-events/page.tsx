import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtmlAsync } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Promotions & Events | Finnegan\'s Wake',
  description: 'Weekly trivia, live music, private events, and what\'s happening at Finnegan\'s Wake Irish Pub.',
  openGraph: {
    title: 'Promotions & Events | Finnegan\'s Wake',
    description: 'Weekly trivia, live music, private events, and what\'s happening at Finnegan\'s Wake Irish Pub.',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const html = await getPageHtmlAsync('promotions-and-events');
  return <PageContent html={html} effects="scroll-promo" />;
}
