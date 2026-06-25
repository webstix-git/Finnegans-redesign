'use client';

import { RefObject, useEffect } from 'react';

export type EffectsMode = 'home' | 'scroll' | 'scroll-promo' | 'gallery' | 'faq' | 'contact';

function setupContactForm() {
  document.querySelectorAll('#fw-faqs details').forEach((d) => {
    (d as HTMLDetailsElement).open = true;
  });

  const cleanups: Array<() => void> = [];

  document.querySelectorAll('#fw-contact-form input, #fw-contact-form textarea').forEach((el) => {
    const onFocus = function (this: HTMLInputElement | HTMLTextAreaElement) {
      this.style.borderColor = 'rgba(230,219,198,.55)';
      this.style.background = '#261c14';
    };
    const onBlur = function (this: HTMLInputElement | HTMLTextAreaElement) {
      this.style.borderColor = 'rgba(230,219,198,.22)';
      this.style.background = '#1f1711';
    };
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);
    cleanups.push(() => {
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', onBlur);
    });
  });

  const form = document.getElementById('fw-contact-form');
  const success = document.getElementById('fw-form-success');
  const btn = document.getElementById('fw-submit-btn');
  if (form && btn) {
    const onSubmit = (e: Event) => {
      e.preventDefault();
      btn.textContent = 'Sending…';
      btn.style.opacity = '0.7';
      window.setTimeout(() => {
        (form as HTMLFormElement).reset();
        btn.textContent = 'Send Us a Note';
        btn.style.opacity = '1';
        if (success) success.style.display = 'block';
        window.setTimeout(() => {
          if (success) success.style.display = 'none';
        }, 5000);
      }, 1000);
    };
    form.addEventListener('submit', onSubmit);
    cleanups.push(() => form.removeEventListener('submit', onSubmit));
  }

  return () => cleanups.forEach((fn) => fn());
}

function setupScrollHeader(logoSize: { scrolled: number; default: number }) {
  const h = document.getElementById('fw-header');
  const logo = document.getElementById('fw-logo') as HTMLElement | null;
  if (!h) return () => {};

  const onScroll = () => {
    const scrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 70;
    if (scrolled) {
      h.style.background = 'rgba(21,15,12,.97)';
      h.style.backdropFilter = 'blur(10px)';
      (h.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
        'blur(10px)';
      h.style.boxShadow = '0 8px 26px rgba(0,0,0,.4)';
      if (logo) {
        logo.style.width = `${logoSize.scrolled}px`;
        logo.style.height = `${logoSize.scrolled}px`;
      }
    } else {
      h.style.background =
        'linear-gradient(180deg,rgba(21,15,12,.94) 0%,rgba(21,15,12,.62) 55%,rgba(21,15,12,0) 100%)';
      h.style.backdropFilter = 'none';
      (h.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
        'none';
      h.style.boxShadow = 'none';
      if (logo) {
        logo.style.width = `${logoSize.default}px`;
        logo.style.height = `${logoSize.default}px`;
      }
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener('scroll', onScroll);
}

function setupGalleryLightbox() {
  const box = document.getElementById('fw-lightbox');
  const img = document.getElementById('fw-lightbox-img') as HTMLImageElement | null;
  const prevBtn = document.getElementById('fw-lightbox-prev');
  const nextBtn = document.getElementById('fw-lightbox-next');
  const closeBtn = document.getElementById('fw-lightbox-close');
  if (!box || !img || !prevBtn || !nextBtn || !closeBtn) return () => {};

  let srcs: string[] = [];
  let idx = 0;

  const close = () => {
    box.style.display = 'none';
    img.removeAttribute('src');
    document.body.style.overflow = '';
  };

  const show = (i: number) => {
    if (!srcs.length) return;
    idx = ((i % srcs.length) + srcs.length) % srcs.length;
    img.setAttribute('src', srcs[idx]);
    box.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const tileSrc = (tile: Element) => {
    const im = tile.querySelector('img');
    if (im) return im.currentSrc || im.src;
    const full = tile.getAttribute('data-full');
    return full?.startsWith('/') ? full : '';
  };

  const wireLightbox = () => {
    const visible = [...document.querySelectorAll<HTMLElement>('[id^="panel-"]')].find(
      (p) => p.style.display !== 'none'
    );
    if (!visible) return;

    const tiles = [...visible.querySelectorAll('button.fw-tile')];
    srcs = tiles.map(tileSrc).filter(Boolean);

    tiles.forEach((tile, i) => {
      const handler = () => show(i);
      tile.addEventListener('click', handler);
      (tile as HTMLElement & { __fwHandler?: () => void }).__fwHandler = handler;
    });
  };

  const tabs = ['finnsmas', 'stpats', 'everyday', 'food'];
  const switchTab = (id: string) => {
    tabs.forEach((t) => {
      const panel = document.getElementById(`panel-${t}`);
      const btn = document.getElementById(`tab-${t}`);
      if (!panel || !btn) return;
      const active = t === id;
      panel.style.display = active ? 'grid' : 'none';
      btn.style.background = active ? 'var(--brick)' : 'transparent';
      btn.style.color = active ? 'var(--cream)' : 'var(--muted)';
    });

    document.querySelectorAll('button.fw-tile').forEach((tile) => {
      const el = tile as HTMLElement & { __fwHandler?: () => void };
      if (el.__fwHandler) tile.removeEventListener('click', el.__fwHandler);
      delete el.__fwHandler;
    });
    wireLightbox();
  };

  tabs.forEach((t) => {
    const btn = document.getElementById(`tab-${t}`);
    if (btn) btn.addEventListener('click', () => switchTab(t));
  });

  const onPrev = (e: Event) => {
    e.stopPropagation();
    show(idx - 1);
  };
  const onNext = (e: Event) => {
    e.stopPropagation();
    show(idx + 1);
  };
  const onClose = (e: Event) => {
    e.stopPropagation();
    close();
  };
  const onBoxClick = (e: Event) => {
    if (e.target === box) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (box.style.display !== 'flex') return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  closeBtn.addEventListener('click', onClose);
  box.addEventListener('click', onBoxClick);
  document.addEventListener('keydown', onKey);
  wireLightbox();

  return () => {
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    closeBtn.removeEventListener('click', onClose);
    box.removeEventListener('click', onBoxClick);
    document.removeEventListener('keydown', onKey);
  };
}

export function useFinnegansEffects(
  containerRef: RefObject<HTMLDivElement | null>,
  mode: EffectsMode
) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    if (mode === 'home') {
      cleanups.push(setupScrollHeader({ scrolled: 54, default: 145 }));

      document.querySelectorAll('#faq details').forEach((d) => {
        (d as HTMLDetailsElement).open = true;
      });

      const moreGrid = document.getElementById('fw-gallery-more');
      const toggleBtn = document.getElementById('fw-gallery-toggle');
      if (moreGrid && toggleBtn) {
        const onToggleGallery = () => {
          const open = moreGrid.style.display === 'grid';
          moreGrid.style.display = open ? 'none' : 'grid';
          toggleBtn.textContent = open ? 'View More Gallery' : 'Show Less';
        };
        toggleBtn.addEventListener('click', onToggleGallery);
        cleanups.push(() => toggleBtn.removeEventListener('click', onToggleGallery));
      }

      const box = document.getElementById('fw-lightbox');
      const boxImg = document.getElementById('fw-lightbox-img') as HTMLImageElement | null;
      if (box && boxImg) {
        const openLightbox = (src: string) => {
          boxImg.setAttribute('src', src);
          box.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        };
        const closeLightbox = () => {
          box.style.display = 'none';
          boxImg.removeAttribute('src');
          document.body.style.overflow = '';
        };
        const onGalleryClick = (e: Event) => {
          const target = e.target as HTMLElement;
          const btn = target.closest('[data-full]');
          if (btn) {
            e.preventDefault();
            const im = btn.querySelector('img');
            openLightbox(
              im ? im.currentSrc || im.src : btn.getAttribute('data-full') || ''
            );
          }
        };
        const galleryButtons = document.querySelectorAll('#atmosphere [data-full]');
        galleryButtons.forEach((b) => b.addEventListener('click', onGalleryClick));
        const onBoxClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (
            target === box ||
            target.id === 'fw-lightbox-close' ||
            target.closest('#fw-lightbox-close')
          ) {
            closeLightbox();
          }
        };
        box.addEventListener('click', onBoxClick);
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') closeLightbox();
        };
        document.addEventListener('keydown', onKey);
        cleanups.push(() => {
          galleryButtons.forEach((b) => b.removeEventListener('click', onGalleryClick));
          box.removeEventListener('click', onBoxClick);
          document.removeEventListener('keydown', onKey);
        });
      }
    } else if (mode === 'scroll') {
      cleanups.push(setupScrollHeader({ scrolled: 54, default: 145 }));
    } else if (mode === 'scroll-promo') {
      cleanups.push(setupScrollHeader({ scrolled: 54, default: 120 }));
    } else if (mode === 'gallery') {
      cleanups.push(setupScrollHeader({ scrolled: 54, default: 145 }));
      cleanups.push(setupGalleryLightbox());
    } else if (mode === 'faq') {
      cleanups.push(setupScrollHeader({ scrolled: 54, default: 145 }));
      document.querySelectorAll('details').forEach((d) => {
        (d as HTMLDetailsElement).open = true;
      });
    } else if (mode === 'contact') {
      cleanups.push(setupScrollHeader({ scrolled: 54, default: 145 }));
      cleanups.push(setupContactForm());
    }

    return () => cleanups.forEach((fn) => fn());
  }, [containerRef, mode]);
}
