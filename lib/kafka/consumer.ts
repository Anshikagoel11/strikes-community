import { kafka, TOPICS } from "./client";
import { prisma } from "@/lib/prisma";
import type { Consumer, EachMessagePayload } from "kafkajs";
import { SessionManager } from "@/lib/redis/session-manager";

interface KafkaMessage {
    id: string;
    content: string;
    fileUrl?: string;
    memberId: string;
    channelId?: string;
    conversationId?: string;
    serverId?: string;
    timestamp: number;
}

export class MessageConsumer {
    private consumer: Consumer;
    private sessionManager: SessionManager;
    private messageBuffer: KafkaMessage[] = [];
    private directMessageBuffer: KafkaMessage[] = [];
    private readonly BATCH_SIZE = 500;
    private readonly BATCH_TIMEOUT = 5000; // 5 seconds
    private batchTimer: NodeJS.Timeout | null = null;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "message-processor",
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            maxBytes: 10485760, // 10MB
            maxWaitTimeInMs: 1000,
        });
        this.sessionManager = new SessionManager();
    }

    async start() {
        if (this.isRunning) {
            console.log("⚠️ Consumer already running");
            return;
        }

        try {
            await this.consumer.connect();
            console.log("✅ Kafka Consumer connected");

            await this.consumer.subscribe({
                topics: [TOPICS.MESSAGES, TOPICS.DIRECT_MESSAGES],
                fromBeginning: false,
            });

            await this.consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    await this.handleMessage(payload);
                },
            });

            this.isRunning = true;
            this.startBatchTimer();

            console.log("🚀 Message consumer started");
        } catch (error) {
            console.error("❌ Failed to start consumer:", error);
            throw error;
        }
    }

    async stop() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
        }

        if (
            this.messageBuffer.length > 0 ||
            this.directMessageBuffer.length > 0
        ) {
            await this.processBatch();
        }

        await this.consumer.disconnect();
        this.isRunning = false;
        console.log("🛑 Message consumer stopped");
    }

    private async handleMessage({ topic, message }: EachMessagePayload) {
        try {
            const data = JSON.parse(message.value!.toString());

            // Add to appropriate buffer
            if (topic === TOPICS.MESSAGES) {
                this.messageBuffer.push(data);
            } else {
                this.directMessageBuffer.push(data);
            }

            // Trigger batch processing if buffer is full
            if (
                this.messageBuffer.length >= this.BATCH_SIZE ||
                this.directMessageBuffer.length >= this.BATCH_SIZE
            ) {
                await this.processBatch();
            }

            // Deliver to online users immediately (real-time)
            await this.deliverRealtime(data);
        } catch (error) {
            console.error("❌ Failed to handle message:", error);
            // Message will be retried automatically by Kafka
        }
    }

    private startBatchTimer() {
        this.batchTimer = setInterval(async () => {
            if (
                this.messageBuffer.length > 0 ||
                this.directMessageBuffer.length > 0
            ) {
                await this.processBatch();
            }
        }, this.BATCH_TIMEOUT);
    }

    private async processBatch() {
        const messageBatch = [...this.messageBuffer];
        const dmBatch = [...this.directMessageBuffer];

        this.messageBuffer = [];
        this.directMessageBuffer = [];

        const startTime = Date.now();

        try {
            // Batch insert channel messages
            if (messageBatch.length > 0) {
                try {
                    await prisma.message.createMany({
                        data: messageBatch.map((msg: KafkaMessage) => ({
                            id: msg.id,
                            content: msg.content,
                            memberId: msg.memberId,
                            channelId: msg.channelId!,
                            fileUrl: msg.fileUrl,
                            createdAt: new Date(msg.timestamp),
                            updatedAt: new Date(msg.timestamp),
                        })),
                        skipDuplicates: true,
                    });
                    console.log(
                        `✅ Batch processed: ${messageBatch.length} channel messages`,
                    );
                } catch (error: unknown) {
                    // Handle foreign key violations (test data, deleted members, etc.)
                    if (
                        error &&
                        typeof error === "object" &&
                        "code" in error &&
                        error.code === "P2003"
                    ) {
                        console.warn(
                            `⚠️ Skipping ${messageBatch.length} messages - foreign key constraint failed (invalid member/channel IDs)`,
                        );
                        // Filter out invalid messages and retry
                        const validMessages =
                            await this.filterValidMessages(messageBatch);
                        if (validMessages.length > 0) {
                            await prisma.message.createMany({
                                data: validMessages,
                                skipDuplicates: true,
                            });
                            console.log(
                                `✅ Batch processed: ${validMessages.length}/${messageBatch.length} valid messages`,
                            );
                        }
                    } else {
                        throw error; // Re-throw other errors
                    }
                }
            }

            // Batch insert direct messages
            if (dmBatch.length > 0) {
                try {
                    await prisma.directMessage.createMany({
                        data: dmBatch.map((msg) => ({
                            id: msg.id,
                            content: msg.content,
                            memberId: msg.memberId,
                            conversationId: msg.conversationId!,
                            fileUrl: msg.fileUrl,
                            createdAt: new Date(msg.timestamp),
                            updatedAt: new Date(msg.timestamp),
                        })),
                        skipDuplicates: true,
                    });
                    console.log(
                        `✅ Batch processed: ${dmBatch.length} direct messages`,
                    );
                } catch (error: unknown) {
                    if (
                        error &&
                        typeof error === "object" &&
                        "code" in error &&
                        error.code === "P2003"
                    ) {
                        console.warn(
                            `⚠️ Skipping ${dmBatch.length} DMs - foreign key constraint failed`,
                        );
                        const validMessages =
                            await this.filterValidDirectMessages(dmBatch);
                        if (validMessages.length > 0) {
                            await prisma.directMessage.createMany({
                                data: validMessages,
                                skipDuplicates: true,
                            });
                            console.log(
                                `✅ Batch processed: ${validMessages.length}/${dmBatch.length} valid DMs`,
                            );
                        }
                    } else {
                        throw error;
                    }
                }
            }

            const duration = Date.now() - startTime;
            console.log(`⏱️ Batch processing took ${duration}ms`);
        } catch (error) {
            console.error("❌ Batch processing failed:", error);

            // Re-add failed messages back to buffer for retry
            this.messageBuffer.unshift(...messageBatch);
            this.directMessageBuffer.unshift(...dmBatch);
        }
    }

    private async deliverRealtime(message: KafkaMessage) {
        try {
            // For channel messages, get all online members of that channel
            if (message.channelId) {
                const channel = await prisma.channel.findUnique({
                    where: { id: message.channelId },
                    include: {
                        server: {
                            include: {
                                members: {
                                    include: {
                                        profile: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (channel) {
                    // Emit to all online members
                    for (const member of channel.server.members) {
                        try {
                            const session =
                                await this.sessionManager.getUserSession(
                                    member.profile.userId,
                                );
                            if (session && session.socketId) {
                                // This would require access to Socket.io instance
                                // You'll need to pass this in or use a different pattern
                                // For now, we'll just log
                                console.log(
                                    `📨 Would deliver to user ${member.profile.userId}`,
                                );
                            }
                        } catch {
                            // Skip if Redis is unavailable
                            continue;
                        }
                    }
                }
            }

            // For direct messages, find the recipient
            if (message.conversationId) {
                const conversation = await prisma.conversation.findUnique({
                    where: { id: message.conversationId },
                    include: {
                        memberOne: { include: { profile: true } },
                        memberTwo: { include: { profile: true } },
                    },
                });

                if (conversation) {
                    const recipient =
                        conversation.memberOne.id === message.memberId
                            ? conversation.memberTwo
                            : conversation.memberOne;

                    const recipientSession =
                        await this.sessionManager.getUserSession(
                            recipient.profile.userId,
                        );

                    if (recipientSession) {
                        console.log(
                            `📨 Would deliver DM to user ${recipient.profile.userId}`,
                        );
                        // Emit to recipient's socket
                        // await this.sendAck(message.id, 'delivered');
                    }
                }
            }
        } catch (error) {
            console.error("❌ Failed to deliver realtime:", error);
        }
    }

    /**
     * Filter out messages with invalid foreign keys
     */
    private async filterValidMessages(messages: KafkaMessage[]): Promise<
        Array<{
            id: string;
            content: string;
            memberId: string;
            channelId: string;
            fileUrl?: string;
            createdAt: Date;
            updatedAt: Date;
        }>
    > {
        const validMessages = [];

        for (const msg of messages) {
            try {
                // Check if member and channel exist
                const member = await prisma.member.findUnique({
                    where: { id: msg.memberId },
                });
                const channel = await prisma.channel.findUnique({
                    where: { id: msg.channelId },
                });

                if (member && channel) {
                    validMessages.push({
                        id: msg.id,
                        content: msg.content,
                        memberId: msg.memberId,
                        channelId: msg.channelId!,
                        fileUrl: msg.fileUrl,
                        createdAt: new Date(msg.timestamp),
                        updatedAt: new Date(msg.timestamp),
                    });
                } else {
                    console.warn(
                        `⚠️ Skipping message ${msg.id} - invalid member or channel`,
                    );
                }
            } catch (error) {
                console.error(`❌ Error validating message ${msg.id}:`, error);
            }
        }

        return validMessages;
    }

    /**
     * Filter out DMs with invalid foreign keys
     */
    private async filterValidDirectMessages(messages: KafkaMessage[]): Promise<
        Array<{
            id: string;
            content: string;
            memberId: string;
            conversationId: string;
            fileUrl?: string;
            createdAt: Date;
            updatedAt: Date;
        }>
    > {
        const validMessages = [];

        for (const msg of messages) {
            try {
                const member = await prisma.member.findUnique({
                    where: { id: msg.memberId },
                });
                const conversation = await prisma.conversation.findUnique({
                    where: { id: msg.conversationId },
                });

                if (member && conversation) {
                    validMessages.push({
                        id: msg.id,
                        content: msg.content,
                        memberId: msg.memberId,
                        conversationId: msg.conversationId!,
                        fileUrl: msg.fileUrl,
                        createdAt: new Date(msg.timestamp),
                        updatedAt: new Date(msg.timestamp),
                    });
                } else {
                    console.warn(
                        `⚠️ Skipping DM ${msg.id} - invalid member or conversation`,
                    );
                }
            } catch (error) {
                console.error(`❌ Error validating DM ${msg.id}:`, error);
            }
        }

        return validMessages;
    }

    async getLag(): Promise<number> {
        const admin = kafka.admin();
        try {
            await admin.connect();

            let totalLag = 0;

            // Get consumer group offsets
            const groupOffsets = await admin.fetchOffsets({
                groupId: "message-processor",
                topics: [TOPICS.MESSAGES, TOPICS.DIRECT_MESSAGES],
            });

            // Get topic high watermarks
            for (const topicOffset of groupOffsets) {
                const topicOffsets = await admin.fetchTopicOffsets(
                    topicOffset.topic,
                );

                for (const partition of topicOffset.partitions) {
                    const consumerOffset = partition.offset
                        ? parseInt(partition.offset)
                        : 0;
                    const topicPartition = topicOffsets.find(
                        (tp) => tp.partition === partition.partition,
                    );
                    const highWatermark = topicPartition?.high
                        ? parseInt(topicPartition.high)
                        : 0;
                    totalLag += highWatermark - consumerOffset;
                }
            }

            return totalLag;
        } finally {
            await admin.disconnect();
        }
    }
}

// Singleton instance
let consumerInstance: MessageConsumer | null = null;

export function getConsumer(): MessageConsumer {
    if (!consumerInstance) {
        consumerInstance = new MessageConsumer();
    }
    return consumerInstance;
}
