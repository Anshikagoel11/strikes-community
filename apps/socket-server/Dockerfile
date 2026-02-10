FROM oven/bun:1-slim AS builder
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @repo/socket-server --docker

FROM oven/bun:1-slim AS runner
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/out/full/ .

ENV NODE_ENV=production
EXPOSE 8080
CMD ["bun", "apps/socket-server/src/index.ts"]
