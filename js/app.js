/* KURTKI 7KM — SPA без залежностей. Маршрути: #/  #/catalog?..  #/p/:id  #/checkout  #/done  #/info */
(window.CATALOG_READY || Promise.resolve()).then(() => {
  const P = window.PRODUCTS, C = window.COLLECTIONS, CATS = window.CATEGORIES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app'), hdr = $('#hdr');
  const ALIAS = { barolo: 'merlot', 'lacca-wine': 'vino' };  // об’єднані моделі
  const byId = id => P.find(p => p.id === (ALIAS[id] || id));
  // Новинки = 50 останніх доданих товарів у продажу (порядок у data.js = порядок додавання)
  const NEW_LIMIT = 50;
  const ORDER = new Map(P.map((p, i) => [p.id, i]));
  const FRESH = P.filter(p => !p.sold).slice(-NEW_LIMIT).reverse();
  const FRESH_RANK = new Map(FRESH.map((p, i) => [p.id, i]));
  P.forEach(p => { if (p.badge === 'Нове') delete p.badge; if (FRESH_RANK.has(p.id) && !p.badge) p.badge = 'Нове'; });
  const uah = n => n.toLocaleString('uk-UA').replace(/ /g, ' ') + ' ₴';
  const deg = t => (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°C';
  const FREE_SHIP = 12000;

  /* ---------- сховище (браузер може його заборонити — тоді працюємо в пам'яті) ---------- */
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem('k7_' + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('k7_' + k, JSON.stringify(v)); } catch {} },
  };
  let cart = store.get('cart', []);
  let favs = new Set(store.get('favs', []));
  let gridMode = store.get('grid', 'two');

  /* ---------- кольорові родини для фільтра ---------- */
  const FAMILY = { vino: 'wine', merlot: 'wine', rosso: 'wine', ivory: 'light', creme: 'light', paris: 'grey',
    noir: 'black', track: 'black', mokka: 'brown', navy: 'blue', butter: 'yellow',
    taiga: 'black', lago: 'black', equestre: 'black', cacao: 'brown', terra: 'brown', castagna: 'brown',
    highland: 'grey', visone: 'grey',
    rombo: 'black', espresso: 'brown', fumo: 'grey',
    onyx: 'black', carbone: 'black', grafite: 'grey', ardesia: 'grey', nebbia: 'light',
    cortado: 'brown', ranger: 'brown', cioccolato: 'brown', marrone: 'brown',
    basalto: 'black', barolo: 'wine', tartufo: 'brown', nocciola: 'brown', zibellino: 'brown', montone: 'brown',
    'lana-oat': 'light', 'lana-brown': 'brown', 'track-brown': 'brown', 'track-navy': 'blue', 'track-beige': 'light',
    'lungo-camel': 'brown', 'lungo-black': 'black', 'cintura-brown': 'brown', 'cintura-black': 'black',
    'alpina-beige': 'light', 'alpina-grey': 'grey', 'alpina-brown': 'brown', 'taiga-green': 'green',
    notte: 'black', neve: 'light', rosa: 'pink', aviatore: 'brown',
    'nuvola-grey': 'grey', 'nuvola-silver': 'grey', 'nuvola-camel': 'brown', 'nuvola-cream': 'light',
    'silhouette': 'black', 'velluto': 'black', 'safari': 'green', 'utility-brown': 'brown', 'utility-black': 'black', 'lacca-wine': 'wine', 'lacca-red': 'wine', 'vetta-red': 'wine', 'vetta-black': 'black', 'mantella-grey': 'grey', 'mantella-sage': 'green', 'ghiaccio': 'light', 'contessa': 'brown', 'sartoria-cream': 'light', 'sartoria-brown': 'brown', 'sartoria-grey': 'grey', 'pelliccia': 'brown', 'pilota-brown': 'brown', 'pilota-olive': 'green', 'pilota-grey': 'grey', 'fiocco': 'brown', 'velour-grey': 'grey', 'velour-taupe': 'brown', 'misto': 'grey', 'pastore-brown': 'brown', 'pastore-taupe': 'brown', 'tundra': 'brown', 'bombardiere': 'brown', 'nuvola-camel': 'brown', 'nuvola-cream': 'light',
    'cielo-blue': 'blue', 'cielo-pink': 'pink', 'lucia-silver': 'grey', 'lucia-taupe': 'brown', 'bozzolo': 'brown', 'artico': 'black', 'camoscio': 'brown', 'vestaglia-camel': 'brown', 'vestaglia-black': 'black', 'vestaglia-cream': 'light',
    'nastro': 'brown', 'stola-black': 'black', 'stola-cappuccino': 'brown', 'procione': 'black', 'polare': 'black', 'corto': 'black', 'ombra': 'grey', 'camicia': 'brown', 'moka': 'brown', 'bronzo': 'brown', 'bosco-grey': 'grey', 'bosco-brown': 'brown', 'treccia': 'light', 'smeraldo': 'green', 'mirtillo': 'grey', 'panna': 'light', 'trapunta': 'black', 'bottone': 'black', 'denim-brown': 'brown', 'denim-navy': 'blue',
    'pelle': 'black', 'nero': 'black', 'sciarpa-brown': 'brown', 'sciarpa-black': 'black', 'prugna': 'wine', 'fumata': 'grey', 'volpe-brown': 'brown', 'volpe-beige': 'light', 'volpe-olive': 'green', 'volpe-black': 'black', 'soffice-brown': 'brown', 'soffice-white': 'light', 'kimono': 'brown', 'alto': 'brown', 'fiamma-red': 'wine', 'fiamma-navy': 'blue', 'nastro-cream': 'light', 'lucido-purple': 'wine', 'lucido-black': 'black', 'lucido-long': 'black', 'breve': 'black',
    'collo-brown': 'brown', 'collo-grey': 'light', 'nuvoletta-pink': 'pink', 'nuvoletta-brown': 'brown', 'barolo-gloss': 'wine', 'agnello': 'black', 'fibbia': 'black', 'notte-blu': 'blue', 'vestaglia-pufbrown': 'brown', 'vestaglia-pufblack': 'black', 'tuta-black': 'black', 'tuta-cream': 'light',
    'piuma-black': 'black', 'piuma-brown': 'brown', 'cortina': 'brown', 'aviere-black': 'black', 'aviere-cream': 'light', 'aviere-brown': 'brown', 'fumo-black': 'black',
    'trench': 'light', 'onda': 'black', 'oliva': 'green', 'cappuccio': 'brown', 'tasca': 'brown', 'bomber-wine': 'wine', 'bomber-olive': 'green', 'scozia': 'light', 'azzurra-blue': 'blue', 'azzurra-beige': 'light', 'azzurra-brown': 'brown', 'brina-blue': 'blue', 'brina-brown': 'brown', 'cinto': 'brown', 'scamosciato': 'brown', 'perla': 'light', 'doppio-brown': 'brown', 'doppio-beige': 'light', 'cappa': 'black', 'biker': 'brown', 'colletto': 'light', 'menta': 'green', 'argento': 'grey',
    'vita-black': 'black', 'vita-cream': 'light', 'notturno': 'black', 'gilet': 'grey', 'laguna': 'blue', 'corvo': 'black', 'luna': 'grey', 'maglia': 'brown', 'marmo': 'grey', 'indaco': 'blue', 'rifugio-taupe': 'brown', 'rifugio-brown': 'brown', 'bottone-olive': 'green', 'argento': 'grey',
    'castagno': 'brown', 'sabbia-black': 'black', 'sabbia-beige': 'light', 'bianca': 'light', 'argento': 'grey',
    'montagna': 'black', 'scuro': 'black', 'cobalto': 'blue', 'fucsia': 'pink', 'cacao-onda': 'brown', 'pietra': 'light', 'ardesia-long': 'grey', 'argento': 'grey',
    'aviatrice-black': 'black', 'aviatrice-grey': 'brown', 'aviatrice-cognac': 'brown', 'ciliegia': 'wine', 'nevada': 'light', 'volpina': 'brown', 'mongolia': 'light', 'ibrido-grey': 'grey', 'ibrido-cream': 'light', 'ibrido-black': 'black', 'notte-navy': 'blue', 'oliveto': 'green', 'latte': 'light',
    'corsaro': 'black', 'fibbia-grey': 'grey', 'zibellina': 'light', 'sabbia-coat': 'brown' };
  const FAMILIES = [
    ['black', 'Чорний', '#121212'], ['light', 'Молочний', '#efe9dc'], ['wine', 'Бордо / червоний', '#5a1a20'],
    ['brown', 'Шоколад', '#3e2f29'], ['blue', 'Синій', '#1d2335'], ['grey', 'Сірий', '#cfc9bf'], ['yellow', 'Вершковий', '#e6d89a'],
    ['green', 'Оливковий', '#5d7a3a'], ['pink', 'Пудровий', '#d4b8b0'],
  ];
  const LENGTHS = [['short', 'Коротка'], ['mid', 'Середня'], ['long', 'Довга']];
  const TEMPS = [['mild', 'Міжсезоння · вище −10°'], ['20', 'Мороз · до −20° і нижче'], ['30', 'Екстрим · до −30°']];
  const SIZE_ORDER = ['ONE SIZE', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  const sizeRank = s => { const i = SIZE_ORDER.indexOf(s); return i >= 0 ? i : 100 + parseFloat(s); };
  const SIZES = [...new Set(P.flatMap(p => p.sizes))].sort((a, b) => sizeRank(a) - sizeRank(b));

  /* =========================================================
     Спільні шматки розмітки
     ========================================================= */
  const img = (src, alt = '', eager) => `<img src="${src}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  const siblings = p => p.line ? P.filter(x => x.line === p.line) : [p];
  const swatch = p => `<i class="sw" style="background:${p.color.hex2 ? `linear-gradient(90deg,${p.color.hex} 50%,${p.color.hex2} 50%)` : p.color.hex}" title="${p.color.name}"></i>`;

  const card = p => `
    <article class="card rv">
      <a href="#/p/${p.id}" class="card__img" aria-label="${p.name} — ${p.type}, ${uah(p.price)}">
        ${p.sold ? '<span class="card__badge card__badge--sold">Продано</span>' : p.badge ? `<span class="card__badge">${p.badge}</span>` : ''}
        <span class="card__temp">${deg(p.temp)}</span>
        ${img(p.imgs[0], p.name)}${p.imgs[1] ? img(p.imgs[1], '') : ''}
      </a>
      <button class="card__fav ${favs.has(p.id) ? 'on' : ''}" data-fav="${p.id}" aria-label="В обране" aria-pressed="${favs.has(p.id)}">${favs.has(p.id) ? '♥' : '♡'}</button>
      <a href="#/p/${p.id}" class="card__meta">
        <h3 class="card__name">${p.name}</h3><span class="card__price">${p.oldPrice ? `<s>${uah(p.oldPrice)}</s> ` : ''}${uah(p.price)}</span>
        <span class="card__type">${p.type}</span>
        <span class="card__sw">${siblings(p).map(swatch).join('')}</span>
      </a>
    </article>`;

  const footer = () => `
    <footer class="foot">
      <div class="foot__top">
        <div class="foot__news">
          <p class="eyebrow" style="color:#77746f">Розсилка</p>
          <h3>Перші дізнавайтесь про нові колекції та закриті розпродажі</h3>
          <form data-news><input type="email" placeholder="Ваш e-mail" aria-label="E-mail" required><button class="mono">Підписатись →</button></form>
        </div>
        <div class="foot__cols">
          <div><h4>Магазин</h4><a href="#/catalog?sort=new">Нове</a><a href="#/catalog?cat=puffer">Пуховики</a><a href="#/catalog?cat=long">Довгі</a><a href="#/catalog?fur=1">З хутром</a></div>
          <div><h4>Допомога</h4><a href="#/info">Доставка</a><a href="#/info">Розміри</a><a href="#/info">Догляд</a></div>
          <div><h4>Зв’язок</h4><a href="tel:+380000000000">+38 (000) 000 00 00</a><a href="#">Instagram</a><a href="#">Telegram</a></div>
        </div>
      </div>
      <p class="foot__mark">KURTKI<sup>7KM</sup></p>
      <div class="foot__legal mono"><span>© 2026 kurtki7km</span><span>Luxury × Technical outerwear</span></div>
    </footer>`;

  /* =========================================================
     ① ГОЛОВНА
     ========================================================= */
  function viewHome() {
    const col = id => P.filter(p => p.collection === id);
    const railVino = P.filter(p => p.gloss && !p.sold);
    const films = [
      ['img/merlot-wide.webp', 'Merlot', 'Сутінки, −12°'],
      ['img/paris-wide.webp', 'Paris', 'Балкон, перший ранок'],
      ['img/ivory-wide.webp', 'Ivory', 'Колонада, вітер'],
      ['img/track-wide.webp', 'Track 7', 'Вапняк, полудень'],
      ['img/butter-wide.webp', 'Butter', 'Бетон, кава з собою'],
    ];
    const video = window.FILM_VIDEO;

    return `
    <section class="cover" aria-label="Обкладинка сезону">
      <div class="cover__blur" aria-hidden="true"></div>
      <picture class="cover__media">
        ${img('img/vino-2.webp', 'Модель у лаковому бордовому пуховику Vino', true)}
      </picture>
      <h1 class="cover__mast" aria-label="KURTKI 7KM">${'KURTKI'.split('').map(l => `<span>${l}</span>`).join('')}</h1>
      <div class="cover__issue"><span>Нова колекція — зима 2026–2027</span><span>Luxury × Technical</span></div>
      <div class="cover__lines">
        <p class="cover__line">Свобода руху <b>в будь-яку погоду</b></p>
      </div>
      <div class="cover__cta">
        <a class="btn btn--light" href="#/catalog?gloss=1">Колекція</a>
        <a class="btn btn--ghost" href="#/catalog">Каталог</a>
      </div>
    </section>

    <div class="ticker" aria-label="Умови сервісу"><div class="ticker__track">${
      Array(2).fill(['Примірка перед оплатою', 'Нова пошта — 1–2 дні', 'Безкоштовна доставка від 12 000 ₴', 'Температурний паспорт кожної моделі']
        .map(t => `<span>${t}</span>`).join('')).join('')}</div></div>

    <nav class="seas" aria-label="Колекції">${K7.SEASONS.map(([id, l], i) => {
      const n = seaCount(id);
      return `<a class="sea ${SEA_IMG[id] ? '' : 'sea--soon'}" href="#/catalog?sea=${id}">
        ${SEA_IMG[id] ? `<div class="sea__img">${img(SEA_IMG[id], '')}</div>` : '<div class="sea__img"></div>'}
        <div class="sea__txt"><span class="mono">0${i + 1} · ${n ? n + ' ' + plural(n, 'модель', 'моделі', 'моделей') : 'незабаром'}</span><h3>${emph(l)}</h3></div></a>`; }).join('')}
    </nav>

    <!-- 01 Vino -->
    <section class="sec story story--split" aria-labelledby="s-vino">
      <div class="story__img rv-img" style="aspect-ratio:4/5">
        <span class="story__num">01 / 08 — Колекція</span>
        ${img('img/vino-1.webp', 'Пуховик Vino на мокрій бруківці')}
        <button class="hot" style="left:52%;top:36%" data-hot="vino" aria-label="Показати товар на фото"></button>
        <a class="hot__card" id="hot-vino" href="#/p/vino">${img('img/vino-2.webp', '')}<span><b>Vino</b><small>${uah(byId('vino').price)} · −25°C</small></span><span class="mono">→</span></a>
      </div>
      <div>
        <h2 class="story__big split" id="s-vino" data-split><a href="#/catalog?gloss=1">Vino</a></h2>
        <div class="story__text rv">
          <span class="story__kick">Лак і глянець · ${railVino.length} моделей</span>
          <p>${C[0].text}</p>
          <a class="btn btn--ink" href="#/catalog?gloss=1" style="justify-self:start">Лак і глянець · ${railVino.length} <span class="arr">→</span></a>
        </div>
      </div>
    </section>
    <div class="mosaic mosaic--vino" style="margin-top:28px">
      <figure class="m1 rv-img"><a href="#/p/merlot">${img('img/vino-ed-wide.webp', 'Модель у глянцевому пуховику Merlot кольору бордо')}</a></figure>
      <figure class="m2 rv-img"><a href="#/p/vino">${img('img/vino-ed-close.webp', 'Лаковий пуховик Vino, модель зі шпіцом')}</a></figure>
      <figure class="m3 rv-img"><a href="#/p/vino">${img('img/vino-ed-walk.webp', 'Лаковий пуховик Vino на прогулянці мокрим містом')}</a></figure>
    </div>

    <!-- ⑥ Фільм сезону -->
    <section class="film" aria-label="Фільм сезону" style="margin-top:56px">
      ${video
        ? `<video class="film__video" data-src="${video}" poster="${window.FILM_POSTER || 'img/noir-wide.webp'}" muted loop playsinline preload="none" aria-label="Відео: модель у довгому пуховику Noir серед вересу"></video>`
        : films.map((f, i) => `<img class="film__slide ${i ? '' : 'on'}" src="${f[0]}" alt="" loading="${i ? 'lazy' : 'eager'}">`).join('')}
      <div class="film__ui">
        <div class="film__top"><span class="film__rec">Фільм сезону</span><span id="filmTc">00:00 / ${video ? 'Noir' : films[0][1]}</span></div>
        <div>
          <p class="mono" id="filmCap" style="margin:0 0 20px;opacity:.8">${video ? 'Noir · Верес, вітер, −30°' : films[0][2]}</p>
          <div class="film__bar">
            <button class="film__play" id="filmPlay" aria-label="Пауза">❚❚</button>
            <div class="film__prog"><i id="filmProg"></i></div>
            <span id="filmIdx">${video ? '<a href="#/p/noir" class="link" style="color:#fff">Noir →</a>' : `01/0${films.length}`}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 02 Total White -->
    <section class="sec white" aria-labelledby="s-white">
      <div class="sec__head"><h2 class="sec__title" id="s-white"><a href="#/catalog?white=1">Total <em>White</em></a></h2><span class="mono">02 / 08</span></div>
      <div class="white__grid">
        <figure class="white__img rv-img"><a href="#/catalog?white=1">${img('img/white-hero.webp', 'Модель у білому глянцевому пуховику з хутряним капюшоном')}</a></figure>
        <div class="white__txt">
          <blockquote class="quote rv">«Пух, що шепоче. Хутро, що мовчить».</blockquote>
          <p class="rv">Молочний, перлинний, вершковий — уся біла зима в одному розділі.</p>
          <a class="btn btn--ink rv" href="#/catalog?white=1">Усі білі куртки · ${P.filter(p => p.white && !p.sold).length} <span class="arr">→</span></a>
        </div>
      </div>
    </section>

    <!-- Season's Trend — хутро, вуличний стиль -->
    <section class="sec trend" aria-labelledby="s-trend">
      <div class="sec__head"><h2 class="sec__title" id="s-trend"><a href="#/catalog?fur=1">Season's <em>Trend</em></a></h2><span class="mono">Хутро · street</span></div>
      <div class="trend__grid">
        <figure class="t1 rv-img"><a href="#/catalog?fur=1">${img('img/trend-1.webp', 'Модель у сірому хутряному бомбері переходить вулицю')}</a></figure>
        <figure class="t2 rv-img"><a href="#/catalog?fur=1">${img('img/trend-2.webp', 'Модель у бежевому пуховику з хутром лисиці')}</a></figure>
        <figure class="t3 rv-img"><a href="#/catalog?fur=1">${img('img/trend-3.webp', 'Модель у чорному пуховику з хутряною облямівкою')}</a></figure>
      </div>
      <div class="wrap rv" style="margin-top:24px">
        <a class="btn btn--ink" href="#/catalog?fur=1">Куртки з хутром · ${P.filter(p => p.fur && !p.sold).length} <span class="arr">→</span></a>
      </div>
    </section>

    <!-- 06 Nord — ліс, сніг -->
    <section class="nord" aria-labelledby="s-nord">
      <div class="nord__img">${img('img/nord-wide.webp', 'Модель у кремовому довгому пуховику в засніженому сосновому лісі')}</div>
      <canvas class="snow" aria-hidden="true"></canvas>
      <div class="nord__txt">
        <span class="mono">06 / 08 — Ліс, верес, −30°</span>
        <h2 class="nord__word split" id="s-nord" data-split><a href="#/catalog?cold=1">Nord</a></h2>
        <p class="rv">${C.find(c => c.id === 'nord').text}</p>
        <a class="btn btn--light rv" href="#/catalog?cold=1">Для холодної зими · ${P.filter(p => isCold(p) && !p.sold).length} <span class="arr">→</span></a>
      </div>
    </section>

    <!-- 03 Paris -->
    <section class="paris" aria-labelledby="s-paris">
      <div class="paris__img">${img('img/paris-1.webp', 'Кардиган Paris з хутром, чорно-біле фото')}</div>
      <div class="paris__wide" style="display:none">${img('img/paris-wide.webp', 'Кардиган Paris на балконі з видом на Тріумфальну арку')}</div>
      <h2 class="paris__word" id="s-paris">Paris</h2>
      <div class="paris__cap">
        <span class="mono">03 / 08 — В’язка × хутро</span>
        <a class="btn btn--light" href="#/p/paris">${uah(byId('paris').price)} →</a>
      </div>
    </section>

    <!-- 07 Equestre -->
    <section class="sec equ" aria-labelledby="s-equ">
      <div class="sec__head"><h2 class="sec__title split" id="s-equ" data-split><em>Equestre</em></h2><span class="mono">07 / 08</span></div>
      <figure class="equ__hero rv-img">${img('img/equestre-wide.webp', 'Модель у чорному хутряному пальті веде коня вересовим полем')}
        <button class="hot" style="left:66%;top:48%" data-hot="equ" aria-label="Показати товар на фото"></button>
        <a class="hot__card" id="hot-equ" href="#/p/equestre">${img('img/equestre-1.webp', '')}<span><b>Equestre</b><small>${uah(byId('equestre').price)} · ${deg(byId('equestre').temp)}</small></span><span class="mono">→</span></a>
      </figure>
      <div class="equ__row">
        <p class="rv">${C.find(c => c.id === 'equestre').text}</p>
      </div>
    </section>


    <!-- Технологія -->
    <section class="tech" aria-labelledby="s-tech">
      <div>
        <p class="eyebrow">Luxury × Technical</p>
        <h2 id="s-tech" class="split" data-split>Розкіш, яка <em>гріє</em> на −30°</h2>
        <p class="rv" style="color:#c9c6c0;max-width:40ch;margin:0">Кожна модель має температурний паспорт: утеплювач, fill power, мембрана і вага — щоб ви купували не «теплу куртку», а точну цифру.</p>
      </div>
      <div class="rv">
        <div class="specs">
          <div><b>90/10</b><span>Пух / перо</span></div>
          <div><b>800</b><span>Fill power</span></div>
          <div><b>10k</b><span>Мембрана, мм</span></div>
          <div><b>−30°</b><span>Комфорт до</span></div>
          <div><b>0,9</b><span>Вага від, кг</span></div>
          <div><b>1–2</b><span>Дні доставки</span></div>
        </div>
        ${thermo(-30, '#fff')}
      </div>
    </section>

    <!-- Новинки -->
    <section class="sec" aria-labelledby="s-new">
      <div class="sec__head"><h2 class="sec__title" id="s-new">Нове <em>в сезоні</em></h2><a class="link" href="#/catalog?new=1">Усі новинки · ${FRESH.length}</a></div>
      <div class="grid" style="padding-bottom:0">${FRESH.slice(0, 8).map(card).join('')}</div>
      <div class="wrap" style="margin-top:30px"><a class="btn btn--ghost btn--full" href="#/catalog">Весь каталог <span class="arr">→</span></a></div>
    </section>
    ${footer()}`;
  }

  function thermo(t, color = 'var(--ink)') {
    const pct = Math.min(100, Math.max(0, ((t + 35) / 45) * 100)); // шкала −35 … +10
    return `<div class="thermo" style="color:${color}">
      <div class="thermo__bar"><span class="thermo__mark" data-t="${deg(t)}" style="left:${pct}%"></span></div>
      <div class="thermo__scale"><span>−35°</span><span>−20°</span><span>−10°</span><span>0°</span><span>+10°</span></div>
    </div>`;
  }

  /* =========================================================
     ③ КАТАЛОГ + ⑤ ФІЛЬТРИ
     ========================================================= */
  const emptyF = () => ({ cats: [], len: [], fam: [], sizes: [], temp: '', fur: false, min: '', max: '', col: '', q: '', sort: 'new',
    kind: '', span: '', sea: '', sub: '', leather: false, fresh: false, sale: false, suit: false, white: false, cold: false, gloss: false });
  /* довгий виріб: length 'long' або середній від 80 см (за описом з таблиці) */
  const cm = p => { const m = (p.facts || '').match(/(\d{2,3})(?:-\d{2,3})? см/); return m ? +m[1] : 0; };
  const isLong = p => p.length === 'long';
  const isCold = p => isLong(p) && ['puffer', 'jacket', 'parka', 'fur'].includes(p.kind) && p.season !== 'Весна–осінь' && p.temp <= -15;
  const CARE = {
    puffer: 'Тільки професійна хімчистка (аквачистка) для пухових виробів. Не прати в машині, не віджимати, не відбілювати. Після чистки висушити в розправленому вигляді і злегка збити пух.',
    fur: 'Тільки професійна хімчистка хутра. Зберігати на широких плечиках у чохлі, що дихає, подалі від батарей і прямого сонця. Не прасувати, не мочити.',
    coat: 'Тільки професійна суха хімчистка. Не прати. Відпарювати через тканину, зберігати на плечиках у чохлі.',
    leather: 'Спеціалізована чистка шкіряних виробів. Не прати. Плями прибирати м’якою вологою серветкою, сушити на плечиках подалі від батарей.',
    cardigan: 'Делікатне ручне прання у прохолодній воді або хімчистка. Сушити горизонтально. Хутряні деталі — тільки професійна чистка хутра.',
    other: 'Делікатне прання при 30°. Не відбілювати. Сушити горизонтально.' };
  const careText = p => {
    const own = (p.details || []).find(([k]) => k.startsWith('Догляд'));
    if (own) return own[1];
    const down = /пух/i.test(p.spec.fill) && !/біо/i.test(p.spec.fill);
    const base = p.leather ? CARE.leather : (p.kind === 'vest' && down) ? CARE.puffer : CARE[p.kind] || CARE.other;
    return base + (p.fur && !['fur', 'puffer'].includes(p.kind) && !p.leather ? ' Хутряні деталі — тільки професійна чистка хутра.' : '');
  };
  const KIND = { puffer: 'Пуховики', jacket: 'Куртки', parka: 'Парки', coat: 'Пальта', fur: 'Шуби', vest: 'Жилетки', cardigan: 'Кардигани', suit: 'Костюми' };
  const KIND_ONE = { puffer: 'пуховики', jacket: 'куртки', parka: 'парки', coat: 'пальта', fur: 'шуби', vest: 'жилетки', cardigan: 'кардигани', suit: 'костюми' };
  let F = emptyF();
  /* колекції-сезони і підкатегорії (правила в js/catalog.js) */
  const SEA_LABEL = Object.fromEntries(K7.SEASONS);
  const SUB_BY = Object.fromEntries(K7.SUBS.map(s => [s[0], s]));
  const live = P.filter(p => !p.sold);
  const seaCount = sea => live.filter(p => K7.seaOf(p) === sea).length;
  const subCount = id => live.filter(p => K7.subsOf(p).includes(id)).length;
  const subsIn = sea => K7.SUBS.filter(s => s[1] === sea && subCount(s[0]));   // порожні підкатегорії не показуємо
  const emph = s => { const w = s.split(' '); return w.length > 1 ? `${w[0]} <em>${w.slice(1).join(' ')}</em>` : `<em>${s}</em>`; };
  const SEA_IMG = { winter: 'img/navy-1.webp', demi: 'img/p-sartoria-cream-1.webp', summer: '' };

  function applyFilters(f) {
    let r = P.filter(p =>
      (!f.cats.length || f.cats.some(c => p.cats.includes(c))) &&
      (!f.len.length || f.len.includes(p.length)) &&
      (!f.fam.length || f.fam.includes(FAMILY[p.id])) &&
      (!f.sizes.length || f.sizes.some(s => p.sizes.includes(s) && !p.out.includes(s))) &&
      (!f.fur || p.fur) &&
      (!f.col || p.collection === f.col) &&
      (!f.kind || p.kind === f.kind) &&
      (!f.sea || K7.seaOf(p) === f.sea) && (!f.sub || K7.subsOf(p).includes(f.sub)) &&
      (!f.span || (f.span === 'long') === isLong(p)) &&
      (!f.leather || p.leather) &&
      (!f.white || p.white) &&
      (!f.cold || isCold(p)) &&
      (!f.gloss || p.gloss) &&
      (!f.fresh || FRESH_RANK.has(p.id)) &&
      (!f.sale || p.sale) && (!f.suit || p.kind === 'suit') &&
      (f.min === '' || p.price >= +f.min) && (f.max === '' || p.price <= +f.max) &&
      (!f.temp || (f.temp === 'mild' ? p.temp > -10 : f.temp === '20' ? p.temp <= -20 : p.temp <= -30)) &&
      (!f.q || [p.name, p.type, p.color.name, deg(p.temp), p.spec.shell].join(' ').toLowerCase().includes(f.q.toLowerCase()))
    );
    const s = { price: (a, b) => a.price - b.price, pricedesc: (a, b) => b.price - a.price, warm: (a, b) => a.temp - b.temp,
      new: (a, b) => ORDER.get(b.id) - ORDER.get(a.id), pop: null }[f.sort];
    const sorted = s ? [...r].sort(s) : r;
    return [...sorted.filter(p => !p.sold), ...sorted.filter(p => p.sold)];
  }
  const activeCount = f => f.cats.length + !!f.kind + f.len.length + f.fam.length + f.sizes.length + !!f.temp + f.fur + (f.min !== '' || f.max !== '') + !!f.col;

  function viewCatalog(params) {
    F = emptyF();
    if (params.get('cat')) F.cats = [params.get('cat')];
    if (params.get('fur')) F.fur = true;
    if (params.get('col')) F.col = params.get('col');
    if (params.get('q')) F.q = params.get('q');
    if (params.get('sort')) F.sort = params.get('sort');
    if (params.get('kind')) F.kind = params.get('kind');
    if (params.get('span')) F.span = params.get('span');
    if (params.get('leather')) F.leather = true;
    if (params.get('white')) F.white = true;
    if (params.get('cold')) F.cold = true;
    if (params.get('gloss')) F.gloss = true;
    if (params.get('new')) F.fresh = true;
    if (params.get('sale')) F.sale = true;
    if (params.get('suit')) F.suit = true;
    if (params.get('sea')) F.sea = params.get('sea');
    if (params.get('sub')) { F.sub = params.get('sub'); const s = SUB_BY[F.sub]; if (s && !F.sea) F.sea = s[1]; }
    const colObj = C.find(c => c.id === F.col);
    const kindTitle = F.kind ? (F.span ? `${F.span === 'long' ? 'Довгі' : 'Короткі'} <em>${KIND_ONE[F.kind]}</em>`
      : F.fur && F.kind === 'parka' ? 'Парки <em>з хутром</em>' : `<em>${KIND[F.kind]}</em>`) : '';
    const seaTitle = F.sub && SUB_BY[F.sub] ? SUB_BY[F.sub][2] : F.sea ? SEA_LABEL[F.sea] : '';
    const title = F.q ? `«${F.q}»` : seaTitle ? emph(seaTitle) : F.gloss ? '<em>Vino</em> · лак і глянець' : F.cold ? '<em>Nord</em> · холодна зима' : F.white ? 'Total <em>White</em>' : F.fresh ? '<em>Новинки</em>' : F.sale ? '<em>Sale</em>' : F.suit ? 'Спортивні <em>костюми</em>'
      : F.leather ? 'Шкіряні <em>куртки</em>' : kindTitle ? kindTitle : colObj ? `<em>${colObj.title}</em>` : F.fur ? `З <em>хутром</em>` :
      F.cats.length ? ({ windbreaker: 'Вітровки', long: 'Довгі', knit: 'Трикотаж' }[F.cats[0]] || 'Каталог') : `Верхній <em>одяг</em>`;

    return `
    <div class="page">
      <header class="cat-head">
        <p class="eyebrow">${F.sea ? (F.sub ? SEA_LABEL[F.sea] + ' · Каталог' : 'Колекція · Каталог') : colObj ? `Колекція ${colObj.no} · ${colObj.kicker}` : 'Зима 2026–2027 · Каталог'}</p>
        <h1 class="split" data-split>${title}</h1>
        <p class="mono"><span id="resCount"></span><span style="color:var(--concrete)">Примірка перед оплатою</span></p>
      </header>
      <div class="chips" role="group" aria-label="Категорії">
        ${F.sea ? `<button class="chip" data-sub="" aria-pressed="false">Уся колекція</button>${subsIn(F.sea).map(([id, , l]) => `<button class="chip" data-sub="${id}" aria-pressed="false">${l}</button>`).join('')}`
          : `<button class="chip" data-chip="" aria-pressed="false">Усе</button>${CATS.map(c => `<button class="chip" data-chip="${c.id}" aria-pressed="false">${c.label}</button>`).join('')}`}
      </div>
      <div class="toolbar">
        <button id="openFilters" aria-haspopup="dialog">Фільтри <span class="fcount" id="fCount" hidden></span></button>
        <label><span class="sr" hidden>Сортування</span>
          <select id="sort" aria-label="Сортування">
            ${[['new', 'Спершу нові'], ['pop', 'Популярні'], ['price', 'Дешевші'], ['pricedesc', 'Дорожчі'], ['warm', 'Найтепліші']]
              .map(([v, l]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select></label>
        <span class="spacer" hidden></span>
        <button class="viewtog ${gridMode === 'one' ? 'one' : ''}" id="viewTog" aria-label="Змінити вигляд сітки"><i></i><i></i></button>
      </div>
      <div class="grid ${gridMode === 'one' ? 'one' : ''}" id="grid"></div>
    </div>
    ${footer()}`;
  }

  function renderGrid() {
    const grid = $('#grid'); if (!grid) return;
    const r = applyFilters(F);
    const edit = `<a class="grid__edit grid__edit--forest rv" href="#/catalog?fur=1">${img('img/edit-forest.webp', 'Модель у чорному пуховику з великим хутряним капюшоном у сніжному лісі')}
      <div><p class="mono" style="margin:0 0 8px">Хутро · зима 2026–2027</p><h3>Season's Trend</h3><span class="btn btn--light">Куртки з хутром →</span></div></a>`;
    // у розділі «Довгі» замість фото — відео-реклама
    const editLong = `<a class="grid__edit grid__edit--video rv" href="#/p/noir">
      <video src="${window.FILM_VIDEO || 'video/season.mp4'}" poster="img/noir-wide.webp" autoplay muted loop playsinline preload="metadata" aria-label="Відео: модель у довгому пуховику Noir серед вересу"></video>
      <div><p class="mono" style="margin:0 0 8px">Довгі · −30°</p><h3>Long <em>Line</em></h3><span class="btn btn--light">Noir — ${uah(byId('noir').price)} →</span></div></a>`;
    // у розділі «Шкіряні куртки» — відео з пугачем (вже всередині розділу, тож без переходу)
    const editLeather = `<div class="grid__edit grid__edit--video rv">
      <video src="video/owl.mp4" poster="img/p-pelle-1.webp" autoplay muted loop playsinline preload="metadata" aria-label="Відео: модель у шкіряній куртці з овчиною тримає пугача"></video>
      <div><p class="mono" style="margin:0 0 8px">Шкіра · овчина</p><h3>Wild <em>Spirit</em></h3></div></div>`;
    // у розділі «Парки» — червона парка біля таксі
    const editParka = `<a class="grid__edit grid__edit--parka rv" href="#/p/rosso">${img('img/edit-parka.webp', 'Модель у червоній парці Rosso біля жовтого таксі')}
      <div><p class="mono" style="margin:0 0 8px">Парки · місто</p><h3>Rosso <em>Taxi</em></h3><span class="btn btn--light">Rosso — ${uah(byId('rosso').price)} →</span></div></a>`;
    // у розділі «Пальта» — сіре пальто серед вересу
    const editCoat = `<a class="grid__edit grid__edit--coat rv" href="#/p/fumo">${img('img/edit-coat.webp', 'Модель у сірому вовняному пальті Fumo з поясом серед вересу')}
      <div><p class="mono" style="margin:0 0 8px">Пальта · вовна</p><h3>Highland <em>Wool</em></h3><span class="btn btn--light">Fumo — ${uah(byId('fumo').price)} →</span></div></a>`;
    const banner = F.leather ? editLeather : F.kind === 'coat' ? editCoat : F.kind === 'parka' ? editParka : F.span === 'long' ? editLong : edit;
    grid.innerHTML = r.length
      ? r.map((p, i) => (i === Math.min(4, r.length - 1) && !F.col && (r.length > 6 || F.span || F.leather) ? banner : '') + card(p)).join('')
      : F.sea === 'summer' ? `<div class="empty"><h3>Літня колекція — незабаром</h3><p>Ми готуємо нові моделі. Поки подивіться весняно-осінню колекцію.</p><a class="btn btn--ink" href="#/catalog?sea=demi">Весна / Осінь</a></div>`
      : `<div class="empty"><h3>Нічого не знайшли</h3><p>Спробуйте прибрати частину фільтрів.</p><button class="btn btn--ink" data-reset>Скинути фільтри</button></div>`;
    $('#resCount').textContent = `${r.length} ${plural(r.length, 'модель', 'моделі', 'моделей')}`;
    const n = activeCount(F), fc = $('#fCount');
    fc.hidden = !n; fc.textContent = n;
    $$('.chips [data-sub]').forEach(ch => ch.setAttribute('aria-pressed', ch.dataset.sub === F.sub));
    $$('.chips [data-chip]').forEach(ch => { const v = ch.dataset.chip;
      ch.setAttribute('aria-pressed', v === 'new' ? F.fresh : v ? F.kind === v : !F.kind && !F.fresh && !F.cats.length && !F.fur); });
    reveal();
  }
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };

  /* шторка фільтрів працює з чернеткою D і показує живу кількість */
  let D;
  function openFilters() {
    D = JSON.parse(JSON.stringify(F));
    drawFilters(); openLayer($('#filters'));
  }
  function drawFilters() {
    const t = (arr, v) => arr.includes(v);
    $('#fBody').innerHTML = `
      <div class="fgroup"><h3>Тип</h3><div class="fopts">${CATS.filter(c => c.id !== 'new').map(c => `<button class="chip" data-f="kind" data-v="${c.id}" aria-pressed="${D.kind === c.id}">${c.label}</button>`).join('')}</div></div>
      <div class="fgroup"><h3>Довжина</h3><div class="fopts">${LENGTHS.map(([v, l]) => `<button class="chip" data-f="len" data-v="${v}" aria-pressed="${t(D.len, v)}">${l}</button>`).join('')}</div></div>
      <div class="fgroup"><h3>Колір</h3><div class="fopts">${FAMILIES.map(([v, l, h]) => `<button class="fsw" data-f="fam" data-v="${v}" aria-pressed="${t(D.fam, v)}"><i style="background:${h}"></i>${l}</button>`).join('')}</div></div>
      <div class="fgroup"><h3>Розмір в наявності</h3><div class="fopts">${SIZES.map(s => `<button class="fsize" data-f="sizes" data-v="${s}" aria-pressed="${t(D.sizes, s)}">${s}</button>`).join('')}</div></div>
      <div class="fgroup"><h3>Температура</h3><div class="fopts">${TEMPS.map(([v, l]) => `<button class="chip" data-f="temp" data-v="${v}" aria-pressed="${D.temp === v}">${l}</button>`).join('')}</div></div>
      <div class="fgroup"><h3>Ціна, ₴</h3><div class="range">
        <label><span>Від</span><input inputmode="numeric" data-price="min" value="${D.min}" placeholder="4 900"></label>
        <label><span>До</span><input inputmode="numeric" data-price="max" value="${D.max}" placeholder="13 500"></label></div></div>
      <div class="fgroup"><label class="toggle"><h3 style="margin:0">Тільки з хутром</h3><input type="checkbox" id="fFur" ${D.fur ? 'checked' : ''}></label></div>`;
    updApply();
  }
  function updApply() {
    const n = applyFilters(D).length;
    const b = $('#fApply'); b.textContent = n ? `Показати ${n} ${plural(n, 'модель', 'моделі', 'моделей')}` : 'Немає збігів'; b.disabled = !n;
  }
  $('#fBody').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const { f, v } = b.dataset;
    if (f === 'temp' || f === 'kind') D[f] = D[f] === v ? '' : v;
    else D[f] = D[f].includes(v) ? D[f].filter(x => x !== v) : [...D[f], v];
    if (f === 'temp' || f === 'kind') $$(`[data-f="${f}"]`).forEach(x => x.setAttribute('aria-pressed', D[f] === x.dataset.v));
    else b.setAttribute('aria-pressed', D[f].includes(v));
    updApply();
  });
  $('#fBody').addEventListener('input', e => {
    if (e.target.dataset.price) { D[e.target.dataset.price] = e.target.value.replace(/\D/g, ''); e.target.value = D[e.target.dataset.price]; updApply(); }
    if (e.target.id === 'fFur') { D.fur = e.target.checked; updApply(); }
  });
  $('#fReset').onclick = () => { const keep = { q: D.q, sort: D.sort }; D = { ...emptyF(), ...keep }; drawFilters(); };
  $('#fApply').onclick = () => { F = D; closeLayers(); renderGrid(); $('#grid')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); };

  /* =========================================================
     ④ КАРТКА КУРТКИ
     ========================================================= */
  function viewProduct(id) {
    const p = byId(id); if (!p) return viewNotFound();
    const col = C.find(c => c.id === p.collection);
    // «Вам також може сподобатися»: той самий тип, схожа довжина/колір/хутро/глянець; без інших кольорів цієї ж моделі і без проданих
    const score = x => (x.kind === p.kind) * 6 + (isLong(x) === isLong(p)) * 3 + (FAMILY[x.id] === FAMILY[p.id]) * 2
      + (!!x.fur === !!p.fur) * 2 + (!!x.gloss === !!p.gloss) + (!!x.leather === !!p.leather) * 2 + (x.collection === p.collection) + Math.random() * .8;
    const similar = P.filter(x => x.id !== p.id && !x.sold && !(p.line && x.line === p.line))
      .map(x => [score(x), x]).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, x]) => x);
    const simLink = `#/catalog?kind=${p.kind}${p.kind !== 'suit' ? `&span=${isLong(p) ? 'long' : 'short'}` : ''}`;
    const s = p.spec;
    return `
    <div class="page">
      <div class="pdp">
        <div class="gal" aria-label="Фото ${p.name}">
          <div class="gal__track" id="gal">${p.imgs.map((src, i) => `<figure data-zoom="${src}">${img(src, `${p.name} — фото ${i + 1}`, i === 0)}</figure>`).join('')}</div>
          <span class="gal__count mono" id="galCount">01 / 0${p.imgs.length}</span>
          <div class="gal__dots">${p.imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
        </div>

        <div class="pdp__info">
          <nav class="crumbs mono" aria-label="Шлях"><a href="#/catalog">Каталог</a>/<a href="#/catalog?col=${col.id}">${col.title}</a></nav>
          ${p.sold ? '<p class="eyebrow" style="color:var(--wine)">Продано</p>' : p.badge ? `<p class="eyebrow" style="color:var(--wine)">${p.badge}</p>` : ''}
          <h1 class="pdp__name">${p.name}</h1>
          <p class="pdp__type">${p.type}</p>
          ${p.sku || p.season ? `<p class="mono" style="color:var(--concrete);margin:8px 0 0">${[p.sku ? 'Арт. ' + p.sku : '', p.season || ''].filter(Boolean).join(' · ')}</p>` : ''}
          <div class="pdp__price"><b>${p.oldPrice ? `<s class="old">${uah(p.oldPrice)}</s> ` : ''}${uah(p.price)}</b><span class="mono">${deg(p.temp)} · ${s.fp !== '—' ? s.fp : s.fill}</span></div>

          <div class="pdp__row"><span class="lbl">Колір</span><span class="mono">${p.color.name}</span></div>
          <div class="colors">${siblings(p).map(x => `<a ${x.id === p.id ? 'class="on" aria-current="true"' : `href="#/p/${x.id}"`} title="${x.color.name}" aria-label="Колір: ${x.color.name}"><i style="background:${x.color.hex}"></i></a>`).join('')}</div>

          <div class="pdp__row"><span class="lbl">Розмір</span><button class="link" data-open="sizes">Таблиця розмірів</button></div>
          <div class="sizes" role="radiogroup" aria-label="Розмір">
            ${p.sizes.map(sz => {
              const has = !p.sold && !p.out.includes(sz);
              return `<button class="size" role="radio" aria-checked="false" data-size="${sz}" ${has ? '' : 'disabled aria-disabled="true"'} title="${has ? '' : 'Немає в наявності'}">${sz}</button>`;
            }).join('')}
          </div>
          <p class="size-msg" id="sizeMsg" aria-live="polite">${p.sold ? 'Цю модель уже продано. Подивіться схожі нижче.' : p.out.length ? `Закінчився: ${p.out.join(', ')} — повідомимо, коли з’явиться` : ''}</p>

          <div class="buybar">
            <button class="btn btn--ink" id="addBtn" data-id="${p.id}" ${p.sold ? 'disabled' : ''}>${p.sold ? 'Продано' : `Додати в кошик · ${uah(p.price)}`}</button>
            <button class="fav ${favs.has(p.id) ? 'on' : ''}" data-fav="${p.id}" aria-label="В обране" aria-pressed="${favs.has(p.id)}">${favs.has(p.id) ? '♥' : '♡'}</button>
          </div>

          <div class="pdp__perks">
            <div>Примірка на відділенні Нової пошти перед оплатою</div>
            <div>${(window.SHOP || {}).shipping}</div>
          </div>

          <div class="acc">
            <details open><summary>Опис</summary><div class="acc__b">${p.details ? `<dl class="det">${p.details.filter(([k]) => !k.startsWith('Догляд')).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : `<p>${p.desc}</p>${p.facts ? `<p><b>${p.facts}</b></p>` : ''}`}<p style="color:var(--concrete)">Модель на фото: зріст 172 см, розмір S.</p></div></details>
            <details open><summary>Температурний паспорт</summary><div class="acc__b">
              <div class="specs">
                <div><b>${deg(p.temp)}</b><span>Комфорт до</span></div>
                <div><b>${s.fp}</b><span>Fill power</span></div>
                <div><b style="font-size:17px">${s.fill}</b><span>Утеплювач</span></div>
                <div><b>${s.weight}</b><span>Вага</span></div>
                <div><b style="font-size:17px">${s.water}</b><span>Волога</span></div>
                <div><b style="font-size:17px">${s.wind}</b><span>Вітер</span></div>
              </div>
              ${thermo(p.temp)}
            </div></details>
            <details><summary>Склад і догляд</summary><div class="acc__b"><p>Верх: ${s.shell}. ${s.fill !== 'Без утеплювача' ? 'Утеплювач: ' + s.fill + '.' : ''}</p><p><b>Догляд:</b> ${careText(p)}</p></div></details>
            <details><summary>Доставка і оплата</summary><div class="acc__b"><p>Нова пошта 1–2 дні, безкоштовно від 12 000 ₴. ${(window.SHOP || {}).shipping}</p><p>Оплата: при отриманні (передоплата ${(window.SHOP || {}).prepay} ₴), на рахунок або карткою онлайн.</p></div></details>
          </div>
        </div>

        <section class="sec pdp__more" aria-labelledby="s-sim" style="padding-bottom:20px">
          <div class="sec__head"><h2 class="sec__title" id="s-sim" style="font-size:clamp(34px,8vw,72px)">Вам також <em>сподобається</em></h2><a class="link" href="${simLink}">Дивитись усі →</a></div>
          <div class="rail" style="padding-top:0">${similar.map(card).join('')}</div>
        </section>
      </div>
    </div>
    <div class="zoom" id="zoom" role="dialog" aria-label="Збільшене фото"><button class="close" data-zoomclose aria-label="Закрити">✕</button><img alt=""></div>
    ${footer()}`;
  }

  function mountProduct() {
    const gal = $('#gal'); if (!gal) return;
    let size = null;
    gal.addEventListener('scroll', () => {
      const i = Math.round(gal.scrollLeft / gal.clientWidth);
      $('#galCount').textContent = `0${i + 1} / 0${gal.children.length}`;
      $$('.gal__dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    }, { passive: true });
    $$('.size:not([disabled])').forEach(b => b.onclick = () => {
      size = b.dataset.size;
      $$('.size').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      $('#sizeMsg').textContent = '';
    });
    $('#addBtn').onclick = () => {
      if (!size) {
        $('#sizeMsg').textContent = 'Оберіть розмір';
        $('.sizes').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        $('.sizes').scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      addToCart($('#addBtn').dataset.id, size);
    };
    const zoom = $('#zoom');
    gal.addEventListener('click', e => {
      const f = e.target.closest('[data-zoom]'); if (!f) return;
      zoom.querySelector('img').src = f.dataset.zoom; zoom.classList.add('on'); document.body.classList.add('locked');
      zoom.scrollTo((zoom.scrollWidth - zoom.clientWidth) / 2, 0);
    });
    zoom.addEventListener('click', () => { zoom.classList.remove('on'); document.body.classList.remove('locked'); });
  }

  /* =========================================================
     ⑦ КОШИК + оформлення
     ========================================================= */
  const cartTotal = () => cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);
  const cartQty = () => cart.reduce((s, l) => s + l.qty, 0);
  function saveCart() { store.set('cart', cart); drawCart(); }

  function addToCart(id, size) {
    const ex = cart.find(l => l.id === id && l.size === size);
    ex ? ex.qty++ : cart.push({ id, size, qty: 1 });
    saveCart();
    const bc = $('#bagCount'); bc.classList.remove('bump'); void bc.offsetWidth; bc.classList.add('bump');
    toast(`Додано: ${byId(id).name}, ${size}`, 'Кошик', () => openLayer($('#cart')));
  }

  function drawCart() {
    const q = cartQty(), total = cartTotal();
    $('#bagCount').textContent = q;
    $('#bagSum').textContent = q ? '· ' + uah(total) : '';
    $('.cart').classList.toggle('is-empty', !q);
    $('#cartQty').textContent = q ? `(${q})` : '';
    const left = FREE_SHIP - total;
    $('#cartShip').innerHTML = q ? `${left > 0 ? `До безкоштовної доставки — <b class="mono">${uah(left)}</b>` : '<b>Доставка безкоштовна</b> ✓'}
      <div class="bar"><i style="width:${Math.min(100, total / FREE_SHIP * 100)}%"></i></div>` : '';
    $('#cartShip').hidden = !q;
    $('#cartBody').innerHTML = q ? cart.map((l, i) => {
      const p = byId(l.id);
      return `<div class="cl">
        <a class="cl__img" href="#/p/${p.id}" data-close>${img(p.imgs[0], p.name)}</a>
        <div class="cl__name"><a href="#/p/${p.id}" data-close><b>${p.name}</b></a><span>${p.type}</span>${p.sku ? `<span class="mono">Код: ${p.sku}</span>` : ''}</div>
        <div class="cl__opt"><span class="cl__lbl">Колір / розмір</span>${p.color.name} · ${l.size}</div>
        <div class="cl__price"><span class="cl__lbl">Ціна</span>${uah(p.price)}</div>
        <div class="cl__qty"><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Менше">−</button><span>${l.qty}</span><button data-q="${i}" data-d="1" aria-label="Більше">+</button></div></div>
        <div class="cl__sum">${uah(p.price * l.qty)}</div>
        <button class="cl__rm" data-rm="${i}" aria-label="Видалити ${p.name}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z"/></svg></button>
      </div>`;
    }).join('') : `<div class="cart__empty"><h3>Кошик порожній</h3><p>Зима не чекає — подивіться нову колекцію.</p><a class="btn btn--ink" href="#/catalog" data-close>До каталогу</a></div>`;
    $('#cartFoot').innerHTML = q ? `
      <button class="btn btn--ghost cart__cont" data-close>← Продовжити покупки</button>
      <div class="cart__total"><span>Разом:</span> <b>${uah(total)}</b></div>
      <a class="btn btn--ink cart__go" href="#/checkout" data-close>Оформити замовлення</a>` : '';
    $('#cartFoot').hidden = !q;
  }
  $('#cartBody').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if (q) { const l = cart[+q.dataset.q]; l.qty += +q.dataset.d; if (l.qty < 1) cart.splice(+q.dataset.q, 1); saveCart(); }
    if (rm) {
      const [gone] = cart.splice(+rm.dataset.rm, 1); saveCart();
      toast(`Видалено: ${byId(gone.id).name}`, 'Повернути', () => { cart.push(gone); saveCart(); });
    }
  });

  function viewCheckout() {
    if (!cart.length) return `<div class="page"><div class="done"><h1>Кошик порожній</h1><a class="btn btn--ink" href="#/catalog">До каталогу</a></div></div>`;
    const total = cartTotal();
    return `
    <div class="page"><div class="co">
      <p class="eyebrow">Крок 1 з 1 · без реєстрації</p>
      <h1>Оформ<em>лення</em></h1>
      <div class="co__grid">
        <form id="coForm" novalidate>
          <label class="field"><span>Ім’я *</span><input name="first" autocomplete="given-name" required></label>
          <label class="field"><span>Прізвище *</span><input name="last" autocomplete="family-name" required></label>
          <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" inputmode="email"></label>
          <label class="field"><span>Телефон *</span><input name="tel" type="tel" autocomplete="tel" inputmode="tel" placeholder="+38 (0__) ___ __ __" required></label>
          <label class="field"><span>Доставка</span><select name="ship">
            <option>Нова Пошта — відділення</option><option>Нова Пошта — поштомат</option><option>Нова Пошта — кур’єр</option></select></label>
          <p class="co__note">Замовлення від 12 000 ₴ — доставка безкоштовна. До 12 000 ₴ — за тарифами Нової Пошти.</p>
          <div class="ac-wrap"><label class="field"><span>Місто *</span><input name="city" autocomplete="off" placeholder="Почніть вводити: Київ, Одеса…" required></label><ul class="ac" id="acCity" role="listbox" hidden></ul></div>
          <div class="ac-wrap"><label class="field"><span id="npLbl">Відділення *</span><input name="np" autocomplete="off" placeholder="Номер або адреса відділення" required></label><ul class="ac" id="acNp" role="listbox" hidden></ul></div>
          <fieldset><legend>Спосіб оплати</legend>
            <label class="radio"><input type="radio" name="pay" value="invoice"> Оплата на рахунок</label>
            <label class="radio"><input type="radio" name="pay" value="cod" checked> Оплата при отриманні · передоплата ${(window.SHOP || {}).prepay} ₴</label>
            <label class="radio"><input type="radio" name="pay" value="card"> Онлайн-оплата (Visa / Mastercard)</label>
          </fieldset>
          <label class="field field--area"><span>Коментар до замовлення</span><textarea name="comment" rows="3"></textarea></label>
          <label class="check"><input type="checkbox" name="nocall"> Я впевнений(а) у замовленні, передзвонювати не потрібно</label>
          <p class="size-msg" id="coMsg" aria-live="polite"></p>
          <div class="co__actions"><button class="btn btn--ink">Оформити замовлення</button><span class="co__req">* поля обов’язкові для заповнення</span></div>
        </form>
        <aside class="co__sum" aria-label="Ваше замовлення">
          <p class="eyebrow" style="display:flex;justify-content:space-between">Ваше замовлення <button type="button" class="link" data-open="cart">Змінити кошик</button></p>
          ${cart.map(l => { const p = byId(l.id); return `<div class="line">${img(p.imgs[0], p.name)}<div><div class="line__row"><h4 style="font-size:18px">${p.name}</h4><span class="line__price">${uah(p.price * l.qty)}</span></div><p class="line__meta" style="margin:4px 0 0">${l.size} · ${l.qty} шт.</p></div></div>`; }).join('')}
          <div class="cart__sum total"><span>Разом</span><span>${uah(total)}</span></div>
        </aside>
      </div>
    </div></div>`;
  }
  /* Нова Пошта: відкрите API, працює без ключа (ключ можна вказати в SHOP.npApiKey) */
  const NP = async (model, method, props) => {
    try {
      const r = await fetch('https://api.novaposhta.ua/v2.0/json/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: (window.SHOP || {}).npApiKey || '', modelName: model, calledMethod: method, methodProperties: props }) });
      const j = await r.json(); return j.success ? j.data : [];
    } catch { return []; }
  };
  function autocomplete(input, list, fetcher, pick) {
    let timer, items = [], seq = 0;
    const show = () => {
      list.innerHTML = items.length ? items.map((x, i) => `<li role="option" data-i="${i}">${x.label}</li>`).join('') : '<li class="ac__empty">Нічого не знайдено</li>';
      list.hidden = false;
    };
    const run = async () => { const my = ++seq; const r = await fetcher(input.value.trim()); if (my !== seq || r === null) return; items = r; show(); };
    input.addEventListener('input', () => { clearTimeout(timer); input.dataset.ref = ''; timer = setTimeout(run, 250); });
    input.addEventListener('focus', () => { if (!input.value.trim()) run(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !list.hidden && items[0]) { e.preventDefault(); pick(items[0]); list.hidden = true; } if (e.key === 'Escape') list.hidden = true; });
    list.addEventListener('mousedown', e => { const li = e.target.closest('[data-i]'); if (!li) return; e.preventDefault(); pick(items[+li.dataset.i]); list.hidden = true; });
    input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
  }
  function mountCheckout() {
    const f = $('#coForm'); if (!f) return;
    const courier = () => /кур/.test(f.ship.value), postomat = () => /поштомат/.test(f.ship.value);
    const setShip = () => {
      $('#npLbl').textContent = courier() ? 'Адреса доставки (вулиця, будинок, квартира) *' : postomat() ? 'Поштомат *' : 'Відділення *';
      f.np.placeholder = courier() ? 'вул. Хрещатик, 1, кв. 10' : 'Номер або адреса — наприклад, 12';
      f.np.value = ''; f.np.dataset.ref = '';
    };
    f.ship.addEventListener('change', setShip); setShip();
    autocomplete(f.city, $('#acCity'), async q => {
      if (q.length < 2) return null;
      const d = await NP('Address', 'searchSettlements', { CityName: q, Limit: '20', Page: '1' });
      return ((d[0] || {}).Addresses || []).filter(a => a.Warehouses > 0 || courier()).map(a => ({ label: a.Present, ref: a.DeliveryCity }));
    }, x => { f.city.value = x.label; f.city.dataset.ref = x.ref; f.np.value = ''; f.np.dataset.ref = ''; f.np.focus(); });
    autocomplete(f.np, $('#acNp'), async q => {
      if (courier() || !f.city.dataset.ref) return null;
      const props = { CityRef: f.city.dataset.ref, Limit: '50', Page: '1' };
      if (/^\d+$/.test(q)) props.WarehouseId = q; else if (q) props.FindByString = q;
      const d = await NP('Address', 'getWarehouses', props);
      return d.filter(w => postomat() ? w.CategoryOfWarehouse === 'Postomat' : w.CategoryOfWarehouse !== 'Postomat')
        .map(w => ({ label: w.Description, ref: w.Ref }));
    }, x => { f.np.value = x.label; f.np.dataset.ref = x.ref; });
    f.onsubmit = e => {
      e.preventDefault();
      const bad = [...f.elements].filter(el => el.required && !el.value.trim());
      if (bad.length) { $('#coMsg').textContent = 'Заповніть, будь ласка, обов’язкові поля (*)'; bad[0].focus(); return; }
      if (f.tel.value.replace(/\D/g, '').length < 10) { $('#coMsg').textContent = 'Перевірте номер телефону'; f.tel.focus(); return; }
      if (f.email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value)) { $('#coMsg').textContent = 'Перевірте e-mail'; f.email.focus(); return; }
      if (!courier() && !f.np.dataset.ref && f.city.dataset.ref) { $('#coMsg').textContent = 'Оберіть відділення зі списку'; f.np.focus(); return; }
      try { sessionStorage.setItem('k7_nocall', f.nocall.checked ? '1' : '0'); } catch {}
      const now = new Date(), pad = n => String(n).padStart(2, '0');
      const order = { n: `K7-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`,
        d: now.toISOString().slice(0, 10), pay: f.pay.value,
        b: { name: `${f.first.value.trim()} ${f.last.value.trim()}`, tel: f.tel.value.trim(), email: f.email.value.trim(),
             ship: f.ship.value, city: f.city.value.trim(), np: f.np.value.trim(), comment: f.comment.value.trim() },
        i: cart.map(l => [l.id, l.size, l.qty]) };
      // TODO: надіслати замовлення в CRM / Telegram / на пошту магазину
      if (order.pay === 'card') { location.hash = '#/pay?o=' + encOrder(order); return; }
      cart = []; saveCart();
      location.hash = '#/invoice?o=' + encOrder(order);  // рахунок: повний (на рахунок) або на передоплату (при отриманні)
    };
  }

  function drawFavs() {
    const n = [...favs].filter(id => byId(id)).length, el = $('#favCount');
    el.textContent = n; el.hidden = !n;
    $('.hdr__fav .heart').textContent = n ? '♥' : '♡';
  }
  function viewFavorites() {
    const list = [...favs].map(byId).filter(Boolean);
    const avail = p => p.sold ? [] : p.sizes.filter(s => !p.out.includes(s));
    const sum = list.filter(p => !p.sold).reduce((s, p) => s + p.price, 0);
    return `<div class="page">
      <header class="cat-head"><p class="eyebrow">Те, що вам сподобалось</p><h1>Улюб<em>лені</em></h1>
        <p class="mono"><span>${list.length} ${plural(list.length, 'модель', 'моделі', 'моделей')}</span></p></header>
      ${list.length ? `<div class="favs">${list.map(p => { const sz = avail(p); return `
        <div class="fv${p.sold ? ' fv--sold' : ''}" data-id="${p.id}">
          <a class="fv__img" href="#/p/${p.id}">${img(p.imgs[0], p.name)}</a>
          <div class="fv__info"><a href="#/p/${p.id}"><b>${p.name}</b></a><span>${p.type}</span><span>${p.color.name}</span><span class="mono fv__price">${uah(p.price)}</span></div>
          <div class="fv__size">${p.sold ? '<span class="mono">Продано</span>' : `<select data-favsize aria-label="Розмір ${p.name}"><option value="">Розмір</option>${sz.map(s => `<option${sz.length === 1 ? ' selected' : ''}>${s}</option>`).join('')}</select>`}</div>
          <div class="fv__act">${p.sold ? '' : `<button class="btn btn--ghost" data-favcart="${p.id}">У кошик</button>`}<button class="fv__rm" data-fav="${p.id}" aria-label="Прибрати з улюблених">✕</button></div>
        </div>`; }).join('')}</div>
        <div class="fv__foot wrap"><p class="size-msg" id="favMsg" aria-live="polite"></p>
          <div class="fv__total">Разом: <b>${uah(sum)}</b></div>
          <a class="btn btn--ghost" href="#/catalog">← Продовжити покупки</a>
          <button class="btn btn--ink" id="favOrder">Оформити замовлення</button></div>`
        : `<div class="done" style="min-height:40svh"><p>Натисніть ♡ на картці товару — і він з’явиться тут.</p><p><a class="btn btn--ink" href="#/catalog">До каталогу</a></p></div>`}
    </div>${footer()}`;
  }
  const putInCart = (id, size) => { if (!cart.some(l => l.id === id && l.size === size)) cart.push({ id, size, qty: 1 }); };
  document.addEventListener('click', e => {
    const one = e.target.closest('[data-favcart]');
    if (one) {
      const row = one.closest('.fv'), sel = row.querySelector('select');
      if (!sel.value) { row.classList.add('fv--need'); $('#favMsg').textContent = 'Оберіть розмір'; sel.focus(); return; }
      row.classList.remove('fv--need'); addToCart(row.dataset.id, sel.value);
    }
    if (e.target.closest('#favOrder')) {
      const rows = $$('.fv:not(.fv--sold)'), miss = rows.filter(r => !r.querySelector('select').value);
      rows.forEach(r => r.classList.toggle('fv--need', miss.includes(r)));
      if (miss.length) { $('#favMsg').textContent = 'Оберіть розмір для кожної моделі'; miss[0].querySelector('select').focus(); return; }
      rows.forEach(r => putInCart(r.dataset.id, r.querySelector('select').value));
      saveCart(); location.hash = '#/checkout';
    }
  });
  const encOrder = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const decOrder = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  const orderLines = o => o.i.map(([id, size, qty]) => ({ p: byId(id), size, qty })).filter(l => l.p);
  const orderTotal = o => orderLines(o).reduce((s, l) => s + l.p.price * l.qty, 0);
  /* сума прописом, гривні */
  function words(n) {
    const one = ['', 'один', 'два', 'три', 'чотири', 'п’ять', 'шість', 'сім', 'вісім', 'дев’ять'], oneF = ['', 'одна', 'дві'];
    const teen = ['десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', 'п’ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев’ятнадцять'];
    const tens = ['', '', 'двадцять', 'тридцять', 'сорок', 'п’ятдесят', 'шістдесят', 'сімдесят', 'вісімдесят', 'дев’яносто'];
    const hund = ['', 'сто', 'двісті', 'триста', 'чотириста', 'п’ятсот', 'шістсот', 'сімсот', 'вісімсот', 'дев’ятсот'];
    const tri = (x, fem) => { const h = Math.floor(x / 100), r = x % 100, t = Math.floor(r / 10), u = r % 10, out = [hund[h]];
      if (t === 1) out.push(teen[u]); else { out.push(tens[t]); out.push(fem && u < 3 ? oneF[u] : one[u]); } return out.filter(Boolean).join(' '); };
    const form = (x, a, b, c) => plural(x, a, b, c);
    if (!n) return 'нуль гривень';
    const th = Math.floor(n / 1000), r = n % 1000, parts = [];
    if (th) parts.push(tri(th, true) + ' ' + form(th, 'тисяча', 'тисячі', 'тисяч'));
    if (r) parts.push(tri(r, true));
    const s = parts.join(' ') + ' ' + form(n, 'гривня', 'гривні', 'гривень') + ' 00 копійок';
    return s[0].toUpperCase() + s.slice(1);
  }
  function viewInvoice(params) {
    let o; try { o = decOrder(params.get('o')); } catch { return viewNotFound(); }
    const S = window.SHOP || {}, L = orderLines(o), total = orderTotal(o), d = o.d.split('-').reverse().join('.');
    const pre = o.pay === 'cod', due = pre ? Math.min(S.prepay || 300, total) : total;
    const purpose = `${S.purpose || 'Оплата за товар'}${pre ? ' (передоплата)' : ''}, рахунок № ${o.n}`;
    const link = location.href, text = `Рахунок № ${o.n} від ${d} — ${S.seller}. До сплати: ${uah(due)}. IBAN ${S.iban}. Призначення: ${purpose}.`;
    return `<div class="page"><div class="inv">
      <div class="inv__actions no-print">
        <button class="btn btn--ink" onclick="window.print()">Зберегти PDF / Друк</button>
        <a class="btn btn--ghost" href="mailto:${o.b.email}?subject=${encodeURIComponent('Рахунок № ' + o.n)}&body=${encodeURIComponent(text + '\n\nРахунок: ' + link)}">Надіслати на e-mail</a>
        <a class="btn btn--ghost" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}">Telegram</a>
        <a class="btn btn--ghost" href="viber://forward?text=${encodeURIComponent(text + ' ' + link)}">Viber</a>
        <a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}">WhatsApp</a>
        <button class="btn btn--ghost" data-copy="${link}">Скопіювати посилання</button>
      </div>
      <h1>${pre ? 'Рахунок на передоплату' : 'Рахунок-фактура'} № ${o.n}</h1><p class="mono">від ${d}</p>
      <div class="inv__parties">
        <div><p class="eyebrow">Постачальник</p><p><b>${S.seller}</b><br>ЄДРПОУ: ${S.edrpou}<br>IBAN: <span class="mono">${S.iban}</span>${S.bank ? '<br>Банк: ' + S.bank : ''}${S.address ? '<br>' + S.address : ''}${[S.phone, S.email].filter(Boolean).length ? '<br>' + [S.phone, S.email].filter(Boolean).join(' · ') : ''}</p></div>
        <div><p class="eyebrow">Покупець</p><p><b>${o.b.name}</b><br>${o.b.tel}${o.b.email ? '<br>' + o.b.email : ''}<br>${o.b.ship}: ${o.b.city}, ${o.b.np}</p></div>
      </div>
      <table class="inv__t"><thead><tr><th>№</th><th>Найменування</th><th>Колір / розмір</th><th>К-сть</th><th>Ціна, ₴</th><th>Сума, ₴</th></tr></thead><tbody>
        ${L.map((l, i) => `<tr><td>${i + 1}</td><td>${l.p.name} — ${l.p.type}${l.p.sku ? `<br><small>Арт. ${l.p.sku}</small>` : ''}</td><td>${l.p.color.name} · ${l.size}</td><td>${l.qty}</td><td>${uah(l.p.price)}</td><td>${uah(l.p.price * l.qty)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="5">Разом${S.vat ? ', у т.ч. ПДВ' : ', без ПДВ'}</td><td><b>${uah(total)}</b></td></tr>
        ${pre ? `<tr><td colspan="5">Передоплата — сплатити зараз</td><td><b>${uah(due)}</b></td></tr><tr><td colspan="5">Решта — при отриманні на Новій Пошті</td><td>${uah(total - due)}</td></tr>` : ''}</tfoot></table>
      <div class="inv__pay"><p class="eyebrow">Реквізити для оплати</p>
        <p>Отримувач: <b>${S.seller}</b><br>IBAN: <b class="mono">${S.iban}</b> <button class="link no-print" data-copy="${S.iban}">копіювати</button><br>ЄДРПОУ: ${S.edrpou}<br>Сума: <b>${uah(due)}</b><br>Призначення платежу: <b>${purpose}</b></p></div>
      <p><b>Сума до сплати прописом:</b> ${words(due)}${S.vat ? '' : ', без ПДВ'}.</p>
      <p class="inv__note">${pre ? 'Після надходження передоплати замовлення буде відправлене, решту суми ви сплатите при отриманні на відділенні.' : 'Відправка — після надходження оплати.'} ${S.shipping} Рахунок дійсний 3 банківські дні.</p>
      <p class="no-print" style="margin-top:30px"><a class="link" href="#/">На головну</a></p>
    </div></div>`;
  }
  function viewPay(params) {
    let o; try { o = decOrder(params.get('o')); } catch { return viewNotFound(); }
    const S = window.SHOP || {}, total = orderTotal(o), cur = S.paypalCurrency || 'EUR', amount = (total / (S.eurRate || 48)).toFixed(2);
    return `<div class="page"><div class="co pay">
      <p class="eyebrow">Онлайн-оплата · замовлення ${o.n}</p><h1>Оп<em>лата</em></h1>
      <div class="co__grid"><div>
        <p class="pay__sum">До сплати: <b>${uah(total)}</b> <span class="mono">≈ ${amount} ${cur}</span></p>
        <p class="co__note">Оплата через PayPal: картка Visa / Mastercard або акаунт PayPal. PayPal не приймає гривню, тому сума перераховується в ${cur} за курсом ${S.eurRate} ₴.</p>
        ${S.paypalClientId === 'test' ? '<p class="pay__test">Тестовий режим: справжні гроші не списуються.</p>' : ''}
        <div id="ppButtons" class="pay__btns"><p class="mono">Завантаження PayPal…</p></div>
        <p class="size-msg" id="payMsg" aria-live="polite"></p>
        <p><a class="link" href="#/checkout">← Змінити спосіб оплати</a></p>
      </div>
      <aside class="co__sum"><p class="eyebrow">Ваше замовлення</p>
        ${orderLines(o).map(l => `<div class="line">${img(l.p.imgs[0], l.p.name)}<div><div class="line__row"><h4 style="font-size:18px">${l.p.name}</h4><span class="line__price">${uah(l.p.price * l.qty)}</span></div><p class="line__meta" style="margin:4px 0 0">${l.size} · ${l.qty} шт.</p></div></div>`).join('')}
        <div class="cart__sum total"><span>Разом</span><span>${uah(total)}</span></div></aside></div>
    </div></div>`;
  }
  function mountPay(params) {
    if (!$('#ppButtons')) return;
    const o = decOrder(params.get('o')), S = window.SHOP || {}, cur = S.paypalCurrency || 'EUR';
    const amount = (orderTotal(o) / (S.eurRate || 48)).toFixed(2);
    const render = () => {
      $('#ppButtons').innerHTML = '';
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' },
        createOrder: (d, a) => a.order.create({ purchase_units: [{ description: `KURTKI 7KM, замовлення ${o.n}`, amount: { currency_code: cur, value: amount } }] }),
        onApprove: (d, a) => a.order.capture().then(() => { cart = []; saveCart(); location.hash = '#/done?paid=1'; }),
        onError: () => { $('#payMsg').textContent = 'Оплата не пройшла. Спробуйте ще раз або оберіть інший спосіб.'; },
      }).render('#ppButtons');
    };
    if (window.paypal) return render();
    const sc = document.createElement('script');
    sc.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(S.paypalClientId || 'test')}&currency=${cur}`;
    sc.onload = render; sc.onerror = () => { $('#ppButtons').innerHTML = '<p class="size-msg">Не вдалося завантажити PayPal. Перевірте інтернет.</p>'; };
    document.head.appendChild(sc);
  }
  document.addEventListener('click', e => {
    const cp = e.target.closest('[data-copy]'); if (!cp) return;
    navigator.clipboard?.writeText(cp.dataset.copy).then(() => toast(cp.dataset.copy.startsWith('UA') ? 'IBAN скопійовано' : 'Посилання на рахунок скопійовано'));
  });
  const viewDone = () => `<div class="page"><div class="done"><p class="eyebrow">${location.hash.includes('paid=1') ? 'Оплату отримано' : 'Замовлення прийнято'}</p><h1>Дякуємо</h1><p>${sessionStorage.getItem('k7_nocall') === '1' ? 'Ми відправимо замовлення без дзвінка. Номер накладної надішлемо в SMS.' : 'Менеджер зателефонує протягом 15 хвилин, щоб підтвердити розмір і доставку.'}</p><p><a class="btn btn--ink" href="#/">На головну</a></p></div></div>`;
  const viewNotFound = () => `<div class="page"><div class="done"><h1>Не знайдено</h1><a class="btn btn--ink" href="#/catalog">До каталогу</a></div></div>`;
  const viewInfo = () => `<div class="page"><div class="info">
    <p class="eyebrow">Покупцям</p><h1>Доставка <em class="serif">і оплата</em></h1>
    <h2>Доставка</h2><p>Нова пошта по всій Україні, 1–2 дні. Безкоштовно від 12 000 ₴. ${(window.SHOP || {}).shipping}</p>
    <h2>Оплата</h2><p>Оплата при отриманні на відділенні — з передоплатою ${(window.SHOP || {}).prepay} ₴, решта при отриманні. Також можна оплатити на рахунок ФОП або онлайн карткою Visa / Mastercard.</p>
    <h2>Догляд</h2><p><b>Пуховики, шуби, пальта</b> — тільки професійна хімчистка. <b>Шкіра</b> — чистка шкіряних виробів. <b>Інші куртки</b> — делікатне прання при 30°, без відбілювачів, сушіння горизонтально.</p>
  </div></div>${footer()}`;

  /* =========================================================
     Шари: меню, шторки, кошик
     ========================================================= */
  const scrim = $('#scrim');
  let lastFocus;
  function openLayer(el) {
    closeLayers(true);
    lastFocus = document.activeElement;
    el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
    if (el.id !== 'menu') { scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('on')); }
    document.body.classList.add('locked');
    if (el.id === 'cart') { drawCart(); $('#toast').classList.remove('on'); }
    setTimeout(() => (el.querySelector('[data-close], #menuClose') || el).focus?.(), 60);
  }
  function closeLayers(silent) {
    $$('.menu.on, .sheet.on, .cart.on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); });
    scrim.classList.remove('on'); setTimeout(() => { if (!scrim.classList.contains('on')) scrim.hidden = true; }, 400);
    $('#menuOpen').setAttribute('aria-expanded', 'false');
    if (!silent) { document.body.classList.remove('locked'); lastFocus?.focus?.({ preventScroll: true }); }
    else document.body.classList.remove('locked');
  }
  $('#menuOpen').onclick = () => { openLayer($('#menu')); $('#menuOpen').setAttribute('aria-expanded', 'true'); };
  $('#menuClose').onclick = () => closeLayers();
  $('#cartOpen').onclick = () => openLayer($('#cart'));
  scrim.onclick = () => closeLayers();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { $('#zoom')?.classList.remove('on'); closeLayers(); }
  });
  // свайп вниз закриває bottom sheet
  $$('.sheet').forEach(sh => {
    let y0 = null;
    sh.addEventListener('touchstart', e => { y0 = sh.querySelector('.sheet__body').scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 === null) return; const dy = e.touches[0].clientY - y0; if (dy > 0 && innerWidth < 600) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sh.addEventListener('touchend', e => { if (y0 === null) return; const dy = e.changedTouches[0].clientY - y0; sh.style.transform = ''; if (dy > 110 && innerWidth < 600) closeLayers(); y0 = null; });
  });

  // колекції в меню + прев’ю картинки
  // блок «Колекції» в меню прибрано
  // $('#menuCols').innerHTML = C.map(c => `<li><a href="#/catalog?col=${c.id}" data-prev="${c.img}">${c.title}<span>${c.no}</span></a></li>`).join('');
  $('#menuMain').innerHTML = [
    `<div class="mm"><a class="mm__top" href="#/catalog?new=1" data-prev="img/p-espresso-1.webp"><span class="mono">01</span>Новинки</a></div>`,
    ...K7.SEASONS.map(([id, l], i) => `<div class="mm"><a class="mm__top" href="#/catalog?sea=${id}" data-prev="${SEA_IMG[id] || 'img/creme-1.webp'}"><span class="mono">0${i + 2}</span>${l}</a>
      <div class="mm__sub">${subsIn(id).map(([s, , sl]) => `<a href="#/catalog?sub=${s}">${sl}</a>`).join('') || '<span class="mm__soon">Незабаром</span>'}</div></div>`),
    `<div class="mm"><a class="mm__top mm__top--sale" href="#/catalog?sale=1" data-prev="img/p-vestaglia-camel-1.webp"><span class="mono">05</span>Sale</a></div>`,
  ].join('');
  $('#menu').addEventListener('mouseover', e => { const a = e.target.closest('[data-prev]'); if (a) $('#menuPrev').src = a.dataset.prev; });
  $('#searchForm').onsubmit = e => { e.preventDefault(); const q = $('#searchInput').value.trim(); location.hash = '#/catalog' + (q ? '?q=' + encodeURIComponent(q) : ''); };

  /* делегування кліків по документу */
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]')) { closeLayers(t.closest('a') ? true : false); }
    const o = t.closest('[data-open]'); if (o) openLayer($('#' + o.dataset.open));
    const fav = t.closest('[data-fav]');
    if (fav) {
      e.preventDefault(); const id = fav.dataset.fav;
      favs.has(id) ? favs.delete(id) : favs.add(id); store.set('favs', [...favs]);
      $$(`[data-fav="${id}"]`).forEach(b => { const on = favs.has(id); b.classList.toggle('on', on); b.textContent = on ? '♥' : '♡'; b.setAttribute('aria-pressed', on); });
      drawFavs(); if (location.hash.startsWith('#/favorites') && !favs.has(id)) route();
      if (favs.has(id)) toast(`${byId(id).name} — в улюблених`, 'Улюблені', () => { location.hash = '#/favorites'; });
    }
    const hot = t.closest('[data-hot]'); if (hot) $('#hot-' + hot.dataset.hot).classList.toggle('on');
    if (t.closest('#openFilters')) openFilters();
    const sub = t.closest('.chips [data-sub]');
    if (sub) { F.sub = F.sub === sub.dataset.sub ? '' : sub.dataset.sub; renderGrid(); history.replaceState(null, '', `#/catalog?sea=${F.sea}${F.sub ? '&sub=' + F.sub : ''}`); }
    const chip = t.closest('.chips [data-chip]');
    if (chip) { const v = chip.dataset.chip;
      if (!v) { F.kind = ''; F.fresh = false; F.cats = []; F.fur = false; F.span = ''; F.leather = false; }
      else if (v === 'new') F.fresh = !F.fresh;
      else { F.kind = F.kind === v ? '' : v; F.span = ''; F.leather = false; F.cats = []; }
      renderGrid(); }
    if (t.closest('[data-reset]')) { F = { ...emptyF(), sort: F.sort }; renderGrid(); }
    if (t.closest('#viewTog')) { gridMode = gridMode === 'one' ? 'two' : 'one'; store.set('grid', gridMode); $('#grid').classList.toggle('one', gridMode === 'one'); $('#viewTog').classList.toggle('one', gridMode === 'one'); }
  });
  document.addEventListener('change', e => { if (e.target.id === 'sort') { F.sort = e.target.value; renderGrid(); } });
  document.addEventListener('submit', e => { if (e.target.matches('[data-news]')) { e.preventDefault(); e.target.reset(); toast('Дякуємо! Ви в списку.'); } });

  /* ---------- тост ---------- */
  let tt;
  function toast(msg, action, fn) {
    const el = $('#toast');
    el.innerHTML = `<span>${msg}</span>${action ? `<button>${action}</button>` : ''}`;
    if (action) el.querySelector('button').onclick = () => { el.classList.remove('on'); fn(); };
    el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 3800);
  }

  /* =========================================================
     ⑥ Анімації: поява, розбивка слів, фільм, шапка
     ========================================================= */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() {
    $$('[data-split]:not(.is-split)').forEach(el => {
      el.classList.add('is-split');
      const walk = n => [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) return frag.append(' ');
            const s = document.createElement('span'); s.className = 'w'; s.innerHTML = `<span>${w}</span>`; frag.append(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
      walk(el);
      $$('.w > span', el).forEach((s, i) => s.style.transitionDelay = i * 70 + 'ms');
    });
    $$('.rv:not(.in), .rv-img:not(.in), .split:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  }

  let filmTimer, filmRAF;
  let filmIO;
  function mountFilm() {
    clearInterval(filmTimer); cancelAnimationFrame(filmRAF); filmIO?.disconnect();
    const vid = $('.film__video');
    if (vid) return mountVideo(vid);
    const slides = $$('.film__slide'); if (!slides.length) return;
    const caps = [['Merlot', 'Сутінки, −12°'], ['Paris', 'Балкон, перший ранок'], ['Ivory', 'Колонада, вітер'], ['Track 7', 'Вапняк, полудень'], ['Butter', 'Бетон, кава з собою']];
    const DUR = 5200; let i = 0, t0 = performance.now(), playing = true, elapsed = 0;
    const go = n => {
      slides[i].classList.remove('on'); i = (n + slides.length) % slides.length; slides[i].classList.add('on');
      $('#filmIdx').textContent = `0${i + 1}/0${slides.length}`; $('#filmCap').textContent = caps[i][1];
      t0 = performance.now(); elapsed = 0;
    };
    const tick = now => {
      if (!$('#filmProg')) return;
      if (playing) {
        elapsed = now - t0;
        if (elapsed >= DUR) go(i + 1);
        $('#filmProg').style.width = (elapsed / DUR * 100) + '%';
        const sec = Math.floor((i * DUR + elapsed) / 1000);
        $('#filmTc').textContent = `00:${String(sec).padStart(2, '0')} / ${caps[i][0]}`;
      }
      filmRAF = requestAnimationFrame(tick);
    };
    filmRAF = requestAnimationFrame(tick);
    $('#filmPlay').onclick = () => {
      playing = !playing; if (playing) t0 = performance.now() - elapsed;
      $('#filmPlay').textContent = playing ? '❚❚' : '▶'; $('#filmPlay').setAttribute('aria-label', playing ? 'Пауза' : 'Відтворити');
      slides.forEach(s => s.style.animationPlayState = playing ? 'running' : 'paused');
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) $('#filmPlay').click();
  }

  /* відео вантажиться лише коли секція близько до екрана; поза екраном — пауза */
  function mountVideo(v) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let wantPlay = !reduce;
    const btn = $('#filmPlay');
    const setBtn = () => { const on = !v.paused; btn.textContent = on ? '❚❚' : '▶'; btn.setAttribute('aria-label', on ? 'Пауза' : 'Відтворити'); };
    const load = () => { if (!v.src) { v.src = v.dataset.src; v.load(); } };
    v.addEventListener('play', setBtn); v.addEventListener('pause', setBtn); setBtn();
    filmIO = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { load(); if (wantPlay) v.play().catch(() => {}); }
      else v.pause();
    }, { rootMargin: '300px 0px' });
    filmIO.observe(v.closest('.film'));
    btn.onclick = () => { load(); wantPlay = v.paused; wantPlay ? v.play().catch(() => {}) : v.pause(); };
    const tick = () => {
      if (!$('#filmProg')) return;
      if (v.duration) {
        $('#filmProg').style.width = (v.currentTime / v.duration * 100) + '%';
        $('#filmTc').textContent = `00:${String(Math.floor(v.currentTime)).padStart(2, '0')} / Noir`;
      }
      filmRAF = requestAnimationFrame(tick);
    };
    filmRAF = requestAnimationFrame(tick);
  }

  /* ⑥ сніг над секцією Nord — легкий canvas, стоїть на паузі поза екраном */
  let snowRAF, snowIO;
  function mountSnow() {
    cancelAnimationFrame(snowRAF); snowIO?.disconnect();
    const cv = $('.snow'); if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d'); let W, H, flakes = [], on = false;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(W * H / 9000);
      flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + .4, s: Math.random() * .6 + .25, d: Math.random() * 6.28 }));
    };
    size(); addEventListener('resize', size);
    const draw = () => {
      if (!document.body.contains(cv)) { removeEventListener('resize', size); return; }
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath();
      for (const f of flakes) {
        f.y += f.s * (f.r * .6 + .5); f.d += .01; f.x += Math.sin(f.d) * .35;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, 0, 6.28);
      }
      ctx.fill();
      if (on) snowRAF = requestAnimationFrame(draw);
    };
    snowIO = new IntersectionObserver(([en]) => { on = en.isIntersecting; cancelAnimationFrame(snowRAF); if (on) draw(); });
    snowIO.observe(cv);
  }

  /* шапка: прозора над обкладинкою, ховається при скролі вниз */
  let lastY = 0, isHome = false;
  function onScroll() {
    const y = scrollY, cover = $('.cover');
    const overCover = isHome && cover && y < cover.offsetHeight - 60;
    hdr.classList.toggle('is-over', !!overCover);
    hdr.classList.toggle('hide-logo', !!(isHome && y < 80));
    hdr.classList.toggle('is-solid', !overCover && y > 4);
    const hide = y > 240 && y > lastY + 4 && !document.body.classList.contains('locked');
    const show = y < lastY - 4 || y < 240;
    if (hide) { hdr.classList.add('is-hidden'); document.body.classList.add('hdr-hidden'); }
    else if (show) { hdr.classList.remove('is-hidden'); document.body.classList.remove('hdr-hidden'); }
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* =========================================================
     Роутер
     ========================================================= */
  function route() {
    const [path, qs] = (location.hash.slice(1) || '/').split('?');
    const params = new URLSearchParams(qs || '');
    const seg = path.split('/').filter(Boolean);
    closeLayers(true);
    isHome = !seg.length;
    let html, title = 'KURTKI 7KM — зимовий верхній одяг';
    if (!seg.length) html = viewHome();
    else if (seg[0] === 'catalog') { html = viewCatalog(params); title = 'Каталог — KURTKI 7KM'; }
    else if (seg[0] === 'p') { html = viewProduct(seg[1]); const p = byId(seg[1]); if (p) title = `${p.name} — ${p.type} — KURTKI 7KM`; }
    else if (seg[0] === 'checkout') { html = viewCheckout(); title = 'Оформлення — KURTKI 7KM'; }
    else if (seg[0] === 'done') html = viewDone();
    else if (seg[0] === 'info') html = viewInfo();
    else if (seg[0] === 'favorites') { html = viewFavorites(); title = 'Улюблені — KURTKI 7KM'; }
    else if (seg[0] === 'invoice') { html = viewInvoice(params); title = 'Рахунок — KURTKI 7KM'; }
    else if (seg[0] === 'pay') { html = viewPay(params); title = 'Оплата — KURTKI 7KM'; }
    else html = viewNotFound();
    document.title = title; document.body.dataset.view = seg[0] || 'home';
    app.innerHTML = `<div class="view-enter">${html}</div>`;
    window.scrollTo(0, 0); lastY = 0;
    hdr.classList.remove('is-hidden'); document.body.classList.remove('hdr-hidden');
    if (seg[0] === 'catalog') renderGrid();
    if (seg[0] === 'p') mountProduct();
    if (seg[0] === 'checkout') mountCheckout();
    if (seg[0] === 'pay') mountPay(params);
    if (!seg.length) { mountFilm(); mountSnow(); }
    else { clearInterval(filmTimer); cancelAnimationFrame(filmRAF); filmIO?.disconnect(); cancelAnimationFrame(snowRAF); snowIO?.disconnect(); }
    reveal(); onScroll();
  }
  addEventListener('hashchange', route);
  drawCart(); drawFavs(); route();
});
