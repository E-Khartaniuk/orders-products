# Single-container image (web + API on one origin) for free PaaS hosting such as Render.
# Local development and the full stack use docker-compose.yml with separate images.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts
COPY apps/api apps/api
COPY apps/web apps/web
RUN npm run build -w @op/api
ENV NEXT_PUBLIC_API_SAME_ORIGIN=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @op/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/.next/standalone ./web
COPY --from=build /app/apps/web/.next/static ./web/apps/web/.next/static
COPY --from=build /app/apps/web/public ./web/apps/web/public
COPY scripts/start-single.sh ./start-single.sh
ENV UPLOADS_DIR=/app/apps/api/uploads
EXPOSE 10000
CMD ["sh", "/app/start-single.sh"]
