import { getPageHtmlAsync } from '@/lib/getPageHtml';
import { parsePromoScheduleData } from '@/lib/promotionItems';
import { readPromotionsContentHtml } from '@/lib/promotionsBlobStorage';
import { LivePromotionsEditor } from '@/components/promotions-editor/LivePromotionsEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PromotionsEditorPage() {
  const [baseHtml, rawHtml] = await Promise.all([
    getPageHtmlAsync('promotions-and-events'),
    readPromotionsContentHtml(),
  ]);
  const initialData = parsePromoScheduleData(rawHtml);

  return <LivePromotionsEditor baseHtml={baseHtml} initialData={initialData} />;
}
