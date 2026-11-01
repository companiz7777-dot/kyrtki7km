# KURTKI 7KM

Інтернет-магазин верхнього одягу (статичний сайт, без збірки).

- `index.html`, `css/style.css`, `js/app.js`, `js/catalog.js`: вітрина
- `js/data.js`: каталог товарів (резерв, поки Supabase не налаштовано)
- `js/config.js`: адреса Supabase і публічний ключ (anon/publishable). Секретний service_role ключ сюди не класти
- `admin/`: адмін-панель (вхід через Supabase Auth)
- `supabase/`: схема бази й інструкція з налаштування
- `img/`, `video/`: фото й відео сайту
- `eskizy/`: вихідні фото й ескізи (не публікуються на сайті)
- `.github/workflows/pages.yml`: автопублікація на GitHub Pages після кожної зміни в main

Сайт закритий від пошукових систем (`robots.txt`, `_headers`, meta robots), це треба прибрати перед запуском.
