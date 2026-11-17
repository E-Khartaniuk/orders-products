# Inventory — Orders & Products

SPA для учёта приходов (orders) и продуктов (products): список приходов с боковой панелью деталей, удаление через попап, каталог продуктов с фильтром по типу, живые дата/время и счётчик активных вкладок через WebSocket.

> Статус: каркас проекта (инфраструктура, схема БД, API skeleton). Функциональность добавляется по этапам — см. [Roadmap](#roadmap).

## Стек

| Слой     | Технологии                                                  |
| -------- | ----------------------------------------------------------- |
| Frontend | Next.js (App Router, SSR), React, TypeScript, Redux Toolkit |
| Стили    | Bootstrap 5, SCSS, БЭМ                                      |
| Backend  | Node.js, Express, Socket.io, Zod                            |
| БД       | MySQL 8.4, Prisma ORM                                       |
| Инфра    | Docker, Docker Compose, GitHub Actions, Husky + lint-staged |

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
| `npm run format`      | Prettier                         |
| `npm run docker:up`   | собрать и запустить всё в Docker |
| `npm run docker:down` | остановить контейнеры            |

## База данных

Схема описана в [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma): `orders`, `products`, `prices` (цена продукта в USD и UAH), `product_groups`, `users`.

Файл для MySQL Workbench: `docs/db-schema.mwb` (Database → Reverse Engineer по поднятой БД).

## Git-flow

`main` — стабильные релизы, `develop` — интеграция, `feature/*` — отдельные задачи, вливаются в `develop` через merge.

## Roadmap

- [x] Инфраструктура: монорепо, Docker, CI, линтеры
- [x] Схема БД, миграции, сиды
- [ ] REST API приходов и продуктов
- [ ] JWT-аутентификация
- [ ] Счётчик активных вкладок (Socket.io)
- [ ] Layout: TopMenu, NavigationMenu, переходы роутов
- [ ] Orders: список, панель деталей, удаление с попапом
- [ ] Products: список, фильтр по типу
- [ ] Формы с валидацией
- [ ] GraphQL
- [ ] i18n, lazy loading, WebStorage, charts, maps
- [ ] Graph, WebWorkers, PWA, event-driven обновления
- [ ] Unit, интеграционные и e2e тесты
- [ ] Деплой на VDS
