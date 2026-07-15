import type { Metadata } from 'next';
import { PageContent } from '@/components/PageContent';
import { getPageHtml } from '@/lib/getPageHtml';

export const metadata: Metadata = {
  title: 'AI Readiness Service Index | Finnegan\'s Wake',
  description:
    'AI Readiness Service Index for Finnegan\'s Wake: oversight, privacy alignment, and responsible AI practices.',
  openGraph: {
    title: 'AI Readiness Service Index | Finnegan\'s Wake',
    description:
      'AI Readiness Service Index for Finnegan\'s Wake: oversight, privacy alignment, and responsible AI practices.',
  },
};

export default function Page() {
  const html = getPageHtml('ai-readiness-service-index');
  return <PageContent html={html} effects="scroll" />;
}
