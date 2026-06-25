import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Privacy Policy | Finnegan\'s Wake',
  description: 'Privacy policy for Finnegan\'s Wake Irish Pub in downtown Springfield, MO.',
  openGraph: {
    title: 'Privacy Policy | Finnegan\'s Wake',
    description: 'Privacy policy for Finnegan\'s Wake Irish Pub in downtown Springfield, MO.',
  },
};

export default function Page() {
  const html = getPageHtml('privacy-policy');
  return <PageContent html={html} effects="scroll" />;
}
