import type { EditablePromoField, PromoCardId } from '@/lib/promotionItems';
import { showPromoCardModal } from '@/components/promotions-editor/promoCardModal';

export interface PromoEditorCallbacks {
  onSaveCard: (cardId: PromoCardId, fields: EditablePromoField[]) => Promise<void>;
  onError?: (message: string) => void;
  getOriginalFields: (cardId: PromoCardId) => EditablePromoField[];
}

let editorRoot: HTMLElement | null = null;
let editorCallbacks: PromoEditorCallbacks | null = null;

function getCardElement(root: HTMLElement, cardId: PromoCardId): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-fw-card="${cardId}"]`);
}

function resolveCardContext(actionBtn: HTMLElement): PromoCardId | null {
  const bar = actionBtn.closest<HTMLElement>('.fw-section-edit-bar');
  return (bar?.dataset.section as PromoCardId | undefined) ?? null;
}

async function handleEditClick(cardId: PromoCardId) {
  const callbacks = editorCallbacks;
  if (!callbacks) return;

  const originalFields = callbacks.getOriginalFields(cardId);
  const result = await showPromoCardModal(cardId, originalFields);

  if (result.action === 'save' && result.fields) {
    try {
      await callbacks.onSaveCard(cardId, result.fields);
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err.message : 'Save failed');
    }
  }
}

function handleEditorClick(event: Event) {
  const callbacks = editorCallbacks;
  if (!callbacks || !editorRoot) return;

  const actionBtn = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '#schedule [data-fw-editor-action="edit"]'
  );
  if (!actionBtn || actionBtn.disabled) return;

  const cardId = resolveCardContext(actionBtn);
  if (!cardId || !getCardElement(editorRoot, cardId)) return;

  event.preventDefault();
  event.stopPropagation();
  void handleEditClick(cardId);
}

function ensureSectionBars(root: HTMLElement) {
  // Edit bars are rendered in HTML via promotionItems editor mode.
  void root;
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
}

/** @deprecated Popup editor has no active card state. */
export function getActivePromoCardId(): PromoCardId | null {
  return null;
}

/** @deprecated Popup editor has no active card state. */
export function enterPromoCardEditModeById(_cardId: PromoCardId) {}

/** @deprecated Popup editor has no active card state. */
export function resetPromoEditorState() {}

export function detachPromoEditors() {
  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = null;
  editorCallbacks = null;
}
