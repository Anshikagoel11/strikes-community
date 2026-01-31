import { kafka, TOPICS, getProducer } from "@repo/kafka";
import { prisma } from "@repo/db";
import type { Consumer, EachBatchPayload } from "@repo/kafka";

interface KafkaMessage {
    id: string;
    content: string;
    fileUrl?: string;
    memberId: string;
    channelId?: string;
    conversationId?: string;
    createdAt: string;
    updatedAt: string;
    timestamp: number;
}

export class MessageConsumer {
    private consumer: Consumer;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "message-processor",
        });
    }

    /**
     * Connects to Kafka, subscribes to the messages topic, and starts the processing loop.
     */
    async start() {
        if (this.isRunning) return;

        try {
            await this.consumer.connect();
            console.log("Kafka Consumer: Connected and listening...");

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
                    const flushInterval = 10000; // Flush every 10 seconds if batch not full

                    console.log(
                        `Received ${messages.length} messages from Kafka`,
                    );

                    let currentBatch: (KafkaMessage & { offset: string })[] =
                        [];
                    let lastFlush = Date.now();

                    for (const message of messages) {
                        if (!isRunning()) break;

                        try {
                            const rawValue = message.value?.toString();
                            if (!rawValue) continue;

                            const content = JSON.parse(
                                rawValue,
                            ) as KafkaMessage;
                            currentBatch.push({
                                ...content,
                                offset: message.offset,
                            });

                            const now = Date.now();
                            // Flush if batch size limit reached or time interval passed
                            if (
                                currentBatch.length >= batchSize ||
                                now - lastFlush >= flushInterval
                            ) {
                                await this.processBatchItems(currentBatch);

                                // Resolve the offset of the last successfully processed message
                                const lastMsg =
                                    currentBatch[currentBatch.length - 1];
                                resolveOffset(lastMsg.offset);
                                await heartbeat();

                                currentBatch = [];
                                lastFlush = Date.now();
                            }
                        } catch (error) {
                            console.error(
                                "Error parsing/buffering message:",
                                error,
                            );
                            // Skip broken message and continue
                            resolveOffset(message.offset);
                        }
                    }

                    // Process any remaining messages in the final chunk
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
            console.error("Failed to start consumer:", error);
            throw error;
        }
    }

    /**
     * Gracefully stops the consumer and disconnects from Kafka.
     */
    async stop() {
        if (this.isRunning) {
            await this.consumer.disconnect();
            this.isRunning = false;
            console.log("Kafka Consumer: Stopped successfully");
        }
    }

    /**
     * Processes a batch of messages by splitting them into Channel and Direct messages,
     * then performing bulk inserts into the database.
     */
    private async processBatchItems(
        messages: (KafkaMessage & { offset: string })[],
    ) {
        if (messages.length === 0) return;

        console.log(`⚡ Processing batch of ${messages.length} items...`);
        const startTime = Date.now();

        const channelMessages: {
            id: string;
            content: string;
            fileUrl?: string;
            memberId: string;
            deleted: boolean;
            createdAt: Date;
            updatedAt: Date;
            channelId: string;
        }[] = [];
        const directMessages: {
            id: string;
            content: string;
            fileUrl?: string;
            memberId: string;
            deleted: boolean;
            createdAt: Date;
            updatedAt: Date;
            conversationId: string;
        }[] = [];

        // Sort messages into their respective DB tables in a single pass
        for (const msg of messages) {
            const dbData = {
                id: msg.id,
                content: msg.content,
                fileUrl: msg.fileUrl,
                memberId: msg.memberId,
                deleted: false,
                createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
                updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
            };

            if (msg.conversationId) {
                directMessages.push({
                    ...dbData,
                    conversationId: msg.conversationId,
                });
            } else if (msg.channelId) {
                channelMessages.push({
                    ...dbData,
                    channelId: msg.channelId,
                });
            }
        }

        try {
            // Execute database writes in parallel if both types exist
            const tasks: Promise<{ count: number }>[] = [];
            if (channelMessages.length > 0) {
                tasks.push(
                    prisma.message.createMany({
                        data: channelMessages,
                        skipDuplicates: true,
                    }),
                );
            }
            if (directMessages.length > 0) {
                tasks.push(
                    prisma.directMessage.createMany({
                        data: directMessages,
                        skipDuplicates: true,
                    }),
                );
            }

            if (tasks.length > 0) {
                await Promise.all(tasks);
            }

            const duration = Date.now() - startTime;
            console.log(
                `✅ Batch persistence complete: ${channelMessages.length} channel msgs, ${directMessages.length} direct msgs. (${duration}ms)`,
            );
        } catch (e) {
            console.error(
                "❌ Database batch write failed. Initiating recovery...",
                e,
            );

            // Recovery: Re-push messages back to the end of the Kafka queue so they aren't lost
            const producer = getProducer();
            try {
                for (const msg of messages) {
                    // Remove the Kafka internal offset added by this worker before re-publishing
                    const originalMessage = { ...msg };
                    // @ts-expect-error - offset is injected for batching
                    delete originalMessage.offset;
                    await producer.publishMessage(originalMessage);
                }
                console.log(
                    `🔄 Recovery: Re-queued ${messages.length} messages to Kafka topic.`,
                );
            } catch (produceError) {
                console.error(
                    "🔥 CRITICAL: Failed to re-queue messages! Data loss possible.",
                    produceError,
                );
            }
        }
    }

    /**
     * Calculates the total lag across all partitions for the monitored topic.
     */
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
                        (tp: {
                            partition: number;
                            high: string;
                            low: string;
                        }) => tp.partition === partition.partition,
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
