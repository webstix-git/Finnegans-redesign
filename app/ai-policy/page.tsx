import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'AI Policy | Finnegan\'s Wake',
  description:
    'How Finnegan\'s Wake uses artificial intelligence responsibly on our website and in guest communications.',
  openGraph: {
    title: 'AI Policy | Finnegan\'s Wake',
    description:
      'How Finnegan\'s Wake uses artificial intelligence responsibly on our website and in guest communications.',
  },
};

export default function Page() {
  const html = getPageHtml('ai-policy');
  return <PageContent html={html} effects="scroll" />;
}
