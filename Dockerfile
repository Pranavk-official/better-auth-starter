# Production image: build the app, then serve the built output.

# --- deps: install all deps (build needs prisma + dev tooling) ---
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- build: generate Prisma client + compile Next ---
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compilation never touches the DB; a dummy URL satisfies any env reads.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
# `build` script = prisma generate && next build
RUN bun run build

# --- runner: serve the built app ---
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# node_modules carries the generated Prisma client + prisma CLI for migrations.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
# Apply pending migrations, then start the production server.
CMD ["sh", "-c", "bun run db:deploy && bun run start"]
