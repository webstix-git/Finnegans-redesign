import { getPageHtmlAsync } from '@/lib/getPageHtml';
import { LiveMenuEditor } from '@/components/menu-editor/LiveMenuEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MenuEditorPage() {
  const html = await getPageHtmlAsync('menu');
  return <LiveMenuEditor baseHtml={html} />;
}
