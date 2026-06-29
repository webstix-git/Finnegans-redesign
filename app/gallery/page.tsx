import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'Gallery | Finnegan\'s Wake',
  description:
    'Photos from Finnegan\'s Wake: Finnsmas, St. Patrick\'s Day, everyday pub life, and the food at downtown Springfield\'s favorite Irish pub.',
  openGraph: {
    title: 'Gallery | Finnegan\'s Wake',
    description:
      'Photos from Finnegan\'s Wake: Finnsmas, St. Patrick\'s Day, everyday pub life, and the food at downtown Springfield\'s favorite Irish pub.',
  },
};

export default function Page() {
  const html = getPageHtml('gallery');
  return <PageContent html={html} effects="gallery" />;
}
