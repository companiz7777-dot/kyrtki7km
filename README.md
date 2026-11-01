# KURTKI 7KM

Чернетка інтернет-магазину верхнього одягу (статичний сайт, без збірки).

- `index.html`, `css/style.css`, `js/app.js` — вітрина
- `js/data.js` — каталог товарів
- `admin.html`, `css/admin.css`, `js/admin.js` — адмін-панель (пароль за замовчуванням `kurtki7km`)
- `img/` — фото товарів
- `incoming/` — сюди завантажуються нові фото; `tools/process_photos.py` стискає їх у `img/new/`
- `.github/workflows/pages.yml` — автопублікація на GitHub Pages після кожної зміни

Сайт закритий від пошукових систем (`robots.txt`, `_headers`, meta robots) — прибрати перед запуском.
