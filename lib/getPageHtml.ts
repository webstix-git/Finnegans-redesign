import fs from 'fs';
import path from 'path';
import {
  normalizeButtonHovers,
  renderBreadcrumbs,
  renderFooter,
  renderHeader,
} from './siteChrome';

const contentDir = path.join(process.cwd(), 'lib', 'content');

export function getPageHtml(slug: string): string {
  let html = fs.readFileSync(path.join(contentDir, `${slug}.html`), 'utf8');

  html = html.replace(/<!-- NAV -->[\s\S]*?<\/header>/, renderHeader(slug));
  html = html.replace(/<!-- FOOTER -->[\s\S]*?<\/footer>/, renderFooter());

  const breadcrumbs = slug === 'home' ? '' : renderBreadcrumbs(slug);
  if (html.includes('<!-- BREADCRUMBS -->')) {
    html = html.replace('<!-- BREADCRUMBS -->', breadcrumbs);
  } else if (breadcrumbs) {
    html = html.replace(/(<section id="top"[\s\S]*?<\/section>)/, `$1\n\n  ${breadcrumbs}`);
  }

  html = normalizeButtonHovers(html);

  return html;
}
