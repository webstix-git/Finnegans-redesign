import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'About Us | Finnegan\'s Wake',
  description: 'Twenty years of really good food, familiar faces, and the longest-running trivia in downtown Springfield.',
  openGraph: {
    title: 'About Us | Finnegan\'s Wake',
    description: 'Twenty years of really good food, familiar faces, and the longest-running trivia in downtown Springfield.',
  },
};

export default function Page() {
  const html = getPageHtml('about-us');
  return <PageContent html={html} effects="scroll" />;
}
