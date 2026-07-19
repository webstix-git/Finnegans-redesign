export type MenuCategory = 'apps' | 'salad' | 'mains' | 'drafts';

export const SALAD_DESC_ID = 'salad-description';

export function draftFooterId(boardIndex: 0 | 1, line: 1 | 2): string {
  return `draft-footer-${boardIndex}-line${line}`;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  badge: string;
  price: string;
}

export interface SaladOption {
  id: string;
  name: string;
  price: string;
}

export interface SaladSection {
  description: string;
  options: SaladOption[];
}

export interface DraftBeer {
  id: string;
  name: string;
  price: string;
}

export interface DraftBoard {
  beers: DraftBeer[];
  footerLine1: string;
  footerLine2: string;
}

export interface MenuData {
  apps: MenuItem[];
  salad: SaladSection;
  mains: MenuItem[];
  draftBoards: [DraftBoard, DraftBoard];
}

export interface EditableMenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: MenuCategory;
  badge: string;
  boardIndex?: 0 | 1;
  isSaladDescription?: boolean;
  isDraftFooter?: boolean;
}

export interface ApplyMenuOptions {
  editorMode?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function parseNameAndBadge(nameHtml: string): { name: string; badge: string } {
  const badgeMatch = nameHtml.match(/<span[^>]*>(.*?)<\/span>/i);
  if (!badgeMatch) {
    return { name: stripTags(nameHtml), badge: '' };
  }
  const badge = stripTags(badgeMatch[1]);
  const name = stripTags(nameHtml.replace(/<span[^>]*>.*?<\/span>/i, ''));
  return { name, badge };
}

function parsePrice(inner: string): string {
  const priceMatch = inner.match(
    /<div style="font-family:Oswald,sans-serif;font-weight:600;font-size:16px;[^"]*">([\s\S]*?)<\/div>/
  );
  return priceMatch ? stripTags(priceMatch[1]) : '';
}

export function newId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function wrapEditor(
  inner: string,
  id: string,
  category: MenuCategory,
  boardIndex?: 0 | 1,
  inline = false
): string {
  const boardAttr = boardIndex !== undefined ? ` data-fw-board="${boardIndex}"` : '';
  const tag = inline ? 'span' : 'div';
  return `<${tag} class="fw-menu-editable fw-menu-editable--card" data-fw-item-id="${id}" data-fw-category="${category}"${boardAttr}>${inner}</${tag}>`;
}

const DRAFT_BEER_STYLE =
  'font-family:Oswald,sans-serif;text-transform:uppercase;font-size:17px;color:var(--cream);letter-spacing:.04em;padding:10px 0;text-align:left;';
const DRAFT_FOOTER1_STYLE =
  'font-family:Montserrat,sans-serif;font-style:normal;font-size:15px;color:var(--muted);line-height:1.6;margin:0;text-align:center;';
const DRAFT_FOOTER2_STYLE =
  'font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:18px;color:var(--cream);font-weight:600;margin-top:6px;margin-bottom:0;text-align:center;';

function parseItemInner(inner: string): MenuItem | null {
  const flexMatch = inner.match(/<div style="display:flex;align-items:center;gap:10px;">([\s\S]*?)<\/div>/);
  let titleHtml = '';

  if (flexMatch) {
    const spans = [...flexMatch[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)];
    if (spans.length >= 2) {
      const name = stripTags(spans[0][1]);
      const badge = stripTags(spans[1][1]);
      const descMatch = inner.match(
        /<div style="font-family:Montserrat,sans-serif;font-size:13\.5px;[^"]*">([\s\S]*?)<\/div>/
      );
      const description = descMatch ? stripTags(descMatch[1]) : '';
      const price = parsePrice(inner);
      return name ? { id: newId(), name, description, badge, price } : null;
    }
    titleHtml = flexMatch[1];
  } else {
    const titleDiv = inner.match(/<div style="font-family:Oswald[^"]*">([\s\S]*?)<\/div>/);
    if (!titleDiv) return null;
    titleHtml = titleDiv[1];
  }

  const { name, badge } = parseNameAndBadge(titleHtml);
  const descMatch = inner.match(
    /<div style="font-family:Montserrat,sans-serif;font-size:13\.5px;[^"]*">([\s\S]*?)<\/div>/
  );
  const description = descMatch ? stripTags(descMatch[1]) : '';
  const price = parsePrice(inner);

  return name ? { id: newId(), name, description, badge, price } : null;
}

function parseMenuItems(block: string, _variant: 'apps' | 'mains'): MenuItem[] {
  const items: MenuItem[] = [];
  const rowPattern =
    /<div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:baseline;padding:14px 0;[^"]*">([\s\S]*?)<\/div>\s*(?=<div style="display:grid|<\/div>\s*<\/div>\s*(?:<\/div>\s*<\/section>|<div style="position:relative))/g;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(block)) !== null) {
    const item = parseItemInner(match[1]);
    if (item) items.push(item);
  }
  return items;
}

function parseSalad(block: string): SaladSection {
  const descMatch = block.match(
    /<p style="font-family:Montserrat,sans-serif;font-size:16px;[^"]*">([\s\S]*?)<\/p>/
  );
  const description = descMatch ? stripTags(descMatch[1]) : '';

  const options: SaladOption[] = [];
  const optionRegex =
    /<div style="display:flex;align-items:baseline;gap:12px;[^"]*"><span[^>]*>◆<\/span>([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null;
  while ((match = optionRegex.exec(block)) !== null) {
    const raw = stripTags(match[1]);
    if (!raw) continue;
    const priceMatch = raw.match(/^(.*?)\s+(\$[\d.]+)$/);
    if (priceMatch) {
      options.push({ id: newId(), name: priceMatch[1].trim(), price: priceMatch[2].trim() });
    } else {
      options.push({ id: newId(), name: raw, price: '' });
    }
  }

  return { description, options };
}

function parseDraftBoard(block: string): DraftBoard {
  const beers: DraftBeer[] = [];
  const beerRegex = /<li style="[^"]*">([\s\S]*?)<\/li>/g;
  let match: RegExpExecArray | null;
  while ((match = beerRegex.exec(block)) !== null) {
    const raw = stripTags(match[1]);
    if (!raw) continue;
    const priceMatch = raw.match(/^(.*?)\s+(\$[\d.]+)$/);
    if (priceMatch) {
      beers.push({ id: newId(), name: priceMatch[1].trim(), price: priceMatch[2].trim() });
    } else {
      beers.push({ id: newId(), name: raw, price: '' });
    }
  }

  const footerPs = [...block.matchAll(/<p style="font-family:[^"]*">([\s\S]*?)<\/p>/g)].map((m) =>
    stripTags(m[1])
  );

  return {
    beers,
    footerLine1: footerPs[0] ?? 'All Day, Everyday!',
    footerLine2: footerPs[1] ?? '',
  };
}

export function parseMenuData(html: string): MenuData {
  const appsBlock = html.match(/<!-- APPS -->[\s\S]*?(?=<!-- SALAD -->)/)?.[0] ?? '';
  const saladBlock = html.match(/<!-- SALAD -->[\s\S]*?(?=<!-- SAUCES -->)/)?.[0] ?? '';
  const mainsBlock = html.match(/<!-- MAINS -->[\s\S]*?(?=<!-- DRAFT LIST -->)/)?.[0] ?? '';
  const draftBlock = html.match(/<!-- DRAFT LIST -->[\s\S]*?(?=<!-- FOOTER -->)/)?.[0] ?? '';

  const board1Block = draftBlock.match(/<!-- Board 1 -->[\s\S]*?(?=<!-- Board 2 -->)/)?.[0] ?? '';
  const board2Block = draftBlock.match(/<!-- Board 2 -->[\s\S]*?(?=<\/div>\s*\n\s*<\/div>\s*<\/section>)/)?.[0] ?? '';

  return {
    apps: parseMenuItems(appsBlock, 'apps'),
    salad: parseSalad(saladBlock),
    mains: parseMenuItems(mainsBlock, 'mains'),
    draftBoards: [parseDraftBoard(board1Block), parseDraftBoard(board2Block)],
  };
}

function renderPrice(price: string, color = '#2a1d12'): string {
  if (!price.trim()) return '';
  return `<div style="font-family:Oswald,sans-serif;font-weight:600;font-size:16px;color:${color};white-space:nowrap;">${escapeHtml(price)}</div>`;
}


function renderAppsName(item: MenuItem, _editorMode = false): string {
  const name = escapeHtml(item.name);
  const badge = escapeHtml(item.badge);
  if (!item.badge.trim()) {
    return `<div style="font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;font-size:18px;color:#2a1d12;">${name}</div>`;
  }
  return `<div style="font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;font-size:18px;color:#2a1d12;">${name} <span style="font-size:13px;font-weight:400;color:var(--brick);">${badge}</span></div>`;
}

function renderMainsName(item: MenuItem, _editorMode = false): string {
  const name = escapeHtml(item.name);
  const badge = escapeHtml(item.badge);
  if (!item.badge.trim()) {
    return `<div style="font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;font-size:18px;color:var(--cream);">${name}</div>`;
  }
  return `<div style="display:flex;align-items:center;gap:10px;"><span style="font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;font-size:18px;color:var(--cream);">${name}</span><span style="font-family:Oswald,sans-serif;text-transform:uppercase;font-size:10px;letter-spacing:.12em;color:var(--cream);background:var(--brick);padding:3px 8px;border-radius:2px;">${badge}</span></div>`;
}

function renderAppsItems(items: MenuItem[], editorMode = false): string {
  return items
    .map((item, index) => {
      const border =
        index < items.length - 1 ? 'border-bottom:1px solid rgba(90,54,30,.14);' : '';
      const desc = item.description.trim()
        ? `<div style="font-family:Montserrat,sans-serif;font-size:13.5px;color:#7a6346;margin-top:4px;">${escapeHtml(item.description)}</div>`
        : '';
      const price = renderPrice(item.price);
      const inner = `<div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:baseline;padding:14px 0;${border}">
            <div>
              ${renderAppsName(item)}
              ${desc}
            </div>
            ${price}
          </div>`;
      return editorMode ? wrapEditor(inner, item.id, 'apps') : inner;
    })
    .join('\n          ');
}

function renderMainsItems(items: MenuItem[], editorMode = false): string {
  return items
    .map((item, index) => {
      const border =
        index < items.length - 1 ? 'border-bottom:1px solid rgba(230,219,198,.12);' : '';
      const desc = item.description.trim()
        ? `<div style="font-family:Montserrat,sans-serif;font-size:13.5px;color:var(--muted);margin-top:4px;">${escapeHtml(item.description)}</div>`
        : '';
      const price = renderPrice(item.price, 'var(--gold2)');
      const inner = `<div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:baseline;padding:14px 0;${border}">
            <div>
              ${renderMainsName(item)}
              ${desc}
            </div>
            ${price}
          </div>`;
      return editorMode ? wrapEditor(inner, item.id, 'mains') : inner;
    })
    .join('\n          ');
}

function renderSaladDescription(description: string, editorMode = false): string {
  const inner = escapeHtml(description);
  if (!editorMode) return inner;
  return wrapEditor(
    `<span data-fw-salad-desc="1">${inner}</span>`,
    SALAD_DESC_ID,
    'salad'
  );
}

function renderSaladOptions(options: SaladOption[], editorMode = false): string {
  return options
    .map((option) => {
      const label = option.price.trim()
        ? `${escapeHtml(option.name)} ${escapeHtml(option.price)}`
        : escapeHtml(option.name);
      const inner = `<div style="display:flex;align-items:baseline;gap:12px;font-family:Montserrat,sans-serif;font-size:17px;color:var(--cream2);"><span style="color:var(--brick);font-size:11px;">◆</span>${label}</div>`;
      return editorMode ? wrapEditor(inner, option.id, 'salad') : inner;
    })
    .join('\n          ');
}

function renderDraftBeerList(beers: DraftBeer[], editorMode = false, boardIndex: 0 | 1 = 0): string {
  return beers
    .map((beer, index) => {
      const border =
        index < beers.length - 1 ? 'border-bottom:1px solid rgba(230,219,198,.1);' : '';
      const label = beer.price.trim()
        ? `${escapeHtml(beer.name)} <span style="opacity:.65;font-size:14px;">${escapeHtml(beer.price)}</span>`
        : escapeHtml(beer.name);
      if (editorMode) {
        return `<li class="fw-menu-editable fw-menu-editable--card" data-fw-item-id="${beer.id}" data-fw-category="drafts" data-fw-board="${boardIndex}" style="${DRAFT_BEER_STYLE}${border}list-style:none;">${label}</li>`;
      }
      return `<li style="${DRAFT_BEER_STYLE}${border}">${label}</li>`;
    })
    .join('\n            ');
}

function renderDraftBoard(board: DraftBoard, editorMode = false, boardIndex: 0 | 1 = 0): string {
  const footer1Inner = escapeHtml(board.footerLine1);
  const footer2Inner = escapeHtml(board.footerLine2);
  const footer1 = editorMode
    ? `<p class="fw-menu-editable fw-menu-editable--card" data-fw-item-id="${draftFooterId(boardIndex, 1)}" data-fw-category="drafts" data-fw-board="${boardIndex}" style="${DRAFT_FOOTER1_STYLE}">${footer1Inner}</p>`
    : `<p style="${DRAFT_FOOTER1_STYLE}">${footer1Inner}</p>`;
  const footer2 = editorMode
    ? `<p class="fw-menu-editable fw-menu-editable--card" data-fw-item-id="${draftFooterId(boardIndex, 2)}" data-fw-category="drafts" data-fw-board="${boardIndex}" style="${DRAFT_FOOTER2_STYLE}">${footer2Inner}</p>`
    : `<p style="${DRAFT_FOOTER2_STYLE}">${footer2Inner}</p>`;

  return `<ul style="list-style:none;display:grid;gap:0;">
            ${renderDraftBeerList(board.beers, editorMode, boardIndex)}
          </ul>
          <div style="margin-top:28px;border-top:1px solid rgba(230,219,198,.25);padding-top:22px;text-align:center;">
            ${footer1}
            ${footer2}
          </div>`;
}

export function applyMenuDataToHtml(
  html: string,
  data: MenuData,
  options: ApplyMenuOptions = {}
): string {
  const editorMode = options.editorMode ?? false;
  let next = html;

  {
    next = next.replace(
      /(<!-- APPS -->[\s\S]*?<div style="margin-top:32px;display:grid;gap:0;">)\s*[\s\S]*?(\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*\n\s*<!-- SALAD -->)/,
      `$1\n          ${renderAppsItems(data.apps, editorMode)}\n        $2`
    );
  }

  next = next.replace(
    /(<!-- SALAD -->[\s\S]*?<p style="font-family:Montserrat,sans-serif;font-size:16px;[^"]*">)[\s\S]*?(<\/p>)/,
    `$1${renderSaladDescription(data.salad.description, editorMode)}$2`
  );

  {
    next = next.replace(
      /(<!-- SALAD -->[\s\S]*?<div style="margin-top:26px;display:grid;gap:12px;max-width:360px;">)\s*[\s\S]*?(\s*<\/div>\s*<\/div>\s*<div style="position:relative;">)/,
      `$1\n          ${renderSaladOptions(data.salad.options, editorMode)}\n        $2`
    );
  }

  {
    next = next.replace(
      /(<!-- MAINS -->[\s\S]*?<div style="margin-top:32px;display:grid;gap:0;">)\s*[\s\S]*?(\s*<\/div>\s*<\/div>\s*<div style="position:relative;">)/,
      `$1\n          ${renderMainsItems(data.mains, editorMode)}\n        $2`
    );
  }

  next = next.replace(
    /(<!-- Board 1 -->[\s\S]*?<div style="width:60px;height:1\.5px;background:rgba\(230,219,198,\.3\);margin:0 auto 28px;"><\/div>\s*)\s*[\s\S]*?(\s*<\/div>\s*\n\s*<!-- Board 2 -->)/,
    `$1${renderDraftBoard(data.draftBoards[0], editorMode, 0)}$2`
  );

  next = next.replace(
    /(<!-- Board 2 -->[\s\S]*?<div style="width:60px;height:1\.5px;background:rgba\(230,219,198,\.3\);margin:0 auto 28px;"><\/div>\s*)\s*[\s\S]*?(\s*<\/div>\s*\n\s*<\/div>\s*<\/div>\s*<\/section>)/,
    `$1${renderDraftBoard(data.draftBoards[1], editorMode, 1)}$2`
  );

  return next;
}

export function cloneMenuData(data: MenuData): MenuData {
  return JSON.parse(JSON.stringify(data)) as MenuData;
}

/** Preserve text-only fields if a save accidentally blanks them; item lists trust the client (supports deletes). */
export function mergeMenuDataPreservingSections(incoming: MenuData, stored: MenuData): MenuData {
  const next = cloneMenuData(incoming);

  if (!next.salad.description.trim() && stored.salad.description.trim()) {
    next.salad.description = stored.salad.description;
  }

  for (const boardIndex of [0, 1] as const) {
    if (!next.draftBoards[boardIndex].footerLine1.trim() && stored.draftBoards[boardIndex].footerLine1.trim()) {
      next.draftBoards[boardIndex].footerLine1 = stored.draftBoards[boardIndex].footerLine1;
    }
    if (!next.draftBoards[boardIndex].footerLine2.trim() && stored.draftBoards[boardIndex].footerLine2.trim()) {
      next.draftBoards[boardIndex].footerLine2 = stored.draftBoards[boardIndex].footerLine2;
    }
  }

  return next;
}

export function createEmptyMenuItem(category: MenuCategory = 'apps'): MenuItem {
  return { id: newId(), name: '', description: '', badge: '', price: '' };
}

export function createEmptyEditableItem(
  category: MenuCategory,
  boardIndex?: 0 | 1
): EditableMenuItem {
  const item = createEmptyMenuItem(category);
  return {
    ...item,
    category,
    boardIndex: category === 'drafts' ? boardIndex ?? 0 : undefined,
  };
}

export function toEditableItem(data: MenuData, id: string): EditableMenuItem | null {
  if (id === SALAD_DESC_ID) {
    return {
      id: SALAD_DESC_ID,
      name: 'Salad',
      description: data.salad.description,
      price: '',
      category: 'salad',
      badge: '',
      isSaladDescription: true,
    };
  }

  const footerMatch = id.match(/^draft-footer-([01])-line([12])$/);
  if (footerMatch) {
    const boardIndex = Number(footerMatch[1]) as 0 | 1;
    const line = Number(footerMatch[2]) as 1 | 2;
    const board = data.draftBoards[boardIndex];
    return {
      id,
      name: line === 1 ? 'Promo line 1' : 'Promo line 2',
      description: line === 1 ? board.footerLine1 : board.footerLine2,
      price: '',
      category: 'drafts',
      badge: '',
      boardIndex,
      isDraftFooter: true,
    };
  }

  const app = data.apps.find((i) => i.id === id);
  if (app) return { ...app, category: 'apps' };

  const main = data.mains.find((i) => i.id === id);
  if (main) return { ...main, category: 'mains' };

  const saladOpt = data.salad.options.find((i) => i.id === id);
  if (saladOpt) {
    return {
      id: saladOpt.id,
      name: saladOpt.name,
      description: '',
      price: saladOpt.price,
      category: 'salad',
      badge: '',
    };
  }

  for (const boardIndex of [0, 1] as const) {
    const beer = data.draftBoards[boardIndex].beers.find((i) => i.id === id);
    if (beer) {
      return {
        id: beer.id,
        name: beer.name,
        description: '',
        price: beer.price,
        category: 'drafts',
        badge: '',
        boardIndex,
      };
    }
  }

  return null;
}

export function removeItemById(data: MenuData, id: string): MenuData {
  const next = cloneMenuData(data);
  next.apps = next.apps.filter((i) => i.id !== id);
  next.mains = next.mains.filter((i) => i.id !== id);
  next.salad.options = next.salad.options.filter((i) => i.id !== id);
  next.draftBoards = [
    { ...next.draftBoards[0], beers: next.draftBoards[0].beers.filter((b) => b.id !== id) },
    { ...next.draftBoards[1], beers: next.draftBoards[1].beers.filter((b) => b.id !== id) },
  ];
  return next;
}

/** Rebuild a section from the items still present in the editor DOM (supports deletions). */
export function applySectionItems(
  data: MenuData,
  sectionId: 'apps' | 'salads' | 'mains' | 'drafts',
  items: EditableMenuItem[]
): MenuData {
  let next = cloneMenuData(data);

  if (sectionId === 'apps') {
    next.apps = [];
  } else if (sectionId === 'mains') {
    next.mains = [];
  } else if (sectionId === 'salads') {
    next.salad.options = [];
  } else if (sectionId === 'drafts') {
    next.draftBoards[0].beers = [];
    next.draftBoards[1].beers = [];
  }

  for (const item of items) {
    next = applyEditableItemUpdate(next, item);
  }

  return next;
}

export function applyEditableItemUpdate(data: MenuData, item: EditableMenuItem): MenuData {
  if (item.isSaladDescription) {
    const next = cloneMenuData(data);
    next.salad.description = item.description;
    return next;
  }

  if (item.isDraftFooter && item.boardIndex !== undefined) {
    const next = cloneMenuData(data);
    const line = item.id.endsWith('-line1') ? 1 : 2;
    if (line === 1) next.draftBoards[item.boardIndex].footerLine1 = item.description;
    else next.draftBoards[item.boardIndex].footerLine2 = item.description;
    return next;
  }

  const next = cloneMenuData(data);

  if (item.category === 'apps' || item.category === 'mains') {
    const menuItem: MenuItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      badge: item.badge,
      price: item.price,
    };
    const list = item.category === 'apps' ? next.apps : next.mains;
    const index = list.findIndex((i) => i.id === item.id);
    if (index >= 0) list[index] = menuItem;
    else list.push(menuItem);
    return next;
  }

  if (item.category === 'salad') {
    const option = { id: item.id, name: item.name, price: item.price };
    const index = next.salad.options.findIndex((i) => i.id === item.id);
    if (index >= 0) next.salad.options[index] = option;
    else next.salad.options.push(option);
    return next;
  }

  const boardIndex = item.boardIndex ?? 0;
  const beers = next.draftBoards[boardIndex].beers;
  const beer = { id: item.id, name: item.name, price: item.price };
  const index = beers.findIndex((b) => b.id === item.id);
  if (index >= 0) beers[index] = beer;
  else beers.push(beer);
  return next;
}
