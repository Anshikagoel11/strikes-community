FROM oven/bun:1 AS base

# Builder stage
FROM base AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build --filter=@repo/socket-server

# Runner stage
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/socket-server/dist ./apps/socket-server/dist
COPY --from=builder /app/apps/socket-server/package.json ./apps/socket-server/package.json
# Copy workspace packages that socket-server depends on
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/socket-server
EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
