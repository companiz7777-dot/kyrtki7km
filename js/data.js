/* KURTKI 7KM — каталог (чернетка). Фото — плейсхолдери. */
(function () {
  'use strict';
  var SZ_INT = ['XS', 'S', 'M', 'L', 'XL'];
  function im(base, n) {
    var a = [];
    for (var i = 1; i <= (n || 3); i++) a.push('img/' + base + '-' + i + '.webp');
    return a;
  }
  function c(name, hex, base) { return { name: name, hex: hex, images: im(base) }; }

  var CARE_DOWN = 'Делікатне прання при 30 °C з кульками для пуховиків, без відбілювачів. Сушити горизонтально, періодично розбиваючи наповнювач. Не прасувати.';
  var CARE_LEATHER = 'Лише професійна чистка шкіри. Зберігати на широких плечиках у дихаючому чохлі. Берегти від прямих джерел тепла.';
  var CARE_WOOL = 'Хімчистка. Між носіннями — провітрювати та чистити щіткою. Зберігати в чохлі з кедровим вкладишем.';
  var CARE_FUR = 'Лише хімчистка для хутра. Не сушити біля батареї. Зберігати в просторій шафі, вільно.';
  var CARE_KNIT = 'Ручне прання при 30 °C, сушити горизонтально на рушнику. Не віджимати.';
  var CARE_TECH = 'Машинне прання при 30 °C, делікатний режим, без кондиціонера. Не прасувати мембрану.';

  window.PRODUCTS = [
    { id: 1, slug: 'espresso', name: 'Espresso', title: 'Пуховик Espresso', kind: 'puffer', span: 'short', flags: { new: true },
      price: 8900, colors: [c('Еспресо', '#4a3428', 'p-espresso')], sizes: SZ_INT, temp: '−25°',
      desc: 'Короткий об’ємний пуховик з високим коміром-стійкою та глибоким капюшоном, що ховається в комір. Матова тканина з ефектом замші.',
      materials: 'Верх: 100% поліамід, матовий DWR. Наповнювач: 90% качиний пух / 10% перо, fill power 650. Підкладка: 100% поліестер.', care: CARE_DOWN },
    { id: 2, slug: 'tartufo', name: 'Tartufo', title: 'Довгий пуховик Tartufo', kind: 'puffer', span: 'long', flags: { new: true },
      price: 12900, colors: [c('Трюфель', '#6b5847', 'p-tartufo'), c('Чорний', '#151515', 'p-tartufo-black')], sizes: SZ_INT, temp: '−30°',
      desc: 'Пуховик максі-довжини з двостороннім замком і розрізами по боках. Горизонтальна стьобка, яка не «роздуває» силует.',
      materials: 'Верх: 100% поліамід ripstop. Наповнювач: 90% гусячий пух / 10% перо, fill power 700. Підкладка: 100% поліестер.', care: CARE_DOWN },
    { id: 3, slug: 'pilota', name: 'Pilota', title: 'Шкіряна куртка Pilota', kind: 'jacket', span: 'short', flags: { leather: true },
      price: 16900, colors: [c('Коньяк', '#7a4b2a', 'p-pilota-brown'), c('Чорний', '#1a1a1a', 'p-pilota-black')], sizes: SZ_INT, temp: '−10°',
      desc: 'Авіаторська куртка з натуральної шкіри з утепленим коміром і трикотажними манжетами. Вільний крій, спущене плече.',
      materials: 'Верх: 100% натуральна шкіра ягняти. Утеплювач: синтепух 120 г/м². Комір: штучне хутро.', care: CARE_LEATHER },
    { id: 4, slug: 'utility', name: 'Utility', title: 'Парка Utility з хутром', kind: 'parka', span: 'long', flags: { fur: true, new: true },
      price: 11400, colors: [c('Шоколад', '#5b4030', 'p-utility-brown'), c('Хакі', '#5f5f45', 'p-utility-khaki')], sizes: SZ_INT, temp: '−30°',
      desc: 'Подовжена парка з об’ємними накладними кишенями, кулісою на талії та знімною облямівкою капюшона.',
      materials: 'Верх: 65% бавовна / 35% поліамід. Утеплювач: Thinsulate 200 г/м². Облямівка: штучне хутро.', care: CARE_TECH },
    { id: 5, slug: 'fumo', name: 'Fumo', title: 'Довге пальто Fumo', kind: 'coat', span: 'long', flags: {},
      price: 14500, colors: [c('Димчастий', '#8a8580', 'p-fumo')], sizes: SZ_INT, temp: '−10°',
      desc: 'Двобортне пальто-халат з широкими лацканами та поясом. Ручна обробка країв, прихований ґудзик.',
      materials: 'Верх: 70% вовна / 20% поліамід / 10% кашемір. Підкладка: 100% віскоза.', care: CARE_WOOL },
    { id: 6, slug: 'lucia', name: 'Lucia', title: 'Коротка шуба Lucia', kind: 'fur', span: 'short', flags: { fur: true, new: true },
      price: 9800, colors: [c('Тауп', '#9b8a7a', 'p-lucia-taupe'), c('Крем', '#e6dccb', 'p-lucia-cream')], sizes: SZ_INT, temp: '−20°',
      desc: 'Шуба-тедді з м’якого штучного хутра, комір-апаш та потайні кнопки. Легка й тепла.',
      materials: 'Верх: 100% штучне хутро (поліестер). Підкладка: 100% віскоза.', care: CARE_FUR },
    { id: 7, slug: 'argento', name: 'Argento', title: 'Пухова жилетка Argento', kind: 'vest', span: 'short', flags: { new: true },
      price: 5400, colors: [c('Срібло', '#b7b6b1', 'p-argento')], sizes: SZ_INT, temp: '−5°',
      desc: 'Стьобана жилетка з металізованим блиском і високим коміром. Носіть поверх светра або під пальто.',
      materials: 'Верх: 100% поліамід з металізованим покриттям. Наповнювач: 80% пух / 20% перо.', care: CARE_DOWN },
    { id: 8, slug: 'paris', name: 'Paris', title: 'Кардиган Paris', kind: 'cardigan', span: 'long', flags: {},
      price: 4600, colors: [c('Вівсяний', '#cdbfa8', 'paris')], sizes: SZ_INT, temp: '+5°',
      desc: 'Довгий кардиган великої в’язки з накладними кишенями. Обіймає, як ковдра.',
      materials: '50% вовна мериноса / 30% альпака / 20% поліамід.', care: CARE_KNIT },
    { id: 9, slug: 'tuta', name: 'Tuta', title: 'Спортивний костюм Tuta', kind: 'suit', span: 'short', flags: { suit: true },
      price: 3900, colors: [c('Чорний', '#1b1b1b', 'p-tuta-black'), c('Сірий меланж', '#9c9c9c', 'p-tuta-grey')], sizes: SZ_INT, temp: '+10°',
      desc: 'Костюм із щільного футеру: худі на блискавці та прямі штани з кулісою. Для дому, дороги та прогулянок.',
      materials: '80% бавовна / 20% поліестер, футер тринитка з начосом.', care: CARE_KNIT },
    { id: 10, slug: 'vestaglia', name: 'Vestaglia', title: 'Пальто-халат Vestaglia', kind: 'coat', span: 'long', flags: { sale: true },
      price: 9900, oldPrice: 13900, colors: [c('Кемел', '#b08a5e', 'p-vestaglia-camel'), c('Чорний', '#1c1c1c', 'p-vestaglia-black')], sizes: SZ_INT, temp: '−5°',
      desc: 'Пальто запахом без ґудзиків, з поясом та шалевим коміром. Класика, що не старіє.',
      materials: 'Верх: 60% вовна / 40% поліестер. Підкладка: 100% віскоза.', care: CARE_WOOL },
    { id: 11, slug: 'vino', name: 'Vino', title: 'Пуховик Vino', kind: 'puffer', span: 'long', flags: { new: true },
      price: 11900, colors: [c('Бордо', '#5e1f26', 'vino')], sizes: SZ_INT, temp: '−25°',
      desc: 'Довгий пуховик кольору витриманого вина з коміром-воронкою. Акцент зимового гардеробу.',
      materials: 'Верх: 100% поліамід, сатиновий блиск. Наповнювач: 90% пух / 10% перо, fill power 650.', care: CARE_DOWN },
    { id: 12, slug: 'creme', name: 'Crème', title: 'Пуховик Crème', kind: 'puffer', span: 'short', flags: {},
      price: 8400, colors: [c('Крем', '#e8dfcf', 'creme')], sizes: SZ_INT, temp: '−20°',
      desc: 'Короткий пуховик-кокон молочного відтінку з широкою стьобкою та манжетами-напульсниками.',
      materials: 'Верх: 100% поліамід, матовий. Наповнювач: 80% пух / 20% перо.', care: CARE_DOWN },
    { id: 13, slug: 'nebbia', name: 'Nebbia', title: 'Вітровка Nebbia', kind: 'jacket', span: 'short', flags: { cat: 'windbreaker', new: true },
      price: 4200, colors: [c('Туман', '#c4c3bc', 'p-nebbia'), c('Чорний', '#202020', 'p-nebbia-black')], sizes: SZ_INT, temp: '+5°',
      desc: 'Легка вітровка-анорак з капюшоном і кишенею-кенгуру. Складається в кишеню.',
      materials: '100% поліамід з водовідштовхувальним просоченням. Мембрана 5 000 мм.', care: CARE_TECH },
    { id: 14, slug: 'vento', name: 'Vento', title: 'Довга вітровка Vento', kind: 'jacket', span: 'long', flags: { cat: 'windbreaker' },
      price: 5600, colors: [c('Оливка', '#6b6a4a', 'p-vento-olive'), c('Пісок', '#c9b99a', 'p-vento-sand')], sizes: SZ_INT, temp: '+5°',
      desc: 'Плащ-вітровка нижче коліна з кулісою на талії та розрізом ззаду.',
      materials: '100% поліестер, мембрана 8 000 мм, проклеєні шви.', care: CARE_TECH },
    { id: 15, slug: 'cioccolato', name: 'Cioccolato', title: 'Довгий пуховик Cioccolato', kind: 'puffer', span: 'long', flags: { sale: true },
      price: 8900, oldPrice: 12400, colors: [c('Шоколад', '#3d2a20', 'p-cioccolato')], sizes: SZ_INT, temp: '−30°',
      desc: 'Пуховик-ковдра з капюшоном і внутрішніми манжетами. Тепло на найхолоднішу зиму.',
      materials: 'Верх: 100% поліамід. Наповнювач: 90% пух / 10% перо, fill power 700.', care: CARE_DOWN },
    { id: 16, slug: 'neve', name: 'Neve', title: 'Пуховик Neve', kind: 'puffer', span: 'short', flags: { new: true },
      price: 7900, colors: [c('Сніг', '#f1eee8', 'p-neve'), c('Графіт', '#3b3b3d', 'p-neve-graphite')], sizes: SZ_INT, temp: '−20°',
      desc: 'Короткий глянцевий пуховик з високим коміром і знімним капюшоном.',
      materials: 'Верх: 100% поліамід, глянцевий. Наповнювач: біопух 300 г/м².', care: CARE_DOWN },
    { id: 17, slug: 'bosco', name: 'Bosco', title: 'Коротка парка Bosco', kind: 'parka', span: 'short', flags: {},
      price: 7400, colors: [c('Хакі', '#4f5238', 'p-bosco')], sizes: SZ_INT, temp: '−20°',
      desc: 'Коротка парка з кулісою по низу, кишенями-клапанами та капюшоном.',
      materials: 'Верх: 100% бавовна з просоченням. Утеплювач: синтепух 200 г/м².', care: CARE_TECH },
    { id: 18, slug: 'lupo', name: 'Lupo', title: 'Парка Lupo з хутром', kind: 'parka', span: 'long', flags: { fur: true, sale: true },
      price: 9600, oldPrice: 13200, colors: [c('Графіт', '#38383a', 'p-lupo')], sizes: SZ_INT, temp: '−30°',
      desc: 'Довга парка з об’ємним хутряним капюшоном і внутрішньою вітрозахисною планкою.',
      materials: 'Верх: 100% поліамід Taslan. Утеплювач: Thinsulate 250 г/м². Облямівка: штучне хутро.', care: CARE_TECH },
    { id: 19, slug: 'cammello', name: 'Cammello', title: 'Коротке пальто Cammello', kind: 'coat', span: 'short', flags: { new: true },
      price: 10900, colors: [c('Кемел', '#a9845a', 'p-cammello')], sizes: SZ_INT, temp: '−5°',
      desc: 'Укорочене пальто-бушлат з подвійним рядом ґудзиків і піджачним коміром.',
      materials: 'Верх: 80% вовна / 20% поліамід. Підкладка: 100% віскоза.', care: CARE_WOOL },
    { id: 20, slug: 'grafite', name: 'Grafite', title: 'Пальто Grafite', kind: 'coat', span: 'long', flags: {},
      price: 15900, colors: [c('Графіт', '#3a3a3c', 'p-grafite'), c('Беж', '#c2ad8f', 'p-grafite-beige')], sizes: SZ_INT, temp: '−10°',
      desc: 'Однобортне пальто прямого крою з потайною застібкою та розрізом ззаду.',
      materials: 'Верх: 90% вовна / 10% кашемір. Утеплювач: тонкий синтепон 60 г/м².', care: CARE_WOOL },
    { id: 21, slug: 'orso', name: 'Orso', title: 'Довга шуба Orso', kind: 'fur', span: 'long', flags: { fur: true },
      price: 14900, colors: [c('Карамель', '#8c6a4a', 'p-orso')], sizes: SZ_INT, temp: '−25°',
      desc: 'Довга шуба з густого штучного хутра з об’ємним коміром і кишенями у швах.',
      materials: 'Верх: 100% штучне хутро преміум (модакрил). Підкладка: 100% віскоза.', care: CARE_FUR },
    { id: 22, slug: 'volpe', name: 'Volpe', title: 'Шуба Volpe', kind: 'fur', span: 'short', flags: { fur: true, sale: true },
      price: 7900, oldPrice: 10900, colors: [c('Перлина', '#d8d0c4', 'p-volpe')], sizes: SZ_INT, temp: '−20°',
      desc: 'Коротка шуба з довгим ворсом, комір-стійка та гачки.',
      materials: 'Верх: 100% штучне хутро. Підкладка: 100% поліестер.', care: CARE_FUR },
    { id: 23, slug: 'nuvola', name: 'Nuvola', title: 'Жилетка Nuvola', kind: 'vest', span: 'long', flags: {},
      price: 6200, colors: [c('Молочний', '#ece4d6', 'p-nuvola'), c('Чорний', '#181818', 'p-nuvola-black')], sizes: SZ_INT, temp: '−5°',
      desc: 'Подовжена стьобана жилетка з коміром-стійкою і боковими розрізами.',
      materials: 'Верх: 100% поліамід. Наповнювач: біопух 200 г/м².', care: CARE_DOWN },
    { id: 24, slug: 'cacao', name: 'Cacao', title: 'Жилетка Cacao', kind: 'vest', span: 'short', flags: { sale: true },
      price: 3400, oldPrice: 4800, colors: [c('Какао', '#6e5444', 'p-cacao')], sizes: SZ_INT, temp: '0°',
      desc: 'Коротка жилетка з еко-хутра на кнопках.',
      materials: 'Верх: 100% штучне хутро. Підкладка: 100% поліестер.', care: CARE_FUR },
    { id: 25, slug: 'lana', name: 'Lana', title: 'Кардиган Lana', kind: 'cardigan', span: 'short', flags: { new: true },
      price: 3900, colors: [c('Димчасто-рожевий', '#c7a9a0', 'p-lana'), c('Сірий', '#9a9893', 'p-lana-grey')], sizes: SZ_INT, temp: '+10°',
      desc: 'Короткий кардиган із м’якого мохеру з перламутровими ґудзиками.',
      materials: '40% мохер / 40% поліамід / 20% вовна.', care: CARE_KNIT },
    { id: 26, slug: 'caramella', name: 'Caramella', title: 'Кардиган Caramella', kind: 'cardigan', span: 'long', flags: { sale: true },
      price: 3200, oldPrice: 4400, colors: [c('Карамель', '#b07f4f', 'p-caramella')], sizes: SZ_INT, temp: '+5°',
      desc: 'Довгий кардиган-пальто з поясом і шалевим коміром.',
      materials: '60% вовна / 40% акрил.', care: CARE_KNIT },
    { id: 27, slug: 'corsa', name: 'Corsa', title: 'Утеплений костюм Corsa', kind: 'suit', span: 'short', flags: { suit: true, new: true },
      price: 4900, colors: [c('Мокко', '#7b6656', 'p-corsa')], sizes: SZ_INT, temp: '0°',
      desc: 'Костюм з утепленого футеру: світшот оверсайз та штани-джогери.',
      materials: '70% бавовна / 30% поліестер, начос.', care: CARE_KNIT },
    { id: 28, slug: 'moto', name: 'Moto', title: 'Довга шкіряна куртка Moto', kind: 'jacket', span: 'long', flags: { leather: true },
      price: 22900, colors: [c('Чорний', '#121212', 'p-moto')], sizes: SZ_INT, temp: '−10°',
      desc: 'Подовжений шкіряний тренч з поясом і широкими лацканами.',
      materials: 'Верх: 100% натуральна шкіра. Підкладка: 100% віскоза.', care: CARE_LEATHER },
    { id: 29, slug: 'pelle', name: 'Pelle', title: 'Шкіряна куртка Pelle', kind: 'jacket', span: 'short', flags: { leather: true, sale: true },
      price: 10900, oldPrice: 14900, colors: [c('Тютюн', '#6a4a32', 'p-pelle')], sizes: SZ_INT, temp: '0°',
      desc: 'Коротка шкіряна сорочка-куртка з накладними кишенями.',
      materials: 'Верх: 100% натуральна шкіра. Підкладка: 100% бавовна.', care: CARE_LEATHER },
    { id: 30, slug: 'alpino', name: 'Alpino', title: 'Пуховик Alpino', kind: 'puffer', span: 'long', flags: { new: true },
      price: 18900, colors: [c('Чорний', '#141414', 'p-alpino'), c('Пісок', '#c6b394', 'p-alpino-sand')], sizes: SZ_INT, temp: '−35°',
      desc: 'Експедиційний пуховик з мембраною, регульованим капюшоном і термо-манжетами.',
      materials: 'Верх: мембрана 10 000 мм. Наповнювач: 95% гусячий пух / 5% перо, fill power 800.', care: CARE_DOWN },
    { id: 31, slug: 'stella', name: 'Stella', title: 'Пуховик Stella', kind: 'puffer', span: 'short', flags: { sale: true },
      price: 5900, oldPrice: 8400, colors: [c('Сірий', '#8f8d88', 'p-stella')], sizes: SZ_INT, temp: '−15°',
      desc: 'Короткий пуховик з круглим коміром і кишенями на кнопках.',
      materials: 'Верх: 100% поліамід. Наповнювач: синтепух 250 г/м².', care: CARE_DOWN }
  ];

  window.KINDS = {
    puffer: 'Пуховики', jacket: 'Куртки', parka: 'Парки', coat: 'Пальта',
    fur: 'Шуби', vest: 'Жилетки', cardigan: 'Кардигани', suit: 'Спортивні костюми'
  };
  window.KIND_ONE = {
    puffer: 'Пуховик', jacket: 'Куртка', parka: 'Парка', coat: 'Пальто',
    fur: 'Шуба', vest: 'Жилетка', cardigan: 'Кардиган', suit: 'Костюм'
  };

  /* Каталог, змінений в адмін-панелі (admin.html), має пріоритет над початковим. */
  window.PRODUCTS_DEFAULT = window.PRODUCTS;
  try {
    var saved = JSON.parse(localStorage.getItem('k7_admin_products') || 'null');
    if (Array.isArray(saved)) window.PRODUCTS = saved;
  } catch (e) { /* ignore */ }
  window.PRODUCTS_ALL = window.PRODUCTS;
  window.PRODUCTS = window.PRODUCTS.filter(function (p) { return !p.hidden && p.colors && p.colors.length; });
})();
