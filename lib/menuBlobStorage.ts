import fs from 'fs/promises';
import path from 'path';
import { get, head, put } from '@vercel/blob';
import { assertBlobWritable, isBlobStorageEnabled } from './blobConfig';

const MENU_BLOB_PATH = 'content/menu.html';
const LOCAL_MENU_PATH = path.join(process.cwd(), 'lib', 'content', 'menu.html');

export function isMenuBlobStorageEnabled(): boolean {
  return isBlobStorageEnabled();
}

function blobAccess(): 'public' | 'private' {
  const configured = process.env.BLOB_MENU_ACCESS;
  return configured === 'public' ? 'public' : 'private';
}

async function readLocalMenuHtml(): Promise<string> {
  return fs.readFile(LOCAL_MENU_PATH, 'utf8');
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

async function blobMenuExists(): Promise<boolean> {
  try {
    await head(MENU_BLOB_PATH);
    return true;
  } catch {
    return false;
  }
}

async function seedBlobFromLocalIfMissing(): Promise<void> {
  if (!(await blobMenuExists())) {
    const local = await readLocalMenuHtml();
    await put(MENU_BLOB_PATH, local, {
      access: blobAccess(),
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  }
}

export async function readMenuContentHtml(): Promise<string> {
  if (!isMenuBlobStorageEnabled()) {
    return readLocalMenuHtml();
  }

  try {
    await seedBlobFromLocalIfMissing();

    const result = await get(MENU_BLOB_PATH, {
      access: blobAccess(),
      useCache: false,
    });

    if (result?.statusCode === 200 && result.stream) {
      return streamToText(result.stream);
    }
  } catch (err) {
    console.warn('[menu-blob] read failed, using local file:', err);
  }

  return readLocalMenuHtml();
}

export async function writeMenuContentHtml(html: string): Promise<'blob' | 'local' | 'both'> {
  assertBlobWritable();

  let wroteBlob = false;
  let wroteLocal = false;

  if (isMenuBlobStorageEnabled()) {
    try {
      await put(MENU_BLOB_PATH, html, {
        access: blobAccess(),
        contentType: 'text/html; charset=utf-8',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      wroteBlob = true;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to save menu to Vercel Blob: ${detail}`);
    }
  }

  try {
    await fs.writeFile(LOCAL_MENU_PATH, html, 'utf8');
    wroteLocal = true;
  } catch (err) {
    if (!isMenuBlobStorageEnabled()) {
      throw err;
    }
  }

  if (wroteBlob && wroteLocal) return 'both';
  if (wroteBlob) return 'blob';
  return 'local';
}

export const MENU_BLOB_PATHNAME = MENU_BLOB_PATH;
