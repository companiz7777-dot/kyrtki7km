/* Налаштування підключення до бази (Supabase).
   Поки поля порожні — сайт бере товари з js/data.js, а адмінка працює в демо-режимі лише на localhost.
   anonKey — публічний ключ (його можна тримати в коді: доступ обмежують правила бази RLS).
   Секретний service_role ключ сюди НІКОЛИ не вставляти. */
window.K7_CONFIG = {
  supabaseUrl: 'https://pwymtprtgwqbcxivlsvi.supabase.co',        // https://xxxx.supabase.co
  supabaseAnonKey: 'sb_publishable_r0oFW9o5LeB_032pu4OMOg_aHiTIJou',    // Project Settings → API → anon public
  roundTo: 10,            // округлення ціни в гривнях: 10, 50 або 100
  defaultRate: 41.5,      // стартовий курс, поки адміністратор не встановив свій
};
