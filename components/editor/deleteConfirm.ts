export const TRASH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

export const DELETE_CONFIRM_MESSAGE =
  'Are you sure you want to delete this item? This action cannot be undone.';

export function deleteItemButtonHtml(attrs = ''): string {
  return `<button type="button" class="fw-item-delete" data-fw-editor-action="delete" aria-label="Delete item"${attrs ? ` ${attrs}` : ''}>${TRASH_ICON_SVG}</button>`;
}

export function confirmDeleteItem(): Promise<boolean> {
  return new Promise((resolve) => {
    const existing = document.querySelector('.fw-delete-confirm-overlay');
    existing?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'fw-modal-overlay fw-delete-confirm-overlay';
    overlay.innerHTML = `
      <div class="fw-modal" role="dialog" aria-modal="true" aria-labelledby="fw-delete-confirm-title">
        <div class="fw-modal-header">
          <h2 id="fw-delete-confirm-title">Delete item</h2>
          <p>This cannot be undone.</p>
        </div>
        <div class="fw-modal-body">
          <p class="fw-delete-confirm-message">${DELETE_CONFIRM_MESSAGE}</p>
        </div>
        <div class="fw-modal-footer">
          <button type="button" class="fw-modal-btn fw-modal-btn--cancel" data-fw-confirm="cancel">Cancel</button>
          <button type="button" class="fw-modal-btn fw-modal-btn--danger" data-fw-confirm="ok">Delete</button>
        </div>
      </div>
    `;

    const finish = (ok: boolean) => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(ok);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
    };

    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target === overlay) {
        finish(false);
        return;
      }
      const btn = target.closest<HTMLButtonElement>('[data-fw-confirm]');
      if (!btn) return;
      finish(btn.dataset.fwConfirm === 'ok');
    });

    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-fw-confirm="cancel"]')?.focus();
  });
}
