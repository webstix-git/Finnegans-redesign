import fs from 'fs/promises';
import path from 'path';
import { get, put } from '@vercel/blob';
import { isBlobStorageEnabled, isVercelRuntime } from './blobConfig';
import { MENU_BLOB_PATHNAME } from './menuBlobStorage';
import { PROMOTIONS_BLOB_PATHNAME } from './promotionsBlobStorage';

const DEPLOY_META_PATH = 'content/.deploy-sync-meta.json';
const LOCAL_MENU_PATH = path.join(process.cwd(), 'lib', 'content', 'menu.html');
const LOCAL_PROMOTIONS_PATH = path.join(
  process.cwd(),
  'lib',
  'content',
  'promotions-and-events.html'
);

interface DeploySyncMeta {
  syncedCommitSha: string;
  syncedAt: string;
}

function blobAccess(): 'public' | 'private' {
  const configured = process.env.BLOB_PROMOTIONS_ACCESS ?? process.env.BLOB_MENU_ACCESS;
  return configured === 'public' ? 'public' : 'private';
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

async function readDeployMeta(): Promise<DeploySyncMeta | null> {
  try {
    const result = await get(DEPLOY_META_PATH, {
      access: blobAccess(),
      useCache: false,
    });
    if (result?.statusCode === 200 && result.stream) {
      return JSON.parse(await streamToText(result.stream)) as DeploySyncMeta;
    }
  } catch {
    // Meta file may not exist yet on first deploy with blob enabled.
  }
  return null;
}

async function writeDeployMeta(commitSha: string): Promise<void> {
  const meta: DeploySyncMeta = {
    syncedCommitSha: commitSha,
    syncedAt: new Date().toISOString(),
  };
  await put(DEPLOY_META_PATH, JSON.stringify(meta), {
    access: blobAccess(),
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

let inflightSync: Promise<boolean> | null = null;

async function runDeploySync(force: boolean): Promise<boolean> {
  if (!isBlobStorageEnabled()) return false;

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() ?? 'local';
  if (!force) {
    const meta = await readDeployMeta();
    if (meta?.syncedCommitSha === commitSha) return false;
  }

  const [menuHtml, promotionsHtml] = await Promise.all([
    fs.readFile(LOCAL_MENU_PATH, 'utf8'),
    fs.readFile(LOCAL_PROMOTIONS_PATH, 'utf8'),
  ]);

  const access = blobAccess();
  await Promise.all([
    put(MENU_BLOB_PATHNAME, menuHtml, {
      access,
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    put(PROMOTIONS_BLOB_PATHNAME, promotionsHtml, {
      access,
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    writeDeployMeta(commitSha),
  ]);

  console.log(
    `[blob-deploy-sync] synced menu + promotions from deploy ${commitSha.slice(0, 7)}`
  );
  return true;
}

/**
 * When a new git deploy lands on Vercel, push the bundled HTML snapshots into Blob
 * so staging/production reflect repo changes. Editor saves still win until the next deploy.
 */
export async function syncBlobContentFromDeployIfNeeded(options?: {
  force?: boolean;
}): Promise<boolean> {
  if (!isBlobStorageEnabled()) return false;
  if (!options?.force && !isVercelRuntime()) return false;

  if (!inflightSync) {
    inflightSync = runDeploySync(Boolean(options?.force)).finally(() => {
      inflightSync = null;
    });
  }

  return inflightSync;
}
