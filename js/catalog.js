/* KURTKI 7KM — каталог: ціна в $ × курс → гривня, наявність по розмірах, автоматичне приховування.
   Джерело даних:
   1) Supabase (якщо заповнено js/config.js) — ціна рахується на сервері (view public_catalog);
   2) інакше js/data.js; на localhost додатково застосовуються демо-зміни з адмінки. */
(function () {
  const CFG = window.K7_CONFIG || {};
  const BASE = window.PRODUCTS || [];
  const DEFAULT_RATE = CFG.defaultRate || 41.5;
  const STEP = CFG.roundTo || 10;
  const DEMO_KEY = 'k7_admin_demo';
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const roundUah = n => Math.round(n / STEP) * STEP;

  // стартові значення для адмінки з data.js: $ = гривня / стартовий курс, по 1 шт. кожного розміру
  function seedOf(p) {
    const stock = {};
    p.sizes.forEach(s => { stock[s] = p.sold || p.out.includes(s) ? 0 : 1; });
    return { priceUsd: Math.max(1, Math.round(p.price / DEFAULT_RATE)), oldPriceUsd: 0, stock, hidden: false };
  }
  // товар для вітрини або null, якщо його не треба показувати
  function finalize(data, priceUah, oldPriceUah, stock, hidden) {
    if (hidden) return null;
    const sizes = [...new Set([...(data.sizes || []).filter(s => s in stock), ...Object.keys(stock)])];
    const avail = sizes.filter(s => +stock[s] > 0);
    if (!avail.length) return null;          // усі розміри 0 → зникає з сайту
    const p = { ...data, sizes, out: sizes.filter(s => !(+stock[s] > 0)), price: priceUah, stock };
    delete p.sold;
    if (oldPriceUah && oldPriceUah > priceUah) { p.oldPrice = oldPriceUah; p.sale = true; } else { delete p.oldPrice; p.sale = false; }
    return p;
  }
  function readDemo() { try { return JSON.parse(localStorage.getItem(DEMO_KEY)); } catch { return null; } }

  /* ===== колекції (сезони) і підкатегорії =====
     Автоматичне розкладання за даними товару; в адмінці можна задати вручну: data.sea і data.subs */
  const SEASONS = [['winter', 'Зимова колекція'], ['demi', 'Весна / Осінь'], ['summer', 'Літня колекція']];
  const SUBS = [
    ['w-nofur', 'winter', 'Пуховики без хутра'], ['w-fur', 'winter', 'Пуховики з хутром'], ['w-big', 'winter', 'Пуховики великих розмірів'],
    ['w-over', 'winter', 'Пуховики оверсайз'], ['w-parka', 'winter', 'Парки жіночі'], ['w-short', 'winter', 'Пуховики короткі'],
    ['w-vest', 'winter', 'Жилетки зимові'], ['w-down', 'winter', 'Пуховики на пуху'], ['w-furcoat', 'winter', 'Шуби'], ['w-leather', 'winter', 'Шкіряні куртки'],
    ['d-big', 'demi', 'Куртки великих розмірів'], ['d-short', 'demi', 'Куртки короткі'], ['d-rain', 'demi', 'Плащі жіночі'], ['d-jacket', 'demi', 'Куртки'],
    ['d-wb-lined', 'demi', 'Вітровки на підкладці'], ['d-wb-cotton', 'demi', 'Вітровки з бавовни'], ['d-wb-big', 'demi', 'Вітровки великих розмірів'],
    ['d-vest', 'demi', 'Жилетки'], ['d-vest-big', 'demi', 'Жилетки великих розмірів'], ['d-coat', 'demi', 'Пальта'], ['d-cardigan', 'demi', 'Кардигани'], ['d-suit', 'demi', 'Костюми'],
  ];
  const isBig = p => (p.sizes || []).some(s => /^(XXL|[2-6]XL)$/i.test(s) || +s >= 50);
  const text = p => [p.type, p.desc, p.facts, ...(p.details || []).flat()].join(' ').toLowerCase();
  function seaOf(p) {
    if (p.sea) return p.sea;
    if (p.kind === 'fur') return 'winter';
    if (['coat', 'cardigan', 'suit'].includes(p.kind)) return 'demi';
    if (p.season === 'Весна–осінь') return 'demi';
    if (/зим/i.test(p.season || '')) return 'winter';
    return p.temp <= -10 ? 'winter' : 'demi';
  }
  function subsOf(p) {
    if (Array.isArray(p.subs)) return p.subs;
    const s = seaOf(p), r = [], big = isBig(p), t = text(p), type = (p.type || '').toLowerCase();
    const fill = ((p.spec && p.spec.fill) || '').toLowerCase();
    if (s === 'winter') {
      if (p.kind === 'puffer' || (p.kind === 'jacket' && !p.leather)) {
        r.push(p.fur ? 'w-fur' : 'w-nofur');
        if (big) r.push('w-big');
        if (/оверсайз|oversize/.test(t)) r.push('w-over');
        if (p.length === 'short') r.push('w-short');
        if (/пух/.test(fill) && !/біопух/.test(fill)) r.push('w-down');
      }
      if (p.kind === 'parka') r.push('w-parka');
      if (p.kind === 'vest') r.push('w-vest');
      if (p.kind === 'fur') r.push('w-furcoat');
      if (p.leather) r.push('w-leather');
    }
    if (s === 'demi') {
      const wb = (p.cats || []).includes('windbreaker') || /вітрівк|вітровк/.test(type);
      if (p.kind === 'vest') { r.push('d-vest'); if (big) r.push('d-vest-big'); }
      else if (wb) {
        r.push('d-jacket');
        if (/підкладк/.test(t)) r.push('d-wb-lined');
        if (/бавовн|хлопок|котон|cotton/.test(t)) r.push('d-wb-cotton');
        if (big) r.push('d-wb-big');
      }
      else if (/плащ|тренч/.test(type)) r.push('d-rain');
      else if (['jacket', 'puffer', 'parka'].includes(p.kind)) { r.push('d-jacket'); if (big) r.push('d-big'); if (p.length === 'short') r.push('d-short'); }
      if (p.kind === 'coat') r.push('d-coat');
      if (p.kind === 'cardigan') r.push('d-cardigan');
      if (p.kind === 'suit') r.push('d-suit');
    }
    return r;
  }

  window.K7 = { DEFAULT_RATE, STEP, DEMO_KEY, isLocal, roundUah, seedOf, finalize, BASE: BASE.slice(), readDemo, SEASONS, SUBS, seaOf, subsOf };

  window.CATALOG_READY = (async () => {
    if (CFG.supabaseUrl && CFG.supabaseAnonKey) {
      try {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
        const r = await fetch(`${CFG.supabaseUrl}/rest/v1/public_catalog?select=*&order=sort_order.asc`, {
          headers: { apikey: CFG.supabaseAnonKey }, signal: ctl.signal });
        clearTimeout(tm);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const rows = await r.json();
        if (!rows.length) throw new Error('каталог у базі ще порожній');
        window.PRODUCTS = rows.map(x => finalize(x.data, x.price_uah, x.old_price_uah, x.stock || {}, false)).filter(Boolean);
        window.K7.source = 'supabase';
        return;
      } catch (e) {
        console.warn('Каталог: база недоступна, показую збережену версію з data.js');
      }
    }
    const demo = isLocal ? readDemo() : null;
    if (demo) {
      const rate = (demo.rates && demo.rates.length) ? demo.rates[demo.rates.length - 1].rate : DEFAULT_RATE;
      window.PRODUCTS = BASE.map(p => {
        const o = { ...seedOf(p), ...(demo.products[p.id] || {}) };
        const data = { ...p, ...(o.data || {}) };
        return finalize(data, roundUah(o.priceUsd * rate), o.oldPriceUsd ? roundUah(o.oldPriceUsd * rate) : 0, o.stock, o.hidden);
      }).filter(Boolean);
      window.K7.source = 'demo';
      return;
    }
    window.K7.source = 'static';     // як раніше: ціни з data.js
  })();
})();
