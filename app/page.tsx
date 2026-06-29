import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: {
    absolute: "Finnegan's Wake | Downtown Springfield's Neighborhood Pub",
  },
  description:
    "Cold drinks. Good food. Familiar faces. Downtown Springfield's neighborhood pub with Irish roots, est. 2006 at 305 South Avenue.",
  openGraph: {
    title: "Finnegan's Wake | Downtown Springfield's Neighborhood Pub",
    description:
      "Cold drinks. Good food. Familiar faces. Downtown Springfield's neighborhood pub with Irish roots, est. 2006 at 305 South Avenue.",
  },
};

export default function Page() {
  const html = getPageHtml('home');
  return <PageContent html={html} effects="home" />;
}
