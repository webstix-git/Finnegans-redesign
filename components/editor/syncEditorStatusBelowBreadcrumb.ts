export function syncEditorStatusBelowBreadcrumb(
  root: HTMLElement | null,
  status: string,
  isError: boolean,
  toolbar?: HTMLElement | null
): void {
  if (!root) return;

  const breadcrumb = root.querySelector('nav[aria-label="Breadcrumb"]');
  const anchor = toolbar ?? breadcrumb;
  let strip = root.querySelector<HTMLElement>('.fw-editor-status-strip');

  if (!status) {
    strip?.remove();
    return;
  }

  if (!strip) {
    strip = document.createElement('div');
    strip.className = 'fw-editor-status-strip';
    strip.setAttribute('role', 'status');
    strip.setAttribute('aria-live', 'polite');
    const inner = document.createElement('div');
    inner.className = 'fw-editor-status-strip__inner';
    strip.appendChild(inner);
  }

  strip.classList.toggle('fw-editor-status-strip--error', isError);
  const inner = strip.querySelector('.fw-editor-status-strip__inner');
  if (inner) inner.textContent = status;

  if (anchor) {
    anchor.insertAdjacentElement('afterend', strip);
  }
}

export function syncEditorToolbarBelowBreadcrumb(
  root: HTMLElement | null,
  toolbar: HTMLElement | null
): void {
  if (!root || !toolbar) return;

  const breadcrumb = root.querySelector('nav[aria-label="Breadcrumb"]');
  if (breadcrumb) {
    breadcrumb.insertAdjacentElement('afterend', toolbar);
  }
}

export function syncEditorChromeBelowBreadcrumb(
  root: HTMLElement | null,
  toolbar: HTMLElement | null,
  status: string,
  isError: boolean
): void {
  syncEditorToolbarBelowBreadcrumb(root, toolbar);
  syncEditorStatusBelowBreadcrumb(root, status, isError, toolbar);
}
