<div align="center">
  <img src="apps/web/public/logo/256-mac.png" alt="Logo" width="100" height="100">
  <h1>Strikes Community</h1>
  <p>A full-stack real-time communication platform built with Next.js, Socket.io, Prisma, and modern web technologies.</p>
</div>

## Project Demo

https://github.com/user-attachments/assets/3c878653-6de9-4d44-b264-da32c0b494a7

## Project Architecture

<img width="4958" height="2556" alt="Strikes Community Architecture" src="https://github.com/user-attachments/assets/291cbbbf-6ce1-4181-a17f-7bc99b476806" />

## Detailed Documentation

For comprehensive documentation and detailed information about the project, visit:
[Strikes Community Documentation](https://www.notion.so/arbazansari/2e623f37737480f79067ea159894c7cb)

## Features

- **Real-time Messaging**: Socket.io powered chat with message caching (Redis)
- **Servers & Channels**: Create and customize servers with Text, Audio, and Video channels
- **Authentication**: Secure login and user management via Clerk
- **File Uploads**: Image and PDF sharing using UploadThing
- **Video/Audio Calls**: Integrated LiveKit for voice and video communication
- **AI Integration**: Google Gemini AI for enhanced features
- **Responsive Design**: Modern UI with Light/Dark mode support
- **Message Queue**: Kafka-based event-driven architecture
- **Microservices**: Modular architecture with dedicated services

## Tech Stack

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn/ui
- **State Management**: Zustand & React Query (TanStack Query)
- **UI Components**: Radix UI
- **Authentication**: Clerk

### Backend
- **Database**: PostgreSQL (Prisma ORM)
- **Real-time**: Socket.io
- **Message Queue**: Kafka
- **Cache & Session**: Redis
- **Video/Audio**: LiveKit
- **AI**: Google Gemini (LangChain)

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Package Manager**: Bun

## Project Structure

```
strikes-community/
├── apps/
│   ├── web/              # Next.js frontend application
│   ├── socket-server/    # Socket.io server for real-time communication
│   └── worker/           # Kafka consumer worker service
├── packages/
│   ├── db/              # Prisma database package
│   ├── kafka/           # Kafka client package
│   ├── redis/           # Redis client package
│   ├── eslint-config/   # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
└── docker/
    └── nginx/           # Nginx configuration
```

## Getting Started

### Prerequisites

- **Bun** >= 1.0.0
- **Node.js** >= 18.0.0
- **PostgreSQL** (or use Prisma with your preferred database)
- **Redis** (for caching and session management)
- **Kafka** (for message queue)
- **Docker** (optional, for containerized setup)

### 1. Clone the repository

```bash
git clone https://github.com/ErArbazAnsari/strikes-community.git
cd strikes-community
code .
```

### 2. Install dependencies

```bash
bun install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```bash
cp .env.example .env
```

**Required environment variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `REDIS_CACHE_URL` - Redis cache connection string
- `KAFKA_BROKER` - Kafka broker URL
- `KAFKA_USERNAME` - Kafka username
- `KAFKA_PASSWORD` - Kafka password
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `UPLOADTHING_TOKEN` - UploadThing API token
- `NEXT_PUBLIC_LIVEKIT_URL` - LiveKit server URL
- `LIVEKIT_API_KEY` - LiveKit API key
- `LIVEKIT_API_SECRET` - LiveKit API secret
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API key
- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL

Refer to `.env.example` for complete list and documentation.

### 4. Setup Database

Start the services with Docker and setup the database:

```bash
docker compose up --build
bun run db:generate
bun run db:push
```

Or run migrations (recommended for production):

```bash
bun run db:migrate
```

Then build the project:

```bash
bun run build
```

### 5. Run the application

#### Development Mode (All Services)

```bash
bun run dev
```

This will start all services in development mode:
- Web app: http://localhost:3000
- Socket server: http://localhost:3001
- Worker service

#### Production Build

```bash
bun run build
```

#### Using Docker Compose

```bash
docker-compose up -d
```

This will start all services including Nginx reverse proxy.

### 6. Additional Commands

```bash
# Format code
bun run format

# Lint code
bun run lint

# Open Prisma Studio
bun run db:studio

# Clean all build artifacts and node_modules
bun run clean
```

## Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services exposed:
- **Nginx**: Port 80 (reverse proxy)
- **Web App**: Port 3000
- **Socket Server**: Port 3001

## Development

### Workspace Commands

This is a Turborepo monorepo. You can run commands for specific workspaces:

```bash
# Run dev for specific app
bun --filter=@repo/web dev
bun --filter=@repo/socket-server dev

# Build specific package
bun --filter=@repo/db build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [📖 Full Documentation](https://www.notion.so/arbazansari/2e623f37737480f79067ea159894c7cb)
- [🐛 Report Bug](https://github.com/ErArbazAnsari/strikes-community/issues)
- [✨ Request Feature](https://github.com/ErArbazAnsari/strikes-community/issues)
