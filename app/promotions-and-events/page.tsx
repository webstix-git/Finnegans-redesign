import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtmlAsync } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Promotions & Events',
  description:
    "Weekly trivia, drink specials, private events, and what's happening at Finnegan's Wake — downtown Springfield's Irish pub on South Avenue since 2006.",
  alternates: { canonical: '/promotions-and-events' },
  openGraph: {
    title: "Promotions & Events | Finnegan's Wake",
    description:
      "Weekly trivia, drink specials, private events, and what's happening at Finnegan's Wake — downtown Springfield's Irish pub on South Avenue since 2006.",
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const html = await getPageHtmlAsync('promotions-and-events');
  return <PageContent html={html} effects="scroll-promo" />;
}
