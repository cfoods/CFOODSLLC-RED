/*
 * RedRail Performance — design preview storefront.
 * Static pages under /red/. Sample catalog, prices, reviews and orders; no backend calls,
 * nothing is charged or saved on the server. The cart and the sample sign-in live in this browser only.
 * There is deliberately no vehicle picker / garage / fit filter: what a part fits is plain product text.
 */
(function () {
  'use strict';

  const CAT = window.PREVIEW_CATALOG;
  const ART = window.PartsArt;
  const BASE = '/red';
  const BRAND = 'RedRail Performance';
  const TIER = 'cheap';
  const RED = '#c8102e';
  const P = CAT.products;

  // Customer rules from the CFOODS handoff (Nov 5, 2026). Same for every CFOODS store unless the owner overrides.
  const FREE_SHIP = 30; // lower 48: free at $30+, otherwise flat
  const SHIP_FLAT = 7;
  const SHIP_ZONES = { us: ['Lower 48 states', null], akhi: ['Alaska or Hawaii', 50], ca: ['Canada', 100], intl: ['Other countries', 150] };
  const RETURN_DAYS = 7; // voluntary returns: unused / uninstalled, days after delivery
  const RESTOCK = 0.05; // customer-choice return or cancel refunded to card; waived for store credit and our mistakes
  const shipFor = (zone, subtotal) => (zone === 'us' || !SHIP_ZONES[zone] ? (subtotal >= FREE_SHIP || subtotal <= 0 ? 0 : SHIP_FLAT) : SHIP_ZONES[zone][1]);

  // ------------------------------------------------------------------ helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `$${Number(n).toFixed(2)}`;
  const params = new URLSearchParams(window.location.search);
  const byId = (id) => P.find((p) => p.id === id);
  const price = (p) => p.price[TIER];
  const dash = (s) => String(s).replace(/(\d{4})-(\d{4})/g, '$1–$2');
  const title = (p) => dash(p.title);
  const catById = (id) => CAT.categories.find((c) => c.id === id);

  const store = {
    get(key, fallback) {
      try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: the page still works for this visit */ }
    },
    session(key, value) {
      try {
        if (value === undefined) { const v = window.sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
        if (value === null) window.sessionStorage.removeItem(key); else window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* ignore */ }
      return null;
    },
  };

  const url = {
    home: `${BASE}/home/`,
    all: `${BASE}/collection/`,
    cat: (id) => `${BASE}/collection/?category=${encodeURIComponent(id)}`,
    product: (p) => `${BASE}/product/?p=${encodeURIComponent(p.id)}`,
    search: (q) => `${BASE}/search/?q=${encodeURIComponent(q)}`,
    page: (name) => `${BASE}/${name}/`,
  };

  const I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    cart: '<path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    returns: '<path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="M8 6l-4 4 4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    car: '<path d="M5 17H3v-4l2.2-5.2A2 2 0 0 1 7 6.6h10a2 2 0 0 1 1.8 1.2L21 13v4h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5M4 12.5h16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    wrench: '<path d="M15 4a5 5 0 0 0-4.6 6.9L4 17.3V20h2.7l6.4-6.4A5 5 0 0 0 20 9l-3 1-2-2 1-3z"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 12.5v5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    out: '<path d="M14 4h6v16h-6M10 12h10M6 8l-4 4 4 4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v1.5M12 16v1.5"/>',
  };
  const icon = (name, cls = '') => `<svg class="rr-i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || ''}</svg>`;

  const art = (p, view = 'main') => ART.svg(p.art, { finish: 'steel', accent: RED, coupler: '#141414', view, label: title(p) });
  const catArt = (c) => ART.svg(c.art, { finish: 'steel', accent: RED, coupler: '#141414', label: c.name });

  function priceTag(n, cls = '') {
    const [d, c] = Number(n).toFixed(2).split('.');
    return `<span class="rr-price ${cls}" aria-label="${money(n)}"><span class="rr-price-cur">$</span>${d}<span class="rr-price-cents">.${c}</span></span>`;
  }
  const stars = (r) => `<span class="rr-stars" style="--r:${((r / 5) * 100).toFixed(0)}%" role="img" aria-label="${r} out of 5 stars"></span>`;

  // Sample dates are relative to today, so the demo (like the 7-day return window) always behaves the same.
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoDay(d); };
  const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoDay(d); };
  const niceDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ------------------------------------------------------------------ cart
  const cart = {
    read() { return store.get('rr_preview_cart', []).filter((l) => l && byId(l.id) && l.qty > 0); },
    write(lines) { store.set('rr_preview_cart', lines); updateBadges(); },
    add(id, qty = 1) {
      const lines = this.read();
      const line = lines.find((l) => l.id === id);
      if (line) line.qty = Math.min(20, line.qty + qty); else lines.push({ id, qty: Math.min(20, qty) });
      this.write(lines);
    },
    setQty(id, qty) {
      const lines = this.read().map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l));
      this.write(lines);
    },
    remove(id) { this.write(this.read().filter((l) => l.id !== id)); },
    clear() { this.write([]); },
    count() { return this.read().reduce((a, l) => a + l.qty, 0); },
    subtotal() { return this.read().reduce((a, l) => a + price(byId(l.id)) * l.qty, 0); },
  };

  // Wishlist: per store (RedRail only), for registered accounts on the live site.
  const wish = {
    read() { return store.get('rr_preview_wishlist', []).filter((id) => byId(id)); },
    has(id) { return this.read().includes(id); },
    toggle(id) { const list = this.read(); const on = !list.includes(id); store.set('rr_preview_wishlist', on ? [...list, id] : list.filter((x) => x !== id)); return on; },
  };
  const wishButton = (p) => `<button class="rr-save${wish.has(p.id) ? ' is-on' : ''}" type="button" data-wish="${p.id}" aria-pressed="${wish.has(p.id)}">${icon('heart')}<span>${wish.has(p.id) ? 'Saved' : 'Save'}</span></button>`;

  // What a part fits is plain product text (like the title). There is no vehicle picker or garage.
  const fitText = (p) => (p.universal ? 'Universal fit' : p.fits.map((f) => `${f.from}–${f.to} ${f.make} ${f.model}`).join(', '));

  // ------------------------------------------------------------------ search
  // Plain keyword search over what a product already has: title, category, engine and part number.
  function searchProducts(q) {
    const tokens = String(q || '').toLowerCase().replace(/["'(),]/g, ' ').split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return P.map((p) => {
      const hay = [p.title, p.categoryName, p.category.replace(/-/g, ' '), p.engine, p.sku, p.art, p.universal ? 'universal' : ''].join(' ').toLowerCase();
      const t0 = p.title.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        const single = t.length > 3 ? t.replace(/(es|s)$/, '') : t;
        if (!hay.includes(t) && !hay.includes(single)) return null;
        score += t0.includes(t) || t0.includes(single) ? 3 : 1;
        if (p.categoryName.toLowerCase().includes(single)) score += 2; // "headers" ranks real headers above header kits
      }
      return { p, score: score + p.reviewCount / 1000 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map((x) => x.p);
  }
  function highlight(text, q) {
    let out = esc(text);
    String(q || '').toLowerCase().split(/\s+/).filter((t) => t.length > 1).forEach((t) => {
      const safe = esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(${safe})(?![^<]*>)`, 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  // ------------------------------------------------------------------ shared pieces
  const logo = (light = false) => `<span class="rr-logo-mark${light ? ' is-light' : ''}" aria-hidden="true"><i></i><i></i></span><span class="rr-logo-text${light ? ' is-light' : ''}"><b>RED</b>RAIL<small>PERFORMANCE</small></span>`;

  function card(p) {
    const out = p.stock <= 0;
    const badge = out ? '<span class="rr-badge rr-badge-ink">Sold out</span>' : p.isNew ? '<span class="rr-badge rr-badge-ink">New</span>' : p.best ? '<span class="rr-badge">Best seller</span>' : '';
    const fitLine = `<p class="rr-card-fit">${p.universal ? 'Universal fit' : `Fits ${esc(p.fits.length > 1 ? `${p.fits.length} models` : fitText(p))}`}</p>`;
    return `<article class="rr-card${out ? ' is-out' : ''}">
      <a class="rr-card-media" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}${badge}</a>
      <div class="rr-card-body">
        <p class="rr-card-cat">${esc(p.categoryName)}</p>
        <h3 class="rr-card-title"><a href="${url.product(p)}">${esc(title(p))}</a></h3>
        ${fitLine}
        <div class="rr-card-rating">${stars(p.rating)}<span>${p.rating} (${p.reviewCount})</span></div>
        <div class="rr-card-foot">
          ${priceTag(price(p))}
          ${out ? '<span class="rr-card-soldout">Back soon</span>' : `<button class="rr-add" type="button" data-add="${p.id}" aria-label="Add ${esc(title(p))} to cart">${icon('plus')}<span>Add</span></button>`}
        </div>
      </div>
    </article>`;
  }
  const grid = (list) => `<div class="rr-grid">${list.map(card).join('')}</div>`;

  function shipProgress(sub) {
    const left = FREE_SHIP - sub;
    const pct = Math.max(4, Math.min(100, (sub / FREE_SHIP) * 100));
    return `<div class="rr-progress${left <= 0 ? ' is-done' : ''}">
      <p>${icon('truck')}${left > 0 ? `Add <b>${money(left)}</b> more for free shipping` : '<b>Free shipping</b> unlocked on this order'}</p>
      <div class="rr-progress-bar"><span style="width:${pct}%"></span></div>
    </div>`;
  }

  const crumbs = (items) => `<nav class="rr-crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (href && i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`)).join(`<span class="rr-crumb-sep">/</span>`)}</nav>`;

  function header() {
    return `<a class="rr-skip" href="#main">Skip to content</a>
    <div class="rr-announce"><div class="rr-wrap rr-announce-inner">
      <span>${icon('truck')}Free shipping on orders $${FREE_SHIP}+</span>
      <span class="rr-hide-sm">${icon('returns')}${RETURN_DAYS}-day returns, free return label</span>
      <span class="rr-hide-sm">${icon('shield')}Warranty on every part</span>
    </div></div>
    <header class="rr-header">
      <div class="rr-wrap rr-header-main">
        <button class="rr-icon-btn rr-menu-btn" type="button" data-open-menu aria-label="Open menu">${icon('menu')}</button>
        <a class="rr-logo" href="${url.home}" aria-label="RedRail Performance home">${logo()}</a>
        <form class="rr-search" action="${BASE}/search/" method="get" role="search" autocomplete="off">
          <input name="q" type="search" placeholder="Search parts or part numbers" aria-label="Search parts" value="${esc(document.body.dataset.page === 'search' ? params.get('q') || '' : '')}">
          <button type="submit" aria-label="Search">${icon('search')}</button>
          <div class="rr-suggest" hidden></div>
        </form>
        <nav class="rr-actions" aria-label="Account and cart">
          <a class="rr-action" href="${url.page('account')}">${icon('user')}<span class="rr-action-label">Account</span></a>
          <a class="rr-action rr-cart-link" href="${url.page('cart')}" aria-label="Cart">${icon('cart')}<span class="rr-cart-count">0</span><span class="rr-action-label rr-cart-total">$0.00</span></a>
        </nav>
      </div>
      <div class="rr-nav-row"><div class="rr-wrap rr-nav-inner">
        <nav class="rr-nav" aria-label="Shop by category">
          <a href="${url.all}"${document.body.dataset.page === 'collection' && !params.get('category') ? ' aria-current="page"' : ''}>All parts</a>
          ${CAT.categories.map((c) => `<a href="${url.cat(c.id)}"${params.get('category') === c.id ? ' aria-current="page"' : ''}>${esc(c.name)}</a>`).join('')}
        </nav>
        <a class="rr-nav-deal" href="${url.page('track')}">${icon('truck')}Track an order</a>
      </div></div>
    </header>`;
  }

  function trustBar() {
    return `<section class="rr-trust" aria-label="Why shop RedRail"><div class="rr-wrap rr-trust-grid">
      <div>${icon('truck')}<p><b>Free shipping $${FREE_SHIP}+</b><span>Lower 48, tracking on every order</span></p></div>
      <div>${icon('shield')}<p><b>Warranty on every part</b><span>Replacement first</span></p></div>
      <div>${icon('returns')}<p><b>${RETURN_DAYS}-day returns</b><span>Unused parts, free label</span></p></div>
      <div>${icon('chat')}<p><b>Help 24/7</b><span>Chat or email</span></p></div>
    </div></section>`;
  }

  const HELP_LINKS = [['Track order', 'track'], ['Start a return or claim', 'request'], ['Shipping', 'shipping'], ['Returns & refunds', 'refund'], ['Warranty', 'warranty'], ['FAQ', 'faq'], ['Contact us', 'contact']];
  const COMPANY_LINKS = [['About RedRail', 'about'], ['Customer reviews', 'reviews'], ['Military discount', 'military'], ['Social', 'social']];
  const LEGAL_LINKS = [['Privacy policy', 'privacy'], ['Terms & conditions', 'terms'], ['Vehicle compliance waiver', 'vcw'], ['Consumer use agreement', 'cua'], ['Proposition 65', 'prop65']];
  const linkList = (list) => list.map(([label, page]) => `<li><a href="${url.page(page)}">${esc(label)}</a></li>`).join('');

  function footer() {
    return `<footer class="rr-footer">
      <div class="rr-footer-rails" aria-hidden="true"></div>
      <div class="rr-wrap rr-footer-grid">
        <div class="rr-footer-brand">
          <a class="rr-logo" href="${url.home}" aria-label="RedRail Performance home">${logo(true)}</a>
          <p>Stainless headers, downpipes, test pipes and intakes at straight prices. Built to bolt on, priced to make sense.</p>
        </div>
        <div><h3>Shop</h3><ul><li><a href="${url.all}">All parts</a></li>${CAT.categories.map((c) => `<li><a href="${url.cat(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul></div>
        <div><h3>Help</h3><ul>${linkList(HELP_LINKS)}</ul></div>
        <div><h3>Company</h3><ul>${linkList(COMPANY_LINKS)}<li><a href="${url.page('account')}">My account</a></li></ul></div>
        <div><h3>Legal</h3><ul>${linkList(LEGAL_LINKS)}</ul></div>
      </div>
      <div class="rr-wrap rr-footer-bottom">
        <p>&copy; 2026 RedRail Performance. All rights reserved.</p>
        <p class="rr-preview-note">Design preview: sample products, prices, reviews and orders. Nothing here can be bought. <a href="${url.page('emails')}">See the email designs</a></p>
      </div>
    </footer>`;
  }

  function overlays(withChat = true) {
    return `<div class="rr-overlay" id="rrMenu" hidden>
      <div class="rr-overlay-backdrop" data-close-overlay></div>
      <aside class="rr-panel rr-panel-left" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="rr-panel-head"><span class="rr-logo">${logo()}</span><button class="rr-icon-btn" type="button" data-close-overlay aria-label="Close menu">${icon('x')}</button></div>
        <div class="rr-panel-body">
          <p class="rr-panel-label">Shop</p>
          <ul class="rr-menu-cats">
            <li><a href="${url.all}"><span class="rr-menu-art">${art(byId('accord-94-97-header'))}</span>All parts${icon('chev')}</a></li>
            ${CAT.categories.map((c) => `<li><a href="${url.cat(c.id)}"><span class="rr-menu-art">${catArt(c)}</span>${esc(c.name)}${icon('chev')}</a></li>`).join('')}
          </ul>
          <p class="rr-panel-label">Help</p>
          <ul class="rr-menu-links">${linkList(HELP_LINKS)}<li><a href="${url.page('account')}">My account</a></li></ul>
        </div>
      </aside>
    </div>
    <div class="rr-overlay" id="rrCart" hidden>
      <div class="rr-overlay-backdrop" data-close-overlay></div>
      <aside class="rr-panel rr-panel-right" role="dialog" aria-modal="true" aria-labelledby="rrCartTitle">
        <div class="rr-panel-head"><h2 id="rrCartTitle">Your cart</h2><button class="rr-icon-btn" type="button" data-close-overlay aria-label="Close cart">${icon('x')}</button></div>
        <div class="rr-panel-body" id="rrCartBody"></div>
      </aside>
    </div>
    <div class="rr-toast" id="rrToast" role="status" aria-live="polite"></div>
    ${withChat ? `<button class="rr-chat-launch" type="button" data-open-chat aria-label="Chat with RedRail support" aria-controls="rrChat" aria-expanded="false">${icon('chat')}<span>Help</span></button>
    <section class="rr-chat" id="rrChat" hidden role="dialog" aria-labelledby="rrChatTitle">
      <div class="rr-chat-head"><div><b id="rrChatTitle">RedRail help</b><small>We're here 24/7</small></div><button class="rr-icon-btn" type="button" data-close-chat aria-label="Close chat">${icon('x')}</button></div>
      <div class="rr-chat-body" id="rrChatBody" aria-live="polite"><div class="rr-bubble is-team"><small>RedRail support</small><p>Hi! We’re here to help with orders, shipping, returns and part fitment. What can we do for you?</p></div></div>
      <form class="rr-chat-form" id="rrChatForm" novalidate><label class="rr-visually-hidden" for="rrChatInput">Message</label><input id="rrChatInput" placeholder="Type a message" autocomplete="off"><button class="rr-btn rr-btn-red rr-btn-sm" type="submit">Send</button></form>
      <p class="rr-chat-note">Preview: replies aren't live yet.</p>
    </section>` : ''}`;
  }

  function openChat() {
    const panel = document.getElementById('rrChat');
    if (!panel) return;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    $$('[data-open-chat].rr-chat-launch').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => { const input = document.getElementById('rrChatInput'); if (input) input.focus(); }, 30);
  }
  function closeChat() {
    const panel = document.getElementById('rrChat');
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-open');
    panel.hidden = true;
    $$('[data-open-chat].rr-chat-launch').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.focus(); });
  }

  function updateBadges() {
    const n = cart.count();
    $$('.rr-cart-count').forEach((el) => { el.textContent = n; el.classList.toggle('is-empty', n === 0); });
    $$('.rr-cart-total').forEach((el) => { el.textContent = money(cart.subtotal()); });
  }

  let lastFocus = null;
  function openOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    lastFocus = document.activeElement;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    document.documentElement.classList.add('rr-lock');
    const focusable = $('[data-close-overlay].rr-icon-btn', el) || $('button, a, select, input', el);
    if (focusable) setTimeout(() => focusable.focus(), 30);
  }
  function closeOverlay(el) {
    if (!el || el.hidden) return;
    el.classList.remove('is-open');
    setTimeout(() => { el.hidden = true; }, 220);
    if (!$$('.rr-overlay.is-open').length) document.documentElement.classList.remove('rr-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function toast(text) {
    const el = document.getElementById('rrToast');
    if (!el) return;
    el.innerHTML = `${icon('check')}<span>${esc(text)}</span>`;
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  function renderCartDrawer(addedId) {
    const body = document.getElementById('rrCartBody');
    if (!body) return;
    const lines = cart.read();
    const sub = cart.subtotal();
    if (!lines.length) {
      body.innerHTML = `<div class="rr-empty-small">${icon('cart')}<p>Your cart is empty.</p><a class="rr-btn rr-btn-red" href="${url.all}">Shop parts</a></div>`;
      return;
    }
    const added = addedId ? byId(addedId) : null;
    const extra = ['header-install-kit', 'o2-spacer-90-pair', 'slant-tip-3-4'].map(byId).filter((p) => !lines.some((l) => l.id === p.id)).slice(0, 2);
    body.innerHTML = `${added ? `<p class="rr-added-msg">${icon('check')}Added to your cart</p>` : ''}
      ${shipProgress(sub)}
      <ul class="rr-mini-lines">${lines.map((l) => { const p = byId(l.id); return `<li class="${added && added.id === p.id ? 'is-new' : ''}">
        <a class="rr-mini-art" href="${url.product(p)}">${art(p)}</a>
        <div><a href="${url.product(p)}">${esc(title(p))}</a><span>Qty ${l.qty} &middot; ${money(price(p))}</span></div>
        <strong>${money(price(p) * l.qty)}</strong></li>`; }).join('')}</ul>
      <div class="rr-mini-total"><span>Subtotal</span><strong>${money(sub)}</strong></div>
      <div class="rr-mini-actions"><a class="rr-btn rr-btn-red rr-btn-block" href="${url.page('checkout')}">${icon('lock')}Checkout</a><a class="rr-btn rr-btn-outline rr-btn-block" href="${url.page('cart')}">View cart</a></div>
      ${extra.length ? `<div class="rr-mini-upsell"><p>Most people also grab</p>${extra.map((p) => `<div class="rr-upsell-row"><span class="rr-mini-art">${art(p)}</span><a href="${url.product(p)}">${esc(title(p))}</a><button class="rr-add rr-add-sm" type="button" data-add="${p.id}" data-stay aria-label="Add ${esc(title(p))}">${icon('plus')}<span>${money(price(p))}</span></button></div>`).join('')}</div>` : ''}`;
  }

  function bindHeaderSearch() {
    const form = $('.rr-search');
    if (!form) return;
    const input = $('input', form);
    const box = $('.rr-suggest', form);
    const show = () => {
      const q = input.value.trim();
      if (q.length < 2) { box.hidden = true; return; }
      const found = searchProducts(q);
      box.innerHTML = found.length
        ? `${found.slice(0, 5).map((p) => `<a class="rr-suggest-row" href="${url.product(p)}"><span class="rr-mini-art">${art(p)}</span><span class="rr-suggest-title">${highlight(title(p), q)}</span><b>${money(price(p))}</b></a>`).join('')}<a class="rr-suggest-all" href="${url.search(q)}">See all ${found.length} result${found.length === 1 ? '' : 's'} for &ldquo;${esc(q)}&rdquo;${icon('chev')}</a>`
        : `<p class="rr-suggest-none">No parts match &ldquo;${esc(q)}&rdquo;. Try a car, like &ldquo;Civic&rdquo;.</p>`;
      box.hidden = false;
    };
    input.addEventListener('input', show);
    input.addEventListener('focus', show);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') box.hidden = true; });
    form.addEventListener('submit', (e) => { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });
  }

  // ------------------------------------------------------------------ pages
  const PAGES = {};
  let onCartChange = null; // the cart page sets this so it redraws when something is added
  let onWishChange = null; // the account wishlist tab sets this

  // Price bands, shared by the home page "Shop by price" strip and the collection filter.
  const BANDS = { all: [0, Infinity, 'Any price'], u50: [0, 50, 'Under $50'], '50-100': [50, 100, '$50 to $100'], '100-150': [100, 150, '$100 to $150'], o150: [150, Infinity, '$150 and up'] };
  const inBand = (p, band) => { const [lo, hi] = BANDS[band] || BANDS.all; return price(p) >= lo && price(p) < hi; };

  PAGES.home = () => {
    const hero = byId('accord-94-97-header');
    const best = P.slice().sort((a, b) => (b.best - a.best) || (b.reviewCount - a.reviewCount)).filter((p) => p.stock > 0).slice(0, 8);
    const fresh = P.filter((p) => p.isNew);
    const homeReviews = [byId('wrx-08-14-downpipe'), byId('accord-94-97-header'), byId('370z-09-20-test-pipes')].map((p) => ({ p, r: CAT.featuredReview(p) }));
    return {
      title: 'Headers, Downpipes and Intakes at Straight Prices',
      html: `
      <section class="rr-hero">
        <div class="rr-hero-rails" aria-hidden="true"></div>
        <div class="rr-wrap rr-hero-grid">
          <div class="rr-hero-copy">
            <p class="rr-kicker"><span class="rr-tick"></span>Bolt-on parts &middot; Straight prices</p>
            <h1 class="rr-hero-title">More power.<br><em>Less money.</em></h1>
            <p class="rr-hero-sub">Stainless headers, downpipes, test pipes and intakes for the cars you actually drive. Free shipping over $${FREE_SHIP}, a warranty on every part and real help 24/7.</p>
            <div class="rr-hero-ctas">
              <a class="rr-btn rr-btn-red rr-btn-lg" href="${url.all}">Shop all parts${icon('chev')}</a>
              <a class="rr-btn rr-btn-outline rr-btn-lg" href="#best-sellers">${icon('star')}See best sellers</a>
            </div>
            <ul class="rr-hero-stats">
              <li><b>${P.length}</b><span>parts in stock</span></li>
              <li><b>4.7<i>&#9733;</i></b><span>average rating</span></li>
              <li><b>$${FREE_SHIP}+</b><span>ships free</span></li>
            </ul>
          </div>
          <a class="rr-hero-card" href="${url.product(hero)}">
            <span class="rr-hero-stamp"><small>The</small>$100<small>header</small></span>
            <span class="rr-hero-art">${art(hero)}</span>
            <span class="rr-hero-tag"><span><small>Best seller</small>${esc(title(hero))}</span>${priceTag(price(hero))}</span>
          </a>
        </div>
      </section>

      <section class="rr-pricebar" aria-labelledby="priceTitle">
        <div class="rr-wrap rr-pricebar-inner">
          <div class="rr-pricebar-copy"><h2 id="priceTitle">Shop by price</h2><p>Every part, sorted by what you want to spend.</p></div>
          <div class="rr-pricebar-links">${['u50', '50-100', '100-150', 'o150'].map((b) => `<a class="rr-price-band" href="${url.all}?price=${b}"><b>${BANDS[b][2].replace(' to ', '–')}</b><span>${P.filter((p) => inBand(p, b)).length} parts</span></a>`).join('')}</div>
        </div>
      </section>

      <section class="rr-section">
        <div class="rr-wrap">
          <div class="rr-section-head"><h2>Shop by category</h2><a href="${url.all}">View all parts${icon('chev')}</a></div>
          <div class="rr-cats">${CAT.categories.map((c) => {
            const list = P.filter((p) => p.category === c.id);
            const from = Math.min(...list.map(price));
            return `<a class="rr-cat" href="${url.cat(c.id)}"><span class="rr-cat-art">${catArt(c)}</span><span class="rr-cat-name">${esc(c.name)}</span><span class="rr-cat-from">${list.length} parts &middot; from <b>${money(from)}</b></span></a>`;
          }).join('')}</div>
        </div>
      </section>

      <section class="rr-section rr-section-soft" id="best-sellers">
        <div class="rr-wrap">
          <div class="rr-section-head"><h2>Best sellers</h2><a href="${url.all}">Shop all${icon('chev')}</a></div>
          ${grid(best)}
        </div>
      </section>

      <section class="rr-promo">
        <div class="rr-wrap rr-promo-inner">
          <div class="rr-promo-copy">
            <p class="rr-kicker rr-kicker-light"><span class="rr-tick"></span>Why it costs less</p>
            <h2>T304 stainless.<br>Priced like it isn't.</h2>
            <p>We sell direct, keep the catalog tight and skip the fancy boxes. You get the same thick flanges and back-purged TIG welds for a lot less.</p>
            <a class="rr-btn rr-btn-white rr-btn-lg" href="${url.cat('downpipe')}">Shop downpipes${icon('chev')}</a>
          </div>
          <div class="rr-promo-art">
            <a href="${url.product(byId('wrx-08-14-downpipe'))}" class="rr-promo-item"><span class="rr-promo-img">${art(byId('wrx-08-14-downpipe'))}</span><b>WRX downpipe</b>${priceTag(price(byId('wrx-08-14-downpipe')))}</a>
            <a href="${url.product(byId('civic-06-11-intake'))}" class="rr-promo-item"><span class="rr-promo-img">${art(byId('civic-06-11-intake'))}</span><b>Civic intake</b>${priceTag(price(byId('civic-06-11-intake')))}</a>
          </div>
        </div>
      </section>

      <section class="rr-section">
        <div class="rr-wrap">
          <div class="rr-section-head"><h2>Just landed</h2><a href="${url.all}?sort=new">See what's new${icon('chev')}</a></div>
          ${grid(fresh)}
        </div>
      </section>

      <section class="rr-section rr-section-soft">
        <div class="rr-wrap rr-home-reviews">
          <div class="rr-review-score">
            <p class="rr-big-score">4.7</p>${stars(4.7)}
            <p>from ${P.reduce((a, p) => a + p.reviewCount, 0).toLocaleString()} reviews</p>
            <a class="rr-btn rr-btn-outline" href="${url.page('reviews')}">Read reviews</a>
          </div>
          <div class="rr-review-cards">${homeReviews.map(({ p, r }) => `<figure class="rr-review-card">${stars(r.rating)}<blockquote><b>${esc(r.title)}</b><p>${esc(r.body)}</p></blockquote><figcaption><span>${esc(r.name)} &middot; ${esc(r.vehicle)}</span><a href="${url.product(p)}">${esc(title(p))}</a></figcaption></figure>`).join('')}</div>
        </div>
      </section>

      <section class="rr-newsletter">
        <div class="rr-wrap rr-newsletter-inner">
          <div><h2>Get the deal drops</h2><p>One email when prices drop or new parts land. No spam.</p></div>
          <form class="rr-inline-form" id="newsForm" novalidate>
            <label class="rr-visually-hidden" for="newsEmail">Email address</label>
            <input id="newsEmail" type="email" placeholder="you@email.com" required>
            <button class="rr-btn rr-btn-red" type="submit">Sign me up</button>
          </form>
          <p class="rr-form-msg" id="newsMsg" role="status"></p>
        </div>
      </section>`,
      after() {
        document.getElementById('newsForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('newsEmail');
          const msg = document.getElementById('newsMsg');
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { msg.textContent = 'Enter a valid email address.'; msg.className = 'rr-form-msg is-bad'; email.focus(); return; }
          msg.textContent = 'You’re on the list. (Preview: nothing was sent.)';
          msg.className = 'rr-form-msg is-ok';
          email.value = '';
        });
      },
    };
  };

  PAGES.collection = () => {
    const c = catById(params.get('category'));
    const SORTS = { featured: 'Featured', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', rating: 'Top rated', new: 'Newest' };
    const state = { stock: false, band: BANDS[params.get('price')] ? params.get('price') : 'all', sort: SORTS[params.get('sort')] ? params.get('sort') : 'featured' };
    const base = c ? P.filter((p) => p.category === c.id) : P.slice();
    const draw = () => {
      let list = base.filter((p) => !(state.stock && p.stock <= 0) && inBand(p, state.band));
      const sorters = {
        featured: (a, b) => (b.best - a.best) || (b.reviewCount - a.reviewCount),
        'price-asc': (a, b) => price(a) - price(b),
        'price-desc': (a, b) => price(b) - price(a),
        rating: (a, b) => b.rating - a.rating,
        new: (a, b) => (b.isNew - a.isNew) || (b.reviewCount - a.reviewCount),
      };
      list = list.sort(sorters[state.sort] || sorters.featured);
      document.getElementById('colCount').textContent = `${list.length} part${list.length === 1 ? '' : 's'}`;
      document.getElementById('colGrid').innerHTML = list.length ? grid(list) : `<div class="rr-empty">${icon('search')}<h2>No parts match those filters</h2><p>Try a different price or turn off a filter.</p><button class="rr-btn rr-btn-red" type="button" id="colReset">Clear filters</button></div>`;
      const reset = document.getElementById('colReset');
      if (reset) reset.addEventListener('click', () => { Object.assign(state, { stock: false, band: 'all' }); syncControls(); draw(); });
    };
    const syncControls = () => {
      document.getElementById('fStock').checked = state.stock;
      document.getElementById('fBand').value = state.band;
      document.getElementById('fSort').value = state.sort;
    };
    return {
      title: c ? `${c.name}` : 'All Parts',
      html: `
      <section class="rr-page-head">
        <div class="rr-wrap">
          ${crumbs([['Home', url.home], ['Shop', url.all], ...(c ? [[c.name]] : [])])}
          <div class="rr-page-head-row">
            <div><h1 class="rr-page-title">${esc(c ? c.name : 'All parts')}</h1><p class="rr-page-sub">${esc(c ? c.blurb : 'Every RedRail part in one place, at straight prices.')}</p></div>
            ${c ? `<span class="rr-page-art">${catArt(c)}</span>` : ''}
          </div>
        </div>
      </section>
      <div class="rr-wrap">
        <div class="rr-chips" role="navigation" aria-label="Categories">
          <a class="rr-chip${c ? '' : ' is-on'}" href="${url.all}">All parts</a>
          ${CAT.categories.map((x) => `<a class="rr-chip${c && c.id === x.id ? ' is-on' : ''}" href="${url.cat(x.id)}">${esc(x.name)}</a>`).join('')}
        </div>
        <div class="rr-toolbar">
          <div class="rr-toolbar-filters">
            <label class="rr-toggle"><input type="checkbox" id="fStock"><span class="rr-toggle-ui"></span>In stock</label>
          </div>
          <div class="rr-toolbar-selects">
            <label class="rr-select"><span>Price</span><select id="fBand">${Object.entries(BANDS).map(([k, b]) => `<option value="${k}">${b[2]}</option>`).join('')}</select></label>
            <label class="rr-select"><span>Sort</span><select id="fSort">${Object.entries(SORTS).map(([k, s]) => `<option value="${k}">${s}</option>`).join('')}</select></label>
            <span class="rr-count" id="colCount" aria-live="polite"></span>
          </div>
        </div>
        <div id="colGrid"></div>
      </div>`,
      after() {
        syncControls();
        document.getElementById('fStock').addEventListener('change', (e) => { state.stock = e.target.checked; draw(); });
        document.getElementById('fBand').addEventListener('change', (e) => { state.band = e.target.value; draw(); });
        document.getElementById('fSort').addEventListener('change', (e) => { state.sort = e.target.value; draw(); });
        draw();
      },
    };
  };

  PAGES.search = () => {
    const q = (params.get('q') || '').trim();
    const results = q ? searchProducts(q) : [];
    const state = { cat: '' };
    const TRY = ['headers', 'downpipe', 'test pipes', 'intake', 'flange', 'resonator', 'HDR-1001'];
    const row = (p) => `<article class="rr-row">
        <a class="rr-row-media" href="${url.product(p)}" tabindex="-1" aria-hidden="true">${art(p)}</a>
        <div class="rr-row-info">
          <p class="rr-row-cat">${esc(p.categoryName)} &middot; ${esc(p.sku)}</p>
          <h3><a href="${url.product(p)}">${highlight(title(p), q)}</a></h3>
          <p class="rr-row-fit">${p.universal ? 'Universal fit' : `Fits: ${highlight(fitText(p), q)}`}</p>
          <p class="rr-row-rating">${stars(p.rating)}<span>${p.rating} (${p.reviewCount})</span><span class="${p.stock > 0 ? 'rr-in' : 'rr-outtxt'}">${p.stock > 0 ? 'In stock' : 'Sold out'}</span></p>
        </div>
        <div class="rr-row-buy">
          ${priceTag(price(p))}
          <span class="rr-row-ship">${price(p) >= FREE_SHIP ? 'Free shipping' : `Free shipping over $${FREE_SHIP}`}</span>
          ${p.stock > 0 ? `<button class="rr-btn rr-btn-red rr-btn-sm" type="button" data-add="${p.id}">${icon('cart')}Add to cart</button>` : `<a class="rr-btn rr-btn-outline rr-btn-sm" href="${url.product(p)}">View part</a>`}
        </div>
      </article>`;
    const draw = () => {
      const list = results.filter((p) => !state.cat || p.category === state.cat);
      document.getElementById('searchList').innerHTML = list.map(row).join('');
      $$('[data-facet]').forEach((b) => { b.classList.toggle('is-on', b.dataset.facet === state.cat); b.setAttribute('aria-pressed', String(b.dataset.facet === state.cat)); });
    };
    const facets = CAT.categories.map((c) => [c, results.filter((p) => p.category === c.id).length]).filter(([, n]) => n);
    return {
      title: q ? `Search: ${q}` : 'Search',
      html: `
      <section class="rr-search-head">
        <div class="rr-wrap">
          <form class="rr-search-big" action="${BASE}/search/" method="get" role="search">
            ${icon('search')}<input name="q" type="search" value="${esc(q)}" placeholder="Search parts or part numbers" aria-label="Search parts">
            <button class="rr-btn rr-btn-red" type="submit">Search</button>
          </form>
          ${q ? `<h1 class="rr-search-title">${results.length ? `<b>${results.length}</b> result${results.length === 1 ? '' : 's'} for` : 'No results for'} <span>&ldquo;${esc(q)}&rdquo;</span></h1>` : '<h1 class="rr-search-title">Search the catalog</h1>'}
          <p class="rr-try">Try: ${TRY.map((t) => `<a href="${url.search(t)}">${esc(t)}</a>`).join('')}</p>
        </div>
      </section>
      <div class="rr-wrap">
        ${results.length ? `
        <div class="rr-search-layout">
          <aside class="rr-facets" aria-label="Filter results">
            <p class="rr-facets-title">Category</p>
            <div class="rr-facet-list">
              <button type="button" class="rr-facet is-on" data-facet="" aria-pressed="true">All results<span>${results.length}</span></button>
              ${facets.map(([c, n]) => `<button type="button" class="rr-facet" data-facet="${c.id}" aria-pressed="false">${esc(c.name)}<span>${n}</span></button>`).join('')}
            </div>
            <div class="rr-facet-help">${icon('chat')}<p>Can't find a part? Tell us what you need.</p><a class="rr-link-btn" href="${url.page('contact')}">Ask us</a></div>
          </aside>
          <div class="rr-results" id="searchList"></div>
        </div>` : `
        <div class="rr-empty">${icon('search')}<h2>${q ? 'Nothing matched that search' : 'What are you looking for?'}</h2><p>${q ? 'Check the spelling, search by car (like &ldquo;Accord&rdquo;) or by part (like &ldquo;header&rdquo;).' : 'Search by car, part or part number.'}</p></div>
        <div class="rr-section-head"><h2>Best sellers</h2></div>
        ${grid(P.filter((p) => p.best).slice(0, 4))}`}
      </div>`,
      after() {
        if (!results.length) return;
        $$('[data-facet]').forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.facet; draw(); }));
        draw();
      },
    };
  };

  const COMPLEMENTS = {
    header: ['header-install-kit', 'o2-spacer-90-pair'],
    downpipe: ['flange-3-bolt-3in', 'o2-spacer-90-pair'],
    'test-pipe': ['resonator-3in', 'slant-tip-3-4'],
    'cold-air-intake': ['slant-tip-3-4', 'resonator-3in'],
    'cnc-part': ['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in'],
    'more-products': ['slant-tip-3-4', 'header-install-kit', 'resonator-3in'],
  };

  function describe(p) {
    const c = catById(p.category);
    const where = p.universal ? 'a wide range of builds' : p.fits.map((f) => `the ${f.from}–${f.to} ${f.make} ${f.model}`).join(' and the ');
    const lines = {
      header: `Swap the restrictive factory manifold for equal-length style primaries that flow better and spool cleaner. Built for ${where} with the ${p.engine}.`,
      downpipe: `Replace the cramped factory downpipe with a full 3" path off the turbo. Built for ${where} with the ${p.engine}. A tune is strongly recommended.`,
      'test-pipe': `Straight-through pipe that replaces the factory section for ${where}. For off-road and competition use.`,
      'cold-air-intake': `Pulls cooler air from outside the engine bay through a washable filter. Built for ${where} with the ${p.engine}.`,
      'cnc-part': `Machined from solid stock for a flat, true sealing face. Fits ${where}.`,
      'more-products': `A simple, well-made part that finishes the job. Works on ${where}.`,
    };
    return `<p>${esc(lines[p.category] || c.blurb)}</p><p>${esc(c.blurb)} Every RedRail part is checked before it ships and comes with a ${p.warranty} warranty against defects like cracked welds and warped flanges.</p>`;
  }
  const isOffroad = (p) => p.category === 'downpipe' || p.category === 'test-pipe';

  PAGES.product = () => {
    const p = byId(params.get('p'));
    if (!p) {
      return { title: 'Part not found', html: `<div class="rr-wrap"><div class="rr-empty">${icon('search')}<h1>We couldn't find that part</h1><p>It may have moved. Search or browse below.</p><a class="rr-btn rr-btn-red" href="${url.all}">Shop all parts</a></div></div>` };
    }
    const c = catById(p.category);
    const out = p.stock <= 0;
    const reviews = CAT.reviewsFor(p);
    const reviewCard = (r) => `<article class="rr-review">
              <div class="rr-review-top">${stars(r.rating)}<b>${esc(r.title)}</b></div>
              <p>${esc(r.body)}</p>
              <p class="rr-review-by">${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''} &middot; ${niceDate(r.date)}${r.verified ? ` <span class="rr-verified">${icon('check')}Verified buyer</span>` : ''}</p>
            </article>`;
    const related = P.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    const bundle = [p, ...(COMPLEMENTS[p.category] || []).filter((id) => id !== p.id).slice(0, 2).map(byId)];
    const split = CAT.ratingSplit(p);
    const dist = [5, 4, 3, 2, 1].map((s, i) => [s, split[i]]);
    // What the part fits, as plain text from the product listing. Nothing to pick or check.
    const fitBox = p.universal
      ? `<div class="rr-fitbox">${icon('wrench')}<div><b>Universal part</b><span>Check the sizes under Specs before ordering.</span></div></div>`
      : `<div class="rr-fitbox">${icon('wrench')}<div><b>Fits ${esc(fitText(p))}</b><span>${esc(p.engine)}. Questions? <a href="${url.page('contact')}">Ask us</a> before you order.</span></div></div>`;
    const bullets = Object.entries(p.specs).filter(([k]) => k !== 'Engine').slice(0, 4);
    const views = [['main', 'Front'], ['flip', 'Side'], ['detail', 'Close-up'], ['box', 'In the box']];
    return {
      title: title(p),
      html: `
      <div class="rr-wrap">
        ${crumbs([['Home', url.home], [c.name, url.cat(c.id)], [title(p)]])}
        <div class="rr-pdp">
          <div class="rr-gallery">
            <div class="rr-gallery-main" id="gMain">${art(p)}</div>
            ${p.best ? '<span class="rr-badge rr-gallery-badge">Best seller</span>' : p.isNew ? '<span class="rr-badge rr-badge-ink rr-gallery-badge">New</span>' : ''}
            <div class="rr-thumbs" role="tablist" aria-label="Product pictures">${views.map(([vw, label], i) => `<button type="button" class="rr-thumb${i === 0 ? ' is-on' : ''}" data-view="${vw}" role="tab" aria-selected="${i === 0}" aria-label="${label}">${art(p, vw)}<span>${label}</span></button>`).join('')}</div>
          </div>
          <div class="rr-buybox">
            <p class="rr-pdp-meta"><span>SKU ${esc(p.sku)}</span><span class="${out ? 'rr-outtxt' : 'rr-in'}">${out ? 'Sold out' : p.stock < 10 ? `Only ${p.stock} left` : 'In stock'}</span></p>
            <h1 class="rr-pdp-title">${esc(title(p))}</h1>
            <div class="rr-pdp-subrow"><a class="rr-pdp-rating" href="#reviews">${stars(p.rating)}<span>${p.rating} &middot; ${p.reviewCount} reviews</span></a>${wishButton(p)}</div>
            <div class="rr-pdp-price">${priceTag(price(p), 'rr-price-xl')}<span class="rr-ship-note">${price(p) >= FREE_SHIP ? `${icon('truck')}Free shipping` : `${icon('truck')}Free shipping over $${FREE_SHIP}`}</span></div>
            ${fitBox}
            <ul class="rr-pdp-bullets">${bullets.map(([k, val]) => `<li><span>${esc(k)}</span><b>${esc(val)}</b></li>`).join('')}</ul>
            ${out ? `<div class="rr-soldout-box"><b>Sold out</b><p>More are on the way. Leave your email and we'll tell you once when it's back. This doesn't hold a part for you.</p><form class="rr-inline-form" id="notifyForm" novalidate><input type="email" placeholder="you@email.com" aria-label="Email for restock alert" required><button class="rr-btn rr-btn-black" type="submit">Notify me</button></form><p class="rr-form-msg" id="notifyMsg" role="status"></p></div>` : `
            <div class="rr-buy-row">
              <div class="rr-qty" role="group" aria-label="Quantity"><button type="button" data-step="-1" aria-label="One less">${icon('minus')}</button><input id="pdpQty" type="number" min="1" max="20" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-step="1" aria-label="One more">${icon('plus')}</button></div>
              <button class="rr-btn rr-btn-red rr-btn-lg rr-grow" type="button" id="pdpAdd">${icon('cart')}Add to cart</button>
            </div>
            <button class="rr-btn rr-btn-black rr-btn-block" type="button" id="pdpBuy">Buy it now</button>`}
            <ul class="rr-pdp-trust">
              <li>${icon('truck')}<span>Tracking emailed as soon as it ships</span></li>
              <li>${icon('shield')}<span><b>${esc(p.warranty)}</b> warranty, replacement first</span></li>
              <li>${icon('returns')}<span>${RETURN_DAYS}-day returns on unused parts, free return label</span></li>
            </ul>
            ${isOffroad(p) ? `<p class="rr-legal-note">${icon('wrench')}For off-road and competition use only. Not legal for street use in California or states with similar emissions laws. <a href="${url.page('vcw')}">Read the waiver</a></p>` : ''}
          </div>
        </div>

        ${bundle.length > 1 ? `<section class="rr-bundle" aria-labelledby="bundleTitle">
          <h2 id="bundleTitle">Frequently bought together</h2>
          <div class="rr-bundle-inner">
            <div class="rr-bundle-items">${bundle.map((b, i) => `${i ? '<span class="rr-bundle-plus">+</span>' : ''}<label class="rr-bundle-item"><input type="checkbox" data-bundle="${b.id}" checked${b.stock <= 0 ? ' disabled' : ''}><span class="rr-bundle-art">${art(b)}</span><span class="rr-bundle-name">${i === 0 ? '<i>This part:</i> ' : ''}${esc(title(b))}</span><b>${money(price(b))}</b></label>`).join('')}</div>
            <div class="rr-bundle-buy"><p>Total for selected</p><strong id="bundleTotal"></strong><button class="rr-btn rr-btn-red" type="button" id="bundleAdd">Add selected to cart</button></div>
          </div>
        </section>` : ''}

        <section class="rr-tabs" aria-label="Product details">
          <div class="rr-tablist" role="tablist">
            ${['Description', 'Specs', 'Shipping & returns'].map((t, i) => `<button type="button" role="tab" id="tab${i}" aria-controls="panel${i}" aria-selected="${i === 0}" class="rr-tab${i === 0 ? ' is-on' : ''}" data-tab="${i}">${t}</button>`).join('')}
          </div>
          <div class="rr-tabpanel" role="tabpanel" id="panel0" aria-labelledby="tab0">
            ${describe(p)}
            <h3>In the box</h3><ul class="rr-checklist">${p.inBox.map((x) => `<li>${icon('check')}${esc(x)}</li>`).join('')}</ul>
          </div>
          <div class="rr-tabpanel" role="tabpanel" id="panel1" aria-labelledby="tab1" hidden>
            <table class="rr-spec-table"><tbody>${Object.entries({ SKU: p.sku, Category: c.single, ...p.specs }).map(([k, val]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</tbody></table>
          </div>
          <div class="rr-tabpanel" role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
            <p><b>Shipping:</b> free to the lower 48 states on orders of $${FREE_SHIP} or more, otherwise $${SHIP_FLAT}. Alaska and Hawaii $${SHIP_ZONES.akhi[1]}, Canada $${SHIP_ZONES.ca[1]}, other countries $${SHIP_ZONES.intl[1]}. <a href="${url.page('shipping')}">Shipping details</a>.</p>
            <p><b>Returns:</b> unused, uninstalled parts within ${RETURN_DAYS} days of delivery, with a free return label. Refunds to your card have a 5% restocking fee; choose store credit and there's no fee. <a href="${url.page('refund')}">Return policy</a>.</p>
            <p><b>Warranty:</b> ${esc(p.warranty)} against defects in materials and workmanship. We replace first. <a href="${url.page('warranty')}">Warranty details</a>.</p>
          </div>
        </section>

        <section class="rr-reviews" id="reviews" aria-labelledby="revTitle">
          <div class="rr-section-head"><h2 id="revTitle">Reviews</h2><button class="rr-btn rr-btn-outline rr-btn-sm" type="button" id="writeReview">Write a review</button></div>
          <p class="rr-form-msg" id="reviewMsg" role="status"></p>
          <div class="rr-reviews-grid">
            <div class="rr-review-summary">
              <p class="rr-big-score">${p.rating}</p>${stars(p.rating)}<p>${p.reviewCount} reviews</p>
              <ul class="rr-dist">${dist.map(([s, pct]) => `<li><span>${s}&#9733;</span><span class="rr-dist-bar"><i style="width:${pct}%"></i></span><span>${pct}%</span></li>`).join('')}</ul>
            </div>
            <div class="rr-review-main"><div class="rr-review-tools"><p class="rr-review-count" id="revCount"></p><label class="rr-select"><span>Sort</span><select id="revSort"><option value="new">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></label></div><div class="rr-review-list" id="revList"></div><div class="rr-review-more"><button class="rr-btn rr-btn-outline" type="button" id="revMore"></button><button class="rr-btn rr-btn-outline" type="button" id="revAll"></button></div></div>
          </div>
        </section>

        ${related.length ? `<section class="rr-section rr-related"><div class="rr-section-head"><h2>More ${esc(c.name.toLowerCase())}</h2><a href="${url.cat(c.id)}">See all${icon('chev')}</a></div>${grid(related)}</section>` : ''}
      </div>
      ${out ? '' : `<div class="rr-sticky-buy" id="stickyBuy" aria-hidden="true"><div><b>${esc(title(p))}</b>${priceTag(price(p))}</div><button class="rr-btn rr-btn-red" type="button" data-add="${p.id}" tabindex="-1">${icon('cart')}Add to cart</button></div>`}`,
      after() {
        const main = document.getElementById('gMain');
        $$('.rr-thumb').forEach((t) => t.addEventListener('click', () => {
          main.innerHTML = art(p, t.dataset.view);
          $$('.rr-thumb').forEach((x) => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', String(x === t)); });
        }));
        $$('.rr-tab').forEach((t) => t.addEventListener('click', () => {
          $$('.rr-tab').forEach((x) => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', String(x === t)); });
          $$('.rr-tabpanel').forEach((panel, i) => { panel.hidden = String(i) !== t.dataset.tab; });
        }));
        const qty = document.getElementById('pdpQty');
        if (qty) {
          const clamp = () => { qty.value = Math.max(1, Math.min(20, parseInt(qty.value, 10) || 1)); };
          $$('[data-step]').forEach((b) => b.addEventListener('click', () => { qty.value = (parseInt(qty.value, 10) || 1) + Number(b.dataset.step); clamp(); }));
          qty.addEventListener('change', clamp);
          document.getElementById('pdpAdd').addEventListener('click', () => { clamp(); addToCart(p.id, Number(qty.value)); });
          document.getElementById('pdpBuy').addEventListener('click', () => { clamp(); cart.add(p.id, Number(qty.value)); window.location.href = url.page('checkout'); });
        }
        const notify = document.getElementById('notifyForm');
        if (notify) notify.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = $('input', notify);
          const msg = document.getElementById('notifyMsg');
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
          msg.textContent = ok ? 'Got it. We’ll email you when it’s back. (Preview: nothing was sent.)' : 'Enter a valid email address.';
          msg.className = `rr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
        const total = document.getElementById('bundleTotal');
        if (total) {
          const sum = () => { total.textContent = money($$('[data-bundle]').filter((b) => b.checked && !b.disabled).reduce((a, b) => a + price(byId(b.dataset.bundle)), 0)); };
          $$('[data-bundle]').forEach((b) => b.addEventListener('change', sum));
          sum();
          document.getElementById('bundleAdd').addEventListener('click', () => {
            const picked = $$('[data-bundle]').filter((b) => b.checked && !b.disabled);
            if (!picked.length) { toast('Pick at least one part'); return; }
            picked.forEach((b) => cart.add(b.dataset.bundle, 1));
            renderCartDrawer(picked[0].dataset.bundle);
            openOverlay('rrCart');
          });
        }
        // Every review can be read: a page at a time, or all at once.
        CAT.pageReviews({ reviews: reviews, card: reviewCard, list: document.getElementById('revList'), count: document.getElementById('revCount'), more: document.getElementById('revMore'), all: document.getElementById('revAll'), sort: document.getElementById('revSort') });
        document.getElementById('writeReview').addEventListener('click', () => {
          const msg = document.getElementById('reviewMsg');
          msg.textContent = 'We email you a review link 7 days after delivery. We read every review before it goes up, good or bad. (Preview)';
          msg.className = 'rr-form-msg is-ok';
        });
        const sticky = document.getElementById('stickyBuy');
        const buyBtn = document.getElementById('pdpAdd');
        if (sticky && buyBtn && 'IntersectionObserver' in window) {
          new IntersectionObserver(([entry]) => {
            const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            sticky.classList.toggle('is-on', show);
            sticky.setAttribute('aria-hidden', String(!show));
            $('button', sticky).tabIndex = show ? 0 : -1;
          }).observe(buyBtn);
        }
      },
    };
  };

  function totals(lines, zone = 'us', discount = 0, credit = 0) {
    const sub = lines.reduce((a, l) => a + price(byId(l.id)) * l.qty, 0);
    const off = Math.round(sub * discount * 100) / 100;
    const ship = lines.length ? shipFor(zone, sub - off) : 0;
    const before = sub - off + ship;
    const used = Math.min(credit, before);
    return { sub, off, ship, tax: 0, credit: used, total: Math.round((before - used) * 100) / 100 };
  }
  // When CFOODS can't confirm stock, browsing stays up and checkout pauses. Preview it with ?checkout=paused.
  const checkoutPaused = () => params.get('checkout') === 'paused';
  const pausedNote = () => `<div class="rr-paused" role="status">${icon('clock')}<div><b>Checkout is paused for a few minutes.</b><span>Your cart is saved and you can keep browsing. Try again shortly.</span></div></div>`;

  PAGES.cart = () => {
    const draw = () => {
      const lines = cart.read();
      const holder = document.getElementById('cartHolder');
      if (!lines.length) {
        holder.innerHTML = `<div class="rr-empty">${icon('cart')}<h2>Your cart is empty</h2><p>Start with a best seller, or browse every part.</p><div class="rr-empty-actions"><a class="rr-btn rr-btn-red" href="${url.all}">Shop all parts</a><a class="rr-btn rr-btn-outline" href="${url.all}?price=u50">Parts under $50</a></div></div>
          <div class="rr-section-head"><h2>Best sellers</h2></div>${grid(P.filter((p) => p.best).slice(0, 4))}`;
        return;
      }
      const t = totals(lines);
      holder.innerHTML = `<div class="rr-cart-layout">
        <div class="rr-cart-main">
          ${shipProgress(t.sub)}
          <ul class="rr-lines">${lines.map((l) => { const p = byId(l.id); return `<li class="rr-line">
            <a class="rr-line-art" href="${url.product(p)}">${art(p)}</a>
            <div class="rr-line-info">
              <a class="rr-line-title" href="${url.product(p)}">${esc(title(p))}</a>
              <p class="rr-line-meta">SKU ${esc(p.sku)}</p>
              <p class="rr-line-each">${money(price(p))} each</p>
            </div>
            <div class="rr-qty rr-qty-sm" role="group" aria-label="Quantity for ${esc(title(p))}"><button type="button" data-line-step="-1" data-id="${p.id}" aria-label="One less"${l.qty <= 1 ? ' disabled' : ''}>${icon('minus')}</button><input type="number" min="1" max="20" value="${l.qty}" data-line-qty="${p.id}" aria-label="Quantity"><button type="button" data-line-step="1" data-id="${p.id}" aria-label="One more"${l.qty >= 20 ? ' disabled' : ''}>${icon('plus')}</button></div>
            <strong class="rr-line-total">${money(price(p) * l.qty)}</strong>
            <button class="rr-icon-btn rr-line-remove" type="button" data-remove="${p.id}" aria-label="Remove ${esc(title(p))}">${icon('trash')}</button>
          </li>`; }).join('')}</ul>
          <a class="rr-back-link" href="${url.all}">${icon('back')}Keep shopping</a>
        </div>
        <aside class="rr-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Subtotal (${cart.count()} item${cart.count() === 1 ? '' : 's'})</dt><dd>${money(t.sub)}</dd></div>
            <div><dt>Shipping (lower 48)</dt><dd>${t.ship ? money(t.ship) : '<b class="rr-free">Free</b>'}</dd></div>
            <div><dt>Sales tax</dt><dd>${money(0)}</dd></div>
            <div class="rr-summary-total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
          </dl>
          <p class="rr-summary-small">Alaska, Hawaii, Canada and other countries are priced at checkout.</p>
          ${checkoutPaused() ? `${pausedNote()}<button class="rr-btn rr-btn-red rr-btn-lg rr-btn-block" type="button" disabled>${icon('lock')}Checkout paused</button>` : `<a class="rr-btn rr-btn-red rr-btn-lg rr-btn-block" href="${url.page('checkout')}">${icon('lock')}Checkout</a>`}
          <p class="rr-summary-note">${icon('shield')}Secure checkout &middot; ${RETURN_DAYS}-day returns &middot; Warranty on every part</p>
        </aside>
      </div>
      <section class="rr-section rr-related"><div class="rr-section-head"><h2>Don't forget the small stuff</h2></div>${grid(['header-install-kit', 'o2-spacer-90-pair', 'flange-3-bolt-3in', 'slant-tip-3-4'].map(byId).filter((p) => !lines.some((l) => l.id === p.id)))}</section>`;
    };
    return {
      title: 'Cart',
      html: `<div class="rr-wrap">${crumbs([['Home', url.home], ['Cart']])}<h1 class="rr-page-title">Your cart</h1><div id="cartHolder"></div></div>`,
      after() {
        draw();
        const holder = document.getElementById('cartHolder');
        holder.addEventListener('click', (e) => {
          const step = e.target.closest('[data-line-step]');
          const rm = e.target.closest('[data-remove]');
          if (step) { const line = cart.read().find((l) => l.id === step.dataset.id); if (line) cart.setQty(line.id, line.qty + Number(step.dataset.lineStep)); draw(); }
          if (rm) { cart.remove(rm.dataset.remove); draw(); toast('Removed from cart'); }
        });
        holder.addEventListener('change', (e) => {
          const input = e.target.closest('[data-line-qty]');
          if (input) { cart.setQty(input.dataset.lineQty, parseInt(input.value, 10) || 1); draw(); }
        });
        onCartChange = draw;
      },
    };
  };

  const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  const COUNTRIES = [['US', 'United States'], ['CA', 'Canada'], ['AU', 'Australia'], ['DE', 'Germany'], ['JP', 'Japan'], ['MX', 'Mexico'], ['NZ', 'New Zealand'], ['SE', 'Sweden'], ['GB', 'United Kingdom']];
  const zoneOf = (country, st) => (country === 'US' ? (st === 'AK' || st === 'HI' ? 'akhi' : 'us') : country === 'CA' ? 'ca' : 'intl');
  const zoneLabel = (zone) => (SHIP_ZONES[zone] || SHIP_ZONES.us)[0];
  const signedInUser = () => store.session('rr_preview_user');
  const CREDIT_BALANCE = 15; // sample store credit for the signed-in preview account (see the account ledger)

  PAGES.checkout = () => {
    const lines = cart.read();
    if (!lines.length) {
      return { title: 'Checkout', html: `<div class="rr-wrap"><div class="rr-empty">${icon('cart')}<h1>Your cart is empty</h1><p>Add a part before checking out.</p><a class="rr-btn rr-btn-red" href="${url.all}">Shop all parts</a></div></div>` };
    }
    if (checkoutPaused()) {
      return { title: 'Checkout', html: `<div class="rr-wrap rr-paused-page">${pausedNote()}<p>Nothing was charged. <a href="${url.page('cart')}">Back to your cart</a> or <a href="${url.all}">keep shopping</a>.</p></div>` };
    }
    const user = signedInUser();
    const offroad = lines.map((l) => byId(l.id)).filter(isOffroad);
    const state = { zone: 'us', country: 'US', discount: 0, code: '', useCredit: false };
    const field = (id, label, type = 'text', extra = '') => `<label class="rr-field" for="${id}"><span>${label}</span><input id="${id}" name="${id}" type="${type}" ${extra}><em class="rr-field-err" id="${id}Err"></em></label>`;
    const drawSummary = () => {
      const t = totals(lines, state.zone, state.discount, state.useCredit ? CREDIT_BALANCE : 0);
      document.getElementById('coSummaryBody').innerHTML = `
        <ul class="rr-co-lines">${lines.map((l) => { const p = byId(l.id); return `<li><span class="rr-co-art">${art(p)}<i>${l.qty}</i></span><span>${esc(title(p))}</span><b>${money(price(p) * l.qty)}</b></li>`; }).join('')}</ul>
        <form class="rr-code" id="codeForm" novalidate><label class="rr-visually-hidden" for="code">Discount code</label><input id="code" placeholder="Discount code" value="${esc(state.code)}" autocomplete="off"><button class="rr-btn rr-btn-outline rr-btn-sm" type="submit">Apply</button></form>
        <p class="rr-form-msg" id="codeMsg" role="status">${state.discount ? `Code ${esc(state.code)} applied: ${state.discount * 100}% off` : ''}</p>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>
          ${t.off ? `<div class="rr-discount"><dt>Discount</dt><dd>&minus;${money(t.off)}</dd></div>` : ''}
          <div><dt>Shipping (${esc(zoneLabel(state.zone))})</dt><dd>${t.ship ? money(t.ship) : '<b class="rr-free">Free</b>'}</dd></div>
          <div><dt>Sales tax</dt><dd>${money(0)}</dd></div>
          ${t.credit ? `<div class="rr-discount"><dt>Store credit</dt><dd>&minus;${money(t.credit)}</dd></div>` : ''}
          <div class="rr-summary-total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
        </dl>`;
      document.getElementById('coToggleTotal').textContent = money(t.total);
      document.getElementById('coPlace').innerHTML = `${icon('lock')}Place order &middot; ${money(t.total)}`;
      document.getElementById('shipBox').innerHTML = `<div class="rr-ship-row"><span><b>Standard shipping with tracking</b><small>${esc(zoneLabel(state.zone))}${state.zone === 'us' && t.sub - t.off < FREE_SHIP ? ` &middot; free on orders of $${FREE_SHIP}+` : ''}</small></span><em>${t.ship ? money(t.ship) : '<b class="rr-free">Free</b>'}</em></div>
        ${state.zone === 'ca' || state.zone === 'intl' ? `<p class="rr-co-note">${icon('box')}Import duties, taxes and brokerage fees may be charged by your country on delivery. They are paid by you and are not included here.</p>` : ''}`;
      document.getElementById('codeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('code').value.trim().toUpperCase();
        if (val === 'RAIL10') { state.discount = 0.1; state.code = val; drawSummary(); return; }
        const msg = document.getElementById('codeMsg');
        msg.textContent = val ? 'That code isn’t valid.' : 'Enter a code.';
        msg.className = 'rr-form-msg is-bad';
      });
    };
    return {
      title: 'Checkout',
      chrome: 'checkout',
      html: `
      <div class="rr-wrap rr-checkout">
        <button class="rr-co-toggle" type="button" id="coToggle" aria-expanded="false" aria-controls="coSummary">${icon('cart')}<span>Show order summary</span>${icon('down')}<b id="coToggleTotal"></b></button>
        <form class="rr-co-form" id="coForm" novalidate>
          <ol class="rr-co-steps"><li class="is-on">Contact</li><li>Shipping</li><li>Payment</li></ol>
          <p class="rr-co-guest">${icon('user')}<span>${user ? `Signed in as <b>${esc(user.email)}</b>.` : `Checking out as a guest. <a href="${url.page('login')}">Sign in</a> to use store credit and keep this order in your account.`}</span></p>
          <section class="rr-co-block"><h2>Contact</h2>
            ${field('email', 'Email', 'email', `autocomplete="email" required value="${user ? esc(user.email) : ''}"`)}
            <label class="rr-check"><input type="checkbox" id="optin"> Email me deals and new parts (optional)</label>
          </section>
          <section class="rr-co-block"><h2>Ship to</h2>
            <label class="rr-field" for="country"><span>Country</span><select id="country" autocomplete="country">${COUNTRIES.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></label>
            <div class="rr-field-row">${field('first', 'First name', 'text', 'autocomplete="given-name" required')}${field('last', 'Last name', 'text', 'autocomplete="family-name" required')}</div>
            ${field('address', 'Street address', 'text', 'autocomplete="address-line1" required')}
            ${field('address2', 'Apartment, suite (optional)', 'text', 'autocomplete="address-line2"')}
            <div class="rr-field-row rr-field-row-3">${field('city', 'City', 'text', 'autocomplete="address-level2" required')}
              <label class="rr-field" for="state" id="stateWrap"><span>State</span><select id="state" required autocomplete="address-level1"><option value="">State</option>${STATES.map((s) => `<option>${s}</option>`).join('')}</select><em class="rr-field-err" id="stateErr"></em></label>
              <label class="rr-field" for="region" id="regionWrap" hidden><span>Province / region</span><input id="region" autocomplete="address-level1"><em class="rr-field-err" id="regionErr"></em></label>
              <label class="rr-field" for="zip"><span id="zipLabel">ZIP code</span><input id="zip" name="zip" autocomplete="postal-code" required><em class="rr-field-err" id="zipErr"></em></label></div>
            ${field('phone', 'Phone (for delivery questions)', 'tel', 'autocomplete="tel"')}
          </section>
          <section class="rr-co-block"><h2>Shipping</h2><div id="shipBox"></div></section>
          ${offroad.length ? `<section class="rr-co-block rr-ack"><h2>Before you order</h2>
            <p>These parts are for off-road and competition use only: <b>${offroad.map((p) => esc(title(p))).join(', ')}</b>.</p>
            <label class="rr-check rr-ack-check"><input type="checkbox" id="ack"> <span>I've read the <a href="${url.page('vcw')}" target="_blank" rel="noopener">vehicle compliance waiver</a> and will only use these parts off-road, where it's legal.</span></label>
            <em class="rr-field-err" id="ackErr"></em>
          </section>` : ''}
          <section class="rr-co-block"><h2>Payment</h2>
            <p class="rr-pay-ways"><span>Card</span><span>Apple Pay</span><span>Google Pay</span><span>Link</span></p>
            <div class="rr-pay-placeholder">${icon('lock')}<div><b>Secure payment form goes here</b><p>On the live store, payment details are entered in Stripe's secure form for RedRail's own merchant account, never typed into these pages.</p></div></div>
            ${user ? `<label class="rr-check rr-credit-check"><input type="checkbox" id="useCredit"> <span>Use store credit (<b>${money(CREDIT_BALANCE)}</b> available). You'll confirm with your passkey or authenticator app.</span></label>` : `<p class="rr-co-note">${icon('coin')}Have store credit? <a href="${url.page('login')}">Sign in</a> to use it.</p>`}
            <p class="rr-preview-flag">Design preview: placing this order does not charge anything. It just shows the confirmation page.</p>
          </section>
          <button class="rr-btn rr-btn-red rr-btn-lg rr-btn-block" type="submit" id="coPlace">Place order</button>
          <p class="rr-co-legal">By placing your order you agree to the <a href="${url.page('terms')}">terms</a>, <a href="${url.page('refund')}">return policy</a> and <a href="${url.page('privacy')}">privacy policy</a>.</p>
        </form>
        <aside class="rr-co-summary" id="coSummary" aria-label="Order summary"><h2>Order summary</h2><div id="coSummaryBody"></div></aside>
      </div>`,
      after() {
        const $id = (id) => document.getElementById(id);
        const syncCountry = () => {
          state.country = $id('country').value;
          const us = state.country === 'US';
          $id('stateWrap').hidden = !us;
          $id('regionWrap').hidden = us;
          $id('zipLabel').textContent = us ? 'ZIP code' : 'Postal code';
          state.zone = zoneOf(state.country, $id('state').value);
          drawSummary();
        };
        $id('country').addEventListener('change', syncCountry);
        $id('state').addEventListener('change', syncCountry);
        const credit = $id('useCredit');
        if (credit) credit.addEventListener('change', () => { state.useCredit = credit.checked; drawSummary(); });
        syncCountry();
        const toggle = $id('coToggle');
        toggle.addEventListener('click', () => {
          const open = $id('coSummary').classList.toggle('is-open');
          toggle.setAttribute('aria-expanded', String(open));
          $('span', toggle).textContent = open ? 'Hide order summary' : 'Show order summary';
        });
        const form = $id('coForm');
        form.addEventListener('input', (e) => { const err = $id(`${e.target.id}Err`); if (err) err.textContent = ''; e.target.removeAttribute('aria-invalid'); });
        form.addEventListener('change', (e) => { if (e.target.id === 'ack') $id('ackErr').textContent = ''; });
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const us = state.country === 'US';
          const checks = {
            email: (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.',
            first: (x) => Boolean(x) || 'Enter a first name.',
            last: (x) => Boolean(x) || 'Enter a last name.',
            address: (x) => x.length > 3 || 'Enter a street address.',
            city: (x) => Boolean(x) || 'Enter a city.',
            ...(us ? { state: (x) => Boolean(x) || 'Pick a state.' } : {}),
            ...(state.country === 'CA' ? { region: (x) => Boolean(x) || 'Enter a province.' } : {}),
            zip: (x) => (us ? /^\d{5}(-\d{4})?$/.test(x) || 'Enter a 5-digit ZIP.' : state.country === 'CA' ? /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(x) || 'Enter a postal code like K1A 0B1.' : x.length >= 3 || 'Enter a postal code.'),
          };
          let first = null;
          Object.entries(checks).forEach(([id, test]) => {
            const el = $id(id);
            const res = test(el.value.trim());
            $id(`${id}Err`).textContent = res === true ? '' : res;
            if (res !== true) { el.setAttribute('aria-invalid', 'true'); if (!first) first = el; } else el.removeAttribute('aria-invalid');
          });
          const ack = $id('ack');
          if (ack && !ack.checked) { $id('ackErr').textContent = 'Please confirm you’ve read the waiver for off-road parts.'; if (!first) first = ack; }
          if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
          const t = totals(lines, state.zone, state.discount, state.useCredit ? CREDIT_BALANCE : 0);
          const val = (id) => $id(id).value.trim();
          const countryName = (COUNTRIES.find(([c]) => c === state.country) || [])[1] || '';
          store.session('rr_preview_order', {
            n: `RR-${String(Date.now()).slice(-6)}`,
            email: val('email'), name: `${val('first')} ${val('last')}`, guest: !user,
            address: [val('address'), val('address2'), us ? `${val('city')}, ${val('state')} ${val('zip')}` : `${val('city')} ${val('region')} ${val('zip')}`.replace(/\s+/g, ' ').trim(), us ? '' : countryName].filter(Boolean),
            zone: state.zone, lines, ...t,
          });
          cart.clear();
          window.location.href = url.page('confirmation');
        });
      },
    };
  };

  // Sample orders, dated relative to today: one being packed, one delivered 2 days ago (still returnable),
  // one delivered two weeks ago (return window closed, warranty open) and an older one.
  const SAMPLE_ORDERS = [
    { n: 'RR-104611', date: daysAgo(1), status: 1, items: [['civic-06-11-intake', 1]], credit: 10, tracking: '', carrier: 'UPS Ground' },
    { n: 'RR-104590', date: daysAgo(6), status: 5, items: [['wrx-08-14-downpipe', 1], ['o2-spacer-90-pair', 1]], tracking: '1Z RR4 590 03 1288 4410', carrier: 'UPS Ground' },
    { n: 'RR-104233', date: daysAgo(18), status: 5, items: [['accord-94-97-header', 1], ['header-install-kit', 1]], tracking: '1Z RR4 233 03 1842 7731', carrier: 'UPS Ground' },
    { n: 'RR-103871', date: daysAgo(64), status: 5, items: [['slant-tip-3-4', 2]], tracking: '9400 1112 0261 3871 0042 19', carrier: 'USPS Ground Advantage' },
  ];
  const STEPS = ['Order placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
  const orderTotals = (o) => totals(o.items.map(([id, qty]) => ({ id, qty })), 'us', 0, o.credit || 0);
  const deliveredOn = (o) => (o.status >= 5 ? addDays(o.date, 4) : null);
  const returnUntil = (o) => (deliveredOn(o) ? addDays(deliveredOn(o), RETURN_DAYS) : null);
  const canReturn = (o) => Boolean(returnUntil(o)) && returnUntil(o) >= daysAgo(0);
  function timeline(status, date) {
    const d = new Date(`${date}T12:00:00`);
    return `<ol class="rr-timeline">${STEPS.map((s, i) => {
      const when = new Date(d); when.setDate(d.getDate() + [0, 1, 1, 4, 4][i]);
      const state = i < status ? 'is-done' : i === status ? 'is-now' : '';
      return `<li class="${state}"><span class="rr-dot">${i < status ? icon('check') : ''}</span><b>${s}</b><small>${i < status ? when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : i === status ? 'Next' : ''}</small></li>`;
    }).join('')}</ol>`;
  }
  const signedIn = () => store.session('rr_preview_user') || { first: 'Jamie', last: 'Rivera', email: 'jamie.rivera@example.com' };
  const statusName = (s) => (s >= 5 ? 'Delivered' : STEPS[s - 1] || 'Processing');

  PAGES.confirmation = () => {
    const o = store.session('rr_preview_order') || {
      n: 'RR-104612', email: 'jamie.rivera@example.com', name: 'Jamie Rivera', address: ['1420 Main Street', 'Apt 3', 'Denver, CO 80202'], zone: 'us', guest: true,
      lines: [{ id: 'accord-94-97-header', qty: 1 }, { id: 'header-install-kit', qty: 1 }], ...totals([{ id: 'accord-94-97-header', qty: 1 }, { id: 'header-install-kit', qty: 1 }]),
    };
    return {
      title: 'Order confirmed',
      html: `<div class="rr-wrap rr-confirm">
        <div class="rr-confirm-head">
          <span class="rr-confirm-check">${icon('check')}</span>
          <p class="rr-kicker"><span class="rr-tick"></span>Order ${esc(o.n)}</p>
          <h1>Thanks, ${esc(o.name.split(' ')[0])}. Your parts are on the list.</h1>
          <p>A receipt is on its way to <b>${esc(o.email)}</b>. We'll email tracking as soon as it ships.</p>
        </div>
        <div class="rr-confirm-grid">
          <section class="rr-card-box"><h2>What happens next</h2>${timeline(1, daysAgo(0))}</section>
          <section class="rr-card-box"><h2>Your order</h2>
            <ul class="rr-co-lines">${o.lines.map((l) => { const p = byId(l.id); return p ? `<li><span class="rr-co-art">${art(p)}<i>${l.qty}</i></span><span>${esc(title(p))}</span><b>${money(price(p) * l.qty)}</b></li>` : ''; }).join('')}</ul>
            <dl><div><dt>Subtotal</dt><dd>${money(o.sub)}</dd></div>${o.off ? `<div class="rr-discount"><dt>Discount</dt><dd>&minus;${money(o.off)}</dd></div>` : ''}<div><dt>Shipping (${esc(zoneLabel(o.zone))})</dt><dd>${o.ship ? money(o.ship) : 'Free'}</dd></div>${o.credit ? `<div class="rr-discount"><dt>Store credit</dt><dd>&minus;${money(o.credit)}</dd></div>` : ''}<div class="rr-summary-total"><dt>Total</dt><dd>${money(o.total)}</dd></div></dl>
          </section>
          <section class="rr-card-box"><h2>Shipping to</h2><p>${esc(o.name)}<br>${o.address.map(esc).join('<br>')}</p>
            ${o.guest ? `<h2>Keep track of it</h2><p>Make a RedRail account with <b>${esc(o.email)}</b> to see this order, start returns and get store credit.</p><a class="rr-btn rr-btn-black rr-btn-sm" href="${url.page('signup')}">Create account</a>` : ''}
          </section>
        </div>
        <div class="rr-confirm-actions"><a class="rr-btn rr-btn-red" href="${url.page('track')}?order=${encodeURIComponent(o.n)}">${icon('truck')}Track this order</a><a class="rr-btn rr-btn-outline" href="${url.all}">Keep shopping</a></div>
        <p class="rr-preview-flag">Design preview: no order was placed and nothing was charged.</p>
      </div>`,
    };
  };

  function authShell(kind) {
    const isLogin = kind === 'login';
    return `<div class="rr-wrap rr-auth">
      <div class="rr-auth-card">
        <h1>${isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p class="rr-muted">${isLogin ? 'Track orders, start returns and check out faster.' : 'Takes 30 seconds. See every order in one place.'}</p>
        <form id="authForm" novalidate>
          ${isLogin ? '' : '<div class="rr-field-row"><label class="rr-field"><span>First name</span><input id="aFirst" autocomplete="given-name" required><em class="rr-field-err" id="aFirstErr"></em></label><label class="rr-field"><span>Last name</span><input id="aLast" autocomplete="family-name" required><em class="rr-field-err" id="aLastErr"></em></label></div>'}
          <label class="rr-field"><span>Email</span><input id="aEmail" type="email" autocomplete="email" required><em class="rr-field-err" id="aEmailErr"></em></label>
          <label class="rr-field"><span>Password${isLogin ? '' : ' (8+ characters)'}</span><span class="rr-pass"><input id="aPass" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required><button type="button" class="rr-link-btn" id="aShow" aria-label="Show password">${icon('eye')}</button></span><em class="rr-field-err" id="aPassErr"></em></label>
          ${isLogin ? `<p class="rr-auth-forgot"><button type="button" class="rr-link-btn" id="aForgot">Forgot password?</button></p>` : ''}
          <button class="rr-btn rr-btn-red rr-btn-lg rr-btn-block" type="submit">${isLogin ? 'Sign in' : 'Create account'}</button>
          <p class="rr-form-msg" id="authMsg" role="status"></p>
        </form>
        <p class="rr-auth-switch">${isLogin ? `New to RedRail? <a href="${url.page('signup')}">Create an account</a>` : `Already have an account? <a href="${url.page('login')}">Sign in</a>`}</p>
      </div>
      <aside class="rr-auth-side">
        <h2>Why make an account?</h2>
        <ul class="rr-checklist">
          <li>${icon('truck')}Track every order in one place</li>
          <li>${icon('pin')}Save your address for faster checkout</li>
          <li>${icon('returns')}Start returns in two clicks</li>
          <li>${icon('tag')}Get deal drops before anyone else</li>
        </ul>
        <span class="rr-auth-art">${art(byId('wrx-08-14-downpipe'))}</span>
      </aside>
    </div>`;
  }
  function bindAuth(kind) {
    const form = document.getElementById('authForm');
    const pass = document.getElementById('aPass');
    document.getElementById('aShow').addEventListener('click', (e) => { pass.type = pass.type === 'password' ? 'text' : 'password'; e.currentTarget.setAttribute('aria-label', pass.type === 'password' ? 'Show password' : 'Hide password'); });
    const forgot = document.getElementById('aForgot');
    if (forgot) forgot.addEventListener('click', () => {
      const msg = document.getElementById('authMsg');
      const email = document.getElementById('aEmail').value.trim();
      msg.className = `rr-form-msg ${email ? 'is-ok' : 'is-bad'}`;
      msg.textContent = email ? `If there's an account for ${email}, a reset link is on its way. (Preview: nothing was sent.)` : 'Enter your email first, then press Forgot password.';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rules = [['aEmail', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.'], ['aPass', (x) => (kind === 'login' ? x.length > 0 : x.length >= 8) || (kind === 'login' ? 'Enter your password.' : 'Use at least 8 characters.')]];
      if (kind === 'signup') rules.unshift(['aFirst', (x) => Boolean(x) || 'Enter your first name.'], ['aLast', (x) => Boolean(x) || 'Enter your last name.']);
      let bad = null;
      rules.forEach(([id, test]) => { const el = document.getElementById(id); const r = test(el.value.trim()); document.getElementById(`${id}Err`).textContent = r === true ? '' : r; if (r !== true && !bad) bad = el; });
      if (bad) { bad.focus(); return; }
      const email = document.getElementById('aEmail').value.trim();
      const first = kind === 'signup' ? document.getElementById('aFirst').value.trim() : 'Jamie';
      const last = kind === 'signup' ? document.getElementById('aLast').value.trim() : 'Rivera';
      store.session('rr_preview_user', { first, last, email });
      window.location.href = url.page('account');
    });
  }
  PAGES.login = () => ({ title: 'Sign in', html: authShell('login'), after: () => bindAuth('login') });
  PAGES.signup = () => ({ title: 'Create account', html: authShell('signup'), after: () => bindAuth('signup') });

  // Sample support threads (Messages tab).
  const THREADS = [
    { subject: 'When will my intake ship?', order: 'RR-104611', date: daysAgo(1), status: 'Answered', messages: [
      ['you', 'Hi, I ordered the Civic intake yesterday. When will it ship?'],
      ['team', 'Thanks for your order! RR-104611 is being packed now. You’ll get an email with tracking as soon as the label is made.'],
    ] },
    { subject: 'Will the WRX downpipe fit a 2011 STI?', order: '', date: daysAgo(9), status: 'Answered', messages: [
      ['you', 'Will the 3" downpipe for the 2008–2014 WRX fit my 2011 STI?'],
      ['team', 'Good question. This downpipe is listed for the 2008–2014 Subaru WRX with the 2.5L EJ255. The STI uses a different engine, so we can’t confirm it fits yet. We’re checking with our parts team and will reply here.'],
      ['staff', 'Checked it: the STI’s turbo outlet and length are different, so this one won’t fit. Sorry about that!'],
    ] },
  ];
  const CREDIT_LEDGER = [
    { date: daysAgo(58), what: 'Refund as store credit: 1 × Slant-Cut Exhaust Tip (RR-103871). No restocking fee.', amount: 25 },
    { date: daysAgo(1), what: 'Used on order RR-104611', amount: -10 },
  ];

  PAGES.account = () => {
    const u = signedIn();
    const tabs = [['orders', 'Orders', 'box'], ['messages', 'Messages', 'chat'], ['credit', 'Store credit', 'coin'], ['wishlist', 'Wishlist', 'heart'], ['addresses', 'Addresses', 'pin'], ['security', 'Security', 'lock']];
    const twoStep = () => store.session('rr_preview_2fa') === true;
    let balance = 0;
    const ledger = CREDIT_LEDGER.map((r) => { balance += r.amount; return { ...r, balance }; });
    const drawWishlist = () => {
      const list = wish.read().map(byId);
      document.getElementById('wishHolder').innerHTML = list.length ? grid(list) : `<div class="rr-empty-small">${icon('heart')}<p>Nothing saved yet. Tap <b>Save</b> on any part to keep it here.</p><a class="rr-btn rr-btn-red" href="${url.all}">Shop parts</a></div>`;
    };
    const securityState = () => `<span class="rr-status ${twoStep() ? 's5' : 's3'}">${twoStep() ? 'On' : 'Off'}</span>`;
    const creditGuard = () => (twoStep()
      ? `<p class="rr-credit-guard is-on">${icon('shield')}Protected. You'll confirm with your authenticator app or passkey each time you use credit.</p>`
      : `<p class="rr-credit-guard">${icon('lock')}To use store credit, turn on two-step sign-in or add a passkey. <button class="rr-link-btn" type="button" data-goto="security">Set it up</button></p>`);
    return {
      title: 'My account',
      html: `<div class="rr-wrap">
        ${crumbs([['Home', url.home], ['My account']])}
        <div class="rr-account-head"><div><p class="rr-kicker"><span class="rr-tick"></span>My account</p><h1 class="rr-page-title">Hey, ${esc(u.first)}.</h1><p class="rr-muted">${esc(u.email)}</p></div><button class="rr-btn rr-btn-outline rr-btn-sm" type="button" id="signOut">${icon('out')}Sign out</button></div>
        <div class="rr-account">
          <nav class="rr-account-nav" role="tablist" aria-label="Account sections">${tabs.map(([id, label, ic]) => `<button type="button" role="tab" class="rr-account-tab" data-acct="${id}" aria-selected="false">${icon(ic)}${label}</button>`).join('')}</nav>
          <div class="rr-account-body">
            <section data-acct-panel="orders" role="tabpanel">
              <h2>Orders</h2>
              <ul class="rr-order-list">${SAMPLE_ORDERS.map((o) => { const t = orderTotals(o); return `<li class="rr-order">
                <div class="rr-order-top"><div><b>${o.n}</b><span>${niceDate(o.date)}</span></div><span class="rr-status s${o.status}">${statusName(o.status)}</span><strong>${money(t.total)}</strong></div>
                <div class="rr-order-items">${o.items.map(([id, q]) => `<span class="rr-mini-art" title="${esc(title(byId(id)))}">${art(byId(id))}${q > 1 ? `<i>${q}</i>` : ''}</span>`).join('')}<p>${o.items.map(([id]) => esc(title(byId(id)))).join(', ')}</p></div>
                <div class="rr-order-actions"><a class="rr-btn rr-btn-black rr-btn-sm" href="${url.page('orderview')}?n=${o.n}">View order</a><a class="rr-btn rr-btn-outline rr-btn-sm" href="${url.page('track')}?order=${o.n}">Track</a>${canReturn(o) ? `<a class="rr-btn rr-btn-outline rr-btn-sm" href="${url.page('request')}?type=return&n=${o.n}">Return</a>` : ''}</div>
              </li>`; }).join('')}</ul>
            </section>
            <section data-acct-panel="messages" role="tabpanel" hidden>
              <h2>Messages</h2>
              <p class="rr-muted rr-panel-intro">Your conversations with RedRail support. Message us any time of day; we reply right here and by email.</p>
              <div class="rr-threads">${THREADS.map((th, i) => `<details class="rr-thread"${i === 0 ? ' open' : ''}>
                <summary><span><b>${esc(th.subject)}</b><small>${th.order ? `${th.order} &middot; ` : ''}${niceDate(th.date)}</small></span><span class="rr-status s5">${th.status}</span></summary>
                <div class="rr-bubbles">${th.messages.map(([who, text]) => `<div class="rr-bubble is-${who}"><small>${who === 'you' ? 'You' : who === 'team' ? 'RedRail support' : 'Sam at RedRail'}</small><p>${esc(text)}</p></div>`).join('')}</div>
                <form class="rr-reply" data-reply novalidate><label class="rr-visually-hidden" for="reply${i}">Reply</label><textarea id="reply${i}" rows="2" placeholder="Write a reply"></textarea><button class="rr-btn rr-btn-black rr-btn-sm" type="submit">Send</button></form>
              </details>`).join('')}</div>
              <a class="rr-btn rr-btn-outline" href="${url.page('contact')}">${icon('chat')}Start a new message</a>
            </section>
            <section data-acct-panel="credit" role="tabpanel" hidden>
              <h2>Store credit</h2>
              <div class="rr-credit-card"><div><small>Available</small><strong>${money(balance)}</strong></div><p>RedRail only &middot; never expires &middot; can't be cashed out</p></div>
              <div id="creditGuard">${creditGuard()}</div>
              <div class="rr-table-wrap"><table class="rr-spec-table rr-ledger"><thead><tr><th>Date</th><th>What happened</th><th>Amount</th><th>Balance</th></tr></thead><tbody>${ledger.slice().reverse().map((r) => `<tr><td>${niceDate(r.date)}</td><td>${esc(r.what)}</td><td class="${r.amount > 0 ? 'rr-plus' : 'rr-minus'}">${r.amount > 0 ? '+' : '&minus;'}${money(Math.abs(r.amount))}</td><td>${money(r.balance)}</td></tr>`).join('')}</tbody></table></div>
              <p class="rr-muted rr-small">Store credit comes from refunds you choose to take as credit, or from our support team. Every change is listed here and emailed to you. Credit can pay for parts, shipping and tax, and works with discount codes.</p>
            </section>
            <section data-acct-panel="wishlist" role="tabpanel" hidden>
              <h2>Wishlist</h2>
              <div id="wishHolder"></div>
            </section>
            <section data-acct-panel="addresses" role="tabpanel" hidden>
              <h2>Addresses</h2>
              <div class="rr-address-card"><span class="rr-badge rr-badge-ink">Default</span><p><b>${esc(u.first)} ${esc(u.last)}</b><br>1420 Main Street, Apt 3<br>Denver, CO 80202</p><button class="rr-link-btn" type="button" data-preview-msg="Editing addresses is not part of the preview.">Edit</button></div>
              <p class="rr-muted rr-small">Saved cards are stored by Stripe, our payment processor. RedRail never sees or keeps your full card number.</p>
            </section>
            <section data-acct-panel="security" role="tabpanel" hidden>
              <h2>Security</h2>
              <div class="rr-sec-list">
                <div class="rr-sec-row">
                  <div class="rr-sec-head">${icon('phone')}<div><b>Two-step sign-in</b><span>Use an authenticator app like Google Authenticator. Needed to use store credit.</span></div><span id="twoStepState">${securityState()}</span></div>
                  <div id="twoStepBody">${twoStep() ? '<p class="rr-muted">On. You’ll enter a 6-digit code when you sign in on a new device and each time you use store credit.</p>' : `<button class="rr-btn rr-btn-black rr-btn-sm" type="button" id="twoStepStart">Set up</button>`}</div>
                </div>
                <div class="rr-sec-row">
                  <div class="rr-sec-head">${icon('key')}<div><b>Passkeys</b><span>Sign in with Face ID, Touch ID or your device PIN instead of a password.</span></div></div>
                  <ul class="rr-passkeys" id="passkeyList"></ul>
                  <button class="rr-btn rr-btn-outline rr-btn-sm" type="button" id="addPasskey">Add a passkey</button>
                </div>
                <div class="rr-sec-row">
                  <div class="rr-sec-head">${icon('mail')}<div><b>Emails on this account</b><span>Add other emails you've ordered with, to see those guest orders here.</span></div></div>
                  <p class="rr-email-line"><b>${esc(u.email)}</b> <span class="rr-badge rr-badge-ink">Primary</span></p>
                  <form class="rr-inline-form rr-add-email" id="addEmailForm" novalidate><input type="email" id="addEmail" placeholder="another@email.com" aria-label="Another email address"><button class="rr-btn rr-btn-black" type="submit">Send code</button></form>
                  <p class="rr-form-msg" id="addEmailMsg" role="status"></p>
                </div>
                <form class="rr-sec-row rr-settings-form" id="pwForm" novalidate>
                  <div class="rr-sec-head">${icon('lock')}<div><b>Password</b><span>At least 8 characters.</span></div></div>
                  <label class="rr-field"><span>Current password</span><input type="password" id="pw0" autocomplete="current-password"></label>
                  <label class="rr-field"><span>New password</span><input type="password" id="pw1" autocomplete="new-password"></label>
                  <button class="rr-btn rr-btn-black" type="submit">Update password</button>
                  <p class="rr-form-msg" id="pwMsg" role="status"></p>
                </form>
                <div class="rr-sec-row">
                  <div class="rr-sec-head">${icon('mail')}<div><b>Email preferences</b><span>Order, shipping and account emails always go out.</span></div></div>
                  <label class="rr-toggle"><input type="checkbox" checked disabled><span class="rr-toggle-ui"></span>Order and shipping emails (always on)</label>
                  <label class="rr-toggle"><input type="checkbox" id="optDeals"><span class="rr-toggle-ui"></span>Deals and new parts</label>
                </div>
                <div class="rr-sec-row rr-sec-danger">
                  <div class="rr-sec-head">${icon('trash')}<div><b>Delete account</b><span>Order records and any store credit are kept as the law requires. You can get your credit back later by proving it's you.</span></div></div>
                  <button class="rr-btn rr-btn-outline rr-btn-sm" type="button" data-preview-msg="On the live store this asks you to confirm with your password, then deletes your account.">Delete my account</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>`,
      after() {
        const pick = (id) => {
          const valid = tabs.some(([t]) => t === id) ? id : 'orders';
          $$('[data-acct]').forEach((b) => { b.classList.toggle('is-on', b.dataset.acct === valid); b.setAttribute('aria-selected', String(b.dataset.acct === valid)); });
          $$('[data-acct-panel]').forEach((s) => { s.hidden = s.dataset.acctPanel !== valid; });
        };
        const go = (id) => { pick(id); try { window.history.replaceState(null, '', `#${id}`); } catch (e) { /* ignore */ } };
        $$('[data-acct]').forEach((b) => b.addEventListener('click', () => go(b.dataset.acct)));
        document.querySelector('.rr-account-body').addEventListener('click', (e) => { const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto); });
        pick(window.location.hash.slice(1));
        drawWishlist();
        onWishChange = drawWishlist;
        document.getElementById('signOut').addEventListener('click', () => { store.session('rr_preview_user', null); window.location.href = url.page('login'); });
        $$('[data-reply]').forEach((f) => f.addEventListener('submit', (e) => {
          e.preventDefault();
          const box = $('textarea', f);
          if (!box.value.trim()) { box.focus(); return; }
          box.value = '';
          toast('Sent to RedRail support (preview)');
        }));
        // Two-step sign-in setup (sample: any 6 digits works)
        const body = document.getElementById('twoStepBody');
        const start = document.getElementById('twoStepStart');
        if (start) start.addEventListener('click', () => {
          body.innerHTML = `<div class="rr-totp"><div class="rr-qr" aria-hidden="true"></div><div><p>Scan this with your authenticator app, or type the key:</p><p class="rr-totp-key">RRPV 7K2M 4QXD 9LTA</p>
            <form class="rr-inline-form" id="totpForm" novalidate><input id="totpCode" inputmode="numeric" maxlength="6" placeholder="6-digit code" aria-label="6-digit code" autocomplete="one-time-code"><button class="rr-btn rr-btn-black" type="submit">Turn on</button></form><p class="rr-form-msg" id="totpMsg" role="status"></p></div></div>`;
          document.getElementById('totpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('totpCode').value.trim();
            const msg = document.getElementById('totpMsg');
            if (!/^\d{6}$/.test(code)) { msg.textContent = 'Enter the 6-digit code from your app.'; msg.className = 'rr-form-msg is-bad'; return; }
            store.session('rr_preview_2fa', true);
            body.innerHTML = '<p class="rr-form-msg is-ok">Two-step sign-in is on. Save your recovery codes somewhere safe. (Preview)</p>';
            document.getElementById('twoStepState').innerHTML = securityState();
            document.getElementById('creditGuard').innerHTML = creditGuard();
          });
        });
        const keys = document.getElementById('passkeyList');
        const drawKeys = () => { const list = store.session('rr_preview_passkeys') || []; keys.innerHTML = list.length ? list.map((k) => `<li>${icon('key')}<span>${esc(k)}</span></li>`).join('') : '<li class="rr-muted">No passkeys yet.</li>'; };
        drawKeys();
        document.getElementById('addPasskey').addEventListener('click', () => {
          const list = store.session('rr_preview_passkeys') || [];
          store.session('rr_preview_passkeys', [...list, `This device · added ${niceDate(daysAgo(0))}`]);
          drawKeys();
          toast('Passkey added (preview: your device would ask for Face ID or your PIN)');
        });
        document.getElementById('addEmailForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const v = document.getElementById('addEmail').value.trim();
          const msg = document.getElementById('addEmailMsg');
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          msg.textContent = ok ? `We sent a code to ${v}. Enter it to add the email. (Preview: nothing was sent.)` : 'Enter a valid email address.';
          msg.className = `rr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
        document.getElementById('pwForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const msg = document.getElementById('pwMsg');
          const ok = document.getElementById('pw0').value && document.getElementById('pw1').value.length >= 8;
          msg.textContent = ok ? 'Password updated. (Preview: nothing was saved.)' : 'Enter your current password and a new one with 8+ characters.';
          msg.className = `rr-form-msg ${ok ? 'is-ok' : 'is-bad'}`;
        });
      },
    };
  };

  PAGES.orderview = () => {
    const o = SAMPLE_ORDERS.find((x) => x.n === params.get('n')) || SAMPLE_ORDERS[1];
    const t = orderTotals(o);
    const u = signedIn();
    const returnLine = o.status < 5 ? 'Returns open once it’s delivered.' : canReturn(o) ? `Returns open until ${niceDate(returnUntil(o))}.` : `The return window closed ${niceDate(returnUntil(o))}. Warranty claims are still open.`;
    return {
      title: `Order ${o.n}`,
      html: `<div class="rr-wrap">
        ${crumbs([['Home', url.home], ['My account', url.page('account')], [`Order ${o.n}`]])}
        <div class="rr-account-head"><div><h1 class="rr-page-title">Order ${o.n}</h1><p class="rr-muted">Placed ${niceDate(o.date)} &middot; <span class="rr-status s${o.status}">${statusName(o.status)}</span></p></div><a class="rr-btn rr-btn-outline rr-btn-sm" href="${url.page('account')}">${icon('back')}All orders</a></div>
        <section class="rr-card-box">${timeline(o.status, o.date)}<p class="rr-tracking">${icon('truck')}${o.tracking ? `${esc(o.carrier)} &middot; <b>${esc(o.tracking)}</b>` : 'Tracking is emailed as soon as the label is made.'}</p></section>
        <div class="rr-confirm-grid">
          <section class="rr-card-box"><h2>Items</h2>
            <ul class="rr-co-lines">${o.items.map(([id, q]) => { const p = byId(id); return `<li><span class="rr-co-art">${art(p)}<i>${q}</i></span><span><a href="${url.product(p)}">${esc(title(p))}</a></span><b>${money(price(p) * q)}</b></li>`; }).join('')}</ul>
            <dl><div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div><div><dt>Shipping</dt><dd>${t.ship ? money(t.ship) : 'Free'}</dd></div><div><dt>Sales tax</dt><dd>${money(0)}</dd></div>${t.credit ? `<div class="rr-discount"><dt>Store credit</dt><dd>&minus;${money(t.credit)}</dd></div>` : ''}<div class="rr-summary-total"><dt>Total</dt><dd>${money(t.total)}</dd></div></dl>
          </section>
          <section class="rr-card-box"><h2>Shipped to</h2><p>${esc(u.first)} ${esc(u.last)}<br>1420 Main Street, Apt 3<br>Denver, CO 80202</p><h2>Paid with</h2><p>Visa ending in 4242${t.credit ? ` and ${money(t.credit)} store credit` : ''}</p></section>
          <section class="rr-card-box"><h2>Need something?</h2>
            <p class="rr-muted rr-small">${returnLine}</p>
            <div class="rr-stack">
              ${canReturn(o) ? `<a class="rr-btn rr-btn-black rr-btn-block" href="${url.page('request')}?type=return&n=${o.n}">${icon('returns')}Start a return</a>` : ''}
              ${o.status >= 5 ? `<a class="rr-btn rr-btn-outline rr-btn-block" href="${url.page('request')}?type=warranty&n=${o.n}">${icon('shield')}Warranty claim</a>` : ''}
              ${o.status < 3 ? `<button class="rr-btn rr-btn-outline rr-btn-block" type="button" data-preview-msg="You can cancel before it ships. Refunds to your card have a 5% fee where allowed; choose store credit and there's no fee.">${icon('x')}Cancel order</button>` : ''}
              <a class="rr-btn rr-btn-outline rr-btn-block" href="${url.page('account')}#messages">${icon('chat')}Ask about this order</a>
              ${o.status >= 5 ? `<button class="rr-btn rr-btn-outline rr-btn-block" type="button" data-preview-msg="We email a review link 7 days after delivery. We read every review before it goes up.">${icon('star')}Review your parts</button>` : ''}
            </div>
          </section>
        </div>
      </div>`,
    };
  };

  PAGES.track = () => {
    const n = (params.get('order') || '').trim().toUpperCase();
    const o = n ? (SAMPLE_ORDERS.find((x) => x.n === n) || (/^RR-\d{6}$/.test(n) ? { n, date: daysAgo(0), status: 1, carrier: 'UPS Ground', tracking: '' } : null)) : null;
    return {
      title: 'Track your order',
      html: `<div class="rr-wrap rr-track">
        <div class="rr-track-card">
          <span class="rr-modal-icon">${icon('truck')}</span>
          <h1>Track your order</h1>
          <p class="rr-muted">Enter the order number from your receipt (it starts with RR-).</p>
          <form class="rr-track-form" action="${url.page('track')}" method="get" novalidate>
            <label class="rr-field"><span>Order number</span><input name="order" value="${esc(n)}" placeholder="RR-104590" required></label>
            <label class="rr-field"><span>Email or ZIP code</span><input name="check" value="${esc(params.get('check') || '')}" placeholder="you@email.com"></label>
            <button class="rr-btn rr-btn-red rr-btn-lg" type="submit">Track</button>
          </form>
        </div>
        ${n ? (o ? `<section class="rr-card-box rr-track-result"><div class="rr-track-result-head"><div><p class="rr-kicker"><span class="rr-tick"></span>Order ${esc(o.n)}</p><h2>${statusName(o.status)}</h2></div><span class="rr-status s${o.status}">${statusName(o.status)}</span></div>${timeline(o.status, o.date)}<p class="rr-tracking">${icon('truck')}${o.tracking ? `${esc(o.carrier)} &middot; <b>${esc(o.tracking)}</b>` : 'Tracking is emailed as soon as the label is made.'}</p>${o.status >= 5 ? `<p class="rr-track-more"><a class="rr-btn rr-btn-outline rr-btn-sm" href="${url.page('request')}?n=${o.n}&type=${canReturn(o) ? 'return' : 'warranty'}">${canReturn(o) ? 'Start a return' : 'Start a warranty claim'}</a></p>` : ''}</section>` : `<div class="rr-empty">${icon('search')}<h2>No order matches ${esc(n)}</h2><p>Check the number on your receipt email. Sample numbers: ${SAMPLE_ORDERS.map((x) => `<a href="${url.page('track')}?order=${x.n}">${x.n}</a>`).join(', ')}.</p></div>`) : ''}
      </div>`,
    };
  };

  // Returns and warranty claims: from the account, or as a guest with order number + email.
  PAGES.request = () => {
    const type = params.get('type') === 'warranty' ? 'warranty' : 'return';
    const n = (params.get('n') || '').trim().toUpperCase();
    const o = SAMPLE_ORDERS.find((x) => x.n === n);
    const isReturn = type === 'return';
    const tabsHtml = `<div class="rr-chips rr-req-tabs" role="navigation" aria-label="Request type"><a class="rr-chip${isReturn ? ' is-on' : ''}" href="${url.page('request')}?type=return${o ? `&n=${o.n}` : ''}">Return</a><a class="rr-chip${isReturn ? '' : ' is-on'}" href="${url.page('request')}?type=warranty${o ? `&n=${o.n}` : ''}">Warranty claim</a></div>`;
    const head = `<section class="rr-info-head"><div class="rr-wrap">${crumbs([['Home', url.home], ['Returns & warranty claims']])}<p class="rr-kicker"><span class="rr-tick"></span>Help</p><h1 class="rr-page-title">${isReturn ? 'Start a return' : 'Warranty claim'}</h1><p class="rr-page-sub">${isReturn ? `Unused, uninstalled parts within ${RETURN_DAYS} days of delivery. The return label is free.` : 'A part failed or arrived broken? We replace first.'}</p></div></section>`;
    if (!o) {
      return {
        title: isReturn ? 'Start a return' : 'Warranty claim',
        html: `${head}<div class="rr-wrap rr-request">${tabsHtml}
          <form class="rr-card-box rr-lookup" action="${url.page('request')}" method="get" novalidate>
            <h2>Find your order</h2>
            <input type="hidden" name="type" value="${type}">
            <label class="rr-field"><span>Order number</span><input name="n" value="${esc(n)}" placeholder="RR-104590" required></label>
            <label class="rr-field"><span>Email used for the order</span><input name="email" type="email" placeholder="you@email.com"></label>
            <button class="rr-btn rr-btn-red" type="submit">Continue</button>
            ${n ? `<p class="rr-form-msg is-bad">We couldn't find ${esc(n)}. Check your receipt email.</p>` : ''}
            <p class="rr-muted rr-small">Signed in? Your orders are in <a href="${url.page('account')}">your account</a>. Sample orders: ${SAMPLE_ORDERS.filter((x) => x.status >= 5).map((x) => `<a href="${url.page('request')}?type=${type}&n=${x.n}">${x.n}</a>`).join(', ')}.</p>
          </form></div>`,
      };
    }
    const blocked = isReturn && !canReturn(o)
      ? (o.status < 5 ? 'You can start a return once this order is delivered.' : `The ${RETURN_DAYS}-day return window for this order closed ${niceDate(returnUntil(o))}. If a part failed or arrived broken, start a warranty claim instead.`)
      : (!isReturn && o.status < 5 ? 'Warranty claims open once the order is delivered.' : '');
    const REASONS = isReturn
      ? [['changed', 'Changed my mind'], ['wrong-order', 'Ordered the wrong part'], ['nofit', "Doesn't fit my car"], ['damaged', 'Arrived damaged'], ['wrong-item', 'You sent the wrong item'], ['other', 'Something else']]
      : [['cracked', 'Cracked weld or crack'], ['warped', 'Warped flange or leak'], ['broken', 'Part broke or failed'], ['other', 'Something else']];
    const OUR_FAULT = ['damaged', 'wrong-item'];
    return {
      title: isReturn ? `Return for ${o.n}` : `Warranty claim for ${o.n}`,
      html: `${head}<div class="rr-wrap rr-request">${tabsHtml}
        <p class="rr-req-order">${icon('box')}Order <b>${o.n}</b> &middot; placed ${niceDate(o.date)}${deliveredOn(o) ? ` &middot; delivered ${niceDate(deliveredOn(o))}` : ''}</p>
        ${blocked ? `<div class="rr-callout">${icon('clock')}<div><b>${isReturn ? 'Return not available' : 'Not yet'}</b><p>${blocked}</p>${isReturn && o.status >= 5 ? `<p><a class="rr-btn rr-btn-black rr-btn-sm" href="${url.page('request')}?type=warranty&n=${o.n}">Start a warranty claim</a></p>` : ''}</div></div>` : `
        <form class="rr-req-grid" id="reqForm" novalidate>
          <div class="rr-req-main">
            <section class="rr-card-box"><h2>Which parts?</h2>
              <ul class="rr-req-items">${o.items.map(([id, q]) => { const p = byId(id); return `<li><label class="rr-check"><input type="checkbox" data-item="${id}"><span class="rr-mini-art">${art(p)}</span><span>${esc(title(p))}<small>${money(price(p))} each${isReturn ? '' : ` &middot; ${esc(p.warranty)} warranty`}</small></span></label>${q > 1 ? `<label class="rr-select"><span>Qty</span><select data-qty="${id}">${Array.from({ length: q }, (_, k) => `<option>${k + 1}</option>`).join('')}</select></label>` : ''}</li>`; }).join('')}</ul>
              <em class="rr-field-err" id="itemsErr"></em>
            </section>
            <section class="rr-card-box"><h2>${isReturn ? 'Why are you returning it?' : 'What went wrong?'}</h2>
              <label class="rr-field"><span>Reason</span><select id="reason"><option value="">Choose a reason</option>${REASONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><em class="rr-field-err" id="reasonErr"></em></label>
              <label class="rr-field"><span>Tell us more${isReturn ? ' (optional)' : ''}</span><textarea id="details" rows="4" placeholder="${isReturn ? 'Anything we should know' : 'When did it happen, and how is the part installed?'}"></textarea><em class="rr-field-err" id="detailsErr"></em></label>
              <label class="rr-field rr-upload"><span>Photos or video ${isReturn ? '(needed if it arrived damaged or wrong)' : '(needed)'}</span><input type="file" id="photos" multiple accept="image/*,video/*,application/pdf"><em class="rr-field-err" id="photosErr"></em></label>
              <ul class="rr-file-list" id="fileList"></ul>
            </section>
            ${isReturn ? `<section class="rr-card-box"><h2>How should we refund you?</h2>
              <label class="rr-radio-card"><input type="radio" name="refund" value="card" checked><span><b>Original payment</b><small id="cardNote">5% restocking fee</small></span><em id="cardAmt"></em></label>
              <label class="rr-radio-card"><input type="radio" name="refund" value="credit"><span><b>RedRail store credit</b><small>No fee &middot; never expires &middot; needs two-step sign-in or a passkey</small></span><em id="creditAmt"></em></label>
            </section>` : `<section class="rr-card-box"><h2>What happens next</h2><ol class="rr-steps-list"><li><b>We review it</b><span>Usually within one business day. We may ask for more photos.</span></li><li><b>Send it back if needed</b><span>If we need the part, we email a free return label.</span></li><li><b>We replace it</b><span>Replacement comes first. If we're out, you're first in line for the next delivery.</span></li></ol></section>`}
          </div>
          <aside class="rr-card-box rr-req-summary"><h2>Summary</h2>
            <dl id="reqSummary"></dl>
            <button class="rr-btn rr-btn-red rr-btn-lg rr-btn-block" type="submit">${isReturn ? 'Request return' : 'Send claim'}</button>
            <p class="rr-muted rr-small">${isReturn ? 'Tax is refunded in proportion. Parts that were used or broken in use go through warranty instead.' : 'Warranty covers the original buyer. It doesn’t change any rights you have by law.'}</p>
          </aside>
        </form>
        <div id="reqDone" hidden></div>`}
      </div>`,
      after() {
        const form = document.getElementById('reqForm');
        if (!form) return;
        const $id = (id) => document.getElementById(id);
        const picked = () => $$('[data-item]').filter((c) => c.checked).map((c) => { const sel = $(`[data-qty="${c.dataset.item}"]`); return { p: byId(c.dataset.item), qty: sel ? Number(sel.value) : 1 }; });
        const calc = () => {
          const value = picked().reduce((a, x) => a + price(x.p) * x.qty, 0);
          const waived = OUR_FAULT.includes($id('reason').value);
          const fee = isReturn && !waived ? Math.round(value * RESTOCK * 100) / 100 : 0;
          return { value, fee, waived };
        };
        const draw = () => {
          const { value, fee, waived } = calc();
          if (isReturn) {
            const toCard = $$('input[name="refund"]').find((r) => r.checked).value === 'card';
            $id('cardNote').textContent = waived ? 'No fee: this one is on us' : '5% restocking fee';
            $id('cardAmt').textContent = money(value - fee);
            $id('creditAmt').textContent = money(value);
            $id('reqSummary').innerHTML = `<div><dt>Parts</dt><dd>${money(value)}</dd></div>${toCard && fee ? `<div><dt>Restocking fee (5%)</dt><dd>&minus;${money(fee)}</dd></div>` : ''}<div><dt>Return label</dt><dd><b class="rr-free">Free</b></dd></div><div class="rr-summary-total"><dt>${toCard ? 'Back to your card' : 'Store credit'}</dt><dd>${money(toCard ? value - fee : value)}</dd></div>`;
          } else {
            $id('reqSummary').innerHTML = `<div><dt>Parts</dt><dd>${picked().reduce((a, x) => a + x.qty, 0) || 0}</dd></div><div><dt>Remedy</dt><dd>Replacement</dd></div><div><dt>Return label</dt><dd><b class="rr-free">Free if needed</b></dd></div>`;
          }
        };
        form.addEventListener('change', (e) => {
          if (e.target.id === 'photos') $id('fileList').innerHTML = Array.from(e.target.files || []).map((f) => `<li>${icon('upload')}${esc(f.name)}</li>`).join('');
          ['itemsErr', 'reasonErr', 'photosErr', 'detailsErr'].forEach((k) => { $id(k).textContent = ''; });
          draw();
        });
        draw();
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const reason = $id('reason').value;
          const needPhotos = !isReturn || OUR_FAULT.includes(reason);
          let ok = true;
          if (!picked().length) { $id('itemsErr').textContent = 'Pick at least one part.'; ok = false; }
          if (!reason) { $id('reasonErr').textContent = 'Choose a reason.'; ok = false; }
          if (!isReturn && $id('details').value.trim().length < 10) { $id('detailsErr').textContent = 'Tell us what happened (10+ characters).'; ok = false; }
          if (needPhotos && !($id('photos').files || []).length) { $id('photosErr').textContent = 'Add at least one photo or video.'; ok = false; }
          if (!ok) return;
          const ref = `${isReturn ? 'RR-R' : 'RR-W'}-${String(Date.now()).slice(-5)}`;
          form.hidden = true;
          const done = $id('reqDone');
          done.hidden = false;
          done.innerHTML = `<div class="rr-card-box rr-req-done"><span class="rr-confirm-check">${icon('check')}</span><h2>Request ${ref} sent</h2><p>${isReturn ? 'We review it within one business day, then email your free return label. Your refund goes out once the part is back and checked.' : 'We review it within one business day and email you what happens next.'}</p><p class="rr-preview-flag">Design preview: nothing was sent or uploaded.</p><a class="rr-btn rr-btn-outline" href="${url.page('account')}">Back to my account</a></div>`;
          done.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      },
    };
  };

  // ------------------------------------------------------------------ help, company and legal pages
  const SAMPLE_LEGAL = '<p class="rr-sample-note">Sample text for the design preview. Replace with RedRail’s real policy before launch.</p>';
  const INFO = {
    about: {
      title: 'About RedRail', kicker: 'Our story', lead: 'Good stainless parts shouldn’t cost a week’s pay.',
      body: () => `<p>RedRail started in a garage with a simple complaint: the parts we wanted were either cheap and flimsy, or solid and wildly overpriced. So we made the middle option. Real T304 stainless, thick flanges, clean welds, and prices that leave money for the tune.</p>
        <div class="rr-values">${[['tag', 'Straight prices', 'No fake sales or inflated compare-at prices. The price you see is the price.'], ['car', 'Real fitment', 'Every part is listed with the exact years, models and engines it fits.'], ['truck', 'Free shipping over $30', 'To the lower 48 states, with tracking on every order.'], ['shield', 'Warranty on every part', 'Cracked weld or warped flange? We replace it first, no runaround.']].map(([ic, h, t]) => `<div>${icon(ic)}<h3>${h}</h3><p>${t}</p></div>`).join('')}</div>
        <div class="rr-stat-band"><div><b>${P.length}</b><span>parts in the catalog</span></div><div><b>4.7&#9733;</b><span>average rating</span></div><div><b>24/7</b><span>help by chat or email</span></div></div>
        <p>Every part we sell is checked for fit before it goes in the box. If something is wrong, we want to hear about it, and we'll make it right.</p>`,
    },
    contact: {
      title: 'Contact us', kicker: 'Help', lead: 'Chat or email any time. We answer fast and we’re here to help with anything about your order or your car.',
      body: () => `<div class="rr-contact-grid">
        <form class="rr-contact-form" id="contactForm" novalidate>
          <div class="rr-field-row"><label class="rr-field"><span>Name</span><input id="cName" autocomplete="name" required><em class="rr-field-err" id="cNameErr"></em></label><label class="rr-field"><span>Email</span><input id="cEmail" type="email" autocomplete="email" required><em class="rr-field-err" id="cEmailErr"></em></label></div>
          <div class="rr-field-row"><label class="rr-field"><span>Order number (optional)</span><input id="cOrder" placeholder="RR-104590"></label><label class="rr-field"><span>Topic</span><select id="cTopic"><option>Fitment question</option><option>Order status</option><option>Return or exchange</option><option>Warranty claim</option><option>Something else</option></select></label></div>
          <label class="rr-field"><span>Message</span><textarea id="cMsg" rows="6" required></textarea><em class="rr-field-err" id="cMsgErr"></em></label>
          <button class="rr-btn rr-btn-red rr-btn-lg" type="submit">Send message</button>
          <p class="rr-form-msg" id="contactMsg" role="status"></p>
        </form>
        <div class="rr-contact-side">
          <div class="rr-card-box">${icon('chat')}<h3>Help 24/7</h3><p>Chat from any page, or send this form. Orders, fit, returns or anything else, we’ve got you.</p><button class="rr-btn rr-btn-black rr-btn-sm" type="button" data-open-chat>Open chat</button></div>
          <div class="rr-card-box">${icon('car')}<h3>Fitment questions</h3><p>Include your year, make, model and engine. A VIN is even better.</p></div>
          <div class="rr-card-box">${icon('truck')}<h3>Where's my order?</h3><p><a href="${url.page('track')}">Track it here</a> with your order number.</p></div>
        </div>
      </div>`,
      after() {
        document.getElementById('contactForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const rules = [['cName', (x) => Boolean(x) || 'Enter your name.'], ['cEmail', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) || 'Enter a valid email.'], ['cMsg', (x) => x.length >= 10 || 'Tell us a bit more (10+ characters).']];
          let bad = null;
          rules.forEach(([id, test]) => { const el = document.getElementById(id); const r = test(el.value.trim()); document.getElementById(`${id}Err`).textContent = r === true ? '' : r; if (r !== true && !bad) bad = el; });
          const msg = document.getElementById('contactMsg');
          if (bad) { bad.focus(); msg.textContent = ''; return; }
          msg.textContent = 'Thanks. You’ll get an answer by email, and it will show up under Messages in your account. (Preview: nothing was sent.)';
          msg.className = 'rr-form-msg is-ok';
          e.target.reset();
        });
      },
    },
    reviews: {
      title: 'Customer reviews', kicker: 'Reviews', lead: 'What people say after the parts are on the car.',
      body: () => {
        const total = P.reduce((a, p) => a + p.reviewCount, 0);
        const avg = (P.reduce((a, p) => a + CAT.reviewsFor(p).reduce((b, r) => b + r.rating, 0), 0) / total).toFixed(1);
        return `<div class="rr-reviews-top"><div><p class="rr-big-score">${avg}</p>${stars(Number(avg))}<p>${total.toLocaleString()} reviews across ${P.length} parts</p></div>
          <div class="rr-chips" id="revChips"><button type="button" class="rr-chip is-on" data-rcat="">All</button>${CAT.categories.map((c) => `<button type="button" class="rr-chip" data-rcat="${c.id}">${esc(c.name)}</button>`).join('')}</div></div>
          <div class="rr-review-tools"><p class="rr-review-count" id="revCount"></p><label class="rr-select"><span>Sort</span><select id="revSort"><option value="new">Most recent</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select></label></div><div class="rr-review-wall" id="revWall"></div><div class="rr-review-more"><button class="rr-btn rr-btn-outline" type="button" id="revMore"></button><button class="rr-btn rr-btn-outline" type="button" id="revAll"></button></div>`;
      },
      after() {
        // Every review from every part, newest first, a page at a time; the chips narrow it to one kind of part.
        const all = P.flatMap((p) => CAT.reviewsFor(p).map((r) => ({ ...r, p })));
        const card = (r) => `<article class="rr-review" data-rc="${r.p.category}"><div class="rr-review-top">${stars(r.rating)}<b>${esc(r.title)}</b></div><p>${esc(r.body)}</p><p class="rr-review-by">${esc(r.name)}${r.vehicle ? ` &middot; ${esc(r.vehicle)}` : ''} &middot; ${niceDate(r.date)}</p><a class="rr-review-product" href="${url.product(r.p)}"><span class="rr-mini-art">${art(r.p)}</span>${esc(title(r.p))}</a></article>`;
        const wall = CAT.pageReviews({ reviews: all, card: card, list: document.getElementById('revWall'), count: document.getElementById('revCount'), more: document.getElementById('revMore'), all: document.getElementById('revAll'), sort: document.getElementById('revSort'), first: 24, step: 24 });
        $$('[data-rcat]').forEach((b) => b.addEventListener('click', () => {
          $$('[data-rcat]').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
          wall.filter(b.dataset.rcat ? (r) => r.p.category === b.dataset.rcat : null);
        }));
      },
      wide: true,
    },
    shipping: {
      title: 'Shipping', kicker: 'Help', lead: `Free shipping to the lower 48 states on orders of $${FREE_SHIP} or more.`,
      body: () => `${SAMPLE_LEGAL}<table class="rr-spec-table rr-ship-table"><thead><tr><th>Where it's going</th><th>Shipping</th></tr></thead><tbody>
          <tr><td>Lower 48 states</td><td>Free on orders of $${FREE_SHIP}+, otherwise $${SHIP_FLAT}</td></tr>
          <tr><td>Alaska and Hawaii</td><td>$${SHIP_ZONES.akhi[1]}</td></tr>
          <tr><td>Canada</td><td>$${SHIP_ZONES.ca[1]}</td></tr>
          <tr><td>Other countries we ship to</td><td>$${SHIP_ZONES.intl[1]}</td></tr></tbody></table>
        <h2>How it ships</h2><p>Every order ships with tracking from our warehouse, using the best carrier for where it's going. You get an email with the tracking number as soon as the label is made. Big orders can ship in more than one box, each with its own tracking.</p>
        <h2>Outside the US</h2><p>Import duties, taxes and brokerage fees are set by your country, are paid by you on delivery and are not included in our prices or shipping.</p>
        <h2>Damaged in shipping</h2><p>Send photos of the box and the part through a <a href="${url.page('request')}?type=return">return request</a> and we'll sort it out. Keep the packaging until it's settled.</p>`,
    },
    refund: {
      title: 'Returns & refunds', kicker: 'Help', lead: `${RETURN_DAYS} days to send back a part you haven't used. The return label is free.`,
      body: () => `${SAMPLE_LEGAL}<ol class="rr-steps-list"><li><b>Start the return</b><span>From your account, open the order and press Start a return. No account? <a href="${url.page('request')}?type=return">Start it with your order number and email</a>.</span></li><li><b>Tell us why, add photos</b><span>Pick the parts and the reason. Photos are needed if a part arrived damaged or wrong.</span></li><li><b>Ship it free</b><span>Once we approve it, we email you a prepaid return label.</span></li><li><b>Get your refund</b><span>We check the part when it arrives, then refund you the way you chose.</span></li></ol>
        <h2>What can be returned</h2><p>Parts that are unused and uninstalled, within ${RETURN_DAYS} days of delivery. Test-fitting a part without running it is fine. A part that broke while in use is a <a href="${url.page('warranty')}">warranty claim</a>, not a return.</p>
        <h2>Your refund</h2><table class="rr-spec-table"><tbody>
          <tr><th scope="row">Back to your card</th><td>Minus a 5% restocking fee</td></tr>
          <tr><th scope="row">As RedRail store credit</th><td>Full amount, no fee</td></tr>
          <tr><th scope="row">Our mistake (damaged, wrong item, defect)</th><td>No fee either way</td></tr></tbody></table>
        <p>Tax is refunded in proportion to what you return. If you paid partly with store credit, that part comes back as credit.</p>
        <h2>Cancelling an order</h2><p>You can cancel before it ships. Refunds to your card have the same 5% fee where allowed; choose store credit and there's no fee. If we cancel, or a delay means you're owed a full refund, there's no fee.</p>`,
    },
    warranty: {
      title: 'Warranty', kicker: 'Help', lead: 'Every part has a warranty. We replace first.',
      body: () => `${SAMPLE_LEGAL}<p>Each part's warranty period is listed on its page, under Specs. It covers defects in materials and workmanship, like a cracked weld or a warped flange, for the original buyer.</p>
        <h2>Making a claim</h2><ol class="rr-steps-list"><li><b>Start a claim</b><span>From your account, or <a href="${url.page('request')}?type=warranty">with your order number and email</a>. Your receipt works too.</span></li><li><b>Show us</b><span>Add photos or a short video. Sometimes we'll need the part back, and we send a free label for it.</span></li><li><b>Get a replacement</b><span>If we're out of stock, you're first in line when the next ones arrive. You keep the rest of your original warranty on the replacement.</span></li></ol>
        <h2>Not covered</h2><ul class="rr-bullets"><li>Damage from installation mistakes, accidents or impacts</li><li>Discoloring from heat (normal on stainless)</li><li>Parts that have been modified</li><li>Labor, tuning or other costs</li></ul>
        <p>This warranty doesn't take away any rights you have by law.</p>`,
    },
    faq: {
      title: 'FAQ', kicker: 'Help', lead: 'Quick answers to what people ask most.',
      body: () => `<div class="rr-faq">${[
        ['How do I know a part fits my car?', `Every part lists the years, models and engine it fits, right under the price. Still not sure? <a href="${url.page('contact')}">Send us your VIN</a> and we'll confirm before you order.`],
        ['How much is shipping?', `Free to the lower 48 states on orders of $${FREE_SHIP}+, otherwise $${SHIP_FLAT}. Alaska and Hawaii $${SHIP_ZONES.akhi[1]}, Canada $${SHIP_ZONES.ca[1]}, other countries $${SHIP_ZONES.intl[1]}. <a href="${url.page('shipping')}">Shipping details</a>.`],
        ['Do you ship outside the US?', `Yes, to Canada and many other countries. Import duties and taxes are paid by you on delivery.`],
        ['Can I return a part?', `Yes, within ${RETURN_DAYS} days of delivery if it's unused and uninstalled. The return label is free. Refunds to your card have a 5% restocking fee; store credit has none. <a href="${url.page('refund')}">Return policy</a>.`],
        ['What is store credit?', 'Money in your RedRail account from a refund you chose to take as credit. It never expires, works on anything (including shipping), and is protected by two-step sign-in or a passkey.'],
        ['Do I need a tune for a downpipe?', 'On most turbo cars, yes. Without one the car may run poorly or show a check engine light.'],
        ['Are your parts street legal?', 'Parts marked for off-road use are for off-road and competition vehicles only. Check your state’s emissions laws before installing.'],
        ['Can I change or cancel my order?', 'Yes, before it ships. Message us right away. Refunds to your card have a 5% fee where allowed; store credit has none.'],
        ['Do you sell gift cards?', 'Not right now.'],
        ['Do you offer a military discount?', `Yes. See the <a href="${url.page('military')}">military discount page</a>.`],
      ].map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}${icon('plus')}</summary><p>${a}</p></details>`).join('')}</div>`,
    },
    military: {
      title: 'Military discount', kicker: 'Company', lead: '10% off for active duty, veterans, Guard and Reserve.',
      body: () => `<div class="rr-callout">${icon('medal')}<div><b>Thank you for your service.</b><p>Get 10% off every order, with no limit on how often you use it.</p></div></div>
        <ol class="rr-steps-list"><li><b>Send proof</b><span>Use the <a href="${url.page('contact')}">contact form</a> and pick Something else. A photo of a military ID or DD-214 with personal numbers covered is fine.</span></li><li><b>Get your code</b><span>We reply with a personal code within one business day.</span></li><li><b>Save on every order</b><span>Enter the code at checkout.</span></li></ol>`,
    },
    social: {
      title: 'Social', kicker: 'Company', lead: 'Builds, installs and new parts. Tag yours with #RedRailBuilt.',
      body: () => `<div class="rr-social-cards">${[['camera', 'Instagram', 'Build photos and new parts'], ['play', 'YouTube', 'Install walk-throughs and sound clips'], ['bolt', 'TikTok', 'Quick before-and-after sound checks'], ['chat', 'Facebook', 'Group for owners and questions']].map(([ic, n, t]) => `<div class="rr-card-box">${icon(ic)}<h3>${n}</h3><p>${t}</p><span class="rr-soon">Coming soon</span></div>`).join('')}</div>
        <h2>From the community</h2>
        <div class="rr-builds">${[['wrx-08-14-downpipe', '2011 WRX', '3" downpipe and a pro tune'], ['accord-94-97-header', '1996 Accord', 'The $100 header, installed in an afternoon'], ['370z-09-20-test-pipes', '2015 370Z', 'Test pipes for track days'], ['civic-06-11-intake', '2009 Civic', 'Intake and a cleaner sound'], ['mustang-gt-11-14-x-pipe', '2013 Mustang GT', 'X-pipe for the crossover rasp'], ['miata-99-05-intake', '2003 Miata', 'Weekend autocross build']].map(([id, car, cap]) => `<a class="rr-build" href="${url.product(byId(id))}"><span>${art(byId(id))}</span><b>${car}</b><small>${cap}</small></a>`).join('')}</div>`,
      wide: true,
    },
    privacy: {
      title: 'Privacy policy', kicker: 'Legal', lead: 'What we collect, why, and what you can do about it.',
      body: () => `${SAMPLE_LEGAL}<h2>What we collect</h2><p>Your name, email, shipping address and phone number when you order. Your order history, wishlist and support messages if you make an account. Basic device and browsing data to keep the site working.</p>
        <h2>Your RedRail account is only for RedRail</h2><p>Your account, orders, store credit and emails here are kept separate from any other store.</p>
        <h2>How we use it</h2><p>To fill and ship orders, answer questions, prevent fraud and, if you opt in, send deal emails.</p>
        <h2>Who we share it with</h2><p>Only the companies that help us run the store: our payment processor, shipping carriers and email provider. We never sell your information.</p>
        <h2>Payments</h2><p>Card details go straight to our payment processor. RedRail never sees or stores your full card number.</p>
        <h2>Your choices</h2><p>Deal emails are only sent if you opt in, and you can unsubscribe at any time. You can delete your account yourself; order and payment records are kept as the law requires. Ask us to see or correct your data through the <a href="${url.page('contact')}">contact page</a>.</p>`,
    },
    terms: {
      title: 'Terms & conditions', kicker: 'Legal', lead: 'The rules for buying from RedRail.',
      body: () => `${SAMPLE_LEGAL}<h2>Orders</h2><p>An order is accepted when it ships. We may cancel an order with a pricing or stock error and refund it in full.</p>
        <h2>Prices</h2><p>Prices are in US dollars and can change without notice. The price at checkout is the price you pay.</p>
        <h2>Installation and use</h2><p>Performance parts should be installed by someone qualified. You are responsible for following the laws where you drive, including emissions laws.</p>
        <h2>Off-road parts</h2><p>Parts marked for off-road use may not be installed on vehicles driven on public roads. See the <a href="${url.page('vcw')}">vehicle compliance waiver</a>.</p>
        <h2>Returns, cancellations and store credit</h2><p>See the <a href="${url.page('refund')}">return policy</a>. Store credit can only be used at RedRail, doesn't expire and can't be exchanged for cash unless the law requires it.</p>
        <h2>Limits</h2><p>Our responsibility is limited to the price you paid for the part, except where the law says otherwise.</p>`,
    },
    vcw: {
      title: 'Vehicle compliance waiver', kicker: 'Legal', lead: 'Read this before buying parts marked for off-road use.',
      body: () => `${SAMPLE_LEGAL}<p>Some parts on this site, including catless downpipes and test pipes, change or remove emissions equipment. They are sold for off-road and competition vehicles only.</p>
        <h2>By buying an off-road part you confirm that</h2><ul class="rr-bullets"><li>The part will be installed on a vehicle that is not driven on public roads</li><li>You understand federal and state emissions laws and will follow them</li><li>You are responsible for any fines, failed inspections or warranty loss that come from installing the part</li></ul>
        <h2>California and similar states</h2><p>These parts are not legal for use on public roads in California or states that follow California emissions rules.</p>`,
    },
    cua: {
      title: 'Consumer use agreement', kicker: 'Legal', lead: 'How RedRail parts are meant to be used.',
      body: () => `${SAMPLE_LEGAL}<p>Performance parts change how a vehicle runs. Installing them can affect drivability, emissions, noise and manufacturer warranties.</p>
        <h2>You agree to</h2><ul class="rr-bullets"><li>Have parts installed by a qualified person</li><li>Check fitment before installing</li><li>Use parts only where it is legal to do so</li><li>Stop using a part that is damaged or not working correctly</li></ul>`,
    },
    prop65: {
      title: 'Proposition 65', kicker: 'Legal', lead: 'Information for California customers.',
      body: () => `${SAMPLE_LEGAL}<div class="rr-callout rr-callout-warn">${icon('shield')}<div><b>WARNING</b><p>These products can expose you to chemicals including nickel and chromium (hexavalent compounds), which are known to the State of California to cause cancer. For more information go to www.P65Warnings.ca.gov.</p></div></div>
        <p>Stainless steel exhaust parts contain nickel and chromium. Wear gloves when handling and cutting parts, and wash your hands after installation.</p>`,
    },
  };
  const INFO_NAV = [['Help', HELP_LINKS.filter(([, k]) => k !== 'track' && k !== 'request')], ['Company', COMPANY_LINKS], ['Legal', LEGAL_LINKS]];

  Object.entries(INFO).forEach(([key, info]) => {
    PAGES[key] = () => ({
      title: info.title,
      html: `<section class="rr-info-head"><div class="rr-wrap">${crumbs([['Home', url.home], [info.title]])}<p class="rr-kicker"><span class="rr-tick"></span>${esc(info.kicker)}</p><h1 class="rr-page-title">${esc(info.title)}</h1><p class="rr-page-sub">${esc(info.lead)}</p></div></section>
        <div class="rr-wrap rr-info${info.wide ? ' is-wide' : ''}">
          ${info.wide ? '' : `<nav class="rr-info-nav" aria-label="Help pages">${INFO_NAV.map(([group, links]) => `<p>${group}</p><ul>${links.map(([label, k]) => `<li><a href="${url.page(k)}"${k === key ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}</ul>`).join('')}</nav>`}
          <article class="rr-prose">${info.body()}</article>
        </div>`,
      after: info.after,
    });
  });

  // RedRail's transactional email designs (each store sends its own, from its own domain).
  PAGES.emails = () => {
    const o = SAMPLE_ORDERS[1];
    const t = orderTotals(o);
    const u = signedIn();
    const btn = (label) => `<span class="rr-mail-btn">${label}</span>`;
    const itemRows = o.items.map(([id, q]) => { const p = byId(id); return `<tr><td class="rr-mail-art">${art(p)}</td><td>${esc(title(p))}<small>Qty ${q}</small></td><td>${money(price(p) * q)}</td></tr>`; }).join('');
    const mail = (id, label, subject, inner) => `<section class="rr-mail-wrap" id="${id}">
      <p class="rr-mail-label">${label}</p>
      <div class="rr-mail-meta"><p><b>From</b> RedRail Performance</p><p><b>Subject</b> ${subject}</p></div>
      <div class="rr-mail">
        <div class="rr-mail-top"><span class="rr-logo">${logo(true)}</span></div>
        <div class="rr-mail-rails" aria-hidden="true"></div>
        <div class="rr-mail-body">${inner}</div>
        <div class="rr-mail-foot"><p><b>RedRail Performance</b> &middot; Help 24/7: reply to this email or chat on the site</p><p>You're getting this email because you ordered from RedRail.</p></div>
      </div>
    </section>`;
    const list = [
      ['confirm', 'Order confirmed', `Order ${o.n} confirmed`, `<h1>Thanks, ${esc(u.first)}. We've got your order.</h1><p>We'll email tracking as soon as it ships.</p>
        <table class="rr-mail-items">${itemRows}</table>
        <table class="rr-mail-totals"><tr><td>Subtotal</td><td>${money(t.sub)}</td></tr><tr><td>Shipping</td><td>${t.ship ? money(t.ship) : 'Free'}</td></tr><tr class="is-total"><td>Total</td><td>${money(t.total)}</td></tr></table>${btn('View your order')}`],
      ['shipped', 'Shipped', 'Your RedRail order is on the way', `<h1>It's on the way.</h1><p>Order ${o.n} left our warehouse.</p><div class="rr-mail-box"><small>${esc(o.carrier)}</small><b>${esc(o.tracking)}</b></div>${btn('Track package')}<p class="rr-mail-small">Big orders can ship in more than one box. Each one gets its own tracking email.</p>`],
      ['return', 'Return approved', 'Return approved: your free label is ready', `<h1>Your return is approved.</h1><ol class="rr-mail-steps"><li>Print the label below.</li><li>Pack the part, in its original box if you can.</li><li>Drop it off with the carrier within 7 days.</li></ol>${btn('Download return label')}<p class="rr-mail-small">We'll refund you the way you chose once the part is back and checked: to your card (minus the 5% restocking fee) or as store credit with no fee.</p>`],
      ['credit', 'Store credit added', 'You have $25.00 in RedRail store credit', `<h1>$25.00 store credit added.</h1><div class="rr-mail-box rr-mail-credit"><small>Your balance</small><b>${money(25)}</b></div><p>From your return on order RR-103871. It never expires and works on anything at RedRail, including shipping.</p><p class="rr-mail-small">To use it you'll confirm with your passkey or authenticator app, so only you can spend it.</p>${btn('See your store credit')}`],
      ['review', 'Review request (7 days after delivery)', `How's the ${esc(title(byId(o.items[0][0])))}?`, `<h1>How's it going on the car?</h1><p>Rate your ${esc(title(byId(o.items[0][0])))}. It helps other people pick the right part.</p><p class="rr-mail-stars">${[1, 2, 3, 4, 5].map((n) => `<span aria-label="${n} stars">&#9733;</span>`).join('')}</p><p class="rr-mail-small">We read every review before it's posted, good or bad.</p>`],
    ];
    return {
      title: 'Email designs',
      html: `<section class="rr-info-head"><div class="rr-wrap">${crumbs([['Home', url.home], ['Email designs']])}<p class="rr-kicker"><span class="rr-tick"></span>Design preview</p><h1 class="rr-page-title">RedRail emails</h1><p class="rr-page-sub">How RedRail's order emails look. Each store sends its own, from its own address.</p></div></section>
        <div class="rr-wrap rr-mails">
          <div class="rr-chips">${list.map(([id, label]) => `<a class="rr-chip" href="#${id}">${label.replace(/ \(.*\)/, '')}</a>`).join('')}</div>
          <div class="rr-mail-grid">${list.map(([id, label, subject, inner]) => mail(id, label, subject, inner)).join('')}</div>
        </div>`,
    };
  };

  PAGES.notfound = () => ({ title: 'Page not found', html: `<div class="rr-wrap"><div class="rr-empty">${icon('search')}<h1>That page went off the rails</h1><p>Try the search, or head back home.</p><a class="rr-btn rr-btn-red" href="${url.home}">Go home</a></div></div>` });

  // ------------------------------------------------------------------ render and global events
  function addToCart(id, qty = 1, stay = false) {
    const p = byId(id);
    if (!p || p.stock <= 0) return;
    cart.add(id, qty);
    if (onCartChange) onCartChange();
    if (stay) { renderCartDrawer(); toast(`Added ${title(p)}`); return; }
    renderCartDrawer(id);
    openOverlay('rrCart');
  }

  function render() {
    const root = document.getElementById('rr-root');
    const key = document.body.dataset.page;
    const view = (PAGES[key] || PAGES.notfound)();
    document.title = `${view.title} | ${BRAND}`;
    const checkoutChrome = view.chrome === 'checkout';
    root.innerHTML = (checkoutChrome
      ? `<header class="rr-co-header"><div class="rr-wrap rr-co-header-inner"><a class="rr-logo" href="${url.home}" aria-label="RedRail Performance home">${logo()}</a><span class="rr-co-secure">${icon('lock')}Secure checkout</span><a class="rr-back-link" href="${url.page('cart')}">${icon('back')}Back to cart</a></div></header>`
      : header())
      + `<main id="main" class="rr-main rr-page-${esc(key)}" tabindex="-1">${view.html}</main>`
      + (checkoutChrome ? `<footer class="rr-co-footer"><div class="rr-wrap"><a href="${url.page('refund')}">Returns</a><a href="${url.page('shipping')}">Shipping</a><a href="${url.page('privacy')}">Privacy</a><a href="${url.page('terms')}">Terms</a></div></footer>` : trustBar() + footer())
      + overlays(!checkoutChrome);
    updateBadges();
    bindHeaderSearch();
    onCartChange = null;
    onWishChange = null;
    if (view.after) view.after();
  }

  document.addEventListener('click', (e) => {
    $$('.rr-suggest').forEach((box) => { if (!box.parentElement.contains(e.target)) box.hidden = true; });
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      addToCart(add.dataset.add, 1, add.hasAttribute('data-stay'));
      add.classList.add('is-added');
      setTimeout(() => add.classList.remove('is-added'), 1200);
      return;
    }
    if (e.target.closest('[data-open-menu]')) { openOverlay('rrMenu'); return; }
    if (e.target.closest('[data-close-overlay]')) { closeOverlay(e.target.closest('.rr-overlay')); return; }
    if (e.target.closest('[data-open-chat]')) { const p = document.getElementById('rrChat'); if (p && !p.hidden && e.target.closest('.rr-chat-launch')) closeChat(); else openChat(); return; }
    if (e.target.closest('[data-close-chat]')) { closeChat(); return; }
    const save = e.target.closest('[data-wish]');
    if (save) {
      const on = wish.toggle(save.dataset.wish);
      $$(`[data-wish="${save.dataset.wish}"]`).forEach((b) => { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); $('span', b).textContent = on ? 'Saved' : 'Save'; });
      toast(on ? 'Saved to your wishlist' : 'Removed from your wishlist');
      if (onWishChange) onWishChange();
      return;
    }
    const msg = e.target.closest('[data-preview-msg]');
    if (msg) toast(msg.dataset.previewMsg);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $$('.rr-overlay.is-open').forEach(closeOverlay); closeChat(); }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'rrChatForm') return;
    e.preventDefault();
    const input = document.getElementById('rrChatInput');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const body = document.getElementById('rrChatBody');
    body.insertAdjacentHTML('beforeend', `<div class="rr-bubble is-you"><small>You</small><p>${esc(text)}</p></div>`);
    input.value = '';
    setTimeout(() => {
      body.insertAdjacentHTML('beforeend', '<div class="rr-bubble is-team"><small>RedRail support</small><p>Thanks! On the live store we’d answer you right here, any time of day. (Preview)</p></div>');
      body.scrollTop = body.scrollHeight;
    }, 450);
    body.scrollTop = body.scrollHeight;
  });
  window.addEventListener('storage', (e) => { if (e.key === 'rr_preview_cart') { updateBadges(); if (onCartChange) onCartChange(); } });
  window.addEventListener('scroll', () => { document.documentElement.classList.toggle('rr-scrolled', window.scrollY > 40); }, { passive: true });

  render();
})();
