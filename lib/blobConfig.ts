/** True when running on Vercel (production or preview). */
export function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1';
}

/**
 * Whether menu/promotions content should be read and written via Vercel Blob.
 *
 * On Vercel, `@vercel/blob` resolves OIDC credentials at request time when
 * `BLOB_STORE_ID` is set — `VERCEL_OIDC_TOKEN` is not always present in
 * `process.env`, so we must not require it here.
 */
export function isBlobStorageEnabled(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;

  if (process.env.BLOB_STORE_ID?.trim()) {
    // Linked Blob store on Vercel uses runtime OIDC auth.
    if (isVercelRuntime()) return true;
    // Local scripts may pass OIDC explicitly.
    if (process.env.VERCEL_OIDC_TOKEN?.trim()) return true;
  }

  return false;
}

export function assertBlobWritable(): void {
  if (isVercelRuntime() && !isBlobStorageEnabled()) {
    throw new Error(
      'Content saves require Vercel Blob on deployed environments. In Vercel → Project → Settings → Environment Variables, enable BLOB_READ_WRITE_TOKEN (or connect a Blob store so BLOB_STORE_ID is set) for Preview and Production.'
    );
  }
}
