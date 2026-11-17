# Inventory — Orders & Products

SPA для учёта приходов (orders) и продуктов (products): список приходов с боковой панелью деталей, удаление через попап, каталог продуктов с фильтром по типу, живые дата/время и счётчик активных вкладок через WebSocket.

> Статус: основная функциональность готова (приходы, продукты, формы, JWT, REST и GraphQL API, i18n, аналитика с графиками и картой). Дополнительные возможности добавляются по этапам — см. [Roadmap](#roadmap).

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

| Команда               | Описание                         |
| --------------------- | -------------------------------- |
| `npm run dev`         | web и api в режиме разработки    |
| `npm run build`       | сборка всех приложений           |
| `npm run lint`        | ESLint во всех приложениях       |
| `npm run typecheck`   | проверка типов TypeScript        |
| `npm run test`        | тесты во всех приложениях        |
| `npm run format`      | Prettier                         |
| `npm run docker:up`   | собрать и запустить всё в Docker |
| `npm run docker:down` | остановить контейнеры            |

## REST API

Базовый URL: `http://localhost:4000/api`. Ошибки возвращаются в формате `{ "error": { "message", "details?" } }`.

| Метод    | Путь              | Описание                                                         |
| -------- | ----------------- | ---------------------------------------------------------------- |
| `GET`    | `/health`         | состояние API и БД                                               |
| `POST`   | `/auth/register`  | регистрация: `email`, `name`, `password`                         |
| `POST`   | `/auth/login`     | вход: `email`, `password`                                        |
| `POST`   | `/auth/refresh`   | новый access-токен по refresh-cookie (с ротацией)                |
| `POST`   | `/auth/logout`    | выход: отзыв refresh-сессии и очистка cookie                     |
| `GET`    | `/auth/me`        | текущий пользователь                                             |
| `GET`    | `/orders`         | приходы: количество продуктов, суммы в USD и UAH; `?search=`     |
| `GET`    | `/orders/:id`     | приход с продуктами                                              |
| `POST`   | `/orders`         | создать приход: `title`, `description?`, `date?`                 |
| `PATCH`  | `/orders/:id`     | изменить приход                                                  |
| `DELETE` | `/orders/:id`     | удалить приход вместе с продуктами                               |
| `GET`    | `/products`       | продукты с ценами и приходом; `?type=`, `?orderId=`, `?search=`  |
| `GET`    | `/products/types` | список типов для фильтра                                         |
| `GET`    | `/products/:id`   | продукт                                                          |
| `POST`   | `/products`       | создать продукт (валидация: гарантия, уникальные валюты, приход) |
| `DELETE` | `/products/:id`   | удалить продукт                                                  |

Коды ответов: `400` — ошибка валидации, `401` — нет или истёк access-токен, `404` — не найдено, `409` — дубликат (серийный номер, email), `422` — приход не существует, `429` — слишком много попыток входа.

### Аутентификация (JWT)

- Эндпоинты `/orders` и `/products` требуют заголовок `Authorization: Bearer <accessToken>`.
- **Access-токен** (HS256, 15 минут) возвращается в теле ответа и хранится только в памяти (Redux), не в `localStorage`, чтобы его нельзя было украсть через XSS.
- **Refresh-токен** (7 дней) лежит в `httpOnly`-cookie с `path=/api/auth`; в БД хранится только его SHA-256-хеш в таблице `refresh_sessions`. При каждом обновлении токен ротируется, при несовпадении хеша все сессии пользователя отзываются.
- Пароли хешируются bcrypt; при неверном email или пароле ответ одинаковый; `/login` и `/register` ограничены rate limit'ом.
- Клиент при `401` один раз вызывает `/auth/refresh` (параллельные запросы ждут один и тот же refresh) и повторяет запрос; при неудаче — выход на страницу входа.
- Переменные: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (обязательны в production, ≥ 32 символов), `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `COOKIE_SECURE` (`true` за HTTPS).

## GraphQL API

Эндпоинт: `POST http://localhost:4000/api/graphql` с тем же заголовком `Authorization: Bearer <accessToken>`. В режиме разработки по `GET` на этот адрес открывается Apollo Sandbox, introspection включена; в production оба отключены. Схема — [`apps/api/src/graphql/schema.ts`](apps/api/src/graphql/schema.ts).

- **Query:** `me`, `orders(search)`, `order(id)`, `products(type, search, orderId)`, `productTypes`.
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

Файл для MySQL Workbench: `docs/db-schema.mwb` (Database → Reverse Engineer по поднятой БД).

## Интерфейс

- **Вход и регистрация** (`/login`, `/register`) — без сессии любые страницы перенаправляют на вход и после него возвращают на исходную; сессия восстанавливается после перезагрузки по refresh-cookie.
- **TopMenu** — логотип, глобальный поиск (фильтрует приходы и продукты), счётчик активных вкладок через Socket.io, дата и время в реальном времени, имя пользователя и кнопка выхода.
- **NavigationMenu** — профиль и роут-ссылки на «Приход», «Продукты» и «Аналитика».
- **Приходы** (`/orders`, `/orders/:id`) — список с количеством продуктов, датами в двух форматах и суммой в USD/UAH. Клик по приходу открывает панель с его продуктами рядом со списком; состояние хранится в URL. Удаление прихода и продукта — через попап подтверждения.
- **Продукты** (`/products`) — все продукты с фильтром по типу: статус, гарантия, состояние, цены в двух валютах, группа, пользователь, приход.
- **Формы** — «+» рядом с заголовком создаёт приход, «Добавить продукт» в панели прихода добавляет продукт. Валидация на клиенте (React Hook Form + Zod: обязательные поля, формат серийного номера и цены, гарантия «по» не раньше «с») и на сервере; ошибки API (`400` по полям, `409` — серийный номер занят) показываются у соответствующих полей.
- **Аналитика** (`/dashboard`) — ключевые показатели, графики продуктов по статусам и типам, сумма приходов по месяцам (Recharts) и карта складов приходов (Leaflet + OpenStreetMap). У каждого графика есть табличное представление. Склад выбирается при создании прихода.
- **i18n** — русский и английский интерфейс (`apps/web/src/i18n/messages`), переключатель RU/EN в шапке и на страницах входа. Через словари переводятся тексты, сообщения валидации, склонения (ICU plural) и форматы дат и сумм.
- **WebStorage** — язык и фильтр по типу сохраняются в `localStorage` и синхронизируются между вкладками, поисковый запрос хранится в `sessionStorage` (только для текущей вкладки). Значения проверяются схемой при чтении.
- **Обновления в реальном времени (EDA)** — сервисы API публикуют доменные события (`order.created`, `product.deleted` и др.) во внутреннюю шину, Socket.io рассылает их вошедшим пользователям (сокет авторизуется access-токеном). На клиенте событие становится Redux-действием, а listener middleware сбрасывает нужные теги кеша RTK Query: списки, панель прихода и аналитика обновляются без перезагрузки во всех вкладках и у всех пользователей.
- **Web Worker** — статистика для страницы аналитики считается в отдельном воркере (`apps/web/src/workers`), главный поток не блокируется; без поддержки воркеров расчёт идёт в основном потоке.
- **PWA** — манифест (`/manifest.webmanifest`), иконки, service worker (`public/sw.js`, регистрируется только в production): статические чанки кешируются, страницы открываются по схеме «сначала сеть», без сети показывается `offline.html`. Приложение можно установить из браузера.
- **Lazy loading** — диалоги, графики и карта подгружаются отдельными чанками через `next/dynamic`.
- Анимации: переход между роутами, выезд панели прихода, появление попапа и строк списков.
- Стили: Bootstrap 5 + SCSS-блоки по БЭМ в `apps/web/src/styles/blocks`.
- Состояние: Redux Toolkit (UI-фильтры, сессии) и RTK Query (данные API с инвалидацией кеша).

## Git-flow

`main` — стабильные релизы, `develop` — интеграция, `feature/*` — отдельные задачи, вливаются в `develop` через merge.

## Roadmap

- [x] Инфраструктура: монорепо, Docker, CI, линтеры
- [x] Схема БД, миграции, сиды
- [x] REST API приходов и продуктов
- [x] JWT-аутентификация
- [x] Счётчик активных вкладок (Socket.io)
- [x] Layout: TopMenu, NavigationMenu, переходы роутов
- [x] Orders: список, панель деталей, удаление с попапом
- [x] Products: список, фильтр по типу
- [x] Формы с валидацией
- [x] GraphQL (требование «Graph (на ваш выбор)»)
- [x] i18n, lazy loading, WebStorage, charts, maps
- [x] WebWorkers, PWA, event-driven обновления
- [ ] Unit, интеграционные и e2e тесты
- [ ] Деплой на VDS
