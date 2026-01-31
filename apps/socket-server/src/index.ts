import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { getSessionManager } from "@repo/redis";

// Kafka Consumer for Broadcasting (Scaling)
import { kafka, TOPICS } from "@repo/kafka";
import type { Consumer } from "@repo/kafka";

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL;

const httpServer = new NetServer((req, res) => {
  // Basic health check
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }
  res.writeHead(404);
  res.end();
});

// Setup Redis Adapter for scaling
if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

const io = new ServerIO(httpServer, {
  path: "/api/socket/io",
  addTrailingSlash: false,
  cors: {
    origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
});

const sessionManager = getSessionManager();

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Listen for user identification
  socket.on("identify", async (data: { userId: string; serverId?: string }) => {
    try {
      await sessionManager.setUserSession(data.userId, {
        userId: data.userId,
        serverId: data.serverId,
        socketId: socket.id,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
      });
      console.log(`Session created: ${data.userId} → ${socket.id}`);

      // Optional: join a user-specific room
      socket.join(`user:${data.userId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  });

  // Join room for specific channel or conversation
  socket.on("join-channel", (channelId: string) => {
    const room = `chat:${channelId}:messages`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined channel room: ${room}`);
  });

  socket.on("join-conversation", (conversationId: string) => {
    const room = `chat:${conversationId}:messages`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined conversation room: ${room}`);
  });

  socket.on("leave-channel", (channelId: string) => {
    const room = `chat:${channelId}:messages`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left channel room: ${room}`);
  });

  socket.on("leave-conversation", (conversationId: string) => {
    const room = `chat:${conversationId}:messages`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left conversation room: ${room}`);
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});

let consumer: Consumer | null = null;

async function startConsumer() {
  consumer = kafka.consumer({
    groupId:
      "socket-server-broadcaster-" + Math.random().toString(36).substring(7),
  });
  await consumer.connect();
  await consumer.subscribe({ topics: [TOPICS.MESSAGES] });

  await consumer.run({
    eachMessage: async ({ topic, message }: any) => {
      try {
        const data = JSON.parse(message.value!.toString());
        const roomKey = data.channelId
          ? `chat:${data.channelId}:messages`
          : `chat:${data.conversationId}:messages`;

        // Emit ONLY to the specific room
        io.to(roomKey).emit(roomKey, data);
        console.log(`Broadcasted message to room: ${roomKey}`);
      } catch (e) {
        console.error("Socket broadcast error", e);
      }
    },
  });
}
startConsumer();

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");

  if (consumer) {
    console.log("Disconnecting Kafka consumer...");
    await consumer.disconnect();
  }

  io.close(() => {
    httpServer.close(() => {
      pubClient.quit();
      subClient.quit();
      process.exit(0);
    });
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
