import {
  createEmptyEditableItem,
  type EditableMenuItem,
  type MenuCategory,
} from '@/lib/menuItems';
import { confirmDeleteItem } from '@/components/editor/deleteConfirm';
import { showMenuItemModal } from '@/components/menu-editor/menuItemModal';

export interface PopupMenuEditorCallbacks {
  onSaveItem: (item: EditableMenuItem) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onError?: (message: string) => void;
  getOriginal: (id: string) => EditableMenuItem | null;
}

const ADD_TARGETS: {
  category: MenuCategory;
  label: string;
  anchor: string;
}[] = [
  {
    category: 'apps',
    label: '+ Add Appetizer',
    anchor: '#apps div[style*="margin-top:32px"][style*="display:grid"]',
  },
  {
    category: 'salad',
    label: '+ Add Salad Option',
    anchor: '#salads div[style*="margin-top:26px"][style*="display:grid"]',
  },
  {
    category: 'mains',
    label: '+ Add Main',
    anchor: '#mains div[style*="margin-top:32px"][style*="display:grid"]',
  },
];

let editorRoot: HTMLElement | null = null;
let editorCallbacks: PopupMenuEditorCallbacks | null = null;

function ensureItemEditButtons(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.fw-menu-editable').forEach((wrapper) => {
    if (wrapper.querySelector('.fw-item-edit-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fw-item-edit-btn';
    btn.dataset.fwEditorAction = 'edit-item';
    btn.textContent = 'Edit';
    btn.setAttribute('aria-label', 'Edit menu item');
    wrapper.appendChild(btn);
  });
}

function ensureAddButtons(root: HTMLElement) {
  root.querySelectorAll('.fw-menu-add-bar').forEach((el) => el.remove());

  for (const target of ADD_TARGETS) {
    const anchor = root.querySelector<HTMLElement>(target.anchor);
    if (!anchor) continue;

    const bar = document.createElement('div');
    bar.className = 'fw-section-edit-bar fw-menu-add-bar';
    bar.dataset.fwAddCategory = target.category;
    bar.innerHTML = `<button type="button" class="fw-menu-add-btn" data-fw-editor-action="add-item">${target.label}</button>`;
    anchor.insertAdjacentElement('afterend', bar);
  }

  root.querySelectorAll<HTMLElement>('#drafts ul').forEach((ul, index) => {
    if (ul.nextElementSibling?.classList.contains('fw-menu-add-bar')) return;

    const bar = document.createElement('div');
    bar.className = 'fw-section-edit-bar fw-menu-add-bar fw-menu-add-bar--draft';
    bar.dataset.fwAddCategory = 'drafts';
    bar.dataset.fwBoard = String(index);
    bar.innerHTML = `<button type="button" class="fw-menu-add-btn" data-fw-editor-action="add-item">+ Add Beer</button>`;
    ul.insertAdjacentElement('afterend', bar);
  });
}

async function handleEditItem(wrapper: HTMLElement) {
  const callbacks = editorCallbacks;
  if (!callbacks) return;

  const id = wrapper.dataset.fwItemId ?? '';
  const original = callbacks.getOriginal(id);
  if (!original) return;

  const result = await showMenuItemModal({ ...original });

  if (result.action === 'save' && result.item) {
    try {
      await callbacks.onSaveItem(result.item);
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err.message : 'Save failed');
    }
    return;
  }

  if (result.action === 'delete') {
    const confirmed = await confirmDeleteItem();
    if (!confirmed) return;
    try {
      await callbacks.onDeleteItem(id);
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err.message : 'Delete failed');
    }
  }
}

async function handleAddItem(bar: HTMLElement) {
  const callbacks = editorCallbacks;
  if (!callbacks) return;

  const category = bar.dataset.fwAddCategory as MenuCategory | undefined;
  if (!category) return;

  const boardIndex =
    category === 'drafts' ? (Number(bar.dataset.fwBoard) as 0 | 1) : undefined;
  const empty = createEmptyEditableItem(category, boardIndex);
  const result = await showMenuItemModal(empty, { isNew: true });

  if (result.action === 'save' && result.item) {
    if (!result.item.name.trim()) {
      callbacks.onError?.('Item name is required');
      return;
    }
    try {
      await callbacks.onSaveItem(result.item);
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err.message : 'Save failed');
    }
  }
}

function handleEditorClick(event: Event) {
  const target = event.target as HTMLElement;

  const addBtn = target.closest<HTMLButtonElement>('[data-fw-editor-action="add-item"]');
  if (addBtn && !addBtn.disabled) {
    const bar = addBtn.closest<HTMLElement>('.fw-menu-add-bar');
    if (bar) {
      event.preventDefault();
      event.stopPropagation();
      void handleAddItem(bar);
    }
    return;
  }

  const actionBtn = target.closest<HTMLButtonElement>('[data-fw-editor-action="edit-item"]');
  if (!actionBtn || actionBtn.disabled) return;

  const wrapper = actionBtn.closest<HTMLElement>('.fw-menu-editable');
  if (!wrapper) return;

  event.preventDefault();
  event.stopPropagation();
  void handleEditItem(wrapper);
}

function ensureDelegation(root: HTMLElement) {
  if (editorRoot === root) return;
  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = root;
  root.addEventListener('click', handleEditorClick);
}

export function attachInlineEditors(root: HTMLElement, callbacks: PopupMenuEditorCallbacks) {
  editorCallbacks = callbacks;
  ensureDelegation(root);
  ensureItemEditButtons(root);
  ensureAddButtons(root);
  root.dataset.fwEditorRoot = '1';
}

/** @deprecated Popup editor has no active section state. */
export function enterSectionEditModeById(_sectionId: string) {}

/** @deprecated Popup editor has no active section state. */
export function getActiveSectionId(): null {
  return null;
}

/** @deprecated Popup editor has no active section state. */
export function resetInlineEditorState() {}

export function detachInlineEditors() {
  editorRoot?.removeEventListener('click', handleEditorClick);
  editorRoot = null;
  editorCallbacks = null;
}
