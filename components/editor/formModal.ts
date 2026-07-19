export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea';
  value: string;
  placeholder?: string;
}

export interface FormModalResult {
  action: 'save' | 'cancel' | 'delete';
  values?: Record<string, string>;
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function fieldHtml(field: FormField): string {
  const placeholder = field.placeholder ? ` placeholder="${escapeAttr(field.placeholder)}"` : '';
  if (field.type === 'textarea') {
    const body = field.value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<div class="fw-modal-field">
      <label for="fw-field-${field.name}">${field.label}</label>
      <textarea id="fw-field-${field.name}" name="${field.name}" rows="4"${placeholder}>${body}</textarea>
    </div>`;
  }
  const value = escapeAttr(field.value);
  return `<div class="fw-modal-field">
    <label for="fw-field-${field.name}">${field.label}</label>
    <input id="fw-field-${field.name}" name="${field.name}" type="text" value="${value}"${placeholder} />
  </div>`;
}

export function showFormModal(options: {
  title: string;
  subtitle?: string;
  fields: FormField[];
  wide?: boolean;
  allowDelete?: boolean;
  deleteLabel?: string;
}): Promise<FormModalResult> {
  return new Promise((resolve) => {
    const existing = document.querySelector('.fw-form-modal-overlay');
    existing?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'fw-modal-overlay fw-form-modal-overlay';
    const modalClass = options.wide ? 'fw-modal fw-modal--wide' : 'fw-modal';
    const fieldsHtml = options.fields.map(fieldHtml).join('');
    const deleteBtn = options.allowDelete
      ? `<button type="button" class="fw-modal-btn fw-modal-btn--danger fw-modal-btn--delete" data-fw-modal="delete">${options.deleteLabel ?? 'Delete'}</button>`
      : '';

    overlay.innerHTML = `
      <div class="${modalClass}" role="dialog" aria-modal="true" aria-labelledby="fw-form-modal-title">
        <div class="fw-modal-header">
          <h2 id="fw-form-modal-title">${options.title}</h2>
          ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
        </div>
        <form class="fw-modal-body fw-modal-body--scroll" data-fw-form-modal>
          ${fieldsHtml}
        </form>
        <div class="fw-modal-footer fw-modal-footer--split">
          ${deleteBtn}
          <div class="fw-modal-footer-actions">
            <button type="button" class="fw-modal-btn fw-modal-btn--cancel" data-fw-modal="cancel">Cancel</button>
            <button type="submit" class="fw-modal-btn fw-modal-btn--save" data-fw-modal="save" form="fw-form-modal-form">Save</button>
          </div>
        </div>
      </div>
    `;

    const form = overlay.querySelector<HTMLFormElement>('[data-fw-form-modal]');
    if (form) {
      form.id = 'fw-form-modal-form';
    }

    const finish = (result: FormModalResult) => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(result);
    };

    const readValues = (): Record<string, string> => {
      const values: Record<string, string> = {};
      for (const field of options.fields) {
        const el = overlay.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${field.name}"]`
        );
        values[field.name] = el?.value ?? '';
      }
      return values;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish({ action: 'cancel' });
    };

    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target === overlay) {
        finish({ action: 'cancel' });
        return;
      }

      const btn = target.closest<HTMLButtonElement>('[data-fw-modal]');
      if (!btn) return;

      const action = btn.dataset.fwModal;
      if (action === 'cancel') {
        finish({ action: 'cancel' });
        return;
      }
      if (action === 'delete') {
        finish({ action: 'delete' });
        return;
      }
      if (action === 'save') {
        e.preventDefault();
        finish({ action: 'save', values: readValues() });
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      finish({ action: 'save', values: readValues() });
    });

    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    const firstInput = overlay.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea'
    );
    firstInput?.focus();
    if (firstInput && 'select' in firstInput) {
      firstInput.select();
    }
  });
}
