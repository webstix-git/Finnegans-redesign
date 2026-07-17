'use client';

import { RefObject, useEffect } from 'react';
import { INTERNATIONAL_PHONE_ERROR, isValidInternationalPhone } from '@/lib/phoneValidation';

export type EffectsMode = 'home' | 'scroll' | 'scroll-promo' | 'gallery' | 'faq' | 'contact';

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: { sitekey: string; theme?: 'light' | 'dark' | 'auto' }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error('Turnstile failed to initialize'));
      };
      script.onerror = () => {
        turnstileLoader = null;
        reject(new Error('Failed to load Turnstile script'));
      };
      document.head.appendChild(script);
    });
  }
  return turnstileLoader;
}

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
  const btn = document.getElementById('fw-submit-btn');
  const phoneInput = document.getElementById('fw-contact-phone') as HTMLInputElement | null;
  const phoneError = document.getElementById('fw-phone-error');
  const formError = document.getElementById('fw-form-error');
  const submitLabel = btn?.textContent ?? 'Send Us a Note';
  const defaultFormError = formError?.textContent ?? '';

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileContainer = document.getElementById('fw-turnstile');
  const turnstileEnabled = Boolean(turnstileSiteKey && turnstileContainer);
  let turnstileWidgetId: string | null = null;
  let turnstileDisposed = false;

  if (turnstileEnabled && turnstileSiteKey && turnstileContainer) {
    loadTurnstile()
      .then((turnstile) => {
        if (turnstileDisposed) return;
        turnstileWidgetId = turnstile.render(turnstileContainer, {
          sitekey: turnstileSiteKey,
          theme: 'dark',
        });
      })
      .catch(() => {
        // Widget unavailable; server-side verification will still reject if required.
      });
    cleanups.push(() => {
      turnstileDisposed = true;
      if (turnstileWidgetId !== null) {
        try {
          window.turnstile?.remove(turnstileWidgetId);
        } catch {
          // widget already gone
        }
        turnstileWidgetId = null;
      }
    });
  }

  const showFormError = (message?: string) => {
    if (!formError) return;
    formError.textContent = message ?? defaultFormError;
    formError.style.display = 'block';
  };

  const defaultBorder = 'rgba(230,219,198,.22)';
  const errorBorder = '#e07070';

  const clearPhoneError = () => {
    if (phoneInput) phoneInput.style.borderColor = defaultBorder;
    if (phoneError) phoneError.style.display = 'none';
  };

  const showPhoneError = () => {
    if (phoneInput) {
      phoneInput.style.borderColor = errorBorder;
      phoneInput.focus();
    }
    if (phoneError) {
      phoneError.textContent = INTERNATIONAL_PHONE_ERROR;
      phoneError.style.display = 'block';
    }
  };

  const setSubmitting = (submitting: boolean) => {
    if (!btn) return;
    btn.textContent = submitting ? 'Sending…' : submitLabel;
    btn.style.opacity = submitting ? '0.7' : '1';
    btn.style.pointerEvents = submitting ? 'none' : 'auto';
  };

  if (phoneInput) {
    const onPhoneInput = () => clearPhoneError();
    phoneInput.addEventListener('input', onPhoneInput);
    cleanups.push(() => phoneInput.removeEventListener('input', onPhoneInput));
  }

  if (form && btn) {
    const onSubmit = async (e: Event) => {
      e.preventDefault();
      clearPhoneError();
      if (formError) formError.style.display = 'none';

      const formEl = form as HTMLFormElement;
      const phoneValue = phoneInput?.value.trim() ?? '';
      if (!isValidInternationalPhone(phoneValue)) {
        showPhoneError();
        return;
      }

      if (!formEl.reportValidity()) return;

      if (turnstileEnabled) {
        const token = window.turnstile?.getResponse(turnstileWidgetId ?? undefined) ?? '';
        if (!token) {
          showFormError('Please complete the verification challenge before sending.');
          return;
        }
      }

      setSubmitting(true);

      try {
        const response = await fetch(formEl.action, {
          method: 'POST',
          body: new FormData(formEl),
        });

        if (!response.ok) {
          throw new Error(`Form submit failed (${response.status})`);
        }

        window.location.href = '/thank-you';
      } catch {
        setSubmitting(false);
        if (turnstileEnabled && turnstileWidgetId !== null) {
          window.turnstile?.reset(turnstileWidgetId);
        }
        showFormError();
      }
    };
    form.addEventListener('submit', onSubmit);
    cleanups.push(() => form.removeEventListener('submit', onSubmit));
  }

  return () => cleanups.forEach((fn) => fn());
}

function setupMobileNav() {
  const header = document.getElementById('fw-header');
  const toggle = document.getElementById('fw-nav-toggle');
  const panel = document.getElementById('fw-nav-panel');
  if (!header || !toggle || !panel) return () => {};

  const mq = window.matchMedia('(max-width: 991px)');

  const closeMenu = () => {
    header.classList.remove('fw-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('fw-nav-menu-open');
    window.dispatchEvent(new Event('scroll'));
  };

  const openMenu = () => {
    header.classList.add('fw-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('fw-nav-menu-open');
    window.dispatchEvent(new Event('scroll'));
  };

  const onToggle = () => {
    if (header.classList.contains('fw-nav-open')) closeMenu();
    else openMenu();
  };

  const onResize = () => {
    if (!mq.matches) closeMenu();
  };

  const onLinkClick = (e: Event) => {
    if ((e.target as HTMLElement).closest('a')) closeMenu();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeMenu();
  };

  toggle.addEventListener('click', onToggle);
  panel.addEventListener('click', onLinkClick);
  mq.addEventListener('change', onResize);
  document.addEventListener('keydown', onKey);

  return () => {
    toggle.removeEventListener('click', onToggle);
    panel.removeEventListener('click', onLinkClick);
    mq.removeEventListener('change', onResize);
    document.removeEventListener('keydown', onKey);
    closeMenu();
  };
}

function setupScrollHeader() {
  const h = document.getElementById('fw-header');
  if (!h) return () => {};

  const onScroll = () => {
    const menuOpen = h.classList.contains('fw-nav-open');
    const scrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 70;
    if (scrolled || menuOpen) {
      h.classList.add('fw-header-scrolled');
      h.style.background = 'rgba(21,15,12,.97)';
      h.style.backdropFilter = 'blur(10px)';
      (h.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
        'blur(10px)';
      h.style.boxShadow = '0 8px 26px rgba(0,0,0,.4)';
    } else {
      h.classList.remove('fw-header-scrolled');
      h.style.background =
        'linear-gradient(180deg,rgba(21,15,12,.94) 0%,rgba(21,15,12,.62) 55%,rgba(21,15,12,0) 100%)';
      h.style.backdropFilter = 'none';
      (h.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
        'none';
      h.style.boxShadow = 'none';
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return () => window.removeEventListener('scroll', onScroll);
}

function setupCarousel(carousel: HTMLElement) {
  const slides = [...carousel.querySelectorAll<HTMLElement>('.fw-carousel-slide')];
  const dots = [...carousel.querySelectorAll<HTMLButtonElement>('.fw-carousel-dot')];
  const prevBtn = carousel.querySelector<HTMLButtonElement>('.fw-carousel-prev');
  const nextBtn = carousel.querySelector<HTMLButtonElement>('.fw-carousel-next');
  if (!slides.length) return () => {};

  let idx = 0;
  let timer: number | null = null;

  const goTo = (i: number) => {
    idx = ((i % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      const active = n === idx;
      slide.classList.toggle('fw-carousel-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach((dot, n) => {
      const active = n === idx;
      dot.classList.toggle('fw-carousel-dot-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  const next = () => goTo(idx + 1);
  const prev = () => goTo(idx - 1);

  const stopAutoplay = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    timer = window.setInterval(next, 5000);
  };

  const onPrev = () => { prev(); startAutoplay(); };
  const onNext = () => { next(); startAutoplay(); };
  const onDotClick = (e: Event) => {
    const dotIdx = dots.indexOf(e.currentTarget as HTMLButtonElement);
    if (dotIdx >= 0) { goTo(dotIdx); startAutoplay(); }
  };

  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);
  dots.forEach((dot) => dot.addEventListener('click', onDotClick));
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  goTo(0);
  startAutoplay();

  return () => {
    stopAutoplay();
    prevBtn?.removeEventListener('click', onPrev);
    nextBtn?.removeEventListener('click', onNext);
    dots.forEach((dot) => dot.removeEventListener('click', onDotClick));
    carousel.removeEventListener('mouseenter', stopAutoplay);
    carousel.removeEventListener('mouseleave', startAutoplay);
    carousel.removeEventListener('focusin', stopAutoplay);
    carousel.removeEventListener('focusout', startAutoplay);
  };
}

function setupAllCarousels() {
  const cleanups: Array<() => void> = [];
  document.querySelectorAll<HTMLElement>('.fw-carousel').forEach((carousel) => {
    cleanups.push(setupCarousel(carousel));
  });
  return () => cleanups.forEach((fn) => fn());
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

  const urlTab = new URLSearchParams(window.location.search).get('tab');
  if (urlTab && tabs.includes(urlTab)) {
    switchTab(urlTab);
    window.requestAnimationFrame(() => {
      const tabBar = document.getElementById('fw-tab-bar');
      if (tabBar) {
        const header = document.getElementById('fw-header');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const top = tabBar.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top, behavior: 'instant' });
      }
    });
  }

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
    cleanups.push(setupMobileNav());

    if (mode === 'home') {
      cleanups.push(setupScrollHeader());

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
      cleanups.push(setupScrollHeader());
      cleanups.push(setupAllCarousels());
    } else if (mode === 'scroll-promo') {
      cleanups.push(setupScrollHeader());
      cleanups.push(setupAllCarousels());
      document.getElementById('fw-header')?.classList.add('fw-logo-size-promo');
      cleanups.push(() =>
        document.getElementById('fw-header')?.classList.remove('fw-logo-size-promo')
      );
    } else if (mode === 'gallery') {
      cleanups.push(setupScrollHeader());
      cleanups.push(setupGalleryLightbox());
    } else if (mode === 'faq') {
      cleanups.push(setupScrollHeader());
      document.querySelectorAll('details').forEach((d) => {
        (d as HTMLDetailsElement).open = true;
      });
    } else if (mode === 'contact') {
      cleanups.push(setupScrollHeader());
      cleanups.push(setupContactForm());
    }

    return () => cleanups.forEach((fn) => fn());
  }, [containerRef, mode]);
}
