FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace=@proativa/api --include-workspace-root --no-audit --no-fund

FROM deps AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://schema-only:schema-only@localhost:5432/schema-only
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npx prisma generate && npx tsc -p tsconfig.build.json

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/dist
COPY --from=build /app/apps/api/prisma /app/prisma
COPY --from=build /app/apps/api/prisma.config.ts /app/prisma.config.ts
COPY --from=build /app/apps/api/package.json /app/package.json
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && mkdir -p /app/private-documents
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
