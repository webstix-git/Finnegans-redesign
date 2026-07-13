import type { EditableMenuItem } from '@/lib/menuItems';
import { confirmDeleteItem } from '@/components/editor/deleteConfirm';

type SectionId = 'apps' | 'salads' | 'mains' | 'drafts';

const SECTIONS: {
  id: SectionId;
  label: string;
  anchorSelector: string;
}[] = [
  { id: 'apps', label: 'Edit Apps', anchorSelector: 'div[style*="margin-top:32px"][style*="display:grid"]' },
  { id: 'salads', label: 'Edit Salad', anchorSelector: 'div[style*="margin-top:26px"][style*="display:grid"]' },
  { id: 'mains', label: 'Edit Mains', anchorSelector: 'div[style*="margin-top:32px"][style*="display:grid"]' },
  { id: 'drafts', label: 'Edit Draft List', anchorSelector: 'div[style*="grid-template-columns:repeat(auto-fit"]' },
];

function fieldText(el: HTMLElement | null): string {
  return el?.textContent?.trim() ?? '';
}

function showBadge(el: HTMLElement | null) {
  if (!el) return;
  el.style.removeProperty('display');
}

function getEditableFields(wrapper: HTMLElement): HTMLElement[] {
  const fields = [...wrapper.querySelectorAll<HTMLElement>('[data-fw-field]')];
  if (wrapper.dataset.fwField) fields.unshift(wrapper);
  return fields;
}

function readField(wrapper: HTMLElement, field: string): string {
  const el =
    wrapper.dataset.fwField === field
      ? wrapper
      : wrapper.querySelector<HTMLElement>(`[data-fw-field="${field}"]`);
  return fieldText(el);
}

export function readItemFromDom(wrapper: HTMLElement): EditableMenuItem {
  const id = wrapper.dataset.fwItemId ?? '';
  const category = (wrapper.dataset.fwCategory ?? 'apps') as EditableMenuItem['category'];
  const boardIndex = wrapper.dataset.fwBoard
    ? (Number(wrapper.dataset.fwBoard) as 0 | 1)
    : undefined;
  const isSaladDescription = wrapper.querySelector('[data-fw-salad-desc="1"]') !== null;
  const isDraftFooter = id.startsWith('draft-footer-');

  return {
    id,
    name: readField(wrapper, 'name'),
    description: readField(wrapper, 'description'),
    price: readField(wrapper, 'price'),
    badge: readField(wrapper, 'badge'),
    category,
    boardIndex,
    isSaladDescription,
    isDraftFooter,
  };
}

function setFieldEditable(wrapper: HTMLElement, editing: boolean) {
  getEditableFields(wrapper).forEach((field) => {
    if (editing) {
      field.setAttribute('contenteditable', 'true');
      field.setAttribute('spellcheck', 'false');
      field.classList.add('fw-inline-field');
    } else {
      field.removeAttribute('contenteditable');
      field.removeAttribute('spellcheck');
      field.classList.remove('fw-inline-field');
    }
  });

  const badge = wrapper.querySelector<HTMLElement>('[data-fw-field="badge"]');
  if (badge && editing) {
    showBadge(badge);
  }
}

export interface InlineEditorCallbacks {
  onSaveSection: (sectionId: SectionId, items: EditableMenuItem[]) => Promise<void>;
  onDeleteItem: (itemId: string, sectionId: SectionId) => Promise<void>;
  onCancelSection?: (sectionId: SectionId) => void;
  onError?: (message: string) => void;
  getOriginal: (id: string) => EditableMenuItem | null;
}

let activeSectionId: SectionId | null = null;
let activeSectionEl: HTMLElement | null = null;
let activeSectionBar: HTMLElement | null = null;

let editorRoot: HTMLElement | null = null;
let editorCallbacks: InlineEditorCallbacks | null = null;

function getSectionItems(section: HTMLElement): HTMLElement[] {
  return [...section.querySelectorAll<HTMLElement>('.fw-menu-editable')];
}

function setSectionActionsVisible(bar: HTMLElement, visible: boolean) {
  bar.querySelector('.fw-menu-save-btn')?.classList.toggle('fw-item-action--hidden', !visible);
  bar.querySelector('.fw-menu-cancel-btn')?.classList.toggle('fw-item-action--hidden', !visible);
}

function restoreOriginal(wrapper: HTMLElement, original: EditableMenuItem) {
  const setField = (field: string, value: string) => {
    const el =
      wrapper.dataset.fwField === field
        ? wrapper
        : wrapper.querySelector<HTMLElement>(`[data-fw-field="${field}"]`);
    if (el) el.textContent = value;
  };

  if (original.isSaladDescription || original.isDraftFooter) {
    setField('description', original.description);
    return;
  }

  setField('name', original.name);
  setField('description', original.description);
  setField('price', original.price);
  setField('badge', original.badge);
}

function exitSectionEditMode(section: HTMLElement, bar: HTMLElement) {
  section.classList.remove('fw-section-editing');
  getSectionItems(section).forEach((wrapper) => {
    wrapper.classList.remove('fw-item-editing');
    setFieldEditable(wrapper, false);
  });
  setSectionActionsVisible(bar, false);

  if (activeSectionEl === section) {
    activeSectionId = null;
    activeSectionEl = null;
    activeSectionBar = null;
  }
}

function restoreSection(section: HTMLElement, callbacks: InlineEditorCallbacks) {
  getSectionItems(section).forEach((wrapper) => {
    const id = wrapper.dataset.fwItemId ?? '';
    const original = callbacks.getOriginal(id);
    if (original) restoreOriginal(wrapper, original);
  });
}

function enterSectionEditMode(
  sectionId: SectionId,
  section: HTMLElement,
  bar: HTMLElement,
  _callbacks: InlineEditorCallbacks
) {
  activeSectionId = sectionId;
  activeSectionEl = section;
  activeSectionBar = bar;

  section.classList.add('fw-section-editing');
  getSectionItems(section).forEach((wrapper) => {
    wrapper.classList.add('fw-item-editing');
    setFieldEditable(wrapper, true);
  });
  setSectionActionsVisible(bar, true);

  const firstField =
    getSectionItems(section)
      .flatMap((wrapper) => getEditableFields(wrapper))
      .find(Boolean) ?? section.querySelector<HTMLElement>('[data-fw-field]');
  firstField?.focus();
}

export function enterSectionEditModeById(sectionId: SectionId) {
  const callbacks = editorCallbacks;
  if (!callbacks || !editorRoot) return;

  const section = editorRoot.querySelector<HTMLElement>(`#${sectionId}`);
  const bar = section?.querySelector<HTMLElement>(
    `.fw-section-edit-bar[data-section="${sectionId}"]`
  );
  if (!section || !bar) return;

  enterSectionEditMode(sectionId, section, bar, callbacks);
}

export function reenterActiveSectionEditMode() {
  if (!activeSectionId) return;
  enterSectionEditModeById(activeSectionId);
}

function resolveSectionContext(actionBtn: HTMLElement): {
  sectionId: SectionId;
  section: HTMLElement;
  bar: HTMLElement;
} | null {
  const bar = actionBtn.closest<HTMLElement>('.fw-section-edit-bar');
  if (!bar?.dataset.section || !editorRoot) return null;

  const sectionId = bar.dataset.section as SectionId;
  const section = editorRoot.querySelector<HTMLElement>(`#${sectionId}`);
  if (!section) return null;

  const liveBar =
    section.querySelector<HTMLElement>(`.fw-section-edit-bar[data-section="${sectionId}"]`) ?? bar;

  return { sectionId, section, bar: liveBar };
}

async function handleSaveClick(
  sectionId: SectionId,
  section: HTMLElement,
  bar: HTMLElement,
  saveBtn: HTMLButtonElement
) {
  const callbacks = editorCallbacks;
  if (!callbacks) return;

  const items = getSectionItems(section).map(readItemFromDom);
  saveBtn.disabled = true;
  const prevLabel = saveBtn.textContent;
  saveBtn.textContent = 'Saving…';

  try {
    await callbacks.onSaveSection(sectionId, items);
    resetInlineEditorState();
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err.message : 'Save failed');
    const live = editorRoot
      ?.querySelector<HTMLElement>(`#${sectionId}`)
      ?.querySelector<HTMLButtonElement>('[data-fw-editor-action="save"]');
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
  if (!callbacks || !editorRoot || !activeSectionId) return;

  const wrapper = deleteBtn.closest<HTMLElement>('.fw-menu-editable');
  const itemId = wrapper?.dataset.fwItemId;
  if (!itemId || wrapper?.querySelector('[data-fw-salad-desc="1"]') || itemId.startsWith('draft-footer-')) {
    return;
  }

  const confirmed = await confirmDeleteItem();
  if (!confirmed) return;

  try {
    await callbacks.onDeleteItem(itemId, activeSectionId);
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err.message : 'Delete failed');
  }
}

function handleEditorClick(event: Event) {
  const callbacks = editorCallbacks;
  if (!callbacks || !editorRoot) return;

  const actionBtn = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '[data-fw-editor-action]'
  );
  if (!actionBtn || actionBtn.disabled) return;

  const action = actionBtn.dataset.fwEditorAction;

  if (action === 'delete') {
    if (!actionBtn.closest('.fw-section-editing')) return;
    event.preventDefault();
    event.stopPropagation();
    void handleDeleteClick(actionBtn);
    return;
  }

  const ctx = resolveSectionContext(actionBtn);
  if (!ctx) return;

  const { sectionId, section, bar } = ctx;

  event.preventDefault();
  event.stopPropagation();

  if (action === 'edit') {
    if (activeSectionId && activeSectionId !== sectionId) {
      if (callbacks.onCancelSection) {
        const prevId = activeSectionId;
        const nextId = sectionId;
        resetInlineEditorState();
        callbacks.onCancelSection(prevId);
        window.queueMicrotask(() => enterSectionEditModeById(nextId));
        return;
      }
      restoreSection(activeSectionEl!, callbacks);
      exitSectionEditMode(activeSectionEl!, activeSectionBar!);
    }
    enterSectionEditMode(sectionId, section, bar, callbacks);
    return;
  }

  if (action === 'cancel') {
    if (callbacks.onCancelSection) {
      const id = sectionId;
      resetInlineEditorState();
      callbacks.onCancelSection(id);
      return;
    }
    restoreSection(section, callbacks);
    exitSectionEditMode(section, bar);
    return;
  }

  if (action === 'save') {
    void handleSaveClick(sectionId, section, bar, actionBtn);
  }
}

function ensureSectionBars(root: HTMLElement) {
  root.querySelectorAll('.fw-item-controls').forEach((el) => el.remove());

  for (const { id, label, anchorSelector } of SECTIONS) {
    const section = root.querySelector<HTMLElement>(`#${id}`);
    if (!section) continue;

    if (section.querySelector(`.fw-section-edit-bar[data-section="${id}"]`)) continue;

    const anchor = section.querySelector(anchorSelector);
    if (!anchor) continue;

    const bar = document.createElement('div');
    bar.className = 'fw-section-edit-bar';
    bar.dataset.section = id;
    bar.innerHTML = `<button type="button" class="fw-menu-edit-btn" data-fw-editor-action="edit">${label}</button><button type="button" class="fw-menu-save-btn fw-item-action--hidden" data-fw-editor-action="save">Save</button><button type="button" class="fw-menu-cancel-btn fw-item-action--hidden" data-fw-editor-action="cancel">Cancel</button>`;
    anchor.insertAdjacentElement('afterend', bar);
  }
}

function ensureDelegation(root: HTMLElement) {
  if (editorRoot === root) return;

  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = root;
  root.addEventListener('click', handleEditorClick);
}

export function attachInlineEditors(root: HTMLElement, callbacks: InlineEditorCallbacks) {
  editorCallbacks = callbacks;
  ensureDelegation(root);
  ensureSectionBars(root);

  root.dataset.fwEditorRoot = '1';
  activeSectionId = null;
  activeSectionEl = null;
  activeSectionBar = null;
}

export function getActiveSectionId(): SectionId | null {
  return activeSectionId;
}

export function resetInlineEditorState() {
  activeSectionId = null;
  activeSectionEl = null;
  activeSectionBar = null;
}

export function detachInlineEditors() {
  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = null;
  editorCallbacks = null;
  resetInlineEditorState();
}
