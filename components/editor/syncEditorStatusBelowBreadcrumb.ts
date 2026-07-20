let toolbarStickCleanup: (() => void) | null = null;

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

/**
 * Places the toolbar after the breadcrumb and keeps it stuck under the fixed
 * site header while scrolling. Uses position:fixed (not sticky) so it still
 * works when page roots use overflow-x:hidden.
 */
export function syncEditorToolbarBelowBreadcrumb(
  root: HTMLElement | null,
  toolbar: HTMLElement | null
): void {
  if (!root || !toolbar) return;

  const breadcrumb = root.querySelector('nav[aria-label="Breadcrumb"]');
  if (!breadcrumb) return;

  let sentinel = root.querySelector<HTMLElement>('.fw-editor-toolbar-sentinel');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.className = 'fw-editor-toolbar-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
  }

  breadcrumb.insertAdjacentElement('afterend', sentinel);
  sentinel.insertAdjacentElement('afterend', toolbar);

  toolbarStickCleanup?.();

  const update = () => {
    const header = document.getElementById('fw-header');
    const headerBottom = header ? Math.round(header.getBoundingClientRect().bottom) : 0;
    const sentinelTop = sentinel.getBoundingClientRect().top;
    const toolbarHeight = toolbar.offsetHeight;

    if (sentinelTop <= headerBottom) {
      toolbar.classList.add('fw-editor-toolbar-bar--stuck');
      toolbar.style.top = `${headerBottom}px`;
      sentinel.style.height = `${toolbarHeight}px`;
    } else {
      toolbar.classList.remove('fw-editor-toolbar-bar--stuck');
      toolbar.style.top = '';
      sentinel.style.height = '0px';
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  toolbarStickCleanup = () => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
    toolbar.classList.remove('fw-editor-toolbar-bar--stuck');
    toolbar.style.top = '';
    sentinel.style.height = '0px';
  };
}

/** Marks the page root so editor chrome works (overflow-x:hidden clips fixed/sticky). */
export function prepareEditorPageChrome(
  root: HTMLElement | null,
  options?: { scheduleOnly?: boolean }
): void {
  if (!root) return;

  const pageRoot =
    root.querySelector<HTMLElement>(':scope > div') ??
    (root.firstElementChild instanceof HTMLElement ? root.firstElementChild : null);
  if (!pageRoot) return;

  pageRoot.classList.add('fw-editor-mode');
  pageRoot.classList.toggle('fw-promo-editor-mode', Boolean(options?.scheduleOnly));
  pageRoot.style.setProperty('overflow-x', 'visible', 'important');
  pageRoot.style.setProperty('overflow-y', 'visible', 'important');
}

export function syncEditorChromeBelowBreadcrumb(
  root: HTMLElement | null,
  toolbar: HTMLElement | null,
  status: string,
  isError: boolean,
  options?: { scheduleOnly?: boolean }
): void {
  prepareEditorPageChrome(root, options);
  syncEditorToolbarBelowBreadcrumb(root, toolbar);
  syncEditorStatusBelowBreadcrumb(root, status, isError, toolbar);
}
