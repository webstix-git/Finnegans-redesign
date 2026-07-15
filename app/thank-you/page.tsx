import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Thank You | Finnegan\'s Wake',
  description: 'Thank you for contacting Finnegan\'s Wake. We\'ll be in touch soon.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Thank You | Finnegan\'s Wake',
    description: 'Thank you for contacting Finnegan\'s Wake. We\'ll be in touch soon.',
  },
};

export default function Page() {
  const html = getPageHtml('thank-you');
  return <PageContent html={html} effects="scroll" />;
}
