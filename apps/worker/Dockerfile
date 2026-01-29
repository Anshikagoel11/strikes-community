FROM oven/bun:1 AS base

# Builder stage
FROM base AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build --filter=@repo/worker

# Runner stage
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/package.json .\
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
# Copy workspace packages that worker depends on
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/worker
CMD ["bun", "run", "dist/index.js"]
