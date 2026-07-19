import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Contact Us – Springfield Irish Pub',
  description:
    "Get in touch with Finnegan's Wake in downtown Springfield, MO. Find our hours, location, and phone number, or ask about events and group gatherings.",
  alternates: { canonical: '/contact-us' },
  openGraph: {
    title: "Contact Us – Springfield Irish Pub | Finnegan's Wake",
    description:
      "Get in touch with Finnegan's Wake in downtown Springfield, MO. Find our hours, location, and phone number, or ask about events and group gatherings.",
  },
};

export default function Page() {
  const html = getPageHtml('contact-us');
  return <PageContent html={html} effects="contact" />;
}
