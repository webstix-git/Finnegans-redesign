const LOGO_SRC = '/assets/87e2692a-630f-49af-a747-20365db8e0f0.webp';
const INSTAGRAM_URL = 'https://www.instagram.com/finneganssgf/';
const FACEBOOK_URL = 'https://www.facebook.com/finneganssgf/';

const NAV_ITEMS: { slug: string; label: string; href: string }[] = [
  { slug: 'menu', label: 'Menu', href: '/menu' },
  { slug: 'promotions-and-events', label: 'Promotions & Events', href: '/promotions-and-events' },
  { slug: 'gallery', label: 'Gallery', href: '/gallery' },
  { slug: 'reviews', label: 'Reviews', href: '/reviews' },
  { slug: 'about-us', label: 'About Us', href: '/about-us' },
  { slug: 'faq', label: 'FAQs', href: '/faq' },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  'about-us': 'About Us',
  gallery: 'Gallery',
  reviews: 'Reviews',
  faq: 'FAQs',
  menu: 'Menu',
  'promotions-and-events': 'Promotions & Events',
  sitemap: 'Sitemap',
  'privacy-policy': 'Privacy Policy',
  'contact-us': 'Contact Us',
};

const NAV_LINK_BASE =
  'text-decoration:none;padding:6px 0;transition:color .22s ease;';
const NAV_LINK_INACTIVE = `${NAV_LINK_BASE}color:var(--cream);`;
const NAV_LINK_HOVER = 'style-hover="color:var(--gold2)"';
const NAV_LINK_ACTIVE = `${NAV_LINK_BASE}color:var(--gold2);border-bottom:2px solid var(--gold);`;

const FOOTER_LINK_STYLE =
  'text-decoration:none;color:var(--cream2);transition:color .2s;';

function footerQuickLink(href: string, label: string): string {
  return `<a href="${href}" style="${FOOTER_LINK_STYLE}" style-hover="color:var(--gold2)">${label}</a>`;
}

export const BRICK_BTN_HOVER =
  'background:var(--gold2);border-color:var(--gold2);color:#1a120c;transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.45)';

function navLink(item: (typeof NAV_ITEMS)[0], activeSlug: string): string {
  const isActive = item.slug === activeSlug;
  if (isActive) {
    return `<a href="${item.href}" class="fw-nav-link" style="${NAV_LINK_ACTIVE}">${item.label}</a>`;
  }
  return `<a href="${item.href}" class="fw-nav-link" style="${NAV_LINK_INACTIVE}" ${NAV_LINK_HOVER}>${item.label}</a>`;
}

export function renderHeader(activeSlug: string): string {
  const links = NAV_ITEMS.map((item) => navLink(item, activeSlug)).join('\n        ');
  const logoHref = activeSlug === 'home' ? '/#top' : '/';

  return `<!-- NAV -->
  <header id="fw-header" class="fw-site-header" style="position:fixed;top:0;left:0;right:0;z-index:50;background:linear-gradient(180deg,rgba(21,15,12,.94) 0%,rgba(21,15,12,.62) 55%,rgba(21,15,12,0) 100%);transition:background .32s ease,box-shadow .32s ease;">
    <nav class="fw-site-nav" style="max-width:1200px;margin:0 auto;padding:16px 24px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <div class="fw-site-nav-bar">
        <a href="${logoHref}" class="fw-site-logo-link" style="display:flex;align-items:center;text-decoration:none;flex:0 0 auto;">
          <img id="fw-logo" class="fw-site-logo" src="${LOGO_SRC}" alt="Finnegan's Wake Irish Pub" style="border-radius:50%;border:2px solid rgba(230,219,198,.55);box-shadow:0 6px 22px rgba(0,0,0,.5);transition:width .32s ease,height .32s ease;object-fit:cover;">
        </a>
        <button type="button" id="fw-nav-toggle" class="fw-nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="fw-nav-panel">
          <span class="fw-nav-toggle-bar"></span>
          <span class="fw-nav-toggle-bar"></span>
          <span class="fw-nav-toggle-bar"></span>
        </button>
      </div>
      <div id="fw-nav-panel" class="fw-site-nav-panel">
        <div class="fw-site-nav-links" style="flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:7px 24px;flex-wrap:wrap;font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:14px;font-weight:500;text-shadow:0 1px 9px rgba(0,0,0,.6);">
          ${links}
        </div>
        <div class="fw-site-nav-actions" style="flex:0 0 auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <a href="tel:+14178691500" class="fw-nav-phone" style="display:inline-flex;align-items:center;gap:7px;text-decoration:none;color:var(--cream);font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:500;font-size:14px;letter-spacing:.12em;padding:9px 14px;border-radius:2px;border:1px solid rgba(230,219,198,.5);transition:background .25s ease,border-color .25s ease;text-shadow:0 1px 9px rgba(0,0,0,.6);" style-hover="background:rgba(230,219,198,.12);border-color:var(--gold2);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.62 10.79a15.91 15.91 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C9.61 21 3 14.39 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.36.27 2.68.76 3.88a1 1 0 01-.21 1.11z"></path></svg>(417) 869-1500</a>
          <a href="/contact-us" class="fw-nav-cta" style="text-decoration:none;color:var(--cream);background:var(--brick);font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;font-size:14px;letter-spacing:.14em;padding:10px 20px;border-radius:2px;border:1px solid var(--brick);transition:background .25s ease,color .25s ease,border-color .25s ease,transform .25s ease,box-shadow .25s ease;" style-hover="${BRICK_BTN_HOVER}">Reserve Now</a>
        </div>
      </div>
    </nav>
  </header>`;
}

export function renderBreadcrumbs(slug: string): string {
  const label = BREADCRUMB_LABELS[slug];
  if (!label) return '';

  return `<!-- BREADCRUMBS -->
  <nav aria-label="Breadcrumb" style="background:var(--ink2);border-bottom:1px solid rgba(230,219,198,.1);">
    <div style="max-width:1200px;margin:0 auto;padding:14px 24px;font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:12px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
      <a href="/" style="color:var(--muted);text-decoration:none;transition:color .2s;" style-hover="color:var(--gold2)">Home</a>
      <span style="color:var(--muted);">/</span>
      <span style="color:var(--gold2);">${label}</span>
    </div>
  </nav>`;
}

export function renderFooter(): string {
  return `<!-- FOOTER -->
  <footer style="background-color:#0c0805;padding:clamp(48px,6vw,76px) 0 0;background-image:linear-gradient(rgba(9,6,4,.92),rgba(9,6,4,.95)),url('/assets/a1708b39-e7dd-49b7-b474-65a8c1be8c3b.jpg');background-size:cover;background-position:center;">
    <div style="max-width:1280px;margin:0 auto;padding:0 40px;">
      <div class="fw-footer-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px;align-items:start;">

        <div class="fw-footer-brand">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="${LOGO_SRC}" alt="Finnegan's Wake" style="width:64px;height:64px;border-radius:50%;border:1.5px solid rgba(230,219,198,.45);flex-shrink:0;">
            <div>
              <div style="font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.1em;font-size:18px;color:var(--cream);line-height:1.1;">Finnegan's Wake</div>
              <div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.22em;font-size:10.5px;color:var(--gold2);margin-top:4px;font-weight:400;">Irish Pub · Est. 2006</div>
            </div>
          </div>
          <div style="display:grid;gap:14px;margin-top:20px;">
            <div style="display:flex;gap:10px;align-items:flex-start;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:3px;flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span style="font-family:Montserrat,sans-serif;font-size:14px;line-height:1.65;color:var(--cream2);">305 South Avenue<br>Springfield, MO 65806</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.86 19.79 19.79 0 010 1.25a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 6.91a16 16 0 006.29 6.29l.35-.35a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"></path></svg>
              <a href="tel:+14178691500" style="font-family:Montserrat,sans-serif;font-size:14px;color:var(--cream2);text-decoration:none;" style-hover="color:var(--gold2)">(417) 869-1500</a>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <a href="mailto:finneganssgf@gmail.com" style="font-family:Montserrat,sans-serif;font-size:14px;color:var(--cream2);text-decoration:none;" style-hover="color:var(--gold2)">finneganssgf@gmail.com</a>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
              <span style="font-family:Montserrat,sans-serif;font-size:14px;color:var(--muted);">Follow us on:</span>
              <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style="width:38px;height:38px;border:1px solid rgba(230,219,198,.35);border-radius:4px;display:flex;align-items:center;justify-content:center;text-decoration:none;color:var(--cream2);transition:border-color .2s;" style-hover="border-color:var(--gold2);color:var(--gold2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
              <a href="${FACEBOOK_URL}" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style="width:38px;height:38px;border:1px solid rgba(230,219,198,.35);border-radius:4px;display:flex;align-items:center;justify-content:center;text-decoration:none;color:var(--cream2);font-family:Oswald,sans-serif;font-weight:600;font-size:14px;transition:border-color .2s;" style-hover="border-color:var(--gold2);color:var(--gold2)">f</a>
            </div>
          </div>
        </div>

        <div class="fw-footer-hours-col">
          <div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.26em;font-size:11px;color:var(--gold2);margin-bottom:20px;">Hours</div>
          <div class="fw-footer-hours" style="display:grid;grid-template-columns:auto auto;column-gap:16px;row-gap:2px;width:max-content;font-family:Montserrat,sans-serif;font-size:15px;">
            <span style="color:var(--muted);">Mon</span>
            <span style="color:var(--cream2);">Closed</span>
            <span style="color:var(--muted);">Tue – Sun</span>
            <span style="color:var(--cream2);">4 p.m. – Close</span>
          </div>
        </div>

        <div class="fw-footer-links">
          <div style="font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.26em;font-size:11px;color:var(--gold2);margin-bottom:20px;">Quick Links</div>
          <div class="fw-footer-links-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:13px 48px;font-family:Montserrat,sans-serif;font-size:15px;">
            <div style="display:grid;gap:13px;">
              ${footerQuickLink('/menu', 'Menu')}
              ${footerQuickLink('/promotions-and-events', 'Events')}
              ${footerQuickLink('/gallery', 'Gallery')}
            </div>
            <div style="display:grid;gap:13px;">
              ${footerQuickLink('/about-us', 'About Us')}
              ${footerQuickLink('/reviews', 'Reviews')}
              ${footerQuickLink('/faq', 'FAQs')}
              ${footerQuickLink('/contact-us', 'Contact Us')}
            </div>
          </div>
        </div>

      </div>

      <div style="border-top:1px solid rgba(230,219,198,.12);margin-top:48px;padding:20px 0;display:flex;flex-wrap:wrap;gap:10px 24px;justify-content:space-between;align-items:center;font-family:Oswald,sans-serif;text-transform:uppercase;letter-spacing:.14em;font-size:10.5px;color:var(--muted);">
        <span>© 2026 Finnegan's Wake LLC. All Rights Reserved.</span>
        <div style="display:flex;gap:24px;">
          <a href="/sitemap" style="text-decoration:none;color:var(--muted);transition:color .2s;" style-hover="color:var(--gold2)">Sitemap</a>
          <a href="/privacy-policy" style="text-decoration:none;color:var(--muted);transition:color .2s;" style-hover="color:var(--gold2)">Privacy Policy</a>
        </div>
      </div>
    </div>
  </footer>`;
}

export function normalizeButtonHovers(html: string): string {
  return html
    .replace(
      /style-hover="background:var\(--brick2\)([^"]*)"/g,
      `style-hover="${BRICK_BTN_HOVER}"`,
    )
    .replace(
      /style-hover="background:var\(--gold2\);color:var\(--ink\);transform:translateY\(-2px\);"/g,
      `style-hover="background:var(--gold2);color:var(--ink);border-color:var(--gold2);transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.45)"`,
    )
    .replace(
      /style-hover="background:rgba\(230,219,198,.08\);border-color:var\(--gold2\);transform:translateY\(-2px\)"/g,
      `style-hover="background:var(--cream);color:var(--ink);border-color:var(--cream);transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.45)"`,
    );
}
