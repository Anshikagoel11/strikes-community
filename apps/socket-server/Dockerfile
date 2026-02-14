FROM oven/bun:1-slim AS builder
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @repo/socket-server --docker

FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV HUSKY=0
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
RUN bun install --production
COPY --from=builder /app/out/full/ .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "apps/socket-server/src/index.ts"]