/* KURTKI 7KM — SPA (vanilla JS, hash router). Чернетка без бекенду. */
(function () {
  'use strict';

  var P = window.PRODUCTS || [];
  var KINDS = window.KINDS || {};
  var KIND_ONE = window.KIND_ONE || {};
  var FREE_SHIP = 5000;
  var SIZE_UA = { XS: '42', S: '44', M: '46', L: '48', XL: '50' };
  var SPANS = { short: 'Короткі', long: 'Довгі' };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var app = $('#app');

  /* ── utils ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    if (!n) return 'Ціна за запитом';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴';
  }
  function bySlug(s) { for (var i = 0; i < P.length; i++) if (P[i].slug === s) return P[i]; return null; }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function norm(s) { return String(s).toLowerCase().replace(/[−–—]/g, '-').replace(/ё/g, 'е').replace(/[’'`ʼ]/g, ''); }

  /* ── storage (try/catch: приватний режим тощо) ── */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  var cart = sanitizeCart(store.get('k7_cart', []));
  var favs = (store.get('k7_favs', []) || []).filter(function (s) { return typeof s === 'string' && bySlug(s); });

  function sanitizeCart(c) {
    if (!Array.isArray(c)) return [];
    return c.filter(function (it) {
      var p = it && bySlug(it.slug);
      return p && p.colors[it.color] && p.sizes.indexOf(it.size) > -1 && it.qty > 0;
    }).map(function (it) { return { slug: it.slug, color: it.color | 0, size: it.size, qty: Math.min(9, it.qty | 0) }; });
  }
  function saveCart() { store.set('k7_cart', cart); renderCart(); }
  function saveFavs() { store.set('k7_favs', favs); renderFavCount(); }

  /* ── toast ── */
  var toastEl = $('#toast'), toastT;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }

  /* ── overlays: menu, sheets, cart ── */
  var scrim = $('#scrim');
  var stack = [];  // відкриті панелі
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  function openPanel(el, opener) {
    if (!el || el.getAttribute('aria-hidden') === 'false') return;
    // одночасно лише одна панель
    while (stack.length) closePanel(stack[stack.length - 1].el, true);
    stack.push({ el: el, opener: opener || document.activeElement });
    el.setAttribute('aria-hidden', 'false');
    if (el.id !== 'menu') scrim.hidden = false;
    document.body.classList.add('lock');
    app.setAttribute('aria-hidden', 'true');
    if (el.id === 'menu') $('#menuOpen').setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      var f = el.querySelector('.close, #menuClose') || el.querySelector(FOCUSABLE);
      if (f) f.focus({ preventScroll: true });
    }, 60);
  }
  function closePanel(el, silent) {
    if (!el || el.getAttribute('aria-hidden') === 'true') return;
    el.setAttribute('aria-hidden', 'true');
    var idx = -1;
    stack.forEach(function (s, i) { if (s.el === el) idx = i; });
    var entry = idx > -1 ? stack.splice(idx, 1)[0] : null;
    if (el.id === 'menu') $('#menuOpen').setAttribute('aria-expanded', 'false');
    if (!stack.length) {
      scrim.hidden = true;
      document.body.classList.remove('lock');
      app.removeAttribute('aria-hidden');
    }
    if (!silent && entry && entry.opener && document.contains(entry.opener)) {
      try { entry.opener.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }
  function closeAll(silent) { while (stack.length) closePanel(stack[stack.length - 1].el, silent); }
  function top() { return stack.length ? stack[stack.length - 1].el : null; }

  scrim.addEventListener('click', function () { closeAll(); });
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close]');
    if (c) { closePanel(c.closest('.sheet, .cart, .menu')); }
  });
  document.addEventListener('keydown', function (e) {
    var t = top();
    if (!t) return;
    if (e.key === 'Escape') { e.preventDefault(); closePanel(t); return; }
    if (e.key === 'Tab') {
      var f = $$(FOCUSABLE, t).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !t.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !t.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

  /* menu */
  var menu = $('#menu');
  $('#menuOpen').addEventListener('click', function () { openPanel(menu, this); });
  $('#menuClose').addEventListener('click', function () { closePanel(menu); });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#/"]');
    if (a) closePanel(menu, true);
  });
  var prevImg = $('#menuPrev'), prevT;
  function swapPrev(src) {
    if (!src || prevImg.getAttribute('src') === src) return;
    prevImg.classList.add('swap');
    clearTimeout(prevT);
    prevT = setTimeout(function () { prevImg.src = src; prevImg.classList.remove('swap'); }, 160);
  }
  $$('[data-prev]', menu).forEach(function (a) {
    var src = a.getAttribute('data-prev');
    a.addEventListener('mouseenter', function () { swapPrev(src); });
    a.addEventListener('focus', function () { swapPrev(src); });
    var parent = a.closest('.mm');
    if (parent) parent.addEventListener('mouseenter', function () { swapPrev(src); });
  });
  var preloaded = false;
  $('#menuOpen').addEventListener('mouseenter', preloadPrev);
  $('#menuOpen').addEventListener('focus', preloadPrev);
  function preloadPrev() {
    if (preloaded || window.innerWidth < 900) return;
    preloaded = true;
    $$('[data-prev]', menu).forEach(function (a) { var i = new Image(); i.src = a.getAttribute('data-prev'); });
  }

  /* search */
  $('#searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('#searchInput').value.trim();
    closePanel(menu, true);
    location.hash = '#/catalog' + (q ? '?q=' + encodeURIComponent(q) : '');
  });

  /* skip link + dead "#" links */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (h === '#app') { e.preventDefault(); app.focus(); app.scrollIntoView(); }
    else if (h === '#') { e.preventDefault(); toast('Посилання з’явиться після запуску'); }
  });

  /* ── header counters ── */
  function cartTotals() {
    var qty = 0, sum = 0;
    cart.forEach(function (it) { var p = bySlug(it.slug); qty += it.qty; sum += p.price * it.qty; });
    return { qty: qty, sum: sum };
  }
  function renderFavCount() {
    var el = $('#favCount');
    el.textContent = favs.length;
    el.hidden = favs.length === 0;
    $('.hdr__fav').setAttribute('aria-label', 'Улюблені' + (favs.length ? ' (' + favs.length + ')' : ''));
  }
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  /* ── cart drawer ── */
  var cartEl = $('#cart');
  $('#cartOpen').addEventListener('click', function () { openPanel(cartEl, this); });

  function renderCart() {
    var t = cartTotals();
    var bc = $('#bagCount');
    bc.textContent = t.qty;
    bc.classList.toggle('has', t.qty > 0);
    $('#bagSum').textContent = t.qty ? money(t.sum) : '';
    $('#cartOpen').setAttribute('aria-label', 'Кошик: ' + t.qty + ' ' + plural(t.qty, 'товар', 'товари', 'товарів') + (t.qty ? ', ' + money(t.sum) : ''));
    $('#cartQty').textContent = t.qty ? '(' + t.qty + ')' : '';

    var ship = $('#cartShip');
    if (!t.qty) ship.innerHTML = '';
    else if (t.sum >= FREE_SHIP) ship.innerHTML = '<b>Безкоштовна доставка</b> Новою Поштою — ваша ✓<div class="bar"><i style="width:100%"></i></div>';
    else ship.innerHTML = 'До безкоштовної доставки залишилось <b>' + money(FREE_SHIP - t.sum) + '</b><div class="bar"><i style="width:' + Math.round(t.sum / FREE_SHIP * 100) + '%"></i></div>';

    var body = $('#cartBody'), foot = $('#cartFoot');
    $('.cart__cols').hidden = !t.qty;
    if (!t.qty) {
      body.innerHTML = '<div class="cart__empty"><h3>Кошик порожній</h3><p>Додайте модель, яка зігріє цієї зими.</p><a class="btn btn--ink" href="#/catalog?new=1">До новинок</a></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = cart.map(function (it, i) {
      var p = bySlug(it.slug), c = p.colors[it.color];
      return '<div class="ci" data-i="' + i + '">' +
        '<div class="ci__main"><a class="ci__img" href="#/product/' + p.slug + '?c=' + it.color + '" tabindex="-1"><img src="' + c.images[0] + '" alt="" width="180" height="225" loading="lazy"></a>' +
        '<a class="ci__name" href="#/product/' + p.slug + '?c=' + it.color + '">' + esc(p.name) + '<small>' + esc(KIND_ONE[p.kind]) + '</small></a></div>' +
        '<div class="ci__opt">' + esc(c.name) + ' / ' + it.size + ' (' + SIZE_UA[it.size] + ')</div>' +
        '<div class="ci__price">' + money(p.price) + '</div>' +
        '<div class="ci__qty"><div class="qty"><button data-q="-1" aria-label="Зменшити кількість"' + (it.qty <= 1 ? ' disabled' : '') + '>−</button><span aria-live="polite">' + it.qty + '</span><button data-q="1" aria-label="Збільшити кількість"' + (it.qty >= 9 ? ' disabled' : '') + '>+</button></div></div>' +
        '<div class="ci__total">' + money(p.price * it.qty) + '</div>' +
        '<button class="ci__rm" data-rm aria-label="Видалити ' + esc(p.name) + '">Видалити</button>' +
        '</div>';
    }).join('');
    foot.innerHTML =
      '<div class="cart__sum"><span>Разом</span><b>' + money(t.sum) + '</b></div>' +
      '<p class="cart__hint">Доставка Новою Поштою ' + (t.sum >= FREE_SHIP ? '— безкоштовно.' : 'за тарифами перевізника.') + ' Примірка перед оплатою.</p>' +
      '<button class="btn" data-close>Продовжити покупки</button>' +
      '<a class="btn btn--ink" href="#/checkout">Оформити замовлення</a>';
  }
  $('#cartBody').addEventListener('click', function (e) {
    var row = e.target.closest('.ci');
    if (!row) return;
    var i = +row.getAttribute('data-i'), it = cart[i];
    if (!it) return;
    var q = e.target.closest('[data-q]');
    if (q) {
      it.qty = Math.max(1, Math.min(9, it.qty + (+q.getAttribute('data-q'))));
      saveCart();
      var nb = $('.ci[data-i="' + i + '"] [data-q="' + q.getAttribute('data-q') + '"]');
      if (nb && !nb.disabled) nb.focus(); else { var o = $('.ci[data-i="' + i + '"] [data-q]:not([disabled])'); if (o) o.focus(); }
      return;
    }
    if (e.target.closest('[data-rm]')) {
      var p = bySlug(it.slug);
      cart.splice(i, 1);
      saveCart();
      toast(esc(p.name) + ' видалено з кошика');
      var next = $('#cartBody [data-rm]') || $('#cart .close');
      if (next) next.focus();
    }
  });
  cartEl.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#/"]')) closePanel(cartEl, true);
  });

  function addToCart(slug, color, size) {
    var ex = cart.filter(function (it) { return it.slug === slug && it.color === color && it.size === size; })[0];
    if (ex) ex.qty = Math.min(9, ex.qty + 1);
    else cart.push({ slug: slug, color: color, size: size, qty: 1 });
    saveCart();
    bump($('#bagCount'));
  }

  /* ── favorites ── */
  function isFav(slug) { return favs.indexOf(slug) > -1; }
  function toggleFav(slug) {
    var p = bySlug(slug);
    if (isFav(slug)) { favs = favs.filter(function (s) { return s !== slug; }); toast(esc(p.name) + ' прибрано з улюблених'); }
    else { favs.push(slug); toast(esc(p.name) + ' додано в улюблені <a href="#/favorites">Переглянути</a>'); bump($('#favCount')); }
    saveFavs();
    $$('[data-fav="' + slug + '"]').forEach(function (b) {
      var on = isFav(slug);
      b.setAttribute('aria-pressed', on);
      b.innerHTML = on ? '♥' : '♡';
      b.setAttribute('aria-label', (on ? 'Прибрати з улюблених: ' : 'В улюблені: ') + p.name);
    });
    if (route.path === '/favorites' && !isFav(slug)) render();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (b) { e.preventDefault(); toggleFav(b.getAttribute('data-fav')); }
  });

  /* ── product card ── */
  function priceHtml(p) {
    return p.oldPrice
      ? '<span class="price price--sale"><b>' + money(p.price) + '</b><s>' + money(p.oldPrice) + '</s></span>'
      : '<span class="price">' + money(p.price) + '</span>';
  }
  function card(p, opts) {
    opts = opts || {};
    var ci = opts.color || 0, c = p.colors[ci] || p.colors[0];
    var badges = '';
    if (p.oldPrice) badges += '<span class="badge badge--sale">−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%</span>';
    if (p.flags.new) badges += '<span class="badge">New</span>';
    var on = isFav(p.slug);
    var url = '#/product/' + p.slug + (ci ? '?c=' + ci : '');
    return '<article class="card">' +
      '<div class="card__media"><img src="' + c.images[0] + '" alt="' + esc(p.title + ', ' + c.name) + '" width="900" height="1125" loading="' + (opts.eager ? 'eager' : 'lazy') + '">' +
      (c.images[1] ? '<img class="alt" src="' + c.images[1] + '" alt="" width="900" height="1125" loading="lazy">' : '') +
      '<div class="badges">' + badges + '</div></div>' +
      '<button class="fav" data-fav="' + p.slug + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Прибрати з улюблених: ' : 'В улюблені: ') + esc(p.name) + '">' + (on ? '♥' : '♡') + '</button>' +
      '<div class="card__info"><div class="card__row"><a class="card__name" href="' + url + '">' + esc(p.name) + '</a><span class="card__temp mono">' + p.temp + '</span></div>' +
      '<div class="card__kind">' + esc(KIND_ONE[p.kind]) + (p.flags.leather ? ', шкіра' : '') + '</div>' +
      priceHtml(p) +
      (p.colors.length > 1 ? '<div class="dots" aria-label="' + p.colors.length + ' кольори">' + p.colors.map(function (x) { return '<span class="dot" style="background:' + x.hex + '" title="' + esc(x.name) + '"></span>'; }).join('') + '</div>' : '') +
      '</div></article>';
  }

  /* ── router ── */
  var route = { path: '/', params: new URLSearchParams() };
  function parse() {
    var h = location.hash.replace(/^#/, '');
    if (h.charAt(0) !== '/') h = '/';
    var qi = h.indexOf('?');
    return { path: qi > -1 ? h.slice(0, qi) : h, params: new URLSearchParams(qi > -1 ? h.slice(qi + 1) : '') };
  }
  function render() {
    route = parse();
    var p = route.path.replace(/\/+$/, '') || '/';
    var m, html, title = 'KURTKI 7KM — зимовий верхній одяг';
    if (p === '/') { html = viewHome(); }
    else if (p === '/catalog') { var r = viewCatalog(); html = r.html; title = r.title + ' — KURTKI 7KM'; }
    else if ((m = p.match(/^\/product\/([\w-]+)$/))) { var pr = bySlug(m[1]); if (pr) { html = viewProduct(pr); title = pr.title + ' — KURTKI 7KM'; } else html = view404(); }
    else if (p === '/favorites') { html = viewFavs(); title = 'Улюблені — KURTKI 7KM'; }
    else if (p === '/info') { html = viewInfo(); title = 'Доставка та оплата — KURTKI 7KM'; }
    else if (p === '/checkout') { html = viewCheckout(); title = 'Оформлення замовлення — KURTKI 7KM'; }
    else if ((m = p.match(/^\/order\/([\w-]+)$/))) { html = viewDone(m[1]); title = 'Дякуємо за замовлення — KURTKI 7KM'; }
    else { html = view404(); title = 'Сторінку не знайдено — KURTKI 7KM'; }
    app.innerHTML = '<div class="fade-in">' + html + '</div>' + footer();
    document.title = title;
    after(p);
  }
  var lastPath = null;
  function onRoute(init) {
    if (init !== true && location.hash && location.hash.charAt(1) !== '/') return; // #app та інші якорі
    closeAll(true);
    var np = parse().path;
    var samePage = lastPath === np && np === '/catalog';
    var y = window.scrollY;
    render();
    if (samePage) window.scrollTo(0, Math.min(y, $('.toolbar') ? $('.toolbar').offsetTop : 0));
    else window.scrollTo(0, 0);
    if (lastPath !== null && !samePage) app.focus({ preventScroll: true });
    lastPath = np;
  }
  window.addEventListener('hashchange', function () { onRoute(); });

  function after(p) {
    if (p === '/catalog') bindCatalog();
    if (p.indexOf('/product/') === 0) bindProduct();
    if (p === '/checkout') bindCheckout();
  }

  function footer() {
    return '<footer class="foot"><div class="wrap foot__grid">' +
      '<div class="foot__logo" aria-hidden="true">KURTKI<sup>7KM</sup></div>' +
      '<ul><li class="eyebrow">Каталог</li><li><a href="#/catalog?new=1">Новинки</a></li><li><a href="#/catalog?kind=puffer">Пуховики</a></li><li><a href="#/catalog?kind=coat">Пальта</a></li><li><a href="#/catalog?fur=1">З хутром</a></li></ul>' +
      '<ul><li class="eyebrow">Покупцям</li><li><a href="#/info">Доставка та оплата</a></li><li><a href="#/info">Повернення</a></li><li><a href="#/info">Таблиця розмірів</a></li></ul>' +
      '<ul><li class="eyebrow">Контакти</li><li><a href="tel:+380000000000">+38 (000) 000 00 00</a></li><li>Щодня 9:00–21:00</li><li>Ринок «7 км», Одеса</li></ul>' +
      '</div><div class="wrap"><p class="foot__note mono">© 2026 KURTKI 7KM · Чернетка сайту для погодження · <a href="admin.html">Адмін-панель</a></p></div></footer>';
  }

  /* ── views ── */
  function viewHome() {
    var news = P.filter(function (p) { return p.flags.new; }).slice(0, 8);
    var sale = P.filter(function (p) { return p.oldPrice; });
    var tiles = [
      ['puffer', 'img/m-argento-1-1.webp'], ['jacket', 'img/m-camoscio-1-1.webp'], ['parka', 'img/m-duetto-1-1.webp'],
      ['coat', 'img/m-avena-1-1.webp'], ['vest', 'img/m-maglia-1-1.webp']
    ];
    function count(k) { return P.filter(function (p) { return p.kind === k; }).length; }
    tiles = tiles.filter(function (t) { return count(t[0]) > 0; });
    return '' +
      '<section class="hero" aria-label="Колекція зима 2026">' +
        '<div class="hero__media"><img src="img/m-aviatore-2-4.webp" alt="Бомбер Aviatore з хутряним коміром, хакі" width="900" height="1125" fetchpriority="high"><img src="img/m-duetto-1-4.webp" alt="Куртка Duetto зі стьобаною вкладкою, шоколад" width="900" height="1125"></div>' +
        '<div class="hero__copy"><p class="eyebrow">Колекція зима 2026/27</p>' +
          '<h1 class="hero__title">Зима,<br><em>зшита</em> на міру</h1>' +
          '<p class="hero__lead">Пуховики, куртки, пальта та жилети. Тихі кольори, теплі хутряні капюшони, примірка перед оплатою.</p>' +
          '<div class="hero__cta"><a class="btn btn--light" href="#/catalog?new=1">Новинки</a><a class="btn btn--light" href="#/catalog?kind=puffer">Пуховики</a></div></div>' +
      '</section>' +
      '<div class="ticker mono" aria-hidden="true"><div class="ticker__in">' +
        new Array(3).join('<span>Примірка перед оплатою</span><span>Нова Пошта 1–2 дні</span><span>Безкоштовна доставка від 5 000 ₴</span><span>Повернення 14 днів</span>') +
      '</div></div>' +
      '<section class="sec wrap" aria-labelledby="h-cat"><div class="sec__head"><h2 class="sec__title" id="h-cat">Категорії</h2><a class="more" href="#/catalog">Весь каталог</a></div>' +
        '<div class="tiles">' + tiles.map(function (t) {
          return '<a class="tile" href="#/catalog?' + (t[0] === 'suit' ? 'suit=1' : 'kind=' + t[0]) + '"><img src="' + t[1] + '" alt="" width="900" height="1125" loading="lazy"><span class="tile__lbl"><b>' + KINDS[t[0]] + '</b><span class="mono">' + count(t[0]) + '</span></span></a>';
        }).join('') + '</div></section>' +
      '<section class="sec wrap" aria-labelledby="h-new" style="padding-top:0"><div class="sec__head"><h2 class="sec__title" id="h-new">Новинки <em>сезону</em></h2><a class="more" href="#/catalog?new=1">Усі новинки</a></div>' +
        '<div class="rail">' + news.map(function (p) { return card(p); }).join('') + '</div></section>' +
      '<section class="sec wrap" aria-labelledby="h-ed" style="padding-top:0"><div class="edit">' +
        '<div class="edit__img"><img src="img/m-camoscio-2-5.webp" alt="Куртка Camoscio з хутряним капюшоном, шоколад" width="900" height="1125" loading="lazy"></div>' +
        '<div class="edit__txt"><p class="eyebrow">Editorial · 02</p><h2 id="h-ed">Хутро, що <em>зігріває</em></h2><p>Пишні хутряні капюшони та коміри на пуховиках, куртках і бомберах. Тепло й м’якість від першого морозу до березня.</p><a class="btn" href="#/catalog?fur=1">Моделі з хутром</a></div>' +
        '<div class="edit__img"><img src="img/m-volpe-1-5.webp" alt="Пуховик Volpe з хутром, сірий" width="900" height="1125" loading="lazy"></div>' +
      '</div></section>' +
      (sale.length ? '<section class="salestrip" aria-labelledby="h-sale"><div class="sec wrap"><div class="sec__head"><h2 class="sec__title" id="h-sale">Sale <em>до −30%</em></h2><a class="more" href="#/catalog?sale=1">Усі знижки</a></div>' +
        '<div class="rail">' + sale.map(function (p) { return card(p); }).join('') + '</div></div></section>' : '') +
      '<section class="perks" aria-label="Переваги">' +
        '<div class="perk"><span class="mono">01</span><b>Примірка перед оплатою</b><p>Оплачуєте лише те, що підійшло, — прямо у відділенні Нової Пошти.</p></div>' +
        '<div class="perk"><span class="mono">02</span><b>Доставка 1–2 дні</b><p>Відправляємо щодня. Від 5 000 ₴ — безкоштовно.</p></div>' +
        '<div class="perk"><span class="mono">03</span><b>Повернення 14 днів</b><p>Не підійшов розмір — обміняємо або повернемо кошти.</p></div>' +
      '</section>';
  }

  /* catalog */
  var FILTER_KEYS = ['new', 'kind', 'span', 'leather', 'cat', 'fur', 'suit', 'sale', 'q', 'color', 'size', 'min', 'max'];
  function list(v) { return v ? v.split(',').filter(Boolean) : []; }
  function matchQ(p, q) {
    var hay = norm([p.name, p.title, KINDS[p.kind], KIND_ONE[p.kind], p.temp, p.desc, p.materials, SPANS[p.span],
      p.colors.map(function (c) { return c.name; }).join(' '), p.flags.leather ? 'шкіра шкіряна' : '', p.flags.fur ? 'хутро з хутром' : '',
      p.flags.cat === 'windbreaker' ? 'вітровка' : '', p.oldPrice ? 'sale знижка' : '', p.flags.new ? 'новинка new' : ''].join(' '));
    return norm(q).split(/[\s,]+/).filter(Boolean).every(function (w) {
      var stem = w.length > 5 ? w.slice(0, w.length - 2) : w;
      return hay.indexOf(stem) > -1;
    });
  }
  function filterProducts(pr) {
    var kinds = list(pr.get('kind')), spans = list(pr.get('span')), colors = list(pr.get('color')), sizes = list(pr.get('size'));
    var min = +pr.get('min') || 0, max = +pr.get('max') || Infinity, q = pr.get('q');
    return P.filter(function (p) {
      if (pr.get('new') && !p.flags.new) return false;
      if (pr.get('sale') && !p.oldPrice) return false;
      if (pr.get('leather') && !p.flags.leather) return false;
      if (pr.get('fur') && !p.flags.fur) return false;
      if (pr.get('suit') && !p.flags.suit) return false;
      if (pr.get('cat') && p.flags.cat !== pr.get('cat')) return false;
      if (kinds.length && kinds.indexOf(p.kind) < 0) return false;
      if (spans.length && spans.indexOf(p.span) < 0) return false;
      if (colors.length && !p.colors.some(function (c) { return colors.indexOf(c.name) > -1; })) return false;
      if (sizes.length && !p.sizes.some(function (s) { return sizes.indexOf(s) > -1; })) return false;
      if (p.price < min || p.price > max) return false;
      if (q && !matchQ(p, q)) return false;
      return true;
    });
  }
  function catTitle(pr) {
    var kinds = list(pr.get('kind')), spans = list(pr.get('span'));
    var t = 'Каталог';
    if (pr.get('q')) return 'Пошук: «' + pr.get('q') + '»';
    if (pr.get('sale')) t = 'Sale';
    else if (pr.get('new')) t = 'Новинки';
    else if (pr.get('suit')) t = 'Спортивні костюми';
    else if (pr.get('cat') === 'windbreaker') t = 'Вітровки';
    else if (pr.get('leather') && !kinds.length) t = 'Шкіряні куртки';
    else if (kinds.length === 1) t = KINDS[kinds[0]] || t;
    if (spans.length === 1 && kinds.length === 1) t = SPANS[spans[0]] + ' ' + (KINDS[kinds[0]] || '').toLowerCase();
    if (pr.get('fur') && kinds[0] === 'parka') t = 'Парки з хутром';
    return t;
  }
  function sortList(arr, s) {
    var a = arr.slice();
    if (s === 'price-asc') a.sort(function (x, y) { return x.price - y.price; });
    else if (s === 'price-desc') a.sort(function (x, y) { return y.price - x.price; });
    else if (s === 'new') a.sort(function (x, y) { return (y.flags.new ? 1 : 0) - (x.flags.new ? 1 : 0); });
    else if (s === 'sale') a.sort(function (x, y) { return (y.oldPrice ? y.oldPrice - y.price : 0) - (x.oldPrice ? x.oldPrice - x.price : 0); });
    return a;
  }
  function chipLabel(k, v) {
    switch (k) {
      case 'new': return 'Новинки';
      case 'sale': return 'Sale';
      case 'leather': return 'Шкіра';
      case 'fur': return 'З хутром';
      case 'suit': return 'Костюми';
      case 'cat': return 'Вітровки';
      case 'kind': return list(v).map(function (x) { return KINDS[x] || x; }).join(', ');
      case 'span': return list(v).map(function (x) { return SPANS[x] || x; }).join(', ');
      case 'color': return list(v).join(', ');
      case 'size': return 'Розмір ' + list(v).join(', ');
      case 'min': return 'від ' + money(v);
      case 'max': return 'до ' + money(v);
      case 'q': return '«' + v + '»';
    }
    return v;
  }
  function catHash(pr) {
    var s = pr.toString().replace(/%2C/g, ',');
    return '#/catalog' + (s ? '?' + s : '');
  }
  function viewCatalog() {
    var pr = route.params;
    var items = sortList(filterProducts(pr), pr.get('sort'));
    var title = catTitle(pr);
    var active = FILTER_KEYS.filter(function (k) { return pr.get(k); });
    var quick = [['', 'Усі'], ['kind=puffer', 'Пуховики'], ['kind=coat', 'Пальта'], ['kind=parka', 'Парки'], ['kind=jacket', 'Куртки'], ['kind=vest', 'Жилетки'], ['fur=1', 'З хутром']];
    var cur = pr.toString();
    var html = '<div class="wrap">' +
      '<nav class="crumbs mono" aria-label="Навігація"><a href="#/">Головна</a><span aria-hidden="true">/</span><span>Каталог</span></nav>' +
      '<header class="cat__head"><h1 class="cat__title">' + esc(title) + '</h1>' +
      '<p class="cat__count mono" aria-live="polite">' + items.length + ' ' + plural(items.length, 'модель', 'моделі', 'моделей') + '</p></header>' +
      '<div class="chips" role="list">' + quick.map(function (q) {
        var on = q[0] === cur.replace(/&?sort=[^&]*/, '');
        return '<a role="listitem" class="chip' + (on ? ' on' : '') + '" href="#/catalog' + (q[0] ? '?' + q[0] : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + q[1] + '</a>';
      }).join('') + '</div>' +
      '<div class="toolbar"><button class="btn" id="fOpen" aria-controls="filters">Фільтри' + (active.length ? ' · ' + active.length : '') + '</button>' +
      '<label class="sel"><span class="sr">Сортування</span><select id="sort">' +
        [['', 'Рекомендовані'], ['new', 'Спочатку новинки'], ['price-asc', 'Ціна: за зростанням'], ['price-desc', 'Ціна: за спаданням'], ['sale', 'Найбільша знижка']].map(function (o) {
          return '<option value="' + o[0] + '"' + ((pr.get('sort') || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label></div>';
    if (active.length) {
      html += '<div class="active">' + active.map(function (k) {
        return '<button class="chip" data-unset="' + k + '" aria-label="Прибрати фільтр: ' + esc(chipLabel(k, pr.get(k))) + '">' + esc(chipLabel(k, pr.get(k))) + ' <span class="rm" aria-hidden="true">✕</span></button>';
      }).join('') + (active.length > 1 ? '<a class="chip" href="#/catalog">Скинути все</a>' : '') + '</div>';
    }
    if (items.length) html += '<div class="grid">' + items.map(function (p, i) { return card(p, { eager: i < 4 }); }).join('') + '</div>';
    else html += '<div class="empty"><h2>Нічого не знайдено</h2><p>Спробуйте прибрати частину фільтрів або змінити запит.</p><a class="btn btn--ink" href="#/catalog">Увесь каталог</a></div>';
    html += '<div style="height:64px"></div></div>';
    return { html: html, title: title };
  }
  function bindCatalog() {
    var pr = route.params;
    $('#sort').addEventListener('change', function () {
      var n = new URLSearchParams(pr.toString());
      if (this.value) n.set('sort', this.value); else n.delete('sort');
      location.hash = catHash(n);
    });
    $('#fOpen').addEventListener('click', function () { buildFilters(); openPanel($('#filters'), this); });
    $$('[data-unset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = new URLSearchParams(pr.toString());
        n.delete(b.getAttribute('data-unset'));
        location.hash = catHash(n);
      });
    });
  }

  /* filters sheet */
  function allColors() {
    var seen = {}, out = [];
    P.forEach(function (p) { p.colors.forEach(function (c) { if (!seen[c.name]) { seen[c.name] = 1; out.push(c); } }); });
    return out;
  }
  function opt(name, value, label, checked, swatch) {
    return '<label class="fopt"><input type="checkbox" name="' + name + '" value="' + esc(value) + '"' + (checked ? ' checked' : '') + '><span>' + (swatch ? '<i style="background:' + swatch + '"></i>' : '') + esc(label) + '</span></label>';
  }
  function buildFilters() {
    var pr = route.params;
    var kinds = list(pr.get('kind')), spans = list(pr.get('span')), colors = list(pr.get('color')), sizes = list(pr.get('size'));
    var prices = P.map(function (p) { return p.price; });
    $('#fBody').innerHTML =
      '<fieldset class="fgrp"><legend>Категорія</legend><div class="fopts">' + Object.keys(KINDS).map(function (k) { return opt('kind', k, KINDS[k], kinds.indexOf(k) > -1); }).join('') + '</div></fieldset>' +
      '<fieldset class="fgrp"><legend>Довжина</legend><div class="fopts">' + opt('span', 'short', 'Короткі', spans.indexOf('short') > -1) + opt('span', 'long', 'Довгі', spans.indexOf('long') > -1) + '</div></fieldset>' +
      '<fieldset class="fgrp"><legend>Особливості</legend><div class="fopts">' +
        opt('new', '1', 'Новинки', !!pr.get('new')) + opt('sale', '1', 'Sale', !!pr.get('sale')) + opt('leather', '1', 'Шкіра', !!pr.get('leather')) +
        opt('fur', '1', 'З хутром', !!pr.get('fur')) + opt('cat', 'windbreaker', 'Вітровки', pr.get('cat') === 'windbreaker') + '</div></fieldset>' +
      '<fieldset class="fgrp"><legend>Колір</legend><div class="fopts">' + allColors().map(function (c) { return opt('color', c.name, c.name, colors.indexOf(c.name) > -1, c.hex); }).join('') + '</div></fieldset>' +
      '<fieldset class="fgrp"><legend>Розмір</legend><div class="fopts">' + ['XS', 'S', 'M', 'L', 'XL'].map(function (s) { return opt('size', s, s + ' · ' + SIZE_UA[s], sizes.indexOf(s) > -1); }).join('') + '</div></fieldset>' +
      '<fieldset class="fgrp"><legend>Ціна, ₴</legend><div class="frange">' +
        '<input class="inp" type="number" inputmode="numeric" id="fMin" min="0" step="100" placeholder="від ' + Math.min.apply(null, prices) + '" value="' + esc(pr.get('min') || '') + '" aria-label="Ціна від">' +
        '<span>—</span><input class="inp" type="number" inputmode="numeric" id="fMax" min="0" step="100" placeholder="до ' + Math.max.apply(null, prices) + '" value="' + esc(pr.get('max') || '') + '" aria-label="Ціна до"></div></fieldset>';
    updateApplyCount();
  }
  function collectFilters() {
    var n = new URLSearchParams();
    var body = $('#fBody');
    ['kind', 'span', 'color', 'size'].forEach(function (k) {
      var v = $$('input[name="' + k + '"]:checked', body).map(function (i) { return i.value; });
      if (v.length) n.set(k, v.join(','));
    });
    ['new', 'sale', 'leather', 'fur', 'cat'].forEach(function (k) {
      var i = $('input[name="' + k + '"]', body);
      if (i && i.checked) n.set(k, i.value);
    });
    var mn = parseInt($('#fMin').value, 10), mx = parseInt($('#fMax').value, 10);
    if (mn > 0) n.set('min', mn);
    if (mx > 0) n.set('max', mx);
    if (mn > 0 && mx > 0 && mn > mx) { n.set('min', mx); n.set('max', mn); }
    if (route.params.get('q')) n.set('q', route.params.get('q'));
    if (route.params.get('suit')) n.set('suit', route.params.get('suit'));
    if (route.params.get('sort')) n.set('sort', route.params.get('sort'));
    return n;
  }
  function updateApplyCount() {
    var n = filterProducts(collectFilters()).length;
    var b = $('#fApply');
    b.textContent = n ? 'Показати ' + n + ' ' + plural(n, 'модель', 'моделі', 'моделей') : 'Нічого не знайдено';
    b.disabled = !n;
  }
  $('#fBody').addEventListener('change', updateApplyCount);
  $('#fBody').addEventListener('input', function (e) { if (e.target.type === 'number') updateApplyCount(); });
  $('#fApply').addEventListener('click', function () {
    var n = collectFilters();
    closePanel($('#filters'), true);
    location.hash = catHash(n);
  });
  $('#fReset').addEventListener('click', function () {
    $$('#fBody input[type=checkbox]').forEach(function (i) { i.checked = false; });
    $('#fMin').value = ''; $('#fMax').value = '';
    updateApplyCount();
  });

  /* product */
  var pdp = null;
  function viewProduct(p) {
    var ci = Math.min(p.colors.length - 1, Math.max(0, parseInt(route.params.get('c'), 10) || 0));
    pdp = { p: p, color: ci, size: null };
    var related = P.filter(function (x) { return x.kind === p.kind && x.slug !== p.slug; });
    if (related.length < 4) related = related.concat(P.filter(function (x) { return x.kind !== p.kind && x.span === p.span && related.indexOf(x) < 0 && x.slug !== p.slug; })).slice(0, 8);
    var on = isFav(p.slug);
    return '<div class="wrap">' +
      '<nav class="crumbs mono" aria-label="Навігація"><a href="#/">Головна</a><span aria-hidden="true">/</span><a href="#/catalog?' + (p.kind === 'suit' ? 'suit=1' : 'kind=' + p.kind) + '">' + esc(KINDS[p.kind]) + '</a><span aria-hidden="true">/</span><span>' + esc(p.name) + '</span></nav>' +
      '<div class="pdp" style="margin-top:12px">' +
        '<section class="gal" aria-label="Фото товару" id="gal">' + galleryHtml(p, ci) + '</section>' +
        '<section class="pi" aria-label="Деталі товару">' +
          '<div class="pi__top"><p class="pi__kind mono">' + esc(KIND_ONE[p.kind]) + ' · ' + (p.span === 'long' ? 'довга модель' : 'коротка модель') + '</p>' +
          '<h1 class="pi__name">' + esc(p.name) + '</h1>' +
          '<div class="pi__price">' + priceHtml(p) + '</div>' +
          '<div class="pi__meta mono">' + (p.temp ? '<span class="tag tag--ink" title="Температурний режим">' + p.temp + '</span>' : '') +
            (p.flags.new ? '<span class="tag">New</span>' : '') + (p.flags.leather ? '<span class="tag">Шкіра</span>' : '') + (p.flags.fur ? '<span class="tag">Хутро</span>' : '') +
            (p.oldPrice ? '<span class="tag" style="color:var(--sale)">−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%</span>' : '') + '</div></div>' +
          '<div><div class="pi__lbl"><span>Колір: <b id="colorName">' + esc(p.colors[ci].name) + '</b></span></div>' +
            '<div class="sw" role="group" aria-label="Колір">' + p.colors.map(function (c, i) {
              return '<button data-color="' + i + '" aria-pressed="' + (i === ci) + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '"><i style="background:' + c.hex + '"></i></button>';
            }).join('') + '</div></div>' +
          '<div><div class="pi__lbl"><span>Розмір: <b id="sizeName">не обрано</b></span><button class="link" id="sizesOpen" aria-controls="sizes">Таблиця розмірів</button></div>' +
            '<div class="sizes" role="group" aria-label="Розмір" id="sizeGrp">' + p.sizes.map(function (s) {
              return '<button data-size="' + s + '" aria-pressed="false">' + s + '<small>' + SIZE_UA[s] + '</small></button>';
            }).join('') + '</div><p class="err-msg" id="sizeErr" hidden>Оберіть розмір, щоб додати в кошик</p></div>' +
          '<div class="pi__buy"><button class="btn btn--ink" id="addCart">Додати в кошик' + (p.price ? ' · ' + money(p.price) : '') + '</button>' +
            '<button class="btn fav-btn" data-fav="' + p.slug + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Прибрати з улюблених: ' : 'В улюблені: ') + esc(p.name) + '">' + (on ? '♥' : '♡') + '</button></div>' +
          '<ul class="pi__perks"><li>Примірка у відділенні Нової Пошти перед оплатою</li><li>Безкоштовна доставка від 5 000 ₴</li><li>Обмін і повернення протягом 14 днів</li></ul>' +
          '<div class="acc">' +
            '<details open><summary>Опис</summary><div class="acc__b"><p>' + esc(p.desc) + '</p><p class="mono" style="color:var(--mute)">Арт. K7-' + String(p.id).padStart(4, '0') + (p.temp ? ' · Температурний режим ' + p.temp : '') + '</p></div></details>' +
            '<details><summary>Склад і матеріали</summary><div class="acc__b"><p>' + esc(p.materials) + '</p></div></details>' +
            '<details><summary>Догляд</summary><div class="acc__b"><p>' + esc(p.care) + '</p></div></details>' +
            '<details><summary>Доставка та повернення</summary><div class="acc__b"><p>Відправка Новою Поштою щодня, доставка 1–2 дні. Оплата після примірки у відділенні або карткою онлайн. Повернення — 14 днів. <a href="#/info" style="text-decoration:underline">Детальніше</a></p></div></details>' +
          '</div>' +
        '</section>' +
      '</div>' +
      (related.length ? '<section class="sec" aria-labelledby="h-rel"><div class="sec__head"><h2 class="sec__title" id="h-rel">Вам також <em>сподобається</em></h2></div><div class="rail">' + related.slice(0, 8).map(function (x) { return card(x); }).join('') + '</div></section>' : '') +
      '</div>';
  }
  function galleryHtml(p, ci) {
    var imgs = p.colors[ci].images;
    return '<div class="gal__track" id="galTrack" tabindex="0" aria-label="Галерея, гортайте">' + imgs.map(function (src, i) {
      return '<figure class="gal__item"><img src="' + src + '" alt="' + esc(p.title + ', ' + p.colors[ci].name + ', фото ' + (i + 1)) + '" width="900" height="1125"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + '></figure>';
    }).join('') + '</div>' +
      '<div class="gal__dots" aria-hidden="true">' + imgs.map(function (_, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' +
      '<span class="gal__count mono" aria-hidden="true"><span id="galN">1</span> / ' + imgs.length + '</span>';
  }
  function bindGallery() {
    var tr = $('#galTrack');
    if (!tr) return;
    tr.addEventListener('scroll', function () {
      var i = Math.round(tr.scrollLeft / tr.clientWidth);
      $$('.gal__dots i').forEach(function (d, k) { d.classList.toggle('on', k === i); });
      var n = $('#galN'); if (n) n.textContent = i + 1;
    }, { passive: true });
  }
  function bindProduct() {
    var p = pdp.p;
    bindGallery();
    $$('[data-color]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-color');
        if (i === pdp.color) return;
        pdp.color = i;
        $$('[data-color]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $('#colorName').textContent = p.colors[i].name;
        $('#gal').innerHTML = galleryHtml(p, i);
        bindGallery();
        try { history.replaceState(null, '', '#/product/' + p.slug + (i ? '?c=' + i : '')); } catch (e) { /* ignore */ }
      });
    });
    $$('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () {
        pdp.size = b.getAttribute('data-size');
        $$('[data-size]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $('#sizeName').textContent = pdp.size + ' / ' + SIZE_UA[pdp.size];
        $('#sizeGrp').classList.remove('err');
        $('#sizeErr').hidden = true;
      });
    });
    $('#sizesOpen').addEventListener('click', function () { openPanel($('#sizes'), this); });
    $('#addCart').addEventListener('click', function () {
      if (!pdp.size) {
        $('#sizeGrp').classList.add('err');
        $('#sizeErr').hidden = false;
        $('[data-size]').focus();
        toast('Оберіть розмір');
        return;
      }
      addToCart(p.slug, pdp.color, pdp.size);
      toast(esc(p.name) + ', ' + pdp.size + ' — у кошику <a href="#" data-opencart>Відкрити</a>');
    });
  }
  toastEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-opencart]')) { e.preventDefault(); e.stopPropagation(); toastEl.classList.remove('on'); openPanel(cartEl, $('#cartOpen')); }
  });

  function viewFavs() {
    var items = favs.map(bySlug).filter(Boolean);
    var html = '<div class="wrap"><nav class="crumbs mono" aria-label="Навігація"><a href="#/">Головна</a><span aria-hidden="true">/</span><span>Улюблені</span></nav>' +
      '<header class="cat__head"><h1 class="cat__title">Улюблені</h1><p class="cat__count mono">' + items.length + ' ' + plural(items.length, 'модель', 'моделі', 'моделей') + '</p></header>';
    if (!items.length) html += '<div class="empty"><h2>Тут поки порожньо</h2><p>Натискайте ♡ на моделях, які сподобались, — вони збережуться тут.</p><a class="btn btn--ink" href="#/catalog">До каталогу</a></div>';
    else html += '<div class="grid">' + items.map(function (p) { return card(p); }).join('') + '</div>';
    return html + '<div style="height:64px"></div></div>';
  }

  function viewInfo() {
    return '<div class="wrap"><nav class="crumbs mono" aria-label="Навігація"><a href="#/">Головна</a><span aria-hidden="true">/</span><span>Покупцям</span></nav><div class="info">' +
      '<header class="info__hero"><h1>Доставка<br>та оплата</h1><p>Відправляємо по всій Україні Новою Поштою. Спочатку приміряєте — потім платите.</p></header>' +
      '<div class="info__grid">' +
        '<section class="info__card"><span class="info__num mono">01</span><h2>Доставка</h2><ul><li>Нова Пошта: у відділення, поштомат або кур’єром.</li><li>Відправка щодня до 18:00, доставка 1–2 дні.</li><li>Від ' + money(FREE_SHIP) + ' — безкоштовно, менше — за тарифами перевізника (≈ 70–120 ₴).</li></ul></section>' +
        '<section class="info__card"><span class="info__num mono">02</span><h2>Оплата</h2><ul><li>Накладений платіж — оплата у відділенні після примірки (комісія НП 20 ₴ + 2%).</li><li>Карткою онлайн — менеджер надішле захищене посилання на оплату після підтвердження.</li></ul></section>' +
        '<section class="info__card"><span class="info__num mono">03</span><h2>Примірка перед оплатою</h2><p>У відділенні Нової Пошти можна відкрити посилку та приміряти речі. Якщо не підійшло — просто відмовтесь, оплачуєте лише доставку.</p></section>' +
        '<section class="info__card"><span class="info__num mono">04</span><h2>Обмін і повернення</h2><ul><li>14 днів з моменту отримання.</li><li>Річ без слідів носіння, з бірками.</li><li>Кошти повертаємо на картку протягом 3 робочих днів.</li></ul></section>' +
      '</div>' +
      '<section class="info__card" id="sizes-info" style="border:1px solid var(--line)"><span class="info__num mono">05</span><h2>Таблиця розмірів</h2><div class="info__sizes">' + $('#sizes .sizetable').outerHTML + '</div><p class="note">' + $('#sizes .note').textContent + '</p></section>' +
      '</div></div>';
  }

  /* checkout */
  function viewCheckout() {
    var t = cartTotals();
    if (!t.qty) return '<div class="wrap"><div class="empty"><h2>Кошик порожній</h2><p>Щоб оформити замовлення, додайте хоча б одну модель.</p><a class="btn btn--ink" href="#/catalog">До каталогу</a></div></div>';
    var d = store.get('k7_contact', {}) || {};
    var ship = t.sum >= FREE_SHIP ? 'Безкоштовно' : 'За тарифом НП';
    return '<div class="wrap"><div class="co">' +
      '<header><nav class="crumbs mono" aria-label="Навігація" style="padding-bottom:16px"><a href="#/">Головна</a><span aria-hidden="true">/</span><span>Оформлення</span></nav><h1>Оформлення<br>замовлення</h1></header>' +
      '<form class="co__form" id="coForm" novalidate>' +
        '<fieldset class="co__sec"><legend>01 · Контакти</legend>' +
          fld('coName', 'Ім’я та прізвище', 'text', 'name', d.name, 'Як у паспорті — для отримання на НП') +
          fld('coPhone', 'Телефон', 'tel', 'tel', d.phone, '+380 XX XXX XX XX', '+380') +
        '</fieldset>' +
        '<fieldset class="co__sec"><legend>02 · Доставка Новою Поштою</legend><div class="fld2">' +
          fld('coCity', 'Місто', 'text', 'address-level2', d.city, '') +
          fld('coBranch', 'Відділення або поштомат №', 'text', 'off', d.branch, 'Наприклад: 12 або «Поштомат 2345»') +
        '</div></fieldset>' +
        '<fieldset class="co__sec"><legend>03 · Оплата</legend><div class="pay">' +
          '<label><input type="radio" name="pay" value="cod" checked><b>Накладений платіж</b><small>Оплата у відділенні після примірки. Комісія НП 20 ₴ + 2%.</small></label>' +
          '<label><input type="radio" name="pay" value="card"><b>Карткою онлайн</b><small>Менеджер надішле посилання на оплату після підтвердження.</small></label>' +
        '</div></fieldset>' +
        '<div class="fld"><label for="coNote">Коментар <span class="hint">(необов’язково)</span></label><textarea class="inp" id="coNote" rows="3" maxlength="500"></textarea></div>' +
        '<button class="btn btn--ink btn--full" type="submit">Підтвердити замовлення · ' + money(t.sum) + '</button>' +
        '<p class="co__agree">Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних для доставки замовлення. Менеджер зателефонує для підтвердження.</p>' +
      '</form>' +
      '<aside class="co__sum" aria-label="Ваше замовлення"><h2>Ваше замовлення</h2>' +
        cart.map(function (it) {
          var p = bySlug(it.slug), c = p.colors[it.color];
          return '<div class="co__line"><img src="' + c.images[0] + '" alt="" width="112" height="140" loading="lazy"><div>' + esc(p.name) + '<small>' + esc(c.name) + ' / ' + it.size + ' · ' + it.qty + ' шт.</small></div><span class="mono">' + money(p.price * it.qty) + '</span></div>';
        }).join('') +
        '<div class="co__row"><span>Товари</span><b>' + money(t.sum) + '</b></div>' +
        '<div class="co__row"><span>Доставка</span><b>' + ship + '</b></div>' +
        '<div class="co__row co__row--total"><span>До сплати</span><b>' + money(t.sum) + '</b></div>' +
        '<a class="link" href="#" data-opencart-link style="justify-self:start">Змінити кошик</a>' +
      '</aside></div></div>';
  }
  function fld(id, label, type, ac, val, hint, ph) {
    return '<div class="fld"><label for="' + id + '">' + label + '</label>' +
      '<input class="inp" id="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (type === 'tel' ? ' inputmode="tel"' : '') + ' value="' + esc(val || '') + '"' + (ph ? ' placeholder="' + ph + '"' : '') + ' aria-describedby="' + id + 'Err' + (hint ? ' ' + id + 'Hint' : '') + '" required>' +
      (hint ? '<span class="hint" id="' + id + 'Hint">' + esc(hint) + '</span>' : '') +
      '<span class="ferr" id="' + id + 'Err" role="alert"></span></div>';
  }
  function normPhone(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.length === 10 && d.charAt(0) === '0') d = '38' + d;
    if (d.length === 9) d = '380' + d;
    return /^380\d{9}$/.test(d) ? '+' + d : null;
  }
  function fmtPhone(p) { return p.replace(/^\+(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, '+$1 $2 $3 $4 $5'); }
  function bindCheckout() {
    var f = $('#coForm');
    var link = $('[data-opencart-link]');
    if (link) link.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openPanel(cartEl, link); });
    if (!f) return;
    var rules = {
      coName: function (v) { return v.trim().length < 2 ? 'Вкажіть ім’я та прізвище' : (v.trim().split(/\s+/).length < 2 ? 'Вкажіть і прізвище — воно потрібне для отримання посилки' : ''); },
      coPhone: function (v) { return normPhone(v) ? '' : 'Вкажіть номер у форматі +380 XX XXX XX XX'; },
      coCity: function (v) { return v.trim().length < 2 ? 'Вкажіть місто' : ''; },
      coBranch: function (v) { return /\d/.test(v) ? '' : 'Вкажіть номер відділення або поштомата'; }
    };
    function check(id) {
      var el = $('#' + id), msg = rules[id](el.value);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      $('#' + id + 'Err').textContent = msg;
      return !msg;
    }
    Object.keys(rules).forEach(function (id) {
      $('#' + id).addEventListener('blur', function () { if (this.value) check(id); });
      $('#' + id).addEventListener('input', function () { if (this.getAttribute('aria-invalid') === 'true') check(id); });
    });
    $('#coPhone').addEventListener('blur', function () { var n = normPhone(this.value); if (n) this.value = fmtPhone(n); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).filter(function (id) { return !check(id); });
      if (bad.length) { $('#' + bad[0]).focus(); toast('Перевірте, будь ласка, поля форми'); return; }
      var t = cartTotals();
      var order = {
        n: 'K7-' + String(Date.now()).slice(-6),
        at: new Date().toISOString(),
        name: $('#coName').value.trim(), phone: fmtPhone(normPhone($('#coPhone').value)),
        city: $('#coCity').value.trim(), branch: $('#coBranch').value.trim(),
        pay: (f.querySelector('input[name=pay]:checked') || {}).value || 'cod',
        note: $('#coNote').value.trim(), items: cart.slice(), total: t.sum
      };
      var orders = store.get('k7_orders', []);
      if (!Array.isArray(orders)) orders = [];
      orders.push(order);
      store.set('k7_orders', orders);
      store.set('k7_contact', { name: order.name, phone: order.phone, city: order.city, branch: order.branch });
      lastOrder = order;
      cart = [];
      saveCart();
      location.hash = '#/order/' + order.n;
    });
  }
  var lastOrder = null;
  function viewDone(n) {
    var orders = store.get('k7_orders', []) || [];
    var o = (lastOrder && lastOrder.n === n) ? lastOrder : (Array.isArray(orders) ? orders.filter(function (x) { return x.n === n; })[0] : null);
    if (!o) return view404();
    var qty = o.items.reduce(function (s, it) { return s + it.qty; }, 0);
    return '<div class="wrap"><div class="done">' +
      '<p class="eyebrow">Замовлення ' + esc(o.n) + '</p>' +
      '<h1>Дякуємо,<br><em>' + esc(o.name.split(' ')[0]) + '</em></h1>' +
      '<p>Замовлення прийнято. Менеджер зателефонує на ' + esc(o.phone) + ' протягом 30 хвилин (щодня 9:00–21:00), щоб підтвердити деталі.</p>' +
      '<div class="done__box mono">' +
        '<div><span>Товарів</span><span>' + qty + '</span></div>' +
        '<div><span>Сума</span><span>' + money(o.total) + '</span></div>' +
        '<div><span>Доставка</span><span>' + esc(o.city) + ', НП ' + esc(o.branch) + '</span></div>' +
        '<div><span>Оплата</span><span>' + (o.pay === 'card' ? 'Карткою онлайн' : 'Накладений платіж') + '</span></div>' +
      '</div>' +
      '<div class="done__cta"><a class="btn btn--ink" href="#/">На головну</a><a class="btn" href="#/catalog?new=1">Новинки</a></div>' +
      '</div></div>';
  }
  function view404() {
    return '<div class="wrap"><div class="empty"><p class="eyebrow">404</p><h2>Сторінку не знайдено</h2><p>Можливо, модель уже розпродано або посилання застаріло.</p><a class="btn btn--ink" href="#/catalog">До каталогу</a></div></div>';
  }

  /* ── sync between tabs ── */
  window.addEventListener('storage', function (e) {
    if (e.key === 'k7_cart') { cart = sanitizeCart(store.get('k7_cart', [])); renderCart(); }
    if (e.key === 'k7_favs') { favs = store.get('k7_favs', []) || []; renderFavCount(); }
  });

  /* ── init ── */
  renderCart();
  renderFavCount();
  onRoute(true);
})();
