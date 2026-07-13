import fs from 'fs/promises';
import path from 'path';
import { get, head, put } from '@vercel/blob';
import { isMenuBlobStorageEnabled } from './menuBlobStorage';

const PROMOTIONS_BLOB_PATH = 'content/promotions-and-events.html';
const LOCAL_PROMOTIONS_PATH = path.join(process.cwd(), 'lib', 'content', 'promotions-and-events.html');

function blobAccess(): 'public' | 'private' {
  const configured = process.env.BLOB_PROMOTIONS_ACCESS ?? process.env.BLOB_MENU_ACCESS;
  return configured === 'public' ? 'public' : 'private';
}

async function readLocalPromotionsHtml(): Promise<string> {
  return fs.readFile(LOCAL_PROMOTIONS_PATH, 'utf8');
}

function isCorruptedPromotionsHtml(html: string): boolean {
  return (
    html.includes('fw-promo-card') ||
    html.includes('fw-section-edit-bar') ||
    html.includes('fw-promo-card-wrap')
  );
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

async function blobPromotionsExists(): Promise<boolean> {
  try {
    await head(PROMOTIONS_BLOB_PATH);
    return true;
  } catch {
    return false;
  }
}

async function seedBlobFromLocalIfMissing(): Promise<void> {
  if (!(await blobPromotionsExists())) {
    const local = await readLocalPromotionsHtml();
    await put(PROMOTIONS_BLOB_PATH, local, {
      access: blobAccess(),
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  }
}

export function isPromotionsBlobStorageEnabled(): boolean {
  return isMenuBlobStorageEnabled();
}

export async function readPromotionsContentHtml(): Promise<string> {
  if (!isPromotionsBlobStorageEnabled()) {
    return readLocalPromotionsHtml();
  }

  try {
    await seedBlobFromLocalIfMissing();

    const result = await get(PROMOTIONS_BLOB_PATH, {
      access: blobAccess(),
      useCache: false,
    });

    if (result?.statusCode === 200 && result.stream) {
      const blobHtml = await streamToText(result.stream);
      if (isCorruptedPromotionsHtml(blobHtml)) {
        console.warn('[promotions-blob] corrupted blob content, using local file');
        return readLocalPromotionsHtml();
      }
      return blobHtml;
    }
  } catch (err) {
    console.warn('[promotions-blob] read failed, using local file:', err);
  }

  return readLocalPromotionsHtml();
}

export async function writePromotionsContentHtml(html: string): Promise<'blob' | 'local' | 'both'> {
  let wroteBlob = false;
  let wroteLocal = false;

  if (isPromotionsBlobStorageEnabled()) {
    await put(PROMOTIONS_BLOB_PATH, html, {
      access: blobAccess(),
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    wroteBlob = true;
  }

  try {
    await fs.writeFile(LOCAL_PROMOTIONS_PATH, html, 'utf8');
    wroteLocal = true;
  } catch (err) {
    if (!isPromotionsBlobStorageEnabled()) {
      throw err;
    }
  }

  if (wroteBlob && wroteLocal) return 'both';
  if (wroteBlob) return 'blob';
  return 'local';
}

export const PROMOTIONS_BLOB_PATHNAME = PROMOTIONS_BLOB_PATH;
