/* KURTKI 7KM — адмін-панель: ціни в $, курс з історією, наявність по розмірах, редагування товару, журнал змін.
   Два режими роботи (однаковий інтерфейс):
   • Supabase — коли заповнено js/config.js (справжня база, вхід за e-mail і паролем, права перевіряє база);
   • Демо — без бази, ЛИШЕ на localhost: зміни зберігаються в цьому браузері, щоб перевірити роботу. */
(async () => {
  const CFG = window.K7_CONFIG || {}, K7 = window.K7;
  const $ = (s, r = document) => r.querySelector(s);
  const root = $('#root');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtUah = n => Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ') + ' ₴';
  const fmtDate = s => new Date(s).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const KINDS = { puffer: 'Пуховик', jacket: 'Куртка', parka: 'Парка', coat: 'Пальто', fur: 'Шуба', vest: 'Жилетка', cardigan: 'Кардиган', suit: 'Костюм' };
  const LENGTHS = { short: 'Коротка', mid: 'Середня', long: 'Довга' };
  let tt;
  const toast = m => { const el = $('#toast'); el.textContent = m; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2600); };
  const useSupabase = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  /* ================= доступ до даних ================= */
  const norm = r => ({ id: r.id, sort: r.sort_order, data: r.data, priceUsd: +r.price_usd || 0, oldPriceUsd: +r.old_price_usd || 0, stock: r.stock || {}, hidden: !!r.hidden, updatedAt: r.updated_at });

  const Demo = {
    load() { try { return JSON.parse(localStorage.getItem(K7.DEMO_KEY)); } catch { return null; } },
    state() {
      let s = this.load();
      if (!s) { s = { rates: [{ rate: K7.DEFAULT_RATE, at: new Date().toISOString(), by: 'стартове значення', note: '' }], products: {}, log: [] }; this.save(s); }
      return s;
    },
    save(s) { localStorage.setItem(K7.DEMO_KEY, JSON.stringify(s)); },
    async user() { const e = sessionStorage.getItem('k7_admin_user'); return e ? { email: e, role: 'owner' } : null; },
    async signIn(email) { sessionStorage.setItem('k7_admin_user', email || 'демо'); return this.user(); },
    async signOut() { sessionStorage.removeItem('k7_admin_user'); },
    async rates() { return this.state().rates.slice().reverse(); },
    async addRate(rate, note, by) { const s = this.state(); s.rates.push({ rate, at: new Date().toISOString(), by, note }); s.log.push({ at: new Date().toISOString(), by, product: '—', action: 'Курс', diff: `курс: ${rate}` }); this.save(s); },
    async products() {
      const s = this.state();
      return K7.BASE.map((p, i) => { const o = s.products[p.id] || {}; return { id: p.id, sort: i, ...K7.seedOf(p), ...o, data: { ...p, ...(o.data || {}) } }; });
    },
    async saveProduct(id, patch, by, diff) { const s = this.state(); s.products[id] = { ...(s.products[id] || {}), ...patch }; s.log.push({ at: new Date().toISOString(), by, product: id, action: 'Товар', diff }); this.save(s); },
    async log() { return this.state().log.slice().reverse().slice(0, 300); },
  };

  let sb = null;
  const Remote = {
    async init() {
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4'; s.onload = res; s.onerror = () => rej(new Error('Не вдалося завантажити Supabase')); document.head.appendChild(s); });
      sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    },
    async user() {
      const { data } = await sb.auth.getUser(); if (!data.user) return null;
      const { data: a } = await sb.from('admins').select('role').eq('user_id', data.user.id).maybeSingle();
      return a ? { email: data.user.email, role: a.role } : { email: data.user.email, role: null };
    },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; return this.user(); },
    async signOut() { await sb.auth.signOut(); },
    async rates() { const { data, error } = await sb.from('rates').select('*').order('set_at', { ascending: false }).limit(200); if (error) throw error; return data.map(r => ({ rate: +r.rate, at: r.set_at, by: r.set_by_email, note: r.note })); },
    async addRate(rate, note) { const { error } = await sb.from('rates').insert({ rate, note }); if (error) throw error; },
    async products() { const { data, error } = await sb.from('products').select('*').order('sort_order'); if (error) throw error; return data.map(norm); },
    async saveProduct(id, patch) {
      const row = {}; if ('data' in patch) row.data = patch.data; if ('priceUsd' in patch) row.price_usd = patch.priceUsd;
      if ('oldPriceUsd' in patch) row.old_price_usd = patch.oldPriceUsd; if ('stock' in patch) row.stock = patch.stock; if ('hidden' in patch) row.hidden = patch.hidden;
      const { error } = await sb.from('products').update(row).eq('id', id); if (error) throw error;
    },
    async importAll(list) {
      for (let i = 0; i < list.length; i += 50) {
        const { error } = await sb.from('products').insert(list.slice(i, i + 50).map(p => ({ id: p.id, sort_order: p.sort, data: p.data, price_usd: p.priceUsd, old_price_usd: 0, stock: p.stock, hidden: false })));
        if (error) throw error;
      }
    },
    async log() { const { data, error } = await sb.from('audit_log').select('*').order('at', { ascending: false }).limit(300); if (error) throw error; return data.map(r => ({ at: r.at, by: r.user_email, product: r.product_id, action: r.action, diff: r.summary })); },
  };

  if (!useSupabase && !K7.isLocal) {
    root.innerHTML = `<div class="login"><form><h1>Адмін-панель</h1><p>Базу даних ще не підключено. Адмінка запрацює після налаштування Supabase (див. файл supabase/ІНСТРУКЦІЯ.md).</p></form></div>`;
    return;
  }
  const API = useSupabase ? Remote : Demo;
  try { if (useSupabase) await Remote.init(); } catch (e) { root.innerHTML = `<div class="login"><form><h1>Помилка</h1><p class="err">${esc(e.message)}</p></form></div>`; return; }

  /* ================= стан ================= */
  let user = await API.user(), tab = 'products', rates = [], products = [], filter = { q: '', st: 'all' };
  const rate = () => rates[0] ? rates[0].rate : K7.DEFAULT_RATE;
  const uahOf = usd => K7.roundUah(usd * rate());
  const ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
  const sizeKeys = st => Object.keys(st || {}).sort((x, y) => { const i = ORDER.indexOf(x), j = ORDER.indexOf(y); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || x.localeCompare(y, 'uk', { numeric: true }); });
  const qtyTotal = st => Object.values(st || {}).reduce((s, v) => s + (+v || 0), 0);
  const status = p => p.hidden ? ['hid', 'Приховано'] : qtyTotal(p.stock) > 0 ? ['ok', 'На сайті'] : ['no', 'Немає в наявності'];

  /* ================= вхід ================= */
  function viewLogin(msg = '') {
    root.innerHTML = `<div class="login"><form id="lf">
      <h1>Адмін-панель</h1><p style="margin:0;color:var(--muted)">KURTKI 7KM</p>
      ${useSupabase ? '' : '<div class="demo" style="margin:0 -28px">Демо-режим: база ще не підключена, вхід без пароля, зміни лише в цьому браузері.</div>'}
      <label class="f"><span>E-mail</span><input type="email" name="email" autocomplete="username" required></label>
      ${useSupabase ? '<label class="f"><span>Пароль</span><input type="password" name="pass" autocomplete="current-password" required></label>' : ''}
      <p class="err" id="lerr">${esc(msg)}</p>
      <button class="btn">Увійти</button></form></div>`;
    $('#lf').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      try { user = await API.signIn(f.email.value.trim(), f.pass ? f.pass.value : ''); }
      catch (err) {
        const m = String(err.message || err);
        $('#lerr').textContent = /invalid login/i.test(m) ? 'Невірний e-mail або пароль' : /not confirmed/i.test(m) ? 'Пошту не підтверджено (у Supabase поставте Auto Confirm)' : 'Помилка входу: ' + m;
        return;
      }
      try { await start(); } catch (err) { console.error(err); $('#lerr').textContent = 'Вхід вдався, але база відповіла помилкою: ' + (err.message || err); }
    };
  }

  async function start() {
    if (!user) return viewLogin();
    if (useSupabase && !user.role) { await API.signOut(); user = null; return viewLogin('Цей акаунт не має доступу до адмінки'); }
    [rates, products] = await Promise.all([API.rates(), API.products()]);
    if (useSupabase && !products.length) return viewImport();
    render();
  }

  /* ================= перше перенесення каталогу в базу ================= */
  function viewImport() {
    const list = K7.BASE.map((p, i) => ({ id: p.id, sort: i, data: p, ...K7.seedOf(p) }));
    const owner = user.role === 'owner';
    root.innerHTML = `<div class="login"><form id="imf"><h1>База порожня</h1>
      <p>Перенести ${list.length} моделей із сайту в базу? Ціни в $ буде пораховано з поточних гривневих цін за курсом ${K7.DEFAULT_RATE} (потім їх можна виправити). Наявність — по 1 шт. кожного доступного розміру; продані моделі — 0.</p>
      ${owner ? '<button class="btn">Перенести каталог</button>' : '<p class="err">Перенести каталог може лише власник.</p>'}<p class="err" id="imerr"></p></form></div>`;
    $('#imf').onsubmit = async e => {
      e.preventDefault(); e.target.querySelector('button').disabled = true;
      try {
        if (!rates.length) await API.addRate(K7.DEFAULT_RATE, 'стартовий курс', user.email);
        await API.importAll(list); toast('Каталог перенесено'); await start();
      } catch (err) { $('#imerr').textContent = 'Помилка: ' + err.message; e.target.querySelector('button').disabled = false; }
    };
  }

  /* ================= каркас ================= */
  function render() {
    root.innerHTML = `
      <header class="top"><div class="wrap">
        <span class="logo">KURTKI<small>адмін</small></span>
        <nav class="tabs">${[['products', 'Товари'], ['rate', 'Курс $'], ['log', 'Журнал']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</nav>
        <span class="user">${esc(user.email)} · ${user.role === 'owner' ? 'власник' : 'менеджер'} <button id="out">Вийти</button> <a href="../#/" target="_blank" style="color:#fff">Сайт ↗</a></span>
      </div></header>
      ${useSupabase ? '' : '<div class="demo">Демо-режим: зміни зберігаються лише в цьому браузері і видно на сайті тільки на цьому комп’ютері. <button class="btn btn--ghost btn--sm" id="reset">Скинути демо-дані</button></div>'}
      <main class="wrap" id="main"></main>`;
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    $('#out').onclick = async () => { await API.signOut(); user = null; viewLogin(); };
    if ($('#reset')) $('#reset').onclick = async () => { if (!confirm('Скинути всі демо-зміни (курс, ціни, наявність)?')) return; localStorage.removeItem(K7.DEMO_KEY); await start(); toast('Демо-дані скинуто'); };
    ({ products: viewProducts, rate: viewRate, log: viewLog })[tab]();
  }

  /* ================= товари ================= */
  function viewProducts() {
    const q = filter.q.toLowerCase();
    const list = products.filter(p => {
      const [st] = status(p);
      if (filter.st === 'on' && st !== 'ok') return false;
      if (filter.st === 'no' && st !== 'no') return false;
      if (filter.st === 'hid' && st !== 'hid') return false;
      if (filter.st === 'noprice' && p.priceUsd > 0) return false;
      return !q || [p.id, p.data.name, p.data.type, p.data.color?.name, p.data.sku].join(' ').toLowerCase().includes(q);
    });
    $('#main').innerHTML = `
      <div class="bar">
        <span class="rate-chip">1 $ = ${rate().toFixed(2)} ₴</span>
        <input type="search" id="q" placeholder="Пошук: назва, колір, артикул…" value="${esc(filter.q)}">
        <select id="st">${[['all', 'Усі'], ['on', 'На сайті'], ['no', 'Немає в наявності'], ['hid', 'Приховані'], ['noprice', 'Без ціни']].map(([v, l]) => `<option value="${v}"${filter.st === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <span class="count">${list.length} з ${products.length}</span>
      </div>
      <div class="list">${list.map(p => { const [sc, sl] = status(p); return `
        <div class="row" data-id="${esc(p.id)}">
          <img src="../${esc(p.data.imgs?.[0] || '')}" alt="" loading="lazy">
          <div class="info"><div class="name">${esc(p.data.name)}</div><div class="meta">${esc(p.data.type)} · ${esc(p.data.color?.name)}${p.data.sku ? ' · арт. ' + esc(p.data.sku) : ''}</div></div>
          <div class="price"><input type="number" min="0" step="1" value="${p.priceUsd}" data-price aria-label="Ціна в доларах"> $ <span class="uah">= ${fmtUah(uahOf(p.priceUsd))}</span></div>
          <div class="stock">${sizeKeys(p.stock).map(s => `${esc(s)}:${p.stock[s]}`).join(' ') || '—'}</div>
          <div class="actions"><span class="badge ${sc}">${sl}</span><button class="btn btn--ghost btn--sm" data-edit>Редагувати</button></div>
        </div>`; }).join('')}</div>`;
    $('#q').oninput = e => { filter.q = e.target.value; const pos = e.target.selectionStart; viewProducts(); const i = $('#q'); i.focus(); i.setSelectionRange(pos, pos); };
    $('#st').onchange = e => { filter.st = e.target.value; viewProducts(); };
    $('#main').querySelectorAll('[data-price]').forEach(inp => {
      inp.oninput = () => { inp.parentElement.querySelector('.uah').textContent = '= ' + fmtUah(uahOf(+inp.value || 0)); };
      inp.onchange = async () => {
        const id = inp.closest('.row').dataset.id, p = products.find(x => x.id === id), v = Math.max(0, Math.round(+inp.value || 0));
        if (v === p.priceUsd) return;
        await save(p, { priceUsd: v }, `ціна: ${p.priceUsd} $ → ${v} $`);
      };
    });
    $('#main').querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(products.find(x => x.id === b.closest('.row').dataset.id)));
  }

  async function save(p, patch, diff) {
    try { await API.saveProduct(p.id, patch, user.email, diff); Object.assign(p, patch); toast('Збережено'); }
    catch (e) { toast('Помилка збереження: ' + e.message); }
  }

  /* ================= редактор товару ================= */
  function edit(p) {
    const d = JSON.parse(JSON.stringify(p.data)), st = { ...p.stock };
    const det = (d.details || []).map(x => [...x]);
    let hidden = p.hidden, price = p.priceUsd, old = p.oldPriceUsd;
    const el = document.createElement('div'); el.className = 'ed';
    const draw = () => {
      const tot = qtyTotal(st), [sc, sl] = hidden ? ['hid', 'Приховано'] : tot > 0 ? ['ok', 'Буде на сайті'] : ['no', 'Немає в наявності — зникне з сайту'];
      el.innerHTML = `<div class="ed__panel" role="dialog" aria-label="Редагування товару">
        <div class="ed__head"><h2>${esc(d.name)}</h2><button class="btn btn--ghost btn--sm" data-x>✕</button></div>
        <div class="ed__photos">${(d.imgs || []).map(s => `<img src="../${esc(s)}" alt="">`).join('')}</div>
        <div class="sec"><h3>Основне</h3>
          <div class="grid2"><label class="f"><span>Назва</span><input type="text" data-f="name" value="${esc(d.name)}"></label>
          <label class="f"><span>Тип (підзаголовок)</span><input type="text" data-f="type" value="${esc(d.type)}"></label></div>
          <div class="grid2"><label class="f"><span>Розділ</span><select data-f="kind">${Object.entries(KINDS).map(([k, l]) => `<option value="${k}"${d.kind === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="f"><span>Довжина</span><select data-f="length">${Object.entries(LENGTHS).map(([k, l]) => `<option value="${k}"${d.length === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
          <div class="grid2"><label class="f"><span>Колір (назва)</span><input type="text" data-c="name" value="${esc(d.color?.name)}"></label>
          <label class="f"><span>Колір (відтінок)</span><input type="color" data-c="hex" value="${esc(d.color?.hex || '#000000')}" style="height:42px;width:100%"></label></div>
          <label class="f"><span>Артикул</span><input type="text" data-f="sku" value="${esc(d.sku || '')}"></label>
        </div>
        <div class="sec"><h3>Колекція і підкатегорії</h3>
          <label class="f"><span>Колекція</span><select id="sea">${K7.SEASONS.map(([k, l]) => `<option value="${k}"${K7.seaOf(d) === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <div class="subs">${K7.SUBS.filter(s => s[1] === K7.seaOf(d)).map(([id, , l]) => `<label class="toggle"><input type="checkbox" data-sub="${id}"${K7.subsOf(d).includes(id) ? ' checked' : ''}> ${l}</label>`).join('') || '<p style="margin:0;color:var(--muted)">Для цієї колекції підкатегорій ще немає.</p>'}</div>
          <p style="margin:0;font-size:13px;color:var(--muted)">${d.sea || d.subs ? 'Задано вручну. <button class="btn btn--ghost btn--sm" data-auto>Повернути автоматично</button>' : 'Розкладено автоматично (за типом, сезоном, хутром, довжиною, розмірами, утеплювачем). Позначте галочки, щоб змінити.'}</p>
        </div>
        <div class="sec"><h3>Ціна</h3>
          <div class="grid2"><label class="f"><span>Ціна, $</span><input type="number" min="0" step="1" id="pu" value="${price}"></label>
          <label class="f"><span>Стара ціна, $ (для Sale)</span><input type="number" min="0" step="1" id="po" value="${old || ''}" placeholder="—"></label></div>
          <p style="margin:0">На сайті: <b class="mono">${fmtUah(uahOf(price))}</b>${old > price ? ` <s class="mono">${fmtUah(uahOf(old))}</s>` : ''} <span style="color:var(--muted)">(курс ${rate().toFixed(2)})</span></p>
        </div>
        <div class="sec"><h3>Наявність по розмірах</h3>
          <p style="margin:0;font-size:13px;color:var(--muted)">Кількість 0 — розмір недоступний. Усі розміри 0 — товар автоматично зникає з сайту, але лишається тут.</p>
          <div class="sizes">${sizeKeys(st).map(s => `<div class="sz"><b>${esc(s)}</b>
            <span class="qty"><button data-q="${esc(s)}" data-d="-1" aria-label="Менше">−</button><input type="number" min="0" value="${st[s]}" data-qi="${esc(s)}" aria-label="Кількість ${esc(s)}"><button data-q="${esc(s)}" data-d="1" aria-label="Більше">+</button></span>
            <span class="state">${+st[s] > 0 ? '✓ є' : '✕ немає'}</span></div>`).join('')}</div>
          <div class="grid2"><input type="text" id="ns" placeholder="Новий розмір, напр. 2XL"><button class="btn btn--ghost btn--sm" data-addsize>Додати розмір</button></div>
          <label class="toggle"><input type="checkbox" id="hid"${hidden ? ' checked' : ''}> Сховати з сайту вручну (навіть якщо є в наявності)</label>
        </div>
        <div class="sec"><h3>Опис</h3>
          <label class="f"><span>Короткий опис</span><textarea data-f="desc">${esc(d.desc)}</textarea></label>
          <p style="margin:0;font-size:13px;color:var(--muted)">Характеристики (як у таблиці «Описи»):</p>
          ${det.map(([k, v], i) => `<div class="kv"><input type="text" data-dk="${i}" value="${esc(k)}"><input type="text" data-dv="${i}" value="${esc(v)}"><button data-ddel="${i}" aria-label="Видалити рядок">✕</button></div>`).join('')}
          <button class="btn btn--ghost btn--sm" data-dadd style="justify-self:start">+ Рядок</button>
        </div>
      </div>
      <div class="ed__foot"><span class="status"><span class="badge ${sc}">${sl}</span></span><button class="btn btn--ghost" data-x>Скасувати</button><button class="btn" data-save>Зберегти</button></div>`;
    };
    const sync = () => {
      el.querySelectorAll('[data-f]').forEach(i => { d[i.dataset.f] = i.value; });
      d.color = { ...(d.color || {}), name: el.querySelector('[data-c=name]').value, hex: el.querySelector('[data-c=hex]').value };
      el.querySelectorAll('[data-qi]').forEach(i => { st[i.dataset.qi] = Math.max(0, Math.round(+i.value || 0)); });
      el.querySelectorAll('[data-dk]').forEach(i => { det[+i.dataset.dk][0] = i.value; });
      el.querySelectorAll('[data-dv]').forEach(i => { det[+i.dataset.dv][1] = i.value; });
      price = Math.max(0, Math.round(+$('#pu', el).value || 0)); old = Math.max(0, Math.round(+$('#po', el).value || 0)); hidden = $('#hid', el).checked;
    };
    el.addEventListener('click', async e => {
      const t = e.target;
      if (t.closest('[data-x]') || t === el) { el.remove(); return; }
      if (t.closest('[data-q]')) { sync(); const b = t.closest('[data-q]'); st[b.dataset.q] = Math.max(0, (+st[b.dataset.q] || 0) + +b.dataset.d); draw(); return; }
      if (t.closest('[data-addsize]')) { sync(); const s = $('#ns', el).value.trim().toUpperCase(); if (s && !(s in st)) { st[s] = 1; d.sizes = [...(d.sizes || []), s]; } draw(); return; }
      if (t.closest('[data-dadd]')) { sync(); det.push(['', '']); draw(); return; }
      if (t.closest('[data-auto]')) { sync(); delete d.sea; delete d.subs; draw(); return; }
      if (t.closest('[data-ddel]')) { sync(); det.splice(+t.closest('[data-ddel]').dataset.ddel, 1); draw(); return; }
      if (t.closest('[data-save]')) {
        sync();
        d.details = det.filter(([k, v]) => k.trim() && v.trim());
        const changes = [];
        if (price !== p.priceUsd) changes.push(`ціна: ${p.priceUsd} $ → ${price} $`);
        if (old !== p.oldPriceUsd) changes.push(`стара ціна: ${p.oldPriceUsd || '—'} → ${old || '—'} $`);
        Object.keys({ ...st, ...p.stock }).forEach(s => { if ((+st[s] || 0) !== (+p.stock[s] || 0)) changes.push(`${s}: ${p.stock[s] ?? '—'} → ${st[s] ?? '—'}`); });
        if (hidden !== p.hidden) changes.push(hidden ? 'приховано з сайту' : 'повернено на сайт');
        ['name', 'type', 'kind', 'length', 'sku', 'desc'].forEach(k => { if ((d[k] || '') !== (p.data[k] || '')) changes.push(`${k} змінено`); });
        if (JSON.stringify(d.color) !== JSON.stringify(p.data.color)) changes.push('колір змінено');
        if (K7.seaOf(d) !== K7.seaOf(p.data) || JSON.stringify(K7.subsOf(d)) !== JSON.stringify(K7.subsOf(p.data)) || (d.sea || '') !== (p.data.sea || '') || !!d.subs !== !!p.data.subs) changes.push('колекція / підкатегорії змінено');
        if (JSON.stringify(d.details || []) !== JSON.stringify(p.data.details || [])) changes.push('характеристики змінено');
        if (!changes.length) { el.remove(); return; }
        await save(p, { data: d, priceUsd: price, oldPriceUsd: old, stock: st, hidden }, changes.join('; '));
        el.remove(); render();
      }
    });
    el.addEventListener('input', e => { if (e.target.id === 'pu' || e.target.id === 'po' || e.target.dataset.qi !== undefined) { const pos = e.target.selectionStart; const id = e.target.id || 'qi-' + e.target.dataset.qi; sync(); draw(); const n = e.target.id ? $('#' + id, el) : el.querySelector(`[data-qi="${CSS.escape(e.target.dataset.qi)}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch {} } } });
    el.addEventListener('change', e => {
      if (e.target.id === 'hid') { sync(); draw(); }
      if (e.target.id === 'sea') { sync(); d.sea = e.target.value; delete d.subs; draw(); }
      if (e.target.dataset.sub) { sync(); d.subs = [...el.querySelectorAll('[data-sub]:checked')].map(i => i.dataset.sub); draw(); }
    });
    draw(); document.body.appendChild(el);
  }

  /* ================= курс ================= */
  function viewRate() {
    const canSet = user.role === 'owner';
    const ex = products.find(p => p.priceUsd > 0);
    $('#main').innerHTML = `
      <div class="card"><p style="margin:0;color:var(--muted)">Поточний курс</p><div class="big">1 $ = ${rate().toFixed(2)} ₴</div>
        <p style="margin:6px 0 0;font-size:13px;color:var(--muted)">${rates[0] ? 'встановлено ' + fmtDate(rates[0].at) + (rates[0].by ? ' · ' + esc(rates[0].by) : '') : ''}</p></div>
      ${canSet ? `<div class="card"><form id="rf" class="ratef">
        <label class="f"><span>Новий курс, ₴ за 1 $</span><input type="number" step="0.01" min="1" name="rate" required></label>
        <label class="f"><span>Примітка (необов’язково)</span><input type="text" name="note" placeholder="напр. курс НБУ / курс постачальника"></label>
        <button class="btn">Зберегти курс</button></form>
        <p id="rprev" style="margin:10px 0 0;font-size:13px;color:var(--muted)">Після збереження всі ціни на сайті перерахуються автоматично. Ціни в уже оформлених замовленнях не змінюються.</p></div>`
      : '<p>Змінювати курс може лише власник.</p>'}
      <h3>Історія курсу</h3>
      <div class="tscroll"><table class="t"><thead><tr><th>Дата і час</th><th>Курс</th><th>Зміна</th><th>Хто</th><th>Примітка</th></tr></thead><tbody>
        ${rates.map((r, i) => { const prev = rates[i + 1]; const ch = prev ? (r.rate - prev.rate) / prev.rate * 100 : 0;
          return `<tr><td>${fmtDate(r.at)}</td><td class="mono">${r.rate.toFixed(2)}</td><td class="mono ${ch > 0 ? 'up' : ch < 0 ? 'down' : ''}">${prev ? (ch > 0 ? '+' : '') + ch.toFixed(2) + '%' : '—'}</td><td>${esc(r.by)}</td><td>${esc(r.note)}</td></tr>`; }).join('')}
      </tbody></table></div>`;
    const f = $('#rf'); if (!f) return;
    f.rate.oninput = () => { const v = +f.rate.value; if (v > 0 && ex) $('#rprev').textContent = `Приклад: ${ex.data.name} ${ex.priceUsd} $ — було ${fmtUah(uahOf(ex.priceUsd))}, стане ${fmtUah(K7.roundUah(ex.priceUsd * v))}.`; };
    f.onsubmit = async e => {
      e.preventDefault(); const v = Math.round(+f.rate.value * 100) / 100;
      if (!(v > 1 && v < 1000)) return toast('Перевірте курс');
      if (Math.abs(v - rate()) / rate() > 0.1 && !confirm(`Курс змінюється більш ніж на 10% (${rate()} → ${v}). Точно зберегти?`)) return;
      try { await API.addRate(v, f.note.value.trim(), user.email); rates = await API.rates(); toast('Курс збережено, ціни перераховано'); render(); }
      catch (err) { toast('Помилка: ' + err.message); }
    };
  }

  /* ================= журнал ================= */
  async function viewLog() {
    $('#main').innerHTML = '<p>Завантаження…</p>';
    const rows = await API.log();
    $('#main').innerHTML = `<h3>Журнал змін</h3><div class="tscroll"><table class="t"><thead><tr><th>Коли</th><th>Хто</th><th>Що</th><th>Зміни</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${fmtDate(r.at)}</td><td>${esc(r.by)}</td><td>${esc(r.action)}${r.product && r.product !== '—' ? ': ' + esc((products.find(p => p.id === r.product) || {}).data?.name || r.product) : ''}</td><td>${esc(r.diff)}</td></tr>`).join('') || '<tr><td colspan="4">Поки змін немає</td></tr>'}
    </tbody></table></div>`;
  }

  await start();
})();
