import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { syncBlobContentFromDeployIfNeeded } from '@/lib/blobDeploySync';
import { isBlobStorageEnabled } from '@/lib/blobConfig';
import { assertMenuEditorAuth } from '@/lib/menuAuth';

export const runtime = 'nodejs';

/** Force-push deploy HTML snapshots into Vercel Blob (menu + promotions). */
export async function POST(req: NextRequest) {
  try {
    assertMenuEditorAuth(req, { required: true });

    if (!isBlobStorageEnabled()) {
      return NextResponse.json(
        { error: 'Blob storage is not enabled on this environment.' },
        { status: 400 }
      );
    }

    const synced = await syncBlobContentFromDeployIfNeeded({ force: true });

    revalidatePath('/menu');
    revalidatePath('/menu-editor');
    revalidatePath('/promotions-and-events');
    revalidatePath('/promotions-and-events-editor');

    return NextResponse.json({ ok: true, synced });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
