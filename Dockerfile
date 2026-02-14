FROM oven/bun:1-slim AS builder

WORKDIR /app
COPY . .

RUN bun install && bun run db:generate

EXPOSE 3000

CMD ["bun", "run dev"]
