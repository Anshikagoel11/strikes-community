FROM oven/bun:1-slim AS builder
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @repo/web --docker

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN bun turbo db:generate && bun turbo build --filter=@repo/web

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY --from=runner /app/apps/web/public ./apps/web/public
COPY --from=runner /app/apps/web/.next/standalone ./
COPY --from=runner /app/apps/web/.next/static ./apps/web/.next/static

CMD ["bun", "apps/web/server.js"]
