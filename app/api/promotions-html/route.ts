import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { assertMenuEditorAuth } from '@/lib/menuAuth';
import {
  applyPromoScheduleDataToHtml,
  mergePromoDataPreservingCards,
  parsePromoScheduleData,
  type PromoScheduleData,
} from '@/lib/promotionItems';
import {
  isPromotionsBlobStorageEnabled,
  readPromotionsContentHtml,
  writePromotionsContentHtml,
} from '@/lib/promotionsBlobStorage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    assertMenuEditorAuth(req);
    const html = await readPromotionsContentHtml();
    const data = parsePromoScheduleData(html);
    return NextResponse.json({
      data,
      storage: isPromotionsBlobStorageEnabled() ? 'vercel-blob' : 'local-file',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
<<<<<<< HEAD
    assertMenuEditorAuth(req);
=======
    assertMenuEditorAuth(req, { required: true });
>>>>>>> aec7395 (admin fixes)

    const body = (await req.json()) as { data?: PromoScheduleData };
    if (!body.data) {
      return NextResponse.json({ error: 'Invalid payload: data required' }, { status: 400 });
    }

    const currentHtml = await readPromotionsContentHtml();
    const storedData = parsePromoScheduleData(currentHtml);
    const mergedData = mergePromoDataPreservingCards(body.data, storedData);
    const nextHtml = applyPromoScheduleDataToHtml(currentHtml, mergedData, { editorMode: false });

    if (nextHtml.length < 1) {
      return NextResponse.json({ error: 'Promotions HTML cannot be empty' }, { status: 400 });
    }

    const storage = await writePromotionsContentHtml(nextHtml);

    revalidatePath('/promotions-and-events');
    revalidatePath('/promotions-and-events-editor');

    return NextResponse.json({ ok: true, storage });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
