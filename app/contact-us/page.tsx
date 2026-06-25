import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Contact Us | Finnegan\'s Wake',
  description:
    'Get in touch with Finnegan\'s Wake in downtown Springfield, MO. Find our hours, location, phone number, and answers to questions about events, reservations, and group gatherings.',
  openGraph: {
    title: 'Contact Us | Finnegan\'s Wake',
    description:
      'Get in touch with Finnegan\'s Wake in downtown Springfield, MO. Find our hours, location, phone number, and answers to questions about events, reservations, and group gatherings.',
  },
};

export default function Page() {
  const html = getPageHtml('contact-us');
  return <PageContent html={html} effects="contact" />;
}
