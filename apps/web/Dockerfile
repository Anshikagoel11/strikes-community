FROM oven/bun:1 AS base

# Builder stage
FROM base AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build --filter=@repo/web

# Runner stage
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/turbo.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT 3000
CMD ["node", "apps/web/server.js"]
