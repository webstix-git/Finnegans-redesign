import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { assertMenuEditorAuth } from '@/lib/menuAuth';

export const runtime = 'nodejs';

/**
 * Client upload route for Vercel Blob.
 * Uses BLOB_WEBHOOK_PUBLIC_KEY to verify upload-completed callbacks.
 */
export async function POST(request: Request) {
  try {
    assertMenuEditorAuth(request, { required: true });

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      // Verifies upload callbacks using process.env.BLOB_WEBHOOK_PUBLIC_KEY from Vercel
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'text/html',
          'application/json',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
        addRandomSuffix: true,
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('[blob] upload completed:', blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Blob upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
