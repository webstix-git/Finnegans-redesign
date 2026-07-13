export type PromoCardId =
  | 'every-day'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const PROMO_CARD_ORDER: PromoCardId[] = [
  'every-day',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export interface PromoSegment {
  id: string;
  kind: 'price' | 'subhead' | 'text' | 'list' | 'footer' | 'time';
  text?: string;
  items?: string[];
  subheadMargin?: 'normal' | 'spaced';
  listMargin?: 'normal' | 'spaced';
  textMargin?: 'normal' | 'flush';
}

export interface PromoCardData {
  id: PromoCardId;
  day: string;
  title: string;
  badge: string;
  priceLine: string;
  description: string;
  displayPrice: string;
  segments: PromoSegment[];
}

export interface PromoScheduleData {
  cards: PromoCardData[];
}

export interface EditablePromoField {
  cardId: PromoCardId;
  field: string;
  segmentId?: string;
  listIndex?: number;
  value: string;
}

export interface ApplyPromoOptions {
  editorMode?: boolean;
}

const CARD_BG =
  "background-color:#2a1208;background-image:linear-gradient(rgba(18,7,3,.82),rgba(18,7,3,.86)),url('/assets/de8ae464-765c-406a-b69e-5a748d6cdab3.jpg');background-size:cover;background-position:center;border:1px solid rgba(230,219,198,.22);border-radius:10px;padding:30px 28px;";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

export function newPromoId(): string {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseListItems(ulInner: string): string[] {
  const items: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let match: RegExpExecArray | null;
  while ((match = liRegex.exec(ulInner)) !== null) {
    const text = stripTags(match[1].replace(/<span[^>]*>◆<\/span>/i, ''));
    if (text) items.push(text);
  }
  return items;
}

function classifyBlock(tag: string, style: string, inner: string): PromoSegment | null {
  const text = stripTags(inner);

  if (tag === 'ul') {
    const items = parseListItems(inner);
    const listMargin = style.includes('margin-bottom:16px') ? 'spaced' : 'normal';
    return items.length ? { id: newPromoId(), kind: 'list', items, listMargin } : null;
  }

  if (tag === 'div') {
    if (style.includes('color:var(--gold2)') && style.includes('font-weight:600')) {
      return text ? { id: newPromoId(), kind: 'price', text } : null;
    }
    if (style.includes('color:var(--muted)') && style.includes('uppercase')) {
      const subheadMargin = style.includes('margin:16px 0 12px') ? 'spaced' : 'normal';
      return text ? { id: newPromoId(), kind: 'subhead', text, subheadMargin } : null;
    }
  }

  if (tag === 'p') {
    if (style.includes('font-style:normal') && style.includes('color:var(--muted)')) {
      return text ? { id: newPromoId(), kind: 'footer', text } : null;
    }
    if (style.includes('color:var(--gold2)') && style.includes('uppercase')) {
      return text ? { id: newPromoId(), kind: 'time', text } : null;
    }
    const textMargin = style.includes('margin-bottom:16px') ? 'normal' : 'flush';
    return text ? { id: newPromoId(), kind: 'text', text, textMargin } : null;
  }

  return null;
}

function parseArticleSegments(body: string, cardId: string): PromoSegment[] {
  const segments: PromoSegment[] = [];
  const blockRegex = /<(div|ul|p)([^>]*)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(body)) !== null) {
    const seg = classifyBlock(match[1], match[2], match[3]);
    if (seg) {
      seg.id = `${cardId}-seg-${segments.length}`;
      segments.push(seg);
    }
  }
  return segments;
}

function parseEveryDayCard(block: string): PromoCardData {
  const day = stripTags(
    block.match(
      /<div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:\.22em;font-size:16px;color:var\(--gold2\);font-weight:600;">([\s\S]*?)<\/div>/
    )?.[1] ?? 'Every Day'
  );
  const title = stripTags(block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '');
  const priceLine = stripTags(
    block.match(
      /<p style="font-family:Montserrat,sans-serif;font-size:18px;color:var\(--gold2\);font-weight:500;[^"]*">([\s\S]*?)<\/p>/
    )?.[1] ?? ''
  );
  const description = stripTags(
    block.match(
      /<p style="font-family:Montserrat,sans-serif;font-size:18px;color:var\(--cream2\);[^"]*">([\s\S]*?)<\/p>/
    )?.[1] ?? ''
  );
  const displayPrice = stripTags(
    block.match(
      /<div style="font-family:Anton,sans-serif;text-transform:uppercase;color:var\(--gold2\);[^"]*">([\s\S]*?)<\/div>/
    )?.[1] ?? ''
  );

  return {
    id: 'every-day',
    day,
    title,
    badge: '',
    priceLine,
    description,
    displayPrice,
    segments: [],
  };
}

function parseWeekdayArticle(articleHtml: string, id: PromoCardId): PromoCardData {
  const badge = stripTags(
    articleHtml.match(
      /<div style="position:absolute;top:0;right:0;[^"]*">([\s\S]*?)<\/div>/
    )?.[1] ?? ''
  );

  const dayMatch = articleHtml.match(
    /<div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:\.22em;font-size:16px;color:var\(--gold2\);font-weight:600;">([\s\S]*?)<\/div>/
  );
  const day = stripTags(dayMatch?.[1] ?? id);
  const title = stripTags(articleHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '');

  const afterDivider =
    articleHtml.split(
      /<div style="width:42px;height:2px;background:var\(--brick\);margin:14px 0 18px;"><\/div>/
    )[1] ?? '';

  return {
    id,
    day,
    title,
    badge,
    priceLine: '',
    description: '',
    displayPrice: '',
    segments: parseArticleSegments(afterDivider, id),
  };
}

const WEEKDAY_IDS: PromoCardId[] = [
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function parsePromoScheduleData(html: string): PromoScheduleData {
  const scheduleBlock =
    html.match(/<!-- THE CLASS SCHEDULE -->[\s\S]*?(?=<!-- ALUMNI HOUR -->)/)?.[0] ?? '';

  const everyDayBlock =
    scheduleBlock.match(/<!-- Every Day feature -->[\s\S]*?(?=<!-- weekday grid -->)/)?.[0] ?? '';

  const gridBlock =
    scheduleBlock.match(/<!-- weekday grid -->[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/section>)/)?.[0] ??
    '';

  const articles = [...gridBlock.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)].map((m) => m[0]);

  const cards: PromoCardData[] = [parseEveryDayCard(everyDayBlock)];

  WEEKDAY_IDS.forEach((id, index) => {
    const article = articles[index] ?? '';
    cards.push(parseWeekdayArticle(article, id));
  });

  return { cards };
}

function wrapPromoField(
  inner: string,
  cardId: PromoCardId,
  field: string,
  editorMode: boolean,
  attrs = ''
): string {
  if (!editorMode) return inner;
  return `<span class="fw-promo-editable" data-fw-card-id="${cardId}" data-fw-field="${field}"${attrs}>${inner}</span>`;
}

function renderListItems(
  items: string[],
  cardId: PromoCardId,
  segmentId: string,
  editorMode: boolean,
  listMargin: 'normal' | 'spaced' = 'normal'
): string {
  const ulMargin = listMargin === 'spaced' ? 'margin-bottom:16px;' : '';
  const deleteBtn = editorMode
    ? `<button type="button" class="fw-item-delete" data-fw-editor-action="delete" aria-label="Delete item"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>`
    : '';
  const lis = items
    .map((item, index) => {
      const label = wrapPromoField(
        escapeHtml(item),
        cardId,
        'listItem',
        editorMode,
        ` data-fw-segment-id="${segmentId}" data-fw-list-index="${index}"`
      );
      if (editorMode) {
        return `<li class="fw-item-name-row" style="display:flex;gap:12px;align-items:baseline;font-family:Montserrat,sans-serif;font-size:18px;color:var(--cream2);"><span style="color:var(--brick);font-size:16px;flex-shrink:0;">◆</span><span class="fw-item-name-main" style="min-width:0;flex:1 1 auto;">${label}</span>${deleteBtn}</li>`;
      }
      return `<li style="display:flex;gap:12px;align-items:baseline;font-family:Montserrat,sans-serif;font-size:18px;color:var(--cream2);"><span style="color:var(--brick);font-size:16px;">◆</span>${label}</li>`;
    })
    .join('\n            ');
  return `<ul style="list-style:none;display:grid;gap:10px;${ulMargin}">\n            ${lis}\n          </ul>`;
}

function renderSegment(seg: PromoSegment, cardId: PromoCardId, editorMode: boolean): string {
  switch (seg.kind) {
    case 'price':
      return `<div style="font-family:Montserrat,sans-serif;font-size:18px;color:var(--gold2);font-weight:600;margin-bottom:16px;">${wrapPromoField(escapeHtml(seg.text ?? ''), cardId, 'segmentText', editorMode, ` data-fw-segment-id="${seg.id}"`)}</div>`;
    case 'subhead': {
      const margin =
        seg.subheadMargin === 'spaced'
          ? 'margin:16px 0 12px;'
          : 'margin-bottom:12px;';
      return `<div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:16px;color:var(--muted);font-weight:600;${margin}">${wrapPromoField(escapeHtml(seg.text ?? ''), cardId, 'segmentText', editorMode, ` data-fw-segment-id="${seg.id}"`)}</div>`;
    }
    case 'text': {
      const margin = seg.textMargin === 'flush' ? '' : 'margin-bottom:16px;';
      return `<p style="font-family:Montserrat,sans-serif;font-size:18px;color:var(--cream2);${margin}">${wrapPromoField(textToHtml(seg.text ?? ''), cardId, 'segmentText', editorMode, ` data-fw-segment-id="${seg.id}"`)}</p>`;
    }
    case 'footer':
      return `<p style="font-family:Montserrat,sans-serif;font-style:normal;font-size:18px;color:var(--muted);margin-top:16px;">${wrapPromoField(escapeHtml(seg.text ?? ''), cardId, 'segmentText', editorMode, ` data-fw-segment-id="${seg.id}"`)}</p>`;
    case 'time':
      return `<p style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:16px;color:var(--gold2);font-weight:600;">${wrapPromoField(escapeHtml(seg.text ?? ''), cardId, 'segmentText', editorMode, ` data-fw-segment-id="${seg.id}"`)}</p>`;
    case 'list':
      return renderListItems(seg.items ?? [], cardId, seg.id, editorMode, seg.listMargin);
    default:
      return '';
  }
}

function weekdayArticleStyle(card: PromoCardData): string {
  const base = CARD_BG;
  const hasBadge = card.badge.trim().length > 0;

  if (!hasBadge) return base;

  const border =
    card.id === 'wednesday'
      ? 'border:1px solid rgba(230,219,198,.28);'
      : 'border:1px solid rgba(230,219,198,.22);';

  return `${base.replace('border:1px solid rgba(230,219,198,.22);', border)}position:relative;overflow:hidden;`;
}

function renderEveryDayCard(card: PromoCardData, editorMode: boolean): string {
  const editBar = editorMode ? promoEditBarHtml(card.id) : '';
  const cardAttrs = editorMode
    ? `class="fw-promo-card" data-fw-card="${card.id}"`
    : '';
  const outerMargin = editorMode ? '' : 'margin-bottom:26px;';
  const cardHtml = `<div ${cardAttrs} style="background:linear-gradient(100deg,rgba(162,58,44,.22),rgba(31,23,17,.6));border:1px solid rgba(230,219,198,.4);border-radius:4px;padding:32px 34px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:22px;${outerMargin}">
        <div>
          <div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.22em;font-size:16px;color:var(--gold2);font-weight:600;">${wrapPromoField(escapeHtml(card.day), card.id, 'day', editorMode)}</div>
          <h3 style="font-family:Oswald,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.03em;font-size:clamp(24px,2.8vw,32px);color:var(--cream);margin-top:8px;line-height:1.15;">${wrapPromoField(escapeHtml(card.title), card.id, 'title', editorMode)}</h3>
          <p style="font-family:Montserrat,sans-serif;font-size:18px;color:var(--gold2);font-weight:500;margin-top:12px;letter-spacing:.01em;">${wrapPromoField(escapeHtml(card.priceLine), card.id, 'priceLine', editorMode)}</p>
          <p style="font-family:Montserrat,sans-serif;font-size:18px;color:var(--cream2);margin-top:10px;">${wrapPromoField(textToHtml(card.description), card.id, 'description', editorMode)}</p>
        </div>
        <div style="font-family:Anton,sans-serif;text-transform:uppercase;color:var(--gold2);font-size:clamp(34px,4.4vw,56px);line-height:1;white-space:nowrap;">${wrapPromoField(escapeHtml(card.displayPrice), card.id, 'displayPrice', editorMode)}</div>
      </div>`;

  if (!editorMode) return cardHtml;
  return `<div class="fw-promo-card-wrap fw-promo-card-wrap--feature" style="margin-bottom:26px;">${cardHtml}${editBar}</div>`;
}

function renderWeekdayCard(card: PromoCardData, editorMode: boolean): string {
  const hasBadge = card.badge.trim().length > 0;
  const badgeHtml = hasBadge
    ? `<div style="position:absolute;top:0;right:0;background:var(--brick);color:var(--cream);font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.14em;font-size:10px;font-weight:600;padding:5px 12px;border-radius:0 0 0 4px;">${wrapPromoField(escapeHtml(card.badge), card.id, 'badge', editorMode)}</div>`
    : '';

  const articleStyle = weekdayArticleStyle(card);
  const segmentsHtml = card.segments.map((s) => renderSegment(s, card.id, editorMode)).join('\n          ');
  const editBar = editorMode ? promoEditBarHtml(card.id) : '';
  const articleAttrs = editorMode
    ? `class="fw-promo-card" data-fw-card="${card.id}"`
    : '';

  const articleHtml = `<article ${articleAttrs} style="${articleStyle}">
          ${badgeHtml}
          <div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.22em;font-size:16px;color:var(--gold2);font-weight:600;">${wrapPromoField(escapeHtml(card.day), card.id, 'day', editorMode)}</div>
          <h3 style="font-family:Oswald,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.03em;font-size:23px;color:var(--cream);margin-top:8px;">${wrapPromoField(escapeHtml(card.title), card.id, 'title', editorMode)}</h3>
          <div style="width:42px;height:2px;background:var(--brick);margin:14px 0 18px;"></div>
          ${segmentsHtml}
        </article>`;

  if (!editorMode) return articleHtml;
  return `<div class="fw-promo-card-wrap">${articleHtml}${editBar}</div>`;
}

function promoEditBarHtml(cardId: PromoCardId): string {
  const labels: Record<PromoCardId, string> = {
    'every-day': 'Edit Every Day',
    tuesday: 'Edit Tuesday',
    wednesday: 'Edit Wednesday',
    thursday: 'Edit Thursday',
    friday: 'Edit Friday',
    saturday: 'Edit Saturday',
    sunday: 'Edit Sunday',
  };
  const label = labels[cardId];
  return `<div class="fw-section-edit-bar fw-promo-edit-bar" data-section="${cardId}"><button type="button" class="fw-menu-edit-btn" data-fw-editor-action="edit">${label}</button><button type="button" class="fw-menu-save-btn fw-item-action--hidden" data-fw-editor-action="save">Save</button><button type="button" class="fw-menu-cancel-btn fw-item-action--hidden" data-fw-editor-action="cancel">Cancel</button></div>`;
}

export function applyPromoScheduleDataToHtml(
  html: string,
  data: PromoScheduleData,
  options: ApplyPromoOptions = {}
): string {
  const editorMode = options.editorMode ?? false;
  const everyDay = data.cards.find((c) => c.id === 'every-day');
  const weekdays = WEEKDAY_IDS.map((id) => data.cards.find((c) => c.id === id)).filter(
    (c): c is PromoCardData => Boolean(c)
  );

  const scheduleStart = html.indexOf('<!-- THE CLASS SCHEDULE -->');
  const scheduleEnd = html.indexOf('<!-- ALUMNI HOUR -->', scheduleStart);
  if (scheduleStart < 0 || scheduleEnd < 0) return html;

  let scheduleHtml = html.slice(scheduleStart, scheduleEnd);

  if (everyDay) {
    scheduleHtml = scheduleHtml.replace(
      /<!-- Every Day feature -->[\s\S]*?(?=<!-- weekday grid -->)/,
      `<!-- Every Day feature -->\n      ${renderEveryDayCard(everyDay, editorMode)}\n\n      `
    );
  }

  if (weekdays.length > 0) {
    let articleIndex = 0;
    scheduleHtml = scheduleHtml.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g, (article) => {
      const card = weekdays[articleIndex++];
      return card ? renderWeekdayCard(card, editorMode) : article;
    });
  }

  return html.slice(0, scheduleStart) + scheduleHtml + html.slice(scheduleEnd);
}

export function clonePromoScheduleData(data: PromoScheduleData): PromoScheduleData {
  return JSON.parse(JSON.stringify(data)) as PromoScheduleData;
}

export function mergePromoDataPreservingCards(
  incoming: PromoScheduleData,
  stored: PromoScheduleData
): PromoScheduleData {
  const next = clonePromoScheduleData(incoming);

  for (const id of PROMO_CARD_ORDER) {
    const inc = next.cards.find((c) => c.id === id);
    const st = stored.cards.find((c) => c.id === id);
    if (!inc && st) {
      next.cards.push(clonePromoScheduleData({ cards: [st] }).cards[0]);
    } else if (inc && st && isCardEmpty(inc)) {
      const idx = next.cards.findIndex((c) => c.id === id);
      if (idx >= 0) next.cards[idx] = clonePromoScheduleData({ cards: [st] }).cards[0];
    }
  }

  next.cards.sort(
    (a, b) => PROMO_CARD_ORDER.indexOf(a.id) - PROMO_CARD_ORDER.indexOf(b.id)
  );

  return next;
}

function isCardEmpty(card: PromoCardData): boolean {
  if (card.id === 'every-day') {
    return !card.title.trim() && !card.priceLine.trim();
  }
  return !card.title.trim() && card.segments.length === 0;
}

export function readPromoFieldsFromDom(cardEl: HTMLElement): EditablePromoField[] {
  const cardId = (cardEl.dataset.fwCard ?? 'every-day') as PromoCardId;
  const fields: EditablePromoField[] = [];

  cardEl.querySelectorAll<HTMLElement>('.fw-promo-editable').forEach((el) => {
    const field = el.dataset.fwField ?? '';
    const segmentId = el.dataset.fwSegmentId;
    const listIndex = el.dataset.fwListIndex ? Number(el.dataset.fwListIndex) : undefined;
    const value = el.innerHTML.includes('<br')
      ? stripTags(el.innerHTML.replace(/<br\s*\/?>/gi, '\n'))
      : el.textContent?.trim() ?? '';

    fields.push({ cardId, field, segmentId, listIndex, value });
  });

  return fields;
}

export function applyPromoFieldsToData(
  data: PromoScheduleData,
  cardId: PromoCardId,
  fields: EditablePromoField[]
): PromoScheduleData {
  const next = clonePromoScheduleData(data);
  const card = next.cards.find((c) => c.id === cardId);
  if (!card) return next;

  for (const f of fields) {
    if (f.field === 'day') card.day = f.value;
    else if (f.field === 'title') card.title = f.value;
    else if (f.field === 'badge') card.badge = f.value;
    else if (f.field === 'priceLine') card.priceLine = f.value;
    else if (f.field === 'description') card.description = f.value;
    else if (f.field === 'displayPrice') card.displayPrice = f.value;
    else if (f.field === 'segmentText' && f.segmentId) {
      const seg = card.segments.find((s) => s.id === f.segmentId);
      if (seg) seg.text = f.value;
    }
  }

  for (const seg of card.segments) {
    if (seg.kind !== 'list') continue;
    seg.items = fields
      .filter((f) => f.field === 'listItem' && f.segmentId === seg.id)
      .sort((a, b) => (a.listIndex ?? 0) - (b.listIndex ?? 0))
      .map((f) => f.value);
  }

  return next;
}

export function removePromoListItem(
  data: PromoScheduleData,
  cardId: PromoCardId,
  segmentId: string,
  listIndex: number
): PromoScheduleData {
  const next = clonePromoScheduleData(data);
  const card = next.cards.find((c) => c.id === cardId);
  const seg = card?.segments.find((s) => s.id === segmentId);
  if (seg?.items && listIndex >= 0 && listIndex < seg.items.length) {
    seg.items = seg.items.filter((_, index) => index !== listIndex);
  }
  return next;
}

export function getPromoCardOriginalFields(
  data: PromoScheduleData,
  cardId: PromoCardId
): EditablePromoField[] {
  const card = data.cards.find((c) => c.id === cardId);
  if (!card) return [];

  const fields: EditablePromoField[] = [
    { cardId, field: 'day', value: card.day },
    { cardId, field: 'title', value: card.title },
    { cardId, field: 'badge', value: card.badge },
    { cardId, field: 'priceLine', value: card.priceLine },
    { cardId, field: 'description', value: card.description },
    { cardId, field: 'displayPrice', value: card.displayPrice },
  ];

  for (const seg of card.segments) {
    if (seg.kind === 'list') {
      seg.items?.forEach((item, index) => {
        fields.push({
          cardId,
          field: 'listItem',
          segmentId: seg.id,
          listIndex: index,
          value: item,
        });
      });
    } else {
      fields.push({
        cardId,
        field: 'segmentText',
        segmentId: seg.id,
        value: seg.text ?? '',
      });
    }
  }

  return fields;
}

export function restorePromoCardInDom(cardEl: HTMLElement, fields: EditablePromoField[]) {
  for (const f of fields) {
    if (f.field === 'day') {
      const el = cardEl.querySelector<HTMLElement>('[data-fw-field="day"]');
      if (el) el.textContent = f.value;
    } else if (f.field === 'title') {
      const el = cardEl.querySelector<HTMLElement>('[data-fw-field="title"]');
      if (el) el.textContent = f.value;
    } else if (f.field === 'badge') {
      const el = cardEl.querySelector<HTMLElement>('[data-fw-field="badge"]');
      if (el) el.textContent = f.value;
    } else if (f.field === 'priceLine') {
      const el = cardEl.querySelector<HTMLElement>('[data-fw-field="priceLine"]');
      if (el) el.textContent = f.value;
    } else if (f.field === 'description') {
      const el = cardEl.querySelector<HTMLElement>('[data-fw-field="description"]');
      if (el) el.innerHTML = textToHtml(f.value);
    } else if (f.field === 'displayPrice') {
      const el = cardEl.querySelector<HTMLElement>('[data-fw-field="displayPrice"]');
      if (el) el.textContent = f.value;
    } else if (f.field === 'segmentText' && f.segmentId) {
      const el = cardEl.querySelector<HTMLElement>(
        `[data-fw-segment-id="${f.segmentId}"][data-fw-field="segmentText"]`
      );
      if (el) {
        const isMultiline = f.value.includes('\n');
        el.innerHTML = isMultiline ? textToHtml(f.value) : escapeHtml(f.value);
      }
    } else if (f.field === 'listItem' && f.segmentId && f.listIndex !== undefined) {
      const el = cardEl.querySelector<HTMLElement>(
        `[data-fw-segment-id="${f.segmentId}"][data-fw-list-index="${f.listIndex}"]`
      );
      if (el) el.textContent = f.value;
    }
  }
}
