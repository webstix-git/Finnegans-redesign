import fs from 'fs';
import path from 'path';
import {
  normalizeButtonHovers,
  renderBreadcrumbs,
  renderFooter,
  renderHeader,
  renderPromotionsFooter,
} from './siteChrome';
import { isMenuBlobStorageEnabled, readMenuContentHtml } from './menuBlobStorage';
import { isPromotionsBlobStorageEnabled, readPromotionsContentHtml } from './promotionsBlobStorage';

const contentDir = path.join(process.cwd(), 'lib', 'content');

function applySiteChrome(slug: string, html: string): string {
  html = html.replace(/<!-- NAV -->[\s\S]*?<\/header>/, renderHeader(slug));
  const footer =
    slug === 'promotions-and-events' ? renderPromotionsFooter() : renderFooter();
  html = html.replace(/<!-- FOOTER -->[\s\S]*?<\/footer>/, footer);

  const breadcrumbs = slug === 'home' ? '' : renderBreadcrumbs(slug);
  if (html.includes('<!-- BREADCRUMBS -->')) {
    html = html.replace('<!-- BREADCRUMBS -->', breadcrumbs);
  } else if (breadcrumbs) {
    html = html.replace(/(<section id="top"[\s\S]*?<\/section>)/, `$1\n\n  ${breadcrumbs}`);
  }

  return normalizeButtonHovers(html);
}

export function getPageHtml(slug: string): string {
  const html = fs.readFileSync(path.join(contentDir, `${slug}.html`), 'utf8');
  return applySiteChrome(slug, html);
}

export async function getPageHtmlAsync(slug: string): Promise<string> {
  let raw: string;

  if (slug === 'menu' && isMenuBlobStorageEnabled()) {
    raw = await readMenuContentHtml();
  } else if (slug === 'promotions-and-events' && isPromotionsBlobStorageEnabled()) {
    raw = await readPromotionsContentHtml();
  } else {
    raw = fs.readFileSync(path.join(contentDir, `${slug}.html`), 'utf8');
  }

  return applySiteChrome(slug, raw);
}
