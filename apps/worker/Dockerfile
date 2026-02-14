FROM oven/bun:1-slim AS builder
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @repo/worker --docker

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
RUN bun install
COPY --from=builder /app/out/full/ .

RUN bun turbo db:generate

ENV NODE_ENV=production
CMD ["bun", "apps/worker/src/index.ts"]
