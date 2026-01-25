import { kafka, TOPICS } from "./client";
import type { Producer } from "kafkajs";

export interface ChatMessage {
    id: string;
    content: string;
    memberId: string;
    channelId?: string;
    conversationId?: string;
    fileUrl?: string;
    timestamp: number;
    serverId?: string;
}

export class MessageProducer {
    private producer: Producer;
    private isConnected = false;

    constructor() {
        this.producer = kafka.producer({
            allowAutoTopicCreation: false,
            transactionTimeout: 30000,
            idempotent: true, // Prevents duplicate messages
            maxInFlightRequests: 5,
            retry: {
                retries: 5,
            },
        });
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
            console.log("✅ Kafka Producer connected");
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
        }
    }

    /**
     * Publish a chat message to Kafka
     */
    async publishMessage(message: ChatMessage): Promise<string> {
        await this.connect();

        const topic = message.channelId
            ? TOPICS.MESSAGES
            : TOPICS.DIRECT_MESSAGES;
        const partitionKey = message.channelId || message.conversationId!;

        try {
            const result = await this.producer.send({
                topic,
                messages: [
                    {
                        key: partitionKey, // Ensures ordering per channel/conversation
                        value: JSON.stringify(message),
                        headers: {
                            "message-id": message.id,
                            "retry-count": "0",
                        },
                    },
                ],
            });

            return message.id;
        } catch (error) {
            console.error("❌ Failed to publish message:", error);
            throw error;
        }
    }

    /**
     * Batch publish multiple messages (for efficiency)
     */
    async publishBatch(messages: ChatMessage[]): Promise<void> {
        await this.connect();

        const groupedByTopic = messages.reduce(
            (acc, msg) => {
                const topic = msg.channelId
                    ? TOPICS.MESSAGES
                    : TOPICS.DIRECT_MESSAGES;
                if (!acc[topic]) acc[topic] = [];
                acc[topic].push(msg);
                return acc;
            },
            {} as Record<string, ChatMessage[]>,
        );

        try {
            for (const [topic, msgs] of Object.entries(groupedByTopic)) {
                await this.producer.send({
                    topic,
                    messages: msgs.map((msg) => ({
                        key: msg.channelId || msg.conversationId!,
                        value: JSON.stringify(msg),
                        headers: {
                            "message-id": msg.id,
                            batch: "true",
                        },
                    })),
                });
            }

            console.log(`📦 Batch published: ${messages.length} messages`);
        } catch (error) {
            console.error("❌ Failed to publish batch:", error);
            throw error;
        }
    }
}

// Singleton instance
let producerInstance: MessageProducer | null = null;

export function getProducer(): MessageProducer {
    if (!producerInstance) {
        producerInstance = new MessageProducer();
    }
    return producerInstance;
}
