import { kafka, TOPICS } from "@repo/kafka";
import { prisma } from "@repo/db";
import type { Consumer, EachBatchPayload } from "@repo/kafka";

interface KafkaMessage {
    id: string;
    content: string;
    fileUrl?: string;
    memberId: string;
    channelId?: string;
    conversationId?: string;
    serverId?: string;
    timestamp: number;
    [key: string]: any;
}

export class MessageConsumer {
    private consumer: Consumer;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "message-processor",
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            maxBytes: 10485760, // 10MB
            maxWaitTimeInMs: 1000,
        });
    }

    async start() {
        if (this.isRunning) {
            return;
        }

        try {
            await this.consumer.connect();
            console.log("✅ Connected to Kafka");

            await this.consumer.subscribe({
                topics: [TOPICS.MESSAGES],
                fromBeginning: false,
            });

            await this.consumer.run({
                eachBatchAutoResolve: false,
                eachBatch: async ({
                    batch,
                    resolveOffset,
                    heartbeat,
                    isRunning,
                }: EachBatchPayload) => {
                    const messages = batch.messages;
                    const batchSize = 500;
                    const flushInterval = 5000; // 5 seconds

                    console.log(
                        `📥 Received batch of ${messages.length} messages`,
                    );

                    let currentBatch: any[] = [];
                    let lastFlush = Date.now();

                    for (const message of messages) {
                        if (!isRunning()) break;

                        try {
                            const content = JSON.parse(
                                message.value?.toString() || "{}",
                            );
                            currentBatch.push({
                                ...content,
                                offset: message.offset,
                            });

                            const now = Date.now();
                            if (
                                currentBatch.length >= batchSize ||
                                now - lastFlush >= flushInterval
                            ) {
                                await this.processBatchItems(currentBatch);
                                const lastMsg =
                                    currentBatch[currentBatch.length - 1];
                                resolveOffset(lastMsg.offset);
                                await heartbeat();
                                currentBatch = [];
                                lastFlush = Date.now();
                            }
                        } catch (error) {
                            console.error("Error processing message", error);
                            resolveOffset(message.offset);
                        }
                    }

                    if (currentBatch.length > 0) {
                        await this.processBatchItems(currentBatch);
                        const lastMsg = currentBatch[currentBatch.length - 1];
                        resolveOffset(lastMsg.offset);
                        await heartbeat();
                    }
                },
            });

            this.isRunning = true;
        } catch (error) {
            console.error("❌ Failed to start consumer:", error);
            throw error;
        }
    }

    async stop() {
        if (this.isRunning) {
            await this.consumer.disconnect();
            this.isRunning = false;
            console.log("\n✅ Consumer stopped");
        }
    }

    // Helper to process specific batch items
    private async processBatchItems(messages: any[]) {
        if (messages.length === 0) return;

        const dbMessages = messages
            .filter((m) => !m.conversationId)
            .map((msg) => ({
                content: msg.content,
                fileUrl: msg.fileUrl,
                memberId: msg.memberId,
                channelId: msg.channelId!,
                deleted: false,
                // createdAt: new Date(msg.timestamp),
            }));

        const dbDirectMessages = messages
            .filter((m) => m.conversationId)
            .map((msg) => ({
                content: msg.content,
                fileUrl: msg.fileUrl,
                memberId: msg.memberId,
                conversationId: msg.conversationId,
                deleted: false,
                // createdAt: new Date(msg.timestamp),
            }));

        try {
            if (dbMessages.length > 0) {
                await prisma.message.createMany({
                    data: dbMessages,
                    skipDuplicates: true,
                });
            }
            if (dbDirectMessages.length > 0) {
                await prisma.directMessage.createMany({
                    data: dbDirectMessages,
                    skipDuplicates: true,
                });
            }
            console.log(
                `✅ Saved ${dbMessages.length + dbDirectMessages.length} messages`,
            );
        } catch (e) {
            console.error("❌ DB Batch Write Failed", e);
            throw e; // Retry batch
        }
    }

    async getLag(): Promise<number> {
        const admin = kafka.admin();
        try {
            await admin.connect();
            let totalLag = 0;
            const groupOffsets = await admin.fetchOffsets({
                groupId: "message-processor",
                topics: [TOPICS.MESSAGES],
            });

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

let consumerInstance: MessageConsumer | null = null;
export function getConsumer(): MessageConsumer {
    if (!consumerInstance) {
        consumerInstance = new MessageConsumer();
    }
    return consumerInstance;
}
