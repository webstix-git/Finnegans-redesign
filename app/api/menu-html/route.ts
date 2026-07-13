import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { assertMenuEditorAuth } from '@/lib/menuAuth';
import { applyMenuDataToHtml, mergeMenuDataPreservingSections, parseMenuData, type MenuData } from '@/lib/menuItems';
import {
  isMenuBlobStorageEnabled,
  readMenuContentHtml,
  writeMenuContentHtml,
} from '@/lib/menuBlobStorage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    assertMenuEditorAuth(req);
    const html = await readMenuContentHtml();
    const data = parseMenuData(html);
    return NextResponse.json({
      data,
      html,
      storage: isMenuBlobStorageEnabled() ? 'vercel-blob' : 'local-file',
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

    const body = (await req.json()) as { data?: MenuData };
    if (!body.data) {
      return NextResponse.json({ error: 'Invalid payload: data required' }, { status: 400 });
    }

    const currentHtml = await readMenuContentHtml();
    const storedData = parseMenuData(currentHtml);
    const mergedData = mergeMenuDataPreservingSections(body.data, storedData);
    const nextHtml = applyMenuDataToHtml(currentHtml, mergedData);

    if (nextHtml.length < 1) {
      return NextResponse.json({ error: 'Menu HTML cannot be empty' }, { status: 400 });
    }

    const storage = await writeMenuContentHtml(nextHtml);

    revalidatePath('/menu');
    revalidatePath('/menu-editor');

    return NextResponse.json({ ok: true, storage });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
