import {
  PROMO_CARD_ORDER,
  readPromoFieldsFromDom,
  restorePromoCardInDom,
  type EditablePromoField,
  type PromoCardId,
} from '@/lib/promotionItems';
import { confirmDeleteItem } from '@/components/editor/deleteConfirm';

export interface PromoEditorCallbacks {
  onSaveCard: (cardId: PromoCardId, fields: EditablePromoField[]) => Promise<void>;
  onDeleteListItem: (
    cardId: PromoCardId,
    segmentId: string,
    listIndex: number
  ) => Promise<void>;
  onCancelCard?: (cardId: PromoCardId) => void;
  onError?: (message: string) => void;
  getOriginalFields: (cardId: PromoCardId) => EditablePromoField[];
}

let activeCardId: PromoCardId | null = null;
let activeCardEl: HTMLElement | null = null;
let activeCardBar: HTMLElement | null = null;

let editorRoot: HTMLElement | null = null;
let editorCallbacks: PromoEditorCallbacks | null = null;

const CARD_LABELS: Record<PromoCardId, string> = {
  'every-day': 'Edit Every Day',
  tuesday: 'Edit Tuesday',
  wednesday: 'Edit Wednesday',
  thursday: 'Edit Thursday',
  friday: 'Edit Friday',
  saturday: 'Edit Saturday',
  sunday: 'Edit Sunday',
};

function getCardElement(root: HTMLElement, cardId: PromoCardId): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-fw-card="${cardId}"]`);
}

function getEditableFields(card: HTMLElement): HTMLElement[] {
  return [...card.querySelectorAll<HTMLElement>('.fw-promo-editable')];
}

function setSectionActionsVisible(bar: HTMLElement, visible: boolean) {
  bar.querySelector('.fw-menu-save-btn')?.classList.toggle('fw-item-action--hidden', !visible);
  bar.querySelector('.fw-menu-cancel-btn')?.classList.toggle('fw-item-action--hidden', !visible);
}

function setFieldEditable(el: HTMLElement, editing: boolean) {
  if (editing) {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    el.classList.add('fw-inline-field');
  } else {
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.classList.remove('fw-inline-field');
  }
}

function exitCardEditMode(card: HTMLElement, bar: HTMLElement) {
  card.classList.remove('fw-promo-editing');
  getEditableFields(card).forEach((el) => setFieldEditable(el, false));
  setSectionActionsVisible(bar, false);

  if (activeCardEl === card) {
    activeCardId = null;
    activeCardEl = null;
    activeCardBar = null;
  }
}

function enterCardEditMode(
  cardId: PromoCardId,
  card: HTMLElement,
  bar: HTMLElement,
  _callbacks: PromoEditorCallbacks
) {
  activeCardId = cardId;
  activeCardEl = card;
  activeCardBar = bar;

  card.classList.add('fw-promo-editing');
  getEditableFields(card).forEach((el) => setFieldEditable(el, true));
  setSectionActionsVisible(bar, true);

  getEditableFields(card)[0]?.focus();
}

function resolveCardContext(actionBtn: HTMLElement): {
  cardId: PromoCardId;
  card: HTMLElement;
  bar: HTMLElement;
} | null {
  const bar = actionBtn.closest<HTMLElement>('.fw-section-edit-bar');
  if (!bar?.dataset.section || !editorRoot) return null;

  const cardId = bar.dataset.section as PromoCardId;
  const card = getCardElement(editorRoot, cardId);
  if (!card) return null;

  const liveBar =
    bar.isConnected && bar.dataset.section === cardId
      ? bar
      : (editorRoot.querySelector<HTMLElement>(
          `.fw-section-edit-bar[data-section="${cardId}"]`
        ) ?? bar);

  return { cardId, card, bar: liveBar };
}

async function handleSaveClick(
  cardId: PromoCardId,
  card: HTMLElement,
  saveBtn: HTMLButtonElement
) {
  const callbacks = editorCallbacks;
  if (!callbacks) return;

  const fields = readPromoFieldsFromDom(card);
  saveBtn.disabled = true;
  const prevLabel = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';

  try {
    await callbacks.onSaveCard(cardId, fields);
    resetPromoEditorState();
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err.message : 'Save failed');
    const live = editorRoot
      ?.querySelector<HTMLElement>(`[data-fw-card="${cardId}"]`)
      ?.closest('#schedule')
      ?.querySelector<HTMLButtonElement>(
        `.fw-section-edit-bar[data-section="${cardId}"] [data-fw-editor-action="save"]`
      );
    if (live) {
      live.disabled = false;
      live.textContent = 'Save';
    }
  } finally {
    if (saveBtn.isConnected) {
      saveBtn.disabled = false;
      saveBtn.textContent = prevLabel === 'Saving…' ? 'Save' : prevLabel;
    }
  }
}

async function handleDeleteClick(deleteBtn: HTMLButtonElement) {
  const callbacks = editorCallbacks;
  if (!callbacks || !activeCardId) return;

  const field = deleteBtn
    .closest('li')
    ?.querySelector<HTMLElement>('.fw-promo-editable[data-fw-field="listItem"]');
  const segmentId = field?.dataset.fwSegmentId;
  const listIndex = field?.dataset.fwListIndex;
  if (!segmentId || listIndex === undefined) return;

  const confirmed = await confirmDeleteItem();
  if (!confirmed) return;

  try {
    await callbacks.onDeleteListItem(activeCardId, segmentId, Number(listIndex));
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err.message : 'Delete failed');
  }
}

function handleEditorClick(event: Event) {
  const callbacks = editorCallbacks;
  if (!callbacks || !editorRoot) return;

  const actionBtn = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '#schedule [data-fw-editor-action]'
  );
  if (!actionBtn || actionBtn.disabled) return;

  const action = actionBtn.dataset.fwEditorAction;

  if (action === 'delete') {
    if (!actionBtn.closest('.fw-promo-editing')) return;
    event.preventDefault();
    event.stopPropagation();
    void handleDeleteClick(actionBtn);
    return;
  }

  const ctx = resolveCardContext(actionBtn);
  if (!ctx) return;

  const { cardId, card, bar } = ctx;

  event.preventDefault();
  event.stopPropagation();

  if (action === 'edit') {
    if (activeCardId && activeCardId !== cardId) {
      if (callbacks.onCancelCard) {
        const prevId = activeCardId;
        const nextId = cardId;
        resetPromoEditorState();
        callbacks.onCancelCard(prevId);
        window.queueMicrotask(() => enterPromoCardEditModeById(nextId));
        return;
      }
      if (activeCardEl && activeCardBar) {
        restorePromoCardInDom(activeCardEl, callbacks.getOriginalFields(activeCardId));
        exitCardEditMode(activeCardEl, activeCardBar);
      }
    }
    enterCardEditMode(cardId, card, bar, callbacks);
    return;
  }

  if (action === 'cancel') {
    if (callbacks.onCancelCard) {
      resetPromoEditorState();
      callbacks.onCancelCard(cardId);
      return;
    }
    restorePromoCardInDom(card, callbacks.getOriginalFields(cardId));
    exitCardEditMode(card, bar);
    return;
  }

  if (action === 'save') {
    void handleSaveClick(cardId, card, actionBtn);
  }
}

function ensureSectionBars(root: HTMLElement) {
  for (const cardId of PROMO_CARD_ORDER) {
    const card = getCardElement(root, cardId);
    if (!card) continue;
    if (root.querySelector(`.fw-section-edit-bar[data-section="${cardId}"]`)) continue;

    let wrap = card.parentElement?.classList.contains('fw-promo-card-wrap')
      ? card.parentElement
      : null;

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'fw-promo-card-wrap';
      if (cardId === 'every-day') wrap.classList.add('fw-promo-card-wrap--feature');
      card.replaceWith(wrap);
      wrap.appendChild(card);
    }

    const bar = document.createElement('div');
    bar.className = 'fw-section-edit-bar fw-promo-edit-bar';
    bar.dataset.section = cardId;
    bar.innerHTML = `<button type="button" class="fw-menu-edit-btn" data-fw-editor-action="edit">${CARD_LABELS[cardId]}</button><button type="button" class="fw-menu-save-btn fw-item-action--hidden" data-fw-editor-action="save">Save</button><button type="button" class="fw-menu-cancel-btn fw-item-action--hidden" data-fw-editor-action="cancel">Cancel</button>`;
    wrap.appendChild(bar);
  }
}

function ensureDelegation(root: HTMLElement) {
  if (editorRoot === root) return;
  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = root;
  root.addEventListener('click', handleEditorClick);
}

export function attachPromoEditors(root: HTMLElement, callbacks: PromoEditorCallbacks) {
  editorCallbacks = callbacks;
  ensureDelegation(root);
  ensureSectionBars(root);
  root.dataset.fwPromoEditorRoot = '1';
  activeCardId = null;
  activeCardEl = null;
  activeCardBar = null;
}

export function getActivePromoCardId(): PromoCardId | null {
  return activeCardId;
}

export function enterPromoCardEditModeById(cardId: PromoCardId) {
  const callbacks = editorCallbacks;
  if (!callbacks || !editorRoot) return;

  const card = getCardElement(editorRoot, cardId);
  const bar = editorRoot.querySelector<HTMLElement>(
    `.fw-section-edit-bar[data-section="${cardId}"]`
  );
  if (!card || !bar) return;

  enterCardEditMode(cardId, card, bar, callbacks);
}

export function resetPromoEditorState() {
  activeCardId = null;
  activeCardEl = null;
  activeCardBar = null;
}

export function detachPromoEditors() {
  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = null;
  editorCallbacks = null;
  resetPromoEditorState();
}
