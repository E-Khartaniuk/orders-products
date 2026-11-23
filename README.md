# Inventory — Orders & Products

SPA для учёта приходов (orders) и продуктов (products): список приходов с боковой панелью деталей, удаление через попап, каталог продуктов с фильтрами по типу, спецификации, статусу и состоянию, живые дата/время и счётчик активных вкладок через WebSocket.

**Демо:** https://orders-products-pjf6.onrender.com — вход `demo@inventory.local` / `demo12345`. Бесплатный хостинг засыпает без запросов, поэтому первый заход может занять около минуты (см. [Деплой](#деплой)).

> Статус: v1.1.0 — все пункты задания выполнены, см. [Roadmap](#roadmap).

## Стек

| Слой          | Технологии                                                  |
| ------------- | ----------------------------------------------------------- |
| Frontend      | Next.js (App Router, SSR), React, TypeScript, Redux Toolkit |
| UI-библиотеки | use-intl (i18n), Recharts (графики), Leaflet (карта)        |
| Стили         | Bootstrap 5, SCSS, БЭМ                                      |
| Backend       | Node.js, Express, Apollo Server (GraphQL), Socket.io, Zod   |
| БД            | MySQL 8.4, Prisma ORM                                       |
| Инфра         | Docker, Docker Compose, GitHub Actions, Husky + lint-staged |

## Структура

```
apps/
  api/            Express API, Socket.io, Prisma (схема, миграции, сиды)
  web/            Next.js приложение
docs/             схема БД для MySQL Workbench
docker-compose.yml
```

## Требования

- Node.js 22+ и npm 10+
- Docker Desktop (или Docker Engine + Compose v2)

## Быстрый старт в Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npx prisma db seed
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/health
- Демо-вход: `demo@inventory.local` / `demo12345` (создаётся сидом, меняется через `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`)

Проверить запущенный стенд: `npm run smoke` — здоровье API и БД, вход демо-пользователем, приходы, продукты, GraphQL, отказ без токена, страница входа и PWA-манифест. Тот же сценарий запускается в CI: GitHub Actions собирает образы, поднимает `docker compose` и ждёт healthcheck всех сервисов.

Остановить: `docker compose down` (с удалением данных БД: `docker compose down -v`).

## Локальная разработка

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up                         # только MySQL в Docker
npm run db:generate -w @op/api        # Prisma Client
npm run db:migrate                    # применить миграции
npm run db:seed                       # 25 приходов с продуктами
npm run dev                           # web :3000 + api :4000
```

## Скрипты

| Команда                             | Описание                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`                       | web и api в режиме разработки (`dev:web`, `dev:api` — по отдельности)                |
| `npm run build`                     | production-сборка всех приложений                                                    |
| `npm run check`                     | всё, что проверяет CI: форматирование, иконки, ESLint, типы, тесты                   |
| `npm run lint`                      | ESLint во всех приложениях                                                           |
| `npm run typecheck`                 | проверка типов TypeScript                                                            |
| `npm run test`                      | unit-тесты во всех приложениях                                                       |
| `npm run test:integration`          | интеграционные тесты API на реальной MySQL (см. «Тесты»)                             |
| `npm run test:e2e`                  | e2e-тесты Playwright на запущенном стенде (см. «Тесты»)                              |
| `npm run smoke`                     | smoke-проверка запущенного стенда                                                    |
| `npm run format` / `format:check`   | Prettier: исправить / проверить                                                      |
| `npm run icons` / `icons:check`     | пересобрать CSS иконок по использованным `bi-*` классам / проверить, что он актуален |
| `npm run analyze`                   | интерактивный анализ состава бандла фронтенда (`next analyze`)                       |
| `npm run db:up`                     | поднять только MySQL в Docker                                                        |
| `npm run db:generate`               | сгенерировать Prisma Client                                                          |
| `npm run db:migrate` / `db:deploy`  | миграции: создать в разработке / применить                                           |
| `npm run db:seed`                   | заполнить БД тестовыми данными                                                       |
| `npm run docker:up` / `docker:down` | собрать и запустить всё в Docker / остановить                                        |

## Тесты

| Уровень              | Где                           | Что проверяет                                                                                                                                                                                                                 |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                 | `apps/*/src`, `apps/api/test` | схемы валидации, форматирование, редьюсеры и middleware, Web Worker, service worker; API — роуты с замоканным Prisma                                                                                                          |
| Интеграционные       | `apps/api/integration`        | API, Prisma и Socket.io вместе на реальной MySQL: JWT-ротация и отзыв сессий, каскадное удаление с файлами фото, уникальные индексы, GraphQL, доменные события и счётчик вкладок                                              |
| E2E (функциональные) | `e2e/`                        | Playwright в Chromium: вход и регистрация с валидацией, создание прихода и продукта, удаление с попапом, поиск, фильтр продуктов с сохранением, смена языка у пользователя, счётчик вкладок, обновления без перезагрузки, PWA |

Интеграционные тесты работают только с отдельной базой, имя которой оканчивается на `_test`; миграции применяются автоматически, данные очищаются перед каждым тестом:

```bash
TEST_DATABASE_URL=mysql://root:root@localhost:3306/inventory_test npm run test:integration
```

E2E-тесты запускаются на поднятом стенде (по умолчанию web — `http://localhost:3000`, API — `http://localhost:4000`; меняются через `E2E_BASE_URL` и `E2E_API_URL`). Каждый тест регистрирует своего пользователя, поэтому для API нужен `AUTH_RATE_LIMIT` больше 20:

```bash
npx playwright install chromium
npm run test:e2e
```

В CI все три уровня запускаются на каждый PR: unit — в job `check`, интеграционные — с MySQL в service-контейнере, e2e — дважды: на стенде из `docker compose` и на образе одного контейнера для деплоя (см. [Деплой](#деплой)).

## Оптимизация фронтенда

Замеры на production-сборке, страница «Продукты» (108 строк):

|                               | До                | После                |
| ----------------------------- | ----------------- | -------------------- |
| CSS                           | 339 КБ            | 115 КБ               |
| Шрифты                        | 187 КБ            | 56 КБ                |
| `zod` в коде страниц без форм | загружался всегда | только в чанках форм |

- **Bootstrap** подключается из SCSS только нужными частями (reboot, формы, таблицы, хелперы и используемые утилиты) вместо полного `bootstrap.min.css`.
- **Иконки**: вместо шрифта Bootstrap Icons (134 КБ) и его CSS (116 КБ) скрипт `npm run icons` собирает CSS с SVG-масками только тех ~45 иконок, что встречаются в коде; CI проверяет, что файл актуален.
- **Code splitting**: диалоги загружают свой код только при первом открытии; графики, карта и Web Worker — отдельные чанки; `zod` убран из общего бандла (настройки из Web Storage проверяются без схем).
- **Анимации**: `motion` подключён через `LazyMotion`, возможности анимаций загружаются отдельным чанком.
- **Данные**: детали прихода подгружаются при наведении на строку, поэтому панель открывается без ожидания; поиск дебаунсится, RTK Query кеширует и инвалидирует данные по тегам.
- Рендер списка из 108 продуктов при смене фильтра занимает ~30 мс без длинных задач, поэтому виртуализация списка не добавлялась.

## REST API

Базовый URL: `http://localhost:4000/api`. Ошибки возвращаются в формате `{ "error": { "message", "details?" } }`.

| Метод    | Путь                       | Описание                                                                                                                                    |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/health`                  | состояние API и БД                                                                                                                          |
| `POST`   | `/auth/register`           | регистрация: `email`, `name`, `password`                                                                                                    |
| `POST`   | `/auth/login`              | вход: `email`, `password`                                                                                                                   |
| `POST`   | `/auth/refresh`            | новый access-токен по refresh-cookie (с ротацией)                                                                                           |
| `POST`   | `/auth/logout`             | выход: отзыв refresh-сессии и очистка cookie                                                                                                |
| `GET`    | `/auth/me`                 | текущий пользователь                                                                                                                        |
| `GET`    | `/orders`                  | приходы: количество продуктов, суммы в USD и UAH; `?search=`                                                                                |
| `GET`    | `/orders/:id`              | приход с продуктами                                                                                                                         |
| `POST`   | `/orders`                  | создать приход: `title`, `description?`, `date?`                                                                                            |
| `PATCH`  | `/orders/:id`              | изменить приход                                                                                                                             |
| `DELETE` | `/orders/:id`              | удалить приход вместе с продуктами                                                                                                          |
| `GET`    | `/products`                | продукты с ценами и приходом; `?type=`, `?specification=`, `?status=FREE\|IN_REPAIR\|IN_USE`, `?isNew=true\|false`, `?orderId=`, `?search=` |
| `GET`    | `/products/types`          | список типов для фильтра                                                                                                                    |
| `GET`    | `/products/specifications` | список спецификаций для фильтра; `?type=` — только для этого типа                                                                           |
| `GET`    | `/products/:id`            | продукт                                                                                                                                     |
| `POST`   | `/products`                | создать продукт (валидация: гарантия, уникальные валюты, приход)                                                                            |
| `DELETE` | `/products/:id`            | удалить продукт                                                                                                                             |

Коды ответов: `400` — ошибка валидации, `401` — нет или истёк access-токен, `404` — не найдено, `409` — дубликат (серийный номер, email), `422` — приход не существует, `429` — слишком много попыток входа.

### Аутентификация (JWT)

- Эндпоинты `/orders` и `/products` требуют заголовок `Authorization: Bearer <accessToken>`.
- **Access-токен** (HS256, 15 минут) возвращается в теле ответа и хранится только в памяти (Redux), не в `localStorage`, чтобы его нельзя было украсть через XSS.
- **Refresh-токен** (7 дней) лежит в `httpOnly`-cookie с `path=/api/auth`; в БД хранится только его SHA-256-хеш в таблице `refresh_sessions`. При каждом обновлении токен ротируется внутри той же сессии, поэтому повторное предъявление уже использованного токена (признак кражи) отзывает все сессии пользователя.
- Пароли хешируются bcrypt; при неверном email или пароле ответ одинаковый; `/login` и `/register` ограничены rate limit'ом.
- Клиент при `401` один раз вызывает `/auth/refresh` (параллельные запросы ждут один и тот же refresh) и повторяет запрос; при неудаче — выход на страницу входа. Вкладки обновляют токен по очереди через Web Locks API, чтобы не предъявить уже ротированную cookie.
- Лимит попыток входа и регистрации — `AUTH_RATE_LIMIT` (по умолчанию 20 за 15 минут).

### Профиль

- `PATCH /api/profile` — сменить имя и/или язык интерфейса.
- `PUT /api/profile/avatar` (multipart, поле `avatar`) — загрузить фото: PNG, JPEG или WebP до 2 МБ, тип проверяется по сигнатуре файла. `DELETE /api/profile/avatar` — удалить фото. Файлы раздаются по `/uploads/...` и в Docker хранятся в томе `api-uploads` (`UPLOADS_DIR`, `IMAGE_MAX_BYTES`).
- `PUT /api/products/:id/photo` (multipart, поле `photo`) и `DELETE /api/products/:id/photo` — загрузить или удалить фото продукта; файлы удаляются и при удалении продукта или прихода.
- `PUT /api/auth/password` — сменить пароль (нужен текущий); остальные сессии пользователя завершаются.

- Переменные: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (обязательны в production, ≥ 32 символов), `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `COOKIE_SECURE` (`true` за HTTPS).

## GraphQL API

Эндпоинт: `POST http://localhost:4000/api/graphql` с тем же заголовком `Authorization: Bearer <accessToken>`. В режиме разработки по `GET` на этот адрес открывается Apollo Sandbox, introspection включена; в production оба отключены. Схема — [`apps/api/src/graphql/schema.ts`](apps/api/src/graphql/schema.ts).

- **Query:** `me`, `orders(search)`, `order(id)`, `products(type, specification, status, isNew, search, orderId)`, `productTypes`, `productSpecifications(type)`.
- **Mutation:** `createOrder`, `deleteOrder`, `createProduct`, `deleteProduct`.
- Резолверы используют те же сервисы и Zod-схемы, что и REST, поэтому бизнес-логика и валидация общие.
- `Order.products` загружается через DataLoader: запрос списка приходов с продуктами выполняет один SQL-запрос на все приходы вместо N.
- Ошибки возвращаются с `extensions.code`: `UNAUTHENTICATED` (HTTP 401, чтобы клиент обновил токен), `BAD_USER_INPUT` (с `details` по полям), `NOT_FOUND`, `CONFLICT`; внутренние ошибки маскируются.
- Во фронтенде через GraphQL загружается панель деталей прихода (`OrderDetails` с фрагментом `ProductFields`), остальное — через REST.

```graphql
query OrderDetails($id: ID!) {
  order(id: $id) {
    title
    productsCount
    totals {
      symbol
      value
    }
    products {
      title
      status
      prices {
        symbol
        value
      }
    }
  }
}
```

## База данных

Схема описана в [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma): `orders` (с координатами склада: `city`, `latitude`, `longitude`), `products`, `prices` (цена продукта в USD и UAH), `product_groups`, `users`, `refresh_sessions`.

Модель для MySQL Workbench 8.0: [`docs/db-schema.mwb`](docs/db-schema.mwb), схема `inventory` с EER-диаграммой. Получена из БД после `prisma migrate deploy`, служебная таблица `_prisma_migrations` не включена.

```mermaid
erDiagram
    orders ||--o{ products : "order_id (CASCADE)"
    product_groups |o--o{ products : "group_id (SET NULL)"
    users |o--o{ products : "user_id (SET NULL)"
    products ||--o{ prices : "product_id (CASCADE)"
    users ||--o{ refresh_sessions : "user_id (CASCADE)"

    orders {
        int id PK
        varchar title
        text description
        datetime date
        datetime created_at
        varchar city
        double latitude
        double longitude
    }
    products {
        int id PK
        varchar serial_number UK
        tinyint is_new
        varchar photo
        varchar title
        varchar type "index"
        varchar specification
        enum status "FREE, IN_REPAIR, IN_USE"
        datetime guarantee_start
        datetime guarantee_end
        datetime date
        int order_id FK
        int group_id FK
        int user_id FK
    }
    prices {
        int id PK
        decimal value
        enum symbol "USD, UAH; unique with product_id"
        tinyint is_default
        int product_id FK
    }
    product_groups {
        int id PK
        varchar title
    }
    users {
        int id PK
        varchar email UK
        varchar password_hash
        varchar name
        varchar avatar_url
        varchar locale
        datetime created_at
    }
    refresh_sessions {
        varchar id PK "uuid"
        char token_hash "sha256"
        varchar user_agent
        datetime expires_at
        datetime created_at
        int user_id FK
    }
```

## Интерфейс

- **Вход и регистрация** (`/login`, `/register`) — без сессии любые страницы перенаправляют на вход и после него возвращают на исходную; сессия восстанавливается после перезагрузки по refresh-cookie.
- **TopMenu** — логотип, глобальный поиск (фильтрует приходы и продукты), счётчик активных вкладок через Socket.io, дата и время в реальном времени, имя пользователя и кнопка выхода.
- **NavigationMenu** — фото профиля, шестерёнка открывает настройки; ссылки на «Приход», «Продукты», «Пользователи», «Настройки» и «Аналитика».
- **Настройки** (`/settings`) — фото профиля (загрузка и удаление), имя, email только для чтения, смена пароля, язык интерфейса.
- **Пользователи** (`/users`) — пока заглушка «Раздел в разработке».
- **Приходы** (`/orders`, `/orders/:id`) — список с количеством продуктов, датами в двух форматах и суммой в USD/UAH. Клик по приходу открывает панель с его продуктами рядом со списком; состояние хранится в URL. Удаление прихода и продукта — через попап подтверждения.
- **Продукты** (`/products`) — все продукты с фильтрами по типу, спецификации (список зависит от выбранного типа), статусу и состоянию (новый / б/у). В строке: тип, статус, гарантия в двух форматах, состояние, цены в двух валютах, группа и пользователь (на широком экране), приход.
- **Фото продукта** — у продукта без фото показывается иконка по его типу (монитор, ноутбук, клавиатура и т.д., распознаются русские и английские названия). Клик по миниатюре открывает окно, где фото можно загрузить, заменить или удалить; фото можно приложить и сразу при добавлении продукта.
- **Формы** — «+» рядом с заголовком создаёт приход, «Добавить продукт» в панели прихода добавляет продукт. Валидация на клиенте (React Hook Form + Zod: обязательные поля, формат серийного номера и цены, гарантия «по» не раньше «с») и на сервере; ошибки API (`400` по полям, `409` — серийный номер занят) показываются у соответствующих полей.
- **Аналитика** (`/dashboard`) — ключевые показатели, графики продуктов по статусам и типам, сумма приходов по месяцам (Recharts) и карта складов приходов (Leaflet + OpenStreetMap). У каждого графика есть табличное представление. Склад выбирается при создании прихода.
- **i18n** — русский и английский интерфейс (`apps/web/src/i18n/messages`), переключатель RU/EN в шапке и на страницах входа. Через словари переводятся тексты, сообщения валидации, склонения (ICU plural) и форматы дат и сумм. Выбранный язык хранится в профиле пользователя (`users.locale`): после входа включается язык из профиля, а переключение сохраняется на сервер.
- **WebStorage** — язык и фильтры продуктов сохраняются в `localStorage` и синхронизируются между вкладками, поисковый запрос хранится в `sessionStorage` (только для текущей вкладки). Значения проверяются схемой при чтении.
- **Обновления в реальном времени (EDA)** — сервисы API публикуют доменные события (`order.created`, `product.deleted` и др.) во внутреннюю шину, Socket.io рассылает их вошедшим пользователям (сокет авторизуется access-токеном). На клиенте событие становится Redux-действием, а listener middleware сбрасывает нужные теги кеша RTK Query: списки, панель прихода и аналитика обновляются без перезагрузки во всех вкладках и у всех пользователей.
- **Web Worker** — статистика для страницы аналитики считается в отдельном воркере (`apps/web/src/workers`), главный поток не блокируется; без поддержки воркеров расчёт идёт в основном потоке.
- **PWA** — манифест (`/manifest.webmanifest`), иконки, service worker (`public/sw.js`, регистрируется только в production): статические чанки кешируются, страницы открываются по схеме «сначала сеть», без сети показывается `offline.html`. Приложение можно установить из браузера.
- **Lazy loading** — диалоги, графики и карта подгружаются отдельными чанками через `next/dynamic`.
- Анимации: переход между роутами, выезд панели прихода, появление попапа и строк списков.
- Стили: Bootstrap 5 + SCSS-блоки по БЭМ в `apps/web/src/styles/blocks`.
- Состояние: Redux Toolkit (UI-фильтры, сессии) и RTK Query (данные API с инвалидацией кеша).

## Деплой

Демо развёрнуто бесплатно: приложение на [Render](https://render.com) (free web service), база — MySQL 8 на [Aiven](https://aiven.io) (free plan).

Для этого есть отдельный образ — корневой [`Dockerfile`](Dockerfile): web и API в одном контейнере, на одном домене. Express отдаёт `/api`, `/uploads` и Socket.io, остальные запросы проксирует на Next.js (`WEB_PROXY_TARGET`). Один домен нужен, чтобы refresh-cookie, WebSocket и service worker работали без кросс-доменных настроек. При старте ([`scripts/start-single.sh`](scripts/start-single.sh)) применяются миграции, а сид заполняет базу, только если она пустая. `docker compose` для локального запуска не меняется.

Ограничения бесплатного тарифа:

- после 15 минут без запросов сервис засыпает, первый запрос после этого идёт около минуты;
- диск временный: загруженные фото пропадают при перезапуске или новом деплое (данные в MySQL сохраняются).

Как развернуть свою копию:

1. **Aiven** → Create service → MySQL, план Free, регион в Европе. На странице сервиса скопировать Service URI и скачать CA certificate.
2. **Render** → New → Blueprint → выбрать этот репозиторий. Render прочитает [`render.yaml`](render.yaml) и попросит значения:
   - `DATABASE_URL` — Service URI из Aiven как есть (`mysql://avnadmin:…@…aivencloud.com:PORT/defaultdb?ssl-mode=REQUIRED`);
   - `DATABASE_SSL_CA` — содержимое CA-сертификата целиком, вместе со строками `BEGIN`/`END`.

   JWT-секреты Render сгенерирует сам.

3. После сборки приложение откроется по адресу `https://<имя-сервиса>.onrender.com`. Вход: `demo@inventory.local` / `demo12345`. Новые коммиты в `main` деплоятся автоматически.

## Git-flow

`main` — стабильные релизы (деплоятся на Render), `develop` — интеграция. `feature/*` и `fix/*` — отдельные задачи и исправления, вливаются в `develop` через pull request; `release/*` — подготовка версии перед слиянием в `main`.

## Roadmap

- [x] Инфраструктура: монорепо, Docker, CI, линтеры
- [x] Схема БД, миграции, сиды
- [x] REST API приходов и продуктов
- [x] JWT-аутентификация
- [x] Счётчик активных вкладок (Socket.io)
- [x] Layout: TopMenu, NavigationMenu, переходы роутов
- [x] Orders: список, панель деталей, удаление с попапом
- [x] Products: список, фильтры по типу, спецификации, статусу и состоянию
- [x] Формы с валидацией
- [x] GraphQL (требование «Graph (на ваш выбор)»)
- [x] i18n, lazy loading, WebStorage, charts, maps
- [x] WebWorkers, PWA, event-driven обновления
- [x] Unit, интеграционные и e2e тесты
