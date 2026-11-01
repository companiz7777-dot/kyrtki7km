/* KURTKI 7KM — адмін-панель (чернетка без бекенду: дані в localStorage цього браузера). */
(function () {
  'use strict';

  var KINDS = window.KINDS || {};
  var SPANS = { short: 'Коротка', long: 'Довга' };
  var ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  var STATUSES = { new: 'Нове', confirmed: 'Підтверджене', sent: 'Відправлене', done: 'Виконане', cancelled: 'Скасоване' };
  var PAY = { cod: 'Накладений платіж', card: 'Картка' };
  var FLAGS = [['new', 'Новинка'], ['leather', 'Шкіра'], ['fur', 'З хутром'], ['suit', 'Спортивний костюм']];
  // SHA-256 від 'k7:' + пароль. Пароль за замовчуванням: kurtki7km
  var DEFAULT_HASH = 'a9934b8896ec536f6054ebd3a47902ee7e63e55b71d7a5eff5476ecd6d6d517e';
  var IMG_MAX = 1000;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var main = $('#amain');

  /* ── utils ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0₴'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function slugify(s) {
    var map = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ё: 'e', ы: 'y', э: 'e', ъ: '' };
    return String(s).toLowerCase().split('').map(function (c) { return map[c] != null ? map[c] : c; }).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'model';
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return z(d.getDate()) + '.' + z(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) {
        toast('Не вдалося зберегти: сховище браузера переповнене. Зменште кількість або розмір фото.');
        return false;
      }
    },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  var toastEl = $('#toast'), toastT;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 3000);
  }
  function sha(text) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.reject(new Error('no crypto'));
  }

  /* ── дані ── */
  function loadProducts() { return clone(store.get('k7_admin_products', null) || window.PRODUCTS_ALL || window.PRODUCTS_DEFAULT || []); }
  var products = loadProducts();
  function saveProducts() {
    if (!store.set('k7_admin_products', products)) return false;
    renderCounts();
    return true;
  }
  function orders() { var o = store.get('k7_orders', []); return Array.isArray(o) ? o : []; }
  function bySlug(s) { return products.filter(function (p) { return p.slug === s; })[0]; }

  /* ── вхід ── */
  var SESSION = 'k7_admin_session';
  function authed() { try { return sessionStorage.getItem(SESSION) === '1'; } catch (e) { return false; } }
  function setAuthed(v) { try { if (v) sessionStorage.setItem(SESSION, '1'); else sessionStorage.removeItem(SESSION); } catch (e) { /* ignore */ } }
  function passHash() { return store.get('k7_admin_pass', DEFAULT_HASH); }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#loginPass').value;
    sha('k7:' + v).then(function (h) {
      if (h === passHash()) { setAuthed(true); start(); }
      else { $('#loginErr').hidden = false; $('#loginPass').select(); }
    }, function () { toast('Браузер не підтримує перевірку пароля. Відкрийте сторінку через https.'); });
  });
  $('#logout').addEventListener('click', function () { setAuthed(false); location.hash = ''; boot(); });

  function boot() {
    var ok = authed();
    $('#login').hidden = ok;
    $('#panel').hidden = !ok;
    if (ok) start(); else { $('#loginPass').value = ''; $('#loginPass').focus(); }
  }
  function start() {
    $('#login').hidden = true;
    $('#panel').hidden = false;
    renderCounts();
    route();
  }

  /* ── роутер ── */
  window.addEventListener('hashchange', function () { if (authed()) route(); });
  function route() {
    var h = location.hash.replace(/^#/, '') || 'products';
    var m;
    $$('.atabs a').forEach(function (a) { a.classList.toggle('on', h.indexOf(a.getAttribute('data-tab')) === 0); });
    if (h === 'products') viewProducts();
    else if (h === 'product/new') viewEdit(null);
    else if ((m = h.match(/^product\/(.+)$/))) viewEdit(decodeURIComponent(m[1]));
    else if (h === 'orders') viewOrders();
    else if (h === 'settings') viewSettings();
    else viewProducts();
    window.scrollTo(0, 0);
  }
  function renderCounts() {
    $('#cntProducts').textContent = products.length;
    var n = orders().filter(function (o) { return !o.status || o.status === 'new'; }).length;
    var b = $('#cntOrders');
    b.hidden = !n;
    b.textContent = n;
  }

  /* ── Товари ── */
  var listQ = '';
  function thumb(p) {
    var src = p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0];
    return src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="nophoto mono">Без фото</span>';
  }
  function viewProducts() {
    main.innerHTML =
      '<div class="ahead"><h1 class="atitle">Товари</h1>' +
      '<div class="ahead__tools"><input type="search" class="ainput" id="pq" placeholder="Пошук за назвою…" value="' + esc(listQ) + '" aria-label="Пошук товарів">' +
      '<a class="btn btn--ink" href="#product/new">+ Додати товар</a></div></div>' +
      '<div class="plist" id="plist"></div>';
    $('#pq').addEventListener('input', function () { listQ = this.value; renderList(); });
    renderList();
  }
  function renderList() {
    var q = listQ.trim().toLowerCase();
    var items = products.filter(function (p) { return !q || (p.name + ' ' + (p.title || '')).toLowerCase().indexOf(q) > -1; });
    var el = $('#plist');
    if (!items.length) { el.innerHTML = '<p class="aempty">Нічого не знайдено.</p>'; return; }
    el.innerHTML = items.map(function (p) {
      var tags = [];
      if (p.hidden) tags.push('<span class="tag tag--off">Приховано</span>');
      if (p.flags && p.flags.new) tags.push('<span class="tag">Новинка</span>');
      if (p.oldPrice) tags.push('<span class="tag tag--sale">Sale</span>');
      return '<div class="prow' + (p.hidden ? ' prow--off' : '') + '">' +
        '<a class="prow__img" href="#product/' + encodeURIComponent(p.slug) + '">' + thumb(p) + '</a>' +
        '<div class="prow__info"><a class="prow__name" href="#product/' + encodeURIComponent(p.slug) + '">' + esc(p.title || p.name) + '</a>' +
        '<span class="mono prow__meta">' + esc(KINDS[p.kind] || p.kind) + ' · ' + esc(SPANS[p.span] || '') + ' · ' + (p.colors || []).length + ' кол.</span>' +
        '<span class="prow__tags">' + tags.join('') + '</span></div>' +
        '<div class="prow__price mono">' + money(p.price) + (p.oldPrice ? '<s>' + money(p.oldPrice) + '</s>' : '') + '</div>' +
        '<div class="prow__act">' +
        '<button class="ibtn" data-act="toggle" data-slug="' + esc(p.slug) + '" title="' + (p.hidden ? 'Показати на сайті' : 'Приховати з сайту') + '">' + (p.hidden ? 'Показати' : 'Приховати') + '</button>' +
        '<a class="ibtn" href="#product/' + encodeURIComponent(p.slug) + '">Редагувати</a>' +
        '<button class="ibtn ibtn--del" data-act="del" data-slug="' + esc(p.slug) + '">Видалити</button></div></div>';
    }).join('');
  }
  main.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || !$('#plist')) return;
    var p = bySlug(b.getAttribute('data-slug'));
    if (!p) return;
    if (b.getAttribute('data-act') === 'toggle') {
      p.hidden = !p.hidden;
      if (saveProducts()) toast(esc(p.name) + (p.hidden ? ' приховано з сайту' : ' знову на сайті'));
      renderList();
    } else if (b.getAttribute('data-act') === 'del') {
      if (!confirm('Видалити «' + (p.title || p.name) + '»? Це не можна скасувати.')) return;
      products = products.filter(function (x) { return x !== p; });
      if (saveProducts()) toast(esc(p.name) + ' видалено');
      renderList();
    }
  });

  /* ── Редагування товару ── */
  var draft = null;
  function blank() {
    var id = products.reduce(function (m, p) { return Math.max(m, p.id | 0); }, 0) + 1;
    return { id: id, slug: '', name: '', title: '', kind: 'puffer', span: 'short', flags: {}, price: 0, colors: [{ name: '', hex: '#1a1a1a', images: [] }], sizes: ALL_SIZES.slice(), temp: '', desc: '', materials: '', care: '' };
  }
  function viewEdit(slug) {
    var src = slug ? bySlug(slug) : null;
    if (slug && !src) { main.innerHTML = '<p class="aempty">Товар не знайдено. <a class="link" href="#products">До списку</a></p>'; return; }
    draft = src ? clone(src) : blank();
    draft.flags = draft.flags || {};
    var isNew = !src;
    main.innerHTML =
      '<div class="ahead"><div><a class="link mono" href="#products">← Товари</a><h1 class="atitle">' + (isNew ? 'Новий товар' : esc(draft.title || draft.name)) + '</h1></div>' +
      (isNew ? '' : '<a class="link mono" href="index.html#/product/' + encodeURIComponent(draft.slug) + '" target="_blank" rel="noopener">Дивитися на сайті ↗</a>') + '</div>' +
      '<form class="pform" id="pform" novalidate>' +
      '<fieldset class="card"><legend>Основне</legend><div class="grid2">' +
      fld('Назва моделі', '<input class="ainput" id="fName" required value="' + esc(draft.name) + '" placeholder="Напр. Tartufo">') +
      fld('Повна назва', '<input class="ainput" id="fTitle" value="' + esc(draft.title) + '" placeholder="Напр. Довгий пуховик Tartufo">') +
      fld('Категорія', '<select class="ainput" id="fKind">' + Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + (draft.kind === k ? ' selected' : '') + '>' + esc(KINDS[k]) + '</option>'; }).join('') + '</select>') +
      fld('Довжина', '<select class="ainput" id="fSpan">' + Object.keys(SPANS).map(function (k) { return '<option value="' + k + '"' + (draft.span === k ? ' selected' : '') + '>' + SPANS[k] + '</option>'; }).join('') + '</select>') +
      fld('Адреса сторінки (латиницею)', '<input class="ainput" id="fSlug" value="' + esc(draft.slug) + '" placeholder="створиться з назви">') +
      fld('Температурний режим', '<input class="ainput" id="fTemp" value="' + esc(draft.temp) + '" placeholder="Напр. −25°">') +
      '</div></fieldset>' +
      '<fieldset class="card"><legend>Ціна</legend><div class="grid2">' +
      fld('Ціна, ₴', '<input class="ainput" id="fPrice" type="number" min="0" step="10" required value="' + (draft.price || '') + '">') +
      fld('Стара ціна, ₴ (для Sale)', '<input class="ainput" id="fOld" type="number" min="0" step="10" value="' + (draft.oldPrice || '') + '" placeholder="порожньо — без знижки">') +
      '</div></fieldset>' +
      '<fieldset class="card"><legend>Позначки та розміри</legend><div class="checks">' +
      FLAGS.map(function (f) { return chk('flag-' + f[0], f[1], !!draft.flags[f[0]]); }).join('') +
      chk('flag-cat', 'Вітровка', draft.flags.cat === 'windbreaker') +
      chk('fHidden', 'Приховати з сайту', !!draft.hidden) +
      '</div><div class="checks">' + ALL_SIZES.map(function (s) { return chk('size-' + s, 'Розмір ' + s, (draft.sizes || []).indexOf(s) > -1); }).join('') + '</div></fieldset>' +
      '<fieldset class="card"><legend>Кольори та фото</legend><div id="colors"></div>' +
      '<button type="button" class="btn" id="addColor">+ Додати колір</button>' +
      '<p class="hint">Перше фото кольору показується в каталозі. Фото автоматично зменшуються до ' + IMG_MAX + ' px.</p></fieldset>' +
      '<fieldset class="card"><legend>Опис</legend>' +
      fld('Опис', '<textarea class="ainput" id="fDesc" rows="4">' + esc(draft.desc) + '</textarea>') +
      fld('Склад і матеріали', '<textarea class="ainput" id="fMat" rows="3">' + esc(draft.materials) + '</textarea>') +
      fld('Догляд', '<textarea class="ainput" id="fCare" rows="3">' + esc(draft.care) + '</textarea>') +
      '</fieldset>' +
      '<div class="pform__bar"><a class="btn" href="#products">Скасувати</a><button class="btn btn--ink" id="saveBtn">Зберегти</button></div>' +
      '</form>';
    renderColors();
    $('#addColor').addEventListener('click', function () { draft.colors.push({ name: '', hex: '#8c8378', images: [] }); renderColors(); });
    $('#fName').addEventListener('input', function () { if (isNew && !$('#fSlug').dataset.touched) $('#fSlug').value = slugify(this.value); });
    $('#fSlug').addEventListener('input', function () { this.dataset.touched = '1'; });
    $('#pform').addEventListener('submit', function (e) { e.preventDefault(); save(src); });
  }
  function fld(label, input) { return '<label class="fld"><span>' + label + '</span>' + input + '</label>'; }
  function chk(id, label, on) { return '<label class="chk"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>'; }

  function renderColors() {
    var box = $('#colors');
    box.innerHTML = draft.colors.map(function (c, i) {
      return '<div class="color" data-i="' + i + '">' +
        '<div class="color__head">' +
        '<input type="color" class="color__hex" value="' + esc(c.hex || '#000000') + '" data-f="hex" aria-label="Відтінок">' +
        '<input class="ainput" value="' + esc(c.name) + '" data-f="name" placeholder="Назва кольору, напр. Чорний" aria-label="Назва кольору">' +
        (draft.colors.length > 1 ? '<button type="button" class="ibtn ibtn--del" data-c="rm">Прибрати колір</button>' : '') +
        '</div><div class="imgs">' +
        (c.images || []).map(function (src, j) {
          return '<figure class="img"><img src="' + esc(src) + '" alt="">' +
            '<div class="img__act">' + (j ? '<button type="button" data-c="first" data-j="' + j + '" title="Зробити головним">★</button>' : '<span class="mono">головне</span>') +
            '<button type="button" data-c="rmimg" data-j="' + j + '" title="Видалити фото">✕</button></div></figure>';
        }).join('') +
        '<label class="img img--add"><input type="file" accept="image/*" multiple data-c="upload" hidden><span>+ Фото</span></label>' +
        '</div></div>';
    }).join('');
  }
  document.addEventListener('input', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-f');
    var row = e.target.closest && e.target.closest('.color');
    if (!f || !row || !draft) return;
    draft.colors[+row.getAttribute('data-i')][f] = e.target.value;
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]');
    if (!b || !draft || b.tagName === 'INPUT') return;
    var c = draft.colors[+b.closest('.color').getAttribute('data-i')];
    var j = +b.getAttribute('data-j');
    var act = b.getAttribute('data-c');
    if (act === 'rm') { draft.colors.splice(draft.colors.indexOf(c), 1); }
    else if (act === 'rmimg') { c.images.splice(j, 1); }
    else if (act === 'first') { c.images.unshift(c.images.splice(j, 1)[0]); }
    renderColors();
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches || !e.target.matches('[data-c=upload]') || !draft) return;
    var c = draft.colors[+e.target.closest('.color').getAttribute('data-i')];
    var files = Array.prototype.slice.call(e.target.files || []);
    toast('Обробляю фото…');
    Promise.all(files.map(shrink)).then(function (urls) {
      urls.forEach(function (u) { if (u) c.images.push(u); });
      renderColors();
      toast('Додано фото: ' + urls.filter(Boolean).length);
    });
  });
  function shrink(file) {
    return new Promise(function (res) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, IMG_MAX / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          var out = cv.toDataURL('image/webp', 0.8);
          if (out.indexOf('data:image/webp') !== 0) out = cv.toDataURL('image/jpeg', 0.82);
          res(out);
        };
        img.onerror = function () { res(null); };
        img.src = r.result;
      };
      r.onerror = function () { res(null); };
      r.readAsDataURL(file);
    });
  }

  function save(src) {
    var d = draft;
    d.name = $('#fName').value.trim();
    d.title = $('#fTitle').value.trim() || d.name;
    d.kind = $('#fKind').value;
    d.span = $('#fSpan').value;
    d.slug = slugify($('#fSlug').value.trim() || d.name);
    d.temp = $('#fTemp').value.trim();
    d.price = Math.round(+$('#fPrice').value || 0);
    var old = Math.round(+$('#fOld').value || 0);
    if (old > d.price) d.oldPrice = old; else delete d.oldPrice;
    var flags = {};
    FLAGS.forEach(function (f) { if ($('#flag-' + f[0]).checked) flags[f[0]] = true; });
    if ($('#flag-cat').checked) flags.cat = 'windbreaker';
    if (d.oldPrice) flags.sale = true;
    d.flags = flags;
    d.hidden = $('#fHidden').checked || undefined;
    d.sizes = ALL_SIZES.filter(function (s) { return $('#size-' + s).checked; });
    d.desc = $('#fDesc').value.trim();
    d.materials = $('#fMat').value.trim();
    d.care = $('#fCare').value.trim();
    d.colors.forEach(function (c) { c.name = c.name.trim(); });

    var err = null;
    if (!d.name) err = 'Вкажіть назву моделі';
    else if (!d.price) err = 'Вкажіть ціну';
    else if (!d.sizes.length) err = 'Оберіть хоча б один розмір';
    else if (d.colors.some(function (c) { return !c.name; })) err = 'Вкажіть назву кожного кольору';
    else if (d.colors.some(function (c) { return !c.images.length; })) err = 'Додайте хоча б одне фото для кожного кольору';
    else if (products.some(function (p) { return p.slug === d.slug && p !== src; })) err = 'Адреса «' + d.slug + '» вже зайнята іншим товаром';
    if (err) { toast(err); return; }

    var before = products.slice();
    if (src) products[products.indexOf(src)] = d; else products.unshift(d);
    if (!saveProducts()) { products = before; return; }
    toast('Збережено: ' + esc(d.title));
    location.hash = '#products';
  }

  /* ── Замовлення ── */
  var orderFilter = 'all';
  function viewOrders() {
    var all = orders().slice().reverse();
    var list = all.filter(function (o) { return orderFilter === 'all' || (o.status || 'new') === orderFilter; });
    main.innerHTML =
      '<div class="ahead"><h1 class="atitle">Замовлення</h1><div class="ahead__tools">' +
      '<select class="ainput" id="ofilter" aria-label="Фільтр за статусом"><option value="all">Усі (' + all.length + ')</option>' +
      Object.keys(STATUSES).map(function (k) {
        var n = all.filter(function (o) { return (o.status || 'new') === k; }).length;
        return '<option value="' + k + '"' + (orderFilter === k ? ' selected' : '') + '>' + STATUSES[k] + ' (' + n + ')</option>';
      }).join('') + '</select></div></div>' +
      (list.length ? '<div class="olist">' + list.map(orderCard).join('') + '</div>' :
        '<p class="aempty">Замовлень поки немає. Тут з’являтимуться замовлення, оформлені на сайті' + (all.length ? ' з обраним статусом' : '') + '.</p>');
    $('#ofilter').addEventListener('change', function () { orderFilter = this.value; viewOrders(); });
    $$('[data-status]').forEach(function (s) {
      s.addEventListener('change', function () { setOrder(this.getAttribute('data-status'), function (o) { o.status = s.value; }); });
    });
    $$('[data-odel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = this.getAttribute('data-odel');
        if (!confirm('Видалити замовлення ' + n + '?')) return;
        store.set('k7_orders', orders().filter(function (o) { return o.n !== n; }));
        renderCounts(); viewOrders(); toast('Замовлення ' + esc(n) + ' видалено');
      });
    });
  }
  function setOrder(n, fn) {
    var all = orders();
    all.forEach(function (o) { if (o.n === n) fn(o); });
    store.set('k7_orders', all);
    renderCounts();
    toast('Статус замовлення ' + esc(n) + ' оновлено');
  }
  function orderCard(o) {
    var st = o.status || 'new';
    return '<article class="ocard ocard--' + st + '">' +
      '<header class="ocard__head"><div><strong class="mono">' + esc(o.n) + '</strong><span class="mono ocard__date">' + fmtDate(o.at) + '</span></div>' +
      '<select class="ainput ainput--sm" data-status="' + esc(o.n) + '" aria-label="Статус">' +
      Object.keys(STATUSES).map(function (k) { return '<option value="' + k + '"' + (st === k ? ' selected' : '') + '>' + STATUSES[k] + '</option>'; }).join('') + '</select></header>' +
      '<div class="ocard__grid"><dl>' +
      '<dt>Покупець</dt><dd>' + esc(o.name) + '</dd>' +
      '<dt>Телефон</dt><dd><a href="tel:' + esc(String(o.phone).replace(/[^\d+]/g, '')) + '">' + esc(o.phone) + '</a></dd>' +
      '<dt>Доставка</dt><dd>' + esc(o.city) + ', ' + esc(o.branch) + '</dd>' +
      '<dt>Оплата</dt><dd>' + esc(PAY[o.pay] || o.pay) + '</dd>' +
      (o.note ? '<dt>Коментар</dt><dd>' + esc(o.note) + '</dd>' : '') +
      '</dl><ul class="ocard__items">' + (o.items || []).map(function (it) {
        var p = bySlug(it.slug);
        var c = p && p.colors[it.color];
        return '<li><span>' + esc(p ? (p.title || p.name) : it.slug) + '<small class="mono">' + esc(c ? c.name : '') + ' · ' + esc(it.size) + ' · ×' + it.qty + '</small></span>' +
          '<span class="mono">' + (p ? money(p.price * it.qty) : '') + '</span></li>';
      }).join('') + '<li class="ocard__total"><span>Разом</span><span class="mono">' + money(o.total) + '</span></li></ul></div>' +
      '<footer class="ocard__foot"><button class="ibtn ibtn--del" data-odel="' + esc(o.n) + '">Видалити замовлення</button></footer></article>';
  }

  /* ── Налаштування ── */
  function viewSettings() {
    var used = 0;
    try { for (var k in localStorage) if (Object.prototype.hasOwnProperty.call(localStorage, k)) used += (localStorage.getItem(k) || '').length * 2; } catch (e) { /* ignore */ }
    main.innerHTML =
      '<div class="ahead"><h1 class="atitle">Налаштування</h1></div>' +
      '<div class="settings">' +
      '<form class="card" id="passForm"><h2 class="card__title">Пароль адмін-панелі</h2>' +
      fld('Новий пароль', '<input class="ainput" type="password" id="np1" minlength="6" required autocomplete="new-password">') +
      fld('Повторіть пароль', '<input class="ainput" type="password" id="np2" minlength="6" required autocomplete="new-password">') +
      '<button class="btn btn--ink">Змінити пароль</button></form>' +
      '<section class="card"><h2 class="card__title">Резервна копія каталогу</h2>' +
      '<p class="hint">Збережіть файл із каталогом (разом із фото) на комп’ютер або завантажте раніше збережений.</p>' +
      '<div class="row"><button class="btn" id="exp">Завантажити копію</button>' +
      '<label class="btn">Відновити з файлу<input type="file" accept="application/json,.json" id="imp" hidden></label></div></section>' +
      '<section class="card"><h2 class="card__title">Сховище браузера</h2>' +
      '<p class="hint">Зараз зайнято близько <strong>' + (used / 1048576).toFixed(1) + ' МБ</strong> з ~5 МБ. Дані зберігаються тільки в цьому браузері. Щоб зміни бачили всі покупці, потрібно підключити базу даних (Supabase).</p>' +
      '<button class="btn ibtn--del" id="reset">Повернути початковий каталог</button></section>' +
      '</div>';
    $('#passForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var a = $('#np1').value, b = $('#np2').value;
      if (a.length < 6) { toast('Пароль має бути не коротшим за 6 символів'); return; }
      if (a !== b) { toast('Паролі не збігаються'); return; }
      sha('k7:' + a).then(function (h) { store.set('k7_admin_pass', h); toast('Пароль змінено'); e.target.reset(); });
    });
    $('#exp').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ products: products, orders: orders() }, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'kurtki7km-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('#imp').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          var list = Array.isArray(data) ? data : data.products;
          if (!Array.isArray(list)) throw new Error('bad');
          if (!confirm('Замінити поточний каталог (' + products.length + ' тов.) на каталог із файлу (' + list.length + ' тов.)?')) return;
          products = list;
          if (saveProducts()) toast('Каталог відновлено');
          if (Array.isArray(data.orders) && confirm('У файлі є замовлення (' + data.orders.length + '). Відновити їх теж?')) { store.set('k7_orders', data.orders); renderCounts(); }
        } catch (err) { toast('Це не схоже на файл резервної копії'); }
      };
      r.readAsText(f);
    });
    $('#reset').addEventListener('click', function () {
      if (!confirm('Усі зміни в товарах буде втрачено, каталог повернеться до початкового. Продовжити?')) return;
      store.del('k7_admin_products');
      products = clone(window.PRODUCTS_DEFAULT || []);
      renderCounts();
      toast('Початковий каталог повернуто');
    });
  }

  boot();
})();
